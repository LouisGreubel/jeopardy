#!/usr/bin/env python3
"""Validate the static GitHub Pages release package."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

REQUIRED_ROOT_FILES = {
    ".gitignore",
    ".nojekyll",
    "404.html",
    "README.md",
    "index.html",
    "styles.css",
}

REQUIRED_INDEX_IDS = {
    "game-board",
    "clue-dialog",
    "help-dialog",
    "reset-dialog",
    "transition-dialog",
    "results-dialog",
    "game-announcement",
}


class LocalReferenceParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.ids: set[str] = set()
        self.references: list[tuple[str, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        element_id = values.get("id")
        if element_id:
            self.ids.add(element_id)

        for attr in ("src", "href"):
            value = values.get(attr)
            if value:
                self.references.append((attr, value))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--project-root",
        type=Path,
        default=Path(__file__).resolve().parents[1],
        help="Project root to validate.",
    )
    return parser.parse_args()


def fail(message: str) -> None:
    raise RuntimeError(message)


def resolve_local_reference(project_root: Path, document: Path, reference: str) -> Path | None:
    parsed = urlsplit(reference)
    if parsed.scheme or parsed.netloc or reference.startswith("data:") or reference.startswith("#"):
        return None

    if parsed.path.startswith("/"):
        fail(f"Root-absolute reference is not project-path safe: {reference}")

    clean_path = parsed.path
    if not clean_path:
        return None

    return (document.parent / clean_path).resolve()


def validate_html(project_root: Path, relative_path: str) -> LocalReferenceParser:
    document = project_root / relative_path
    parser = LocalReferenceParser()
    parser.feed(document.read_text(encoding="utf-8"))

    for _, reference in parser.references:
        target = resolve_local_reference(project_root, document, reference)
        if target is None:
            continue
        try:
            target.relative_to(project_root.resolve())
        except ValueError as exc:
            fail(f"Reference escapes the project root in {relative_path}: {reference}")
        if not target.exists():
            fail(f"Missing local reference in {relative_path}: {reference}")

    return parser


def validate_manifest(project_root: Path) -> tuple[int, int]:
    manifest_path = project_root / "data" / "manifest.json"
    if not manifest_path.is_file():
        fail("data/manifest.json is missing.")

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    if manifest.get("schemaVersion") != 2:
        fail("Unexpected manifest schema version.")

    shard_count = 0
    record_count = 0
    for round_key in ("1", "2", "final"):
        metadata = manifest.get("rounds", {}).get(round_key)
        if not isinstance(metadata, dict):
            fail(f"Manifest metadata is missing for round {round_key}.")
        shards = metadata.get("shards")
        if not isinstance(shards, list) or not shards:
            fail(f"Manifest has no shards for round {round_key}.")

        for shard in shards:
            path = shard.get("path")
            count = shard.get("count")
            if not isinstance(path, str) or not isinstance(count, int) or count <= 0:
                fail(f"Invalid shard metadata in round {round_key}.")
            shard_path = project_root / "data" / path
            if not shard_path.is_file():
                fail(f"Manifest references a missing shard: data/{path}")
            shard_count += 1
            record_count += count

    playable_total = manifest.get("totals", {}).get("playableClueCount")
    if playable_total != 115_798:
        fail(f"Unexpected playable clue total: {playable_total!r}")

    return shard_count, record_count


def validate_javascript(project_root: Path) -> int:
    js_files = sorted((project_root / "js").glob("*.js"))
    if not js_files:
        fail("No JavaScript files were found.")

    for js_file in js_files:
        result = subprocess.run(
            ["node", "--check", str(js_file)],
            capture_output=True,
            text=True,
            check=False,
        )
        if result.returncode != 0:
            fail(f"JavaScript syntax check failed for {js_file.name}: {result.stderr.strip()}")

    return len(js_files)


def main() -> int:
    args = parse_args()
    project_root = args.project_root.resolve()
    if not project_root.is_dir():
        fail(f"Project root does not exist: {project_root}")

    missing = sorted(name for name in REQUIRED_ROOT_FILES if not (project_root / name).exists())
    if missing:
        fail(f"Missing required root files: {', '.join(missing)}")

    workbook_paths = list(project_root.rglob("*.xlsx"))
    if workbook_paths:
        fail(f"Workbook files must not be packaged: {workbook_paths[0]}")

    index_parser = validate_html(project_root, "index.html")
    validate_html(project_root, "404.html")

    missing_ids = sorted(REQUIRED_INDEX_IDS - index_parser.ids)
    if missing_ids:
        fail(f"index.html is missing required IDs: {', '.join(missing_ids)}")

    index_text = (project_root / "index.html").read_text(encoding="utf-8")
    if 'name="robots" content="noindex, nofollow, noarchive"' not in index_text:
        fail("index.html is missing the release crawler directive.")

    shard_count, record_count = validate_manifest(project_root)
    js_count = validate_javascript(project_root)

    print("Release validation passed.")
    print(f"Project root: {project_root}")
    print(f"JavaScript files checked: {js_count}")
    print(f"Manifest shards checked: {shard_count}")
    print(f"Manifest records represented: {record_count}")
    print("Playable clue total: 115,798")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:  # noqa: BLE001 - friendly CLI failure
        print(f"Release validation failed: {error}", file=sys.stderr)
        raise SystemExit(1)
