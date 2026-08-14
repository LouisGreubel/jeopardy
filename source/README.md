# Local workbook folder

Place the source workbook here only when rebuilding the generated JSON:

```text
source/clues.xlsx
```

Excel workbooks in this folder are excluded by `.gitignore`, so they are not accidentally committed to GitHub. The published browser application uses the generated files under `data/` instead.
