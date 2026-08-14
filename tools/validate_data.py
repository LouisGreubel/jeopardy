#!/usr/bin/env python3
"""Validate generated Jeopardy JSON shards and simulate complete games."""

from __future__ import annotations

import argparse
import hashlib
import json
import random
import sys
import unicodedata
from pathlib import Path
from typing import Any, Sequence

SCHEMA_VERSION = 2
ROUND_KEYS = ("1", "2")


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    project_root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(
        description="Validate generated Jeopardy data and simulate random games."
    )
    parser.add_argument(
        "--manifest",
        type=Path,
        default=project_root / "data" / "manifest.json",
        help="Path to data/manifest.json",
    )
    parser.add_argument(
        "--games",
        type=int,
        default=10000,
        help="Number of random 61-clue games to simulate (default: 10000)",
    )
    return parser.parse_args(argv)


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def read_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise ValueError(f"Missing file: {path}") from exc
    except json.JSONDecodeError as exc:
        raise ValueError(f"Invalid JSON in {path}: {exc}") from exc


def normalized_name(value: str) -> str:
    return unicodedata.normalize("NFKC", value).casefold().strip()


def resolve_shard(manifest_path: Path, relative_path: str) -> Path:
    data_root = manifest_path.parent.resolve()
    shard_path = (data_root / relative_path).resolve()
    try:
        shard_path.relative_to(data_root)
    except ValueError as exc:
        raise ValueError(f"Shard path escapes the data directory: {relative_path}") from exc
    return shard_path


def verify_file(path: Path, expected_bytes: int, expected_sha256: str) -> bytes:
    try:
        payload = path.read_bytes()
    except FileNotFoundError as exc:
        raise ValueError(f"Missing shard: {path}") from exc
    require(len(payload) == expected_bytes, f"Byte count mismatch: {path}")
    actual_hash = hashlib.sha256(payload).hexdigest()
    require(actual_hash == expected_sha256, f"SHA-256 mismatch: {path}")
    return payload


def choose_weighted_shard(
    shards: list[dict[str, Any]], rng: random.Random
) -> dict[str, Any]:
    total = sum(int(shard["count"]) for shard in shards)
    require(total > 0, "Cannot choose from an empty shard list")
    choice = rng.randrange(total)
    running = 0
    for shard in shards:
        running += int(shard["count"])
        if choice < running:
            return shard
    raise AssertionError("Weighted selection failed")


def choose_six_distinct_categories(
    categories: list[dict[str, Any]], rng: random.Random
) -> list[dict[str, Any]]:
    shuffled = list(categories)
    rng.shuffle(shuffled)
    selected: list[dict[str, Any]] = []
    seen_names: set[str] = set()
    for category in shuffled:
        key = normalized_name(category["category"])
        if key in seen_names:
            continue
        seen_names.add(key)
        selected.append(category)
        if len(selected) == 6:
            return selected
    raise ValueError("A category shard contains fewer than six distinct visible names")


