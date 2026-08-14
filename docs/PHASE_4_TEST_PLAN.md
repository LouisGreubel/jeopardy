# Phase 4 manual test plan

Use Phoenix Code Live Preview for these tests.

## 1. Initial generation

- Open the project through Live Preview.
- Confirm that a loading screen appears briefly.
- Confirm that Round 1 opens with six category headers and 30 dollar-value tiles.
- Confirm that the visible clue data is not the old Phase 2 demo text.
- Confirm that all six columns fit without horizontal scrolling on a narrow mobile-sized preview.

## 2. Randomization

- Record the six Round 1 category names.
- Tap **New game**, confirm the reset, and wait for the replacement board.
- Confirm that the game returns to Round 1 with score and counts reset to zero.
- Confirm that the selected board changes. An identical board is technically possible but extraordinarily unlikely; repeat once if necessary.

## 3. Clue interaction

- Tap a dollar value.
- Confirm that the large popup shows the category, value, and full clue.
- Confirm that the correct response is still hidden.
- Tap **Reveal response**.
- Confirm that the response appears and the Right/Wrong buttons become visible.
- Close the popup without scoring.
- Confirm that the tile remains available and is marked with a small exclamation point.
- Reopen it and confirm that the response remains revealed.

## 4. Scoring

- Mark one clue right and confirm that its value is added.
- Mark another clue wrong and confirm that its value is subtracted.
- Confirm that Correct, Wrong, and Answered update.
- Confirm that a scored tile is disabled and marked with a check or X.
- Confirm that the same clue cannot change the score a second time.
- Confirm that a negative total is formatted like `-$400` when applicable.

## 5. Save and restore

- Answer several clues.
- Refresh Live Preview.
- Confirm that the same categories return.
- Confirm that the score, counts, current round, completed tiles, and any revealed-but-unscored clue return.

## 6. Round progression

- Complete all 30 Round 1 clues.
- Confirm that a round-complete dialog appears and reports the current score.
- Confirm that it cannot be dismissed with Escape without advancing.
- Start Double Jeopardy and confirm six new categories with values from $400 through $2,000.
- Complete all 30 Round 2 clues.
- Confirm that the Final Jeopardy transition appears.
- Start Final Jeopardy and confirm a single category with one $3,000 tile.

## 7. Game completion

- Open and score Final Jeopardy.
- Confirm that the results dialog appears after the 61st scored clue.
- Confirm that it displays final score, correct, wrong, accuracy, and `61 / 61` answered.
- Tap **Play another game**.
- Confirm that a new Round 1 board appears with all statistics reset.

## 8. Mobile layout

Test a narrow portrait preview and a short landscape preview.

- Confirm there is no left/right board scrolling.
- Confirm all six category columns remain visible.
- Confirm $1,200, $1,600, and $2,000 fit inside Round 2 tiles.
- Confirm long category headings remain inside their headers.
- Confirm the clue popup occupies most of the phone screen.
- Confirm all buttons are comfortable to tap and no browser zoom is required.

## 9. Error handling

For an optional test, temporarily rename `data/manifest.json`, reload Live Preview, and confirm that the error screen appears with a Retry button. Restore the original filename before continuing.
