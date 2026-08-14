# Jeopardy! Random Game — Release 1.0.0 candidate

This project is a static, single-player browser game that generates a complete 61-clue Jeopardy-style game from a validated clue database.

## Included game flow

- Six-category, 30-clue Jeopardy! Round
- Six-category, 30-clue Double Jeopardy! Round
- One Final Jeopardy! clue
- Value-only compact boards that fit a mobile screen without horizontal scrolling
- Large clue popup with a hidden response
- Honor-system Right and Wrong buttons
- Automatic score, correct, wrong, and progress tracking
- Sequential round progression
- Final results dialog
- Automatic save and restoration in the same browser
- Random new-game generation

## Open locally in Phoenix Code

1. Extract the project folder.
2. Open the folder itself in Phoenix Code.
3. Start **Live Preview**.
4. Do not double-click `index.html` outside Live Preview. The browser must serve the JSON files through an HTTP address.

## Intended GitHub Pages address

```text
https://louisgreubel.github.io/jeopardy/
```

The project uses relative file paths, so it works beneath the `/jeopardy/` project path.

See [`docs/GITHUB_PAGES_DEPLOYMENT.md`](docs/GITHUB_PAGES_DEPLOYMENT.md) for beginner-friendly publication instructions.

## Release-candidate improvements

Release 1.0.0 adds production and deployment polish without changing the accepted game mechanics:

- A **How to play** dialog
- Screen-reader announcements for scoring and round changes
- Focus returned to the same clue tile when an unscored clue popup is closed
- Versioned clue-shard requests to reduce stale-data problems after future database rebuilds
- A custom GitHub Pages `404.html`
- A root `.nojekyll` file for direct static publishing
- A page-level `noindex`, `nofollow`, and `noarchive` request in the HTML metadata
- A 94-file release layout that can be uploaded through GitHub's browser in one batch
- Updated production wording and release identification

The crawler directives reduce discoverability but do not make a public GitHub Pages site private.

The clue data is packaged in 63 shards. This preserves selective loading while keeping the entire release below GitHub's browser-upload count limit.

## Project map

- `index.html` — application structure and dialogs
- `styles.css` — board, popup, mobile, and accessibility styling
- `js/app.js` — startup, player actions, round flow, and announcements
- `js/data.js` — manifest and random shard loading
- `js/game.js` — game state, scoring, and validation
- `js/storage.js` — browser save and restore
- `js/ui.js` — board rendering and interface updates
- `data/` — browser-ready clue manifest and shards
- `404.html` — friendly GitHub Pages not-found page
- `.nojekyll` — direct static-site publishing marker
- `tools/` — Excel conversion and validation utilities
- `source/` — location for a future replacement `clues.xlsx`
- `docs/` — architecture, testing, release, and deployment instructions

## Saved progress

The selected game and all clue states are stored in `localStorage` after important actions. Refreshing the page in the same browser restores the current score, round, and board.

Saved progress is browser- and device-specific. A game on a phone does not automatically appear on a desktop computer.

## Updating the clue data later

Place an updated workbook at:

```text
source/clues.xlsx
```

Then run:

```text
python -m pip install -r requirements.txt
python tools/build_data.py
python tools/validate_data.py
```

The original workbook is ignored by Git and is not included in this release package. The generated JSON under `data/` is what the browser uses.

## Public-site note

Ordinary GitHub Pages publication makes the site and its browser-readable clue files publicly retrievable. The project includes a page-level `noindex` request because the intended use is personal and unadvertised, but it is not an access control.

## Next milestone

After the release candidate passes local testing, publish it to the `louisgreubel/jeopardy` repository and verify the production URL on desktop and the Galaxy S25 Ultra.
