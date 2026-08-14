# Phase 3 data-conversion report

Generated from `clues.xlsx` by converter version 1.0.1.

## Source workbook

- Worksheet: `round 1`
- Clue rows: 120,565
- Round 1 rows: 59,623
- Round 2 rows: 58,739
- Final Jeopardy rows: 2,203
- Source SHA-256: `4f36c7bb5a090053bd74b962ddf84e55e49efb607b8f70d760d24daeda767e0d`

## Reconstructed category instances

- Complete Round 1 instances before media filtering and deduplication: 11,677
- Complete Round 2 instances before media filtering and deduplication: 11,330
- Rows not belonging to a complete five-value sequence: 3,327

## Playable output

- Round 1 categories: 11,547 (57,735 clues)
- Round 2 categories: 11,172 (55,860 clues)
- Final Jeopardy clues: 2,203
- Total playable clues: 115,798
- JSON data size before web-server compression: 20.4 MB
- Data version: `662f71ed90a6d11af7ea`

## Exclusions and review queues

- Complete category instances excluded for high-confidence missing-media cues: 288
- Final clues excluded for validation or high-confidence media cues: 0
- Exact duplicate category instances or Final clues removed: 0
- High-confidence media rows found: 315
- Additional possible-media rows retained but listed for review: 1,903
- Excel-formatted or manually repaired cells recorded: 912

The converter excludes only narrow, high-confidence media patterns. Broader clues mentioning words such as “photo,” “map,” “watch,” or “here” remain playable unless the text explicitly depends on missing media. Review `reports/media_review.csv` to tighten or relax that policy later.

## Generated files

- `data/manifest.json`: dataset version, counts, and shard locations
- `data/round1/*.json`: complete Round 1 category instances
- `data/round2/*.json`: complete Round 2 category instances
- `data/final/*.json`: Final Jeopardy clues
- `reports/conversion_summary.json`: machine-readable audit summary
- `reports/excluded_rows.csv`: incomplete or malformed regular-round rows
- `reports/excluded_category_instances.csv`: complete categories removed by the media policy
- `reports/excluded_final_clues.csv`: removed Final Jeopardy rows
- `reports/media_review.csv`: high-confidence and review-only media matches
- `reports/converted_cells.csv`: Excel-formatted values and explicit repairs
- `reports/duplicate_records.csv`: exact duplicates removed from the pool

## Explicit Excel repairs

The checked-in `tools/data_overrides.json` repairs the known cases where Excel changed the intended text:

- The category in source rows 2–6 is restored from numeric `2` to `2.0`.
- The responses in source rows 32,648 and 112,976 are restored to `9-1-1`.
- The response in source row 33,731 is restored to `3-1-1`.

Other number, currency, percentage, date, and time cells are converted according to their Excel number formats and recorded in `reports/converted_cells.csv`.
