# Publish the game with GitHub Pages

This guide publishes the project at:

```text
https://louisgreubel.github.io/jeopardy/
```

The instructions use GitHub's website for the initial upload because it requires the least command-line work. This release contains 94 files, so it fits within GitHub's current limit of 100 files per browser upload.

## Before uploading

1. Extract the release ZIP.
2. Rename the extracted folder to `jeopardy`.
3. Open it in Phoenix Code and run Live Preview.
4. Open several clues, reveal a response, score a clue, and refresh once to confirm the saved game returns.
5. Close Live Preview before uploading.

## Part 1: Create the repository

1. Sign in to GitHub as `louisgreubel`.
2. Use the **+** menu in the upper-right corner and choose **New repository**.
3. Enter this repository name exactly:

   ```text
   jeopardy
   ```

4. Choose **Public** for the accepted GitHub Pages setup.
5. Do not add a README, `.gitignore`, or license during repository creation; those project files already exist in the folder.
6. Select **Create repository**.

Official repository-creation documentation:

```text
https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository
```

## Part 2: Upload the project

1. On the new empty repository page, select the link for **uploading an existing file**. If the repository is no longer empty, use **Add file → Upload files**.
2. Open the extracted `jeopardy` folder on your computer.
3. Select everything **inside** the extracted `jeopardy` folder and drag it into GitHub's upload area. Do not upload the ZIP itself and do not drag the outer `jeopardy` folder as a single nested folder.
4. Confirm that these important items appear in the pending upload:

   ```text
   index.html
   styles.css
   404.html
   .nojekyll
   js/
   data/
   ```

5. Use the commit message:

   ```text
   Initial Jeopardy game release
   ```

6. Commit directly to the `main` branch.

The package contains 94 files, and the largest generated clue file is under 0.4 MB. It therefore fits within GitHub's current browser limits of 100 files per upload and 25 MiB per file. Preserve the complete folder structure, especially the folders beneath `data/`.

Official upload documentation:

```text
https://docs.github.com/en/get-started/start-your-journey/uploading-a-project-to-github
```

### Verify `.nojekyll`

After the upload finishes, inspect the repository's root file list. It should contain `.nojekyll`.

If your operating system did not include that hidden file:

1. Choose **Add file → Create new file**.
2. Enter `.nojekyll` as the filename.
3. Put one short line in the editor, such as `Static site`.
4. Commit it to `main`.

GitHub Pages ignores the contents; the filename is what matters.

## Part 3: Enable GitHub Pages

1. Open the repository's **Settings** tab.
2. In the left sidebar, under **Code and automation**, choose **Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Select:

   ```text
   Branch: main
   Folder: /(root)
   ```

5. Select **Save**.
6. Wait for GitHub to finish the first deployment.
7. Visit:

   ```text
   https://louisgreubel.github.io/jeopardy/
   ```

GitHub notes that publication can take several minutes after a push.

Official Pages-source documentation:

```text
https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
```

## Part 4: Production test

At the published URL, verify all of the following:

- The loading screen disappears.
- Six real Round 1 categories appear.
- The board does not scroll horizontally on the phone.
- A dollar value opens the clue popup.
- The board is visible and blurred behind the mobile popup.
- Reveal response works.
- Right and Wrong update the score correctly.
- Refresh restores the same game.
- How to play opens and closes.
- New game asks for confirmation.
- `https://louisgreubel.github.io/jeopardy/not-a-real-page` displays the custom 404 page.

## Troubleshooting

### The main URL shows 404

Check that:

- The repository is named exactly `jeopardy`.
- `index.html` is at the repository root, not inside another `jeopardy` subfolder.
- Pages is publishing `main` and `/(root)`.
- The latest Pages deployment finished successfully.

### The game stays on the loading screen

Open this address directly:

```text
https://louisgreubel.github.io/jeopardy/data/manifest.json
```

A JSON document should appear. If it does not, confirm that the entire `data` folder and its subfolders were uploaded.

### The page loads but displays an older version

Perform a hard refresh:

```text
Windows: Ctrl + Shift + R
macOS: Command + Shift + R
```

The app also versions data-shard requests to reduce stale database files after future rebuilds.

### A public URL is not private

The repository and ordinary Pages site are publicly accessible. The page-level `noindex` metadata asks cooperative search engines not to index the main game page; it does not require a password or prevent direct access.

## Updating the live site later

For one or two changed files, GitHub's web editor is adequate. For recurring updates, GitHub Desktop is easier because it can commit and push the modified project folder while preserving all nested data files.

Official GitHub Desktop project-publication documentation:

```text
https://docs.github.com/desktop/guides/contributing-to-projects/adding-an-existing-project-to-github-using-github-desktop
```
