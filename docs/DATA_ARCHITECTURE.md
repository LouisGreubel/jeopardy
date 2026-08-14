# Data architecture

## Why the browser does not load the Excel workbook

The source workbook contains more than 120,000 rows. Parsing it in the phone browser would require a large Excel library, delay startup, and use unnecessary memory. Phase 3 converts it once during development into ordinary JSON that GitHub Pages can serve directly.

## Whole category instances

Round 1 and Round 2 data are stored as complete five-clue category instances. The converter accepts only exact value sequences:

- Round 1: 200, 400, 600, 800, 1,000
- Round 2: 400, 800, 1,200, 1,600, 2,000

This prevents the game generator from combining clues from unrelated appearances of a category with the same title.

## Sharding

The output is divided into shards of at most 400 records:

```text
data/
├── manifest.json
├── round1/
│   ├── r1-000.json
│   └── ...
├── round2/
│   ├── r2-000.json
│   └── ...
└── final/
    ├── fj-000.json
    └── ...
```

The manifest provides each shard's path, record count, byte count, and SHA-256 hash. In the game-generator phase, a random global record number can be mapped to a shard without downloading the entire database. The browser will normally fetch only a small number of approximately 200–235 KB files for a new game.

## Stable IDs

Each category instance and clue receives an ID derived from a SHA-256 digest of its normalized content. Rebuilding the workbook in a different row order therefore does not change the ID of unchanged content.

## Excel display preservation

The converter formats numbers, currencies, percentages, dates, times, and Boolean values according to the cell's Excel number format. Known cases where Excel changed the intended source text are repaired explicitly in `tools/data_overrides.json`, rather than silently guessed.

## Missing-media policy

The workbook contains no media-file column. Complete categories with high-confidence references to missing monitor images, maps, audio, or video are excluded from the default playable pool. Less certain references remain playable and appear in `reports/media_review.csv` for optional review.

## Saved games

The Phase 4 application copies the 61 selected clue objects into browser storage. A saved game therefore reopens without redownloading its source shards. The manifest's `dataVersion` lets the application detect and safely discard a saved game created from an incompatible data rebuild.
