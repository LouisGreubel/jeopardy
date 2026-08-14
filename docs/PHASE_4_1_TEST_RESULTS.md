# Phase 4.1 Mobile Clue Dialog Test Results

## Change tested

The mobile clue dialog is vertically centered and limited to 88% of the dynamic viewport height, with a maximum height of 48rem. The board remains visible above and below the dialog. The mobile backdrop uses a darker translucent overlay plus an 8.8px blur. Unusually long clue and response content scrolls inside the dialog rather than forcing the dialog to fill the screen.

## Automated browser checks

| Viewport | Dialog height | Space above | Space below | Response controls accessible | JavaScript errors |
|---|---:|---:|---:|---|---|
| 320 x 700 | 616 px | 42 px | 42 px | Yes | None |
| 360 x 800 | 704 px | 48 px | 48 px | Yes | None |
| 412 x 915 | 768 px | 73.5 px | 73.5 px | Yes | None |
| 915 x 412 landscape | 370.8 px | 20.6 px | 20.6 px | Yes | None |
| 1440 x 900 desktop | 672 px | 114 px | 114 px | Yes | None |

## Interaction checks

- Opening a value tile opens the clue dialog.
- The clue dialog remains smaller than the mobile viewport.
- The visible board area is blurred behind the dialog.
- Revealing the response keeps the dialog within its fixed mobile height.
- Both honor-system buttons remain accessible.
- Selecting **I was right** updates the score and closes the dialog.
- A deliberately oversized clue and response remained usable through internal dialog scrolling.
- Desktop dialog sizing and backdrop styling remain unchanged.
