# Phase 4 test results

The Phase 4 package was tested against the included converted dataset before packaging.

## Static checks

- All JavaScript files passed `node --check`.
- `data/manifest.json` parsed successfully.
- `index.html` parsed successfully and contains no duplicate element IDs.
- Every local stylesheet and script referenced by `index.html` exists.
- All Round 1, Round 2, and Final shard files matched the record counts in the manifest.
- Every category shard contains at least six distinct visible category names.

## Game-logic checks

A generated game was exercised programmatically through all 61 clues:

- Round 1 contained six categories and 30 clues.
- Round 2 contained six categories and 30 clues.
- Final Jeopardy contained one category and one clue.
- A clue could be revealed and scored only in the active round.
- Round 1 advanced only after 30 scored clues.
- Round 2 advanced only after 30 scored clues.
- Final Jeopardy completed the game only after the 61st scored clue.
- The completed game passed the saved-game integrity validator.

## Browser checks

The project was served over HTTP and tested in headless Chromium.

- The real Round 1 board generated successfully from the JSON shards.
- Six category columns and 30 clue tiles rendered.
- No page-level horizontal overflow occurred at a 412 × 915 viewport.
- The clue popup hid the response initially.
- Revealing the response displayed the Right/Wrong buttons.
- A revealed-but-unscored clue remained available and restored after a page reload.
- Categories, score, counts, and clue states restored from browser storage.
- Confirming New Game generated a different board and reset the statistics.
- A full browser-driven 61-clue game produced the expected result for the test pattern: 31 correct, 30 wrong, 50.8% accuracy, and a final score of -$15,000.

## Mobile sizing checks

The compact board was checked at:

- 320 × 700
- 360 × 800
- 412 × 915
- 915 × 412

All six columns remained visible without horizontal scrolling. The longest category title in the dataset was also injected into every header at each test size; the headers did not overflow their boxes.