def validate(manifest_path: Path, simulations: int) -> dict[str, int]:
    require(simulations >= 1, "--games must be at least 1")
    manifest = read_json(manifest_path)
    require(manifest.get("schemaVersion") == SCHEMA_VERSION, "Unsupported manifest schema")
    require(isinstance(manifest.get("dataVersion"), str) and manifest["dataVersion"], "Missing dataVersion")

    all_ids: set[str] = set()
    shard_cache: dict[str, list[dict[str, Any]]] = {}
    summary = {
        "categoryCount": 0,
        "regularClueCount": 0,
        "finalClueCount": 0,
        "shardCount": 0,
        "dataBytes": 0,
    }

    for round_key in ROUND_KEYS:
        round_info = manifest["rounds"][round_key]
        expected_values = list(round_info["expectedValues"])
        require(len(expected_values) == 5, f"Round {round_key} must define five values")
        counted_categories = 0
        counted_bytes = 0

        for shard_meta in round_info["shards"]:
            shard_path = resolve_shard(manifest_path, shard_meta["path"])
            payload_bytes = verify_file(
                shard_path, int(shard_meta["bytes"]), shard_meta["sha256"]
            )
            try:
                shard = json.loads(payload_bytes)
            except json.JSONDecodeError as exc:
                raise ValueError(f"Invalid JSON in {shard_path}: {exc}") from exc

            require(shard.get("schemaVersion") == SCHEMA_VERSION, f"Schema mismatch: {shard_path}")
            require(shard.get("kind") == f"round{round_key}-categories", f"Kind mismatch: {shard_path}")
            items = shard.get("items")
            require(isinstance(items, list), f"Missing items array: {shard_path}")
            require(len(items) == int(shard_meta["count"]), f"Record count mismatch: {shard_path}")
            unique_names = {normalized_name(item["category"]) for item in items}
            require(len(unique_names) >= 6, f"Fewer than six distinct category names: {shard_path}")

            for category in items:
                category_id = category.get("id")
                category_name = category.get("category")
                clues = category.get("clues")
                require(isinstance(category_id, str) and category_id, f"Missing category id: {shard_path}")
                require(category_id not in all_ids, f"Duplicate id: {category_id}")
                all_ids.add(category_id)
                require(isinstance(category_name, str) and category_name.strip(), f"Blank category: {category_id}")
                require(isinstance(clues, list) and len(clues) == 5, f"Category must contain five clues: {category_id}")
                require([clue.get("value") for clue in clues] == expected_values, f"Bad value sequence: {category_id}")

                for clue in clues:
                    clue_id = clue.get("id")
                    require(isinstance(clue_id, str) and clue_id, f"Missing clue id in {category_id}")
                    require(clue_id not in all_ids, f"Duplicate id: {clue_id}")
                    all_ids.add(clue_id)
                    require(isinstance(clue.get("clue"), str) and clue["clue"].strip(), f"Blank clue: {clue_id}")
                    require(isinstance(clue.get("response"), str) and clue["response"].strip(), f"Blank response: {clue_id}")

            shard_cache[shard_meta["path"]] = items
            counted_categories += len(items)
            counted_bytes += len(payload_bytes)
            summary["shardCount"] += 1

        require(counted_categories == int(round_info["categoryCount"]), f"Round {round_key} category total mismatch")
        require(counted_categories == int(round_info["recordCount"]), f"Round {round_key} record total mismatch")
        require(counted_categories * 5 == int(round_info["clueCount"]), f"Round {round_key} clue total mismatch")
        require(counted_bytes == int(round_info["bytes"]), f"Round {round_key} byte total mismatch")
        require(len(round_info["shards"]) == int(round_info["shardCount"]), f"Round {round_key} shard total mismatch")
        summary["categoryCount"] += counted_categories
        summary["regularClueCount"] += counted_categories * 5
        summary["dataBytes"] += counted_bytes

    final_info = manifest["rounds"]["final"]
    expected_final_value = int(final_info["expectedValue"])
    counted_final = 0
    counted_final_bytes = 0
    for shard_meta in final_info["shards"]:
        shard_path = resolve_shard(manifest_path, shard_meta["path"])
        payload_bytes = verify_file(
            shard_path, int(shard_meta["bytes"]), shard_meta["sha256"]
        )
        try:
            shard = json.loads(payload_bytes)
        except json.JSONDecodeError as exc:
            raise ValueError(f"Invalid JSON in {shard_path}: {exc}") from exc
        require(shard.get("schemaVersion") == SCHEMA_VERSION, f"Schema mismatch: {shard_path}")
        require(shard.get("kind") == "final-clues", f"Kind mismatch: {shard_path}")
        items = shard.get("items")
        require(isinstance(items, list), f"Missing items array: {shard_path}")
        require(len(items) == int(shard_meta["count"]), f"Record count mismatch: {shard_path}")

        for clue in items:
            clue_id = clue.get("id")
            require(isinstance(clue_id, str) and clue_id, f"Missing Final clue id: {shard_path}")
            require(clue_id not in all_ids, f"Duplicate id: {clue_id}")
            all_ids.add(clue_id)
            require(clue.get("value") == expected_final_value, f"Bad Final value: {clue_id}")
            for field in ("category", "clue", "response"):
                require(isinstance(clue.get(field), str) and clue[field].strip(), f"Blank Final {field}: {clue_id}")

        shard_cache[shard_meta["path"]] = items
        counted_final += len(items)
        counted_final_bytes += len(payload_bytes)
        summary["shardCount"] += 1

    require(counted_final == int(final_info["clueCount"]), "Final clue total mismatch")
    require(counted_final == int(final_info["recordCount"]), "Final record total mismatch")
    require(counted_final_bytes == int(final_info["bytes"]), "Final byte total mismatch")
    require(len(final_info["shards"]) == int(final_info["shardCount"]), "Final shard total mismatch")
    summary["finalClueCount"] = counted_final
    summary["dataBytes"] += counted_final_bytes

    totals = manifest["totals"]
    require(summary["categoryCount"] == int(totals["regularCategoryCount"]), "Manifest regular category total mismatch")
    require(
        summary["regularClueCount"] + summary["finalClueCount"]
        == int(totals["playableClueCount"]),
        "Manifest playable clue total mismatch",
    )
    require(summary["dataBytes"] == int(totals["dataBytes"]), "Manifest data byte total mismatch")

    rng = random.Random(20260814)
    for _ in range(simulations):
        game_ids: set[str] = set()
        for round_key in ROUND_KEYS:
            round_info = manifest["rounds"][round_key]
            shard_meta = choose_weighted_shard(round_info["shards"], rng)
            categories = shard_cache[shard_meta["path"]]
            selected = choose_six_distinct_categories(categories, rng)
            require(len(selected) == 6, "Simulation selected fewer than six categories")
            require(len({normalized_name(item["category"]) for item in selected}) == 6, "Simulation selected duplicate visible category names")
            for category in selected:
                require(category["id"] not in game_ids, "Simulation duplicated a category id")
                game_ids.add(category["id"])
                for clue in category["clues"]:
                    require(clue["id"] not in game_ids, "Simulation duplicated a regular clue id")
                    game_ids.add(clue["id"])

        final_shard_meta = choose_weighted_shard(final_info["shards"], rng)
        final_items = shard_cache[final_shard_meta["path"]]
        final_clue = rng.choice(final_items)
        require(final_clue["id"] not in game_ids, "Simulation duplicated the Final clue id")
        game_ids.add(final_clue["id"])
        require(len(game_ids) == 73, "Simulation did not produce 12 category ids and 61 clue ids")

    return summary


def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv)
    try:
        summary = validate(args.manifest.resolve(), args.games)
    except (OSError, ValueError, KeyError, TypeError) as exc:
        print(f"Validation failed: {exc}", file=sys.stderr)
        return 1

    print(
        "Validation passed: "
        f"{summary['categoryCount']:,} category instances, "
        f"{summary['regularClueCount']:,} regular clues, "
        f"{summary['finalClueCount']:,} Final clues, "
        f"{summary['shardCount']:,} shard files, "
        f"{args.games:,} simulated games."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
