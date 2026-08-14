# Phase 5 release-candidate test results

## Result

**Passed.** The release candidate preserved the full 61-clue game and passed static, data, interaction, persistence, responsive-layout, and GitHub Pages path checks.

## Real-dataset validation

Command:

```text
python tools/validate_data.py --games 10000
```

Validated:

- 22,719 playable regular-round category instances
- 113,595 playable regular-round clues
- 2,203 Final Jeopardy clues
- 63 JSON shard files
- 10,000 simulated complete games

The existing data validator reported `Validation passed`.

## Static release validation

Command:

```text
python tools/validate_release.py
```

Validated:

- Required GitHub Pages root files
- Relative HTML asset paths
- Required production interface IDs
- Page-level crawler metadata
- All 63 manifest shard paths
- JavaScript syntax for all five browser modules
- Absence of packaged Excel workbooks

The release validator reported `Release validation passed`.

## GitHub browser-upload packaging

The release data was re-sharded at 400 records per file. This keeps the complete project at **94 files**, below GitHub's current 100-file browser-upload limit, while keeping every individual file under 0.4 MB. The playable clue total and all IDs remain unchanged.

## Browser interaction validation

A headless Chromium harness loaded the real Phase 5 HTML, CSS, and JavaScript modules with deterministic test clue data. This isolates interface behavior while the separate dataset validator checks every real clue shard.

Passed behaviors:

- Six Round 1 categories and 30 clues rendered.
- The compact board had no horizontal overflow at 320, 360, 412, and 915 CSS-pixel widths.
- The How to play dialog opened and closed.
- The mobile clue dialog remained smaller than the viewport.
- The mobile backdrop retained an active blur.
- Closing an unscored clue returned focus to the same tile.
- Reveal response exposed the response panel.
- Correct scoring updated the score and correct count.
- The accessibility announcement included the outcome, value change, and new score.
- Saved game data restored in a new document.
- A complete 61-clue game advanced through both transitions and opened final results.
- Final results showed 61 correct, 0 wrong, and 61 / 61 answered in the all-correct automated run.

## Responsive measurements

| Viewport | Clue-dialog bounds | Visible board space |
|---|---:|---:|
| 360 × 800 | 322 × 704 at y = 48 | 48 px above and below |
| 412 × 915 | 374 × 768 at y = 73.5 | 73.5 px above and below |
| 915 × 412 landscape | 877 × 370.8 at y = 20.6 | About 20.6 px above and below |

At 360 × 800, the computed backdrop blur was `8.8px`.

## Cache-version test

The browser data loader now appends the manifest `dataVersion` to clue-shard requests. The static and syntax validators confirmed the versioned request path, and the browser harness successfully loaded the versioned synthetic shard URLs.

## Manual production checks still required

Automated testing cannot reproduce every browser-toolbar and safe-area detail of the physical phone. After publication, perform the production checklist on:

- Samsung Internet on the Galaxy S25 Ultra
- Chrome on the Galaxy S25 Ultra
- A desktop browser at the final GitHub Pages URL
