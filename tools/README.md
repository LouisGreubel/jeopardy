# Phase 3 data tools

The generated JSON is already included in the project. Python is needed only to validate it or rebuild it after the Excel workbook changes. The published GitHub Pages site will not run Python and will not read the workbook.

## First-time Python setup

Install Python 3.10 or newer. Open a terminal in the project root—the folder containing `index.html`—and run:

```text
python -m pip install -r requirements.txt
```

On Windows, `py` may work in place of `python`.

## Rebuild from `clues.xlsx`

1. Copy the workbook to:

```text
source/clues.xlsx
```

2. From the project root, run:

```text
python tools/build_data.py
```

You may instead pass an explicit path:

```text
python tools/build_data.py "C:\path\to\clues.xlsx"
```

The converter rewrites the deployable JSON under `data/`, updates `docs/DATA_CONVERSION_REPORT.md`, and creates detailed review files under `reports/`.

The default shard size is 400 records. With the current workbook, that produces 63 clue files and keeps the complete release below GitHub's browser-upload file-count limit.

## Validate the generated data

Run:

```text
python tools/validate_data.py
```

The validator checks every manifest entry and shard, byte count, SHA-256 hash, ID, category value sequence, clue, response, and Final value. It also simulates 10,000 complete games. A successful run ends with `Validation passed`.

To use a different simulation count:

```text
python tools/validate_data.py --games 25000
```

## Media review and Excel repairs

- `tools/data_overrides.json` contains four explicit repairs for known Excel auto-conversion damage.
- `reports/media_review.csv` lists both excluded high-confidence media clues and possible media clues retained for review.
- `reports/converted_cells.csv` records how non-text and specially formatted Excel cells were converted for the browser.

Do not hand-edit generated shard files. Change the workbook, override file, or conversion rules and rerun the converter.

## Validate the GitHub Pages release

Run:

```text
python tools/validate_release.py
```

This checks required root files, relative HTML references, production interface IDs, crawler metadata, all manifest shard paths, and JavaScript syntax. It also confirms that no Excel workbook was accidentally packaged.
