# Release 1.0.0 checklist

## Local application

- [ ] Phoenix Code Live Preview reaches the Round 1 board.
- [ ] Six categories and 30 dollar values are visible.
- [ ] The mobile board has no horizontal scrollbar.
- [ ] The clue popup leaves blurred board space visible above and below on mobile.
- [ ] Reveal response shows the stored response.
- [ ] Right adds the clue value.
- [ ] Wrong subtracts the clue value.
- [ ] A scored clue cannot be scored twice.
- [ ] Closing an unscored clue returns focus to the same tile with a keyboard.
- [ ] How to play opens and closes.
- [ ] Refresh restores the current game.
- [ ] Round 1 advances to Double Jeopardy! after 30 clues.
- [ ] Double Jeopardy! advances to Final Jeopardy! after 30 clues.
- [ ] The 61st clue opens the final-results dialog.
- [ ] Play another game generates a different board.

## Repository contents

- [ ] `index.html` is at the repository root.
- [ ] `.nojekyll` is at the repository root.
- [ ] `404.html` is at the repository root.
- [ ] `js/` is complete.
- [ ] `data/manifest.json` is present.
- [ ] `data/round1/`, `data/round2/`, and `data/final/` are complete.
- [ ] `source/clues.xlsx` is not committed.

## GitHub Pages

- [ ] Repository name is `jeopardy`.
- [ ] Repository owner is `louisgreubel`.
- [ ] Pages source is `main` and `/(root)`.
- [ ] The Pages deployment completes successfully.
- [ ] `https://louisgreubel.github.io/jeopardy/` loads the game.
- [ ] The production manifest URL returns JSON.
- [ ] A nonexistent production path shows the custom 404 page.
- [ ] A full mobile smoke test passes on the Galaxy S25 Ultra.
