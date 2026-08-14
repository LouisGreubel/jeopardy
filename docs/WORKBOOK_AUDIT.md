# Initial workbook audit

Source file: `clues.xlsx`

## Structure confirmed

- One worksheet is present. Its tab is named `round 1`, but it contains all three rounds.
- The five headers are `round`, `clue_value`, `category`, `clue`, and `response`.
- The workbook contains 120,565 clue rows, excluding the header.

## Round counts

- Round 1: 59,623 rows.
- Round 2: 58,739 rows.
- Final Jeopardy: 2,203 rows.

## Value patterns

- Round 1 uses $200, $400, $600, $800, and $1,000.
- Round 2 uses $400, $800, $1,200, $1,600, and $2,000.
- Every Final Jeopardy row uses $3,000, so the accepted Phase 1 scoring default is workable.

## Recoverable complete category sets

The rows are sorted by round and category title. Repeated category titles can appear consecutively, but their clue values normally restart in the expected five-value order. Splitting on exact five-value sequences produces:

- 11,677 complete Round 1 category instances.
- 11,330 complete Round 2 category instances.
- 2,203 Final Jeopardy clues.

Rows that belong to incomplete or malformed five-clue sequences will be excluded from the playable pool rather than guessed:

- 1,238 Round 1 rows.
- 2,089 Round 2 rows.

## Excel type-conversion issue

Most cells are text, but Excel converted a small set of categories and responses into numbers, dates, times, percentages, currency values, or a Boolean. The converter must preserve each cell's intended displayed form instead of using a simple `String(value)` conversion.

Examples of recoverable formatting include category titles such as `4, 4`, `5, 5`, and `December 21`, as well as responses expressed as fractions, dates, times, percentages, and dollar amounts.

A few cells appear to have been altered by Excel's automatic date conversion. Those exceptional rows will be put into a review list so they can be repaired explicitly rather than silently changed.

## Media-dependent clues

The workbook has no media-file column. A conservative text scan will flag clues that explicitly depend on a missing photo, map, monitor image, animation, audio clip, or video. We will review the high-confidence patterns before exclusion so ordinary clues containing words such as “video game” are not removed by mistake.

## Conversion decision

The next phase will create validated, browser-ready JSON. It will select whole five-clue category instances, preserve formatted text, assign stable IDs, exclude incomplete instances, and produce a separate review report for ambiguous or media-dependent rows.
