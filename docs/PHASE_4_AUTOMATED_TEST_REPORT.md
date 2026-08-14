# Phase 4 automated test report

Test date: 2026-08-14

Browser used: Headless Chromium 144.0.7559.96

Test viewports:

- Mobile portrait: 390 × 844 CSS pixels
- Mobile landscape: 915 × 412 CSS pixels

## End-to-end browser test

A complete browser-controlled game was played from initial loading through a newly generated replacement game.

The test verified:

- The manifest and three randomly selected clue shards load successfully.
- Round 1 contains six distinct category headings and 30 value-only clue tiles.
- The compact board has no horizontal overflow in portrait or landscape.
- Opening a tile reveals a real workbook clue rather than demo text.
- The response is hidden until `Reveal response` is selected.
- Right and Wrong controls appear only after the response is revealed.
- Correct scoring adds the clue value.
- Saved progress survives a full page refresh.
- Restoring a saved game does not redownload the selected category shards.
- Completing Round 1 opens the required transition dialog.
- Double Jeopardy contains 30 clues with values of $400, $800, $1,200, $1,600, and $2,000.
- Completing Round 2 opens the Final Jeopardy transition.
- Final Jeopardy contains one category and one $3,000 clue tile.
- Completing all 61 clues opens the results dialog.
- An all-correct test game produces a final score of $57,000, 61 correct, 0 wrong, and 100.0% accuracy.
- `Play another game` creates a fresh Round 1 board and resets all statistics.
- No browser console or JavaScript runtime errors occurred.
- A revealed-but-unscored clue can be closed, is marked on the board, and reopens with its response still visible.
- Wrong scoring subtracts the value, formats a negative score correctly, and locks the clue.
- Cancelling the New Game confirmation preserves the current game.
- Negative score and wrong-answer state survive a full page refresh.

## Data-validation test

The Phase 3 validator was rerun against the packaged Phase 4 data with 10,000 simulated games.

Result:

```text
Validation passed: 22,719 category instances, 113,595 regular clues,
2,203 Final clues, 101 shard files, 10,000 simulated games.
```

## Static checks

- All five JavaScript source files passed `node --check`.
- `index.html` passed an HTML parser smoke test.
- All required relative data paths returned successfully from a local web server.

## Generated visual checks

The following screenshots were reviewed during testing:

- Compact mobile Round 1 board
- Mobile clue popup before response reveal
- Mobile clue popup after response reveal
- Final results dialog
- Compact landscape board
