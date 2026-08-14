# Phase 5 release-candidate notes

## Goal

Prepare the accepted full game for its first GitHub Pages publication without changing the core game rules or the mobile clue-popup design.

## Player-facing changes

- Replaced development-checkpoint wording with production wording.
- Added a compact How to play dialog.
- Added an unobtrusive release number in the footer.
- Preserved the accepted six-column mobile board and 88%-height mobile clue dialog.

## Accessibility and interaction changes

- Added a polite screen-reader announcement region.
- Scoring now announces the result, value change, and new score.
- Round changes announce the new round.
- Closing an unanswered or revealed clue returns keyboard focus to the same board tile after the board redraws.
- The response region announces itself when revealed.
- Touch controls use `touch-action: manipulation`.

## Reliability changes

- Clue-shard requests include the manifest data version as a query parameter. This reduces the chance that a browser combines a new manifest with stale cached shard files after a future database rebuild.
- Existing game schema and local-storage keys remain unchanged, so a compatible Phase 4.1 saved game can continue.

## GitHub Pages preparation

- Added `.nojekyll` at the repository root.
- Added a custom `404.html`.
- Added `noindex`, `nofollow`, and `noarchive` page metadata.
- Added a beginner-focused deployment guide.

## Acceptance criteria

- All 61 clues remain playable.
- Scores and counts remain accurate.
- The six-column board does not overflow horizontally at supported mobile widths.
- The mobile clue dialog remains smaller than the full viewport with a blurred board visible behind it.
- The How to play dialog works on desktop and mobile.
- Closing a clue without scoring returns focus to that clue tile.
- GitHub Pages can serve the application from a repository subdirectory.
- All local asset and data paths resolve beneath `/jeopardy/`.
