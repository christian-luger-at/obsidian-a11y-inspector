# A11y Inspector Development Guide

This document explains how to activate code changes automatically in the plugin inside [Obsidian](https://obsidian.md).

## Prerequisites

### Node.js with nvm

This project uses **nvm** (Node Version Manager). Make sure you have nvm installed.

### 1. Create a test vault

If you do not already have a test vault, create one now (or open your existing test vault):

#### Option A: Using the Obsidian UI

1. Open Obsidian
2. Click the vault icon in the top left
3. Choose **Create new vault**
4. Enter a name (for example, "Plugin Test")
5. Choose a location (for example, `~/dev/obsidian-focus-first-vault/Plugin-Test`)
6. Click **Create**

#### Option B: Manual (existing vault)

If your test vault already exists, skip this step.

### 2. Link the plugin to Obsidian (symlink)

Create the plugin folder and add a symlink to the vault's plugin directory:

```bash
mkdir -p ~/dev/obsidian-focus-first-vault/Plugin-Test/.obsidian/plugins

ln -s ~/dev/obsidian-a11y-inspector ~/dev/obsidian-focus-first-vault/Plugin-Test/.obsidian/plugins/a11y-inspector
```

Verify that the symlink was created correctly:

```bash
ls -la ~/dev/obsidian-focus-first-vault/Plugin-Test/.obsidian/plugins/a11y-inspector
```

You should see something like this (macOS usually shows the full target path):

```bash
a11y-inspector -> /Users/christian/dev/obsidian-a11y-inspector
```

> [!tip]
> It is normal for `ls -la` to show the full path `/Users/...` — this is not a misconfiguration.

### 3. Install project dependencies (important)

Make sure the correct Node version is active and install dependencies:

```bash
nvm use # activate the Node version defined in .nvmrc
npm install # install all dependencies (esbuild, typescript, axe-core, ...)
```

> [!important]
> `npm run dev` will fail if you do not run `npm install` first.

### 4. Start the development server (watch mode)

Now start the dev server (esbuild in watch mode):

```bash
nvm use
npm run dev
```

> [!tip]
> You can start the dev server before opening the vault; however, it is recommended to create the vault and symlink first so Obsidian loads the correct `main.js`.

This starts **esbuild in watch mode**, which automatically bundles your TypeScript files into `main.js` whenever you save.

### 5. Load the plugin in Obsidian

1. Open Obsidian with your test vault (if it is not already open)
2. Go to **Settings → Community plugins → Installed plugins**
3. Enable the "A11y Inspector" plugin if it is disabled

### 6. Reload the plugin after code changes

After every change:

1. Save the file (Cmd+S)
2. Wait about 1-2 seconds for `npm run dev` to bundle the new `main.js`
3. Open the **Command Palette** with Cmd+P
4. Type `Reload` and choose **Reload plugins**

That's it! Your updated plugin is now active.

## Folder structure

```bash
main.ts              # plugin entry point (v0 spike — grows with each milestone)
styles.css           # plugin styles (empty for now)
```

The source will be split into `src/` once the project grows beyond the spike phase.

## Build commands

| Command | Description |
| --- | --- |
| `npm run dev` | Watch mode for development (esbuild recompiles on changes) |
| `npm run build` | Production build with TypeScript type check and minification |
| `npm run lint` | Run ESLint with Obsidian-specific rules |

## Build production release

### 1. Bump the version

The version number lives in three places: `package.json`, `manifest.json`, and `versions.json`. You can bump it automatically or manually.

#### Option A — automated (`--bump`)

Pass `--bump patch|minor|major` to the release script (or use the matching npm shortcut). This runs `npm version <type>`, which bumps `package.json` and — via the existing `version-bump.mjs` hook — keeps `manifest.json` and `versions.json` in sync, then commits the result as `chore: bump version to vX.Y.Z`:

```bash
bash release.sh --bump patch   # 0.0.1 → 0.0.2 — bug fixes
bash release.sh --bump minor   # 0.0.1 → 0.1.0 — new features, backwards compatible
bash release.sh --bump major   # 0.0.1 → 1.0.0 — breaking changes
```

This requires a clean working tree (commit or stash any pending changes first). Combine with `--publish` (or use the `release:patch` / `release:minor` / `release:major` npm scripts below) to bump, build, and publish in one command.

#### Option B — manual

Update `manifest.json` and `package.json` by hand, then commit:

```bash
# Edit version in manifest.json and package.json (e.g. 0.0.1 → 0.1.0)
git add manifest.json package.json
git commit -m "chore: bump version to 0.1.0"
git push
```

### 2. Build and package

Run the release script — it builds the production bundle and copies the three required files into `releases/v<version>/`:

```bash
npm run release
```

Output: `releases/v0.1.0/` containing `main.js`, `manifest.json`, `styles.css`.

### 3. Create a GitHub release

#### Option A — automated (`--publish`)

```bash
npm run release:publish
# equivalent to: bash release.sh --publish

# override the auto-generated notes with your own text:
bash release.sh --publish --notes "Initial axe-core spike working in Obsidian"
```

**Release notes are generated automatically** from the [Conventional Commits](https://www.conventionalcommits.org/) since the previous tag: `feat:` commits become **Features**, `fix:` commits become **Fixes**, and non-conventional subjects go under **Other** (noise like `chore:` / `ci:` / `test:` / `docs:` is dropped). The script prints a preview before the publish confirmation. Pass `--notes "…"` to override.

To bump the version, build, and publish in a single command:

```bash
npm run release:patch   # bug fixes
npm run release:minor   # new features
npm run release:major   # breaking changes
```

Before publishing, the script checks that:

- the [GitHub CLI](https://cli.github.com/) (`gh`) is installed and authenticated (`gh auth login`)
- the working tree is clean
- the tag `<version>` doesn't already exist

It then asks for confirmation (`Publish X.Y.Z to GitHub? [y/N]`) before pushing the tag and creating the release.

> [!important]
> The release tag must match the `version` in `manifest.json` **exactly, without a `v` prefix** (e.g. `0.1.0`, not `v0.1.0`). Obsidian's community-plugin store and the in-app auto-updater only recognise releases tagged this way. `release.sh` already tags without the prefix.

#### Option B — manual

```bash
git tag 0.1.0
git push origin 0.1.0

gh release create 0.1.0 \
  releases/v0.1.0/main.js \
  releases/v0.1.0/manifest.json \
  releases/v0.1.0/styles.css \
  --title "0.1.0" \
  --notes "Initial release"
```

> [!tip]
> To install the release in Obsidian manually: download all three files and place them in `.obsidian/plugins/a11y-inspector/` inside your vault.

## Submit the plugin to the Obsidian Community store

Getting the plugin into the in-app **Community Plugins** browser is a **one-time** pull request against Obsidian's registry.

### Before you submit — checklist

- **`manifest.json`** sits in the repo root with a unique `id` (`a11y-inspector`), a `name` that doesn't start with "Obsidian", a concise `description`, plus `author`, `minAppVersion`, and `isDesktopOnly: true`.
- **`versions.json`** maps each released plugin version to its minimum Obsidian version.
- A **`LICENSE`** file and a **`README.md`** (what it does + how to use it) exist.
- No leftover sample-plugin code, no `console.log` — the source is public and reviewable.
- A **GitHub release** exists whose **tag equals the `manifest.json` version exactly, with no `v` prefix**, with `main.js`, `manifest.json`, and `styles.css` attached as assets.

Run `npm run lint` then cut the release with `npm run release:publish`.

### First-time submission (one-off)

1. Cut the release (above) so the tag and the three assets exist.
2. Fork [`obsidianmd/obsidian-releases`](https://github.com/obsidianmd/obsidian-releases) and append your plugin to the **end** of `community-plugins.json`:

   ```json
   {
     "id": "a11y-inspector",
     "name": "A11y Inspector",
     "author": "Christian Luger",
     "description": "Scans installed Obsidian plugins for accessibility violations using axe-core.",
     "repo": "christian-luger-at/obsidian-a11y-inspector"
   }
   ```

   - `repo` is the `user/repo` slug — **not** a full URL.
   - Keep the JSON valid and don't reorder existing entries.
3. Open a **pull request** to `obsidianmd/obsidian-releases` and fill in the PR template.
4. The automated bot validates the repo and release — fix anything it flags. Then a maintainer reviews manually; this can take days to a few weeks.
5. Once the PR is merged, the plugin shows up in **Settings → Community plugins → Browse** for everyone.

### Ongoing updates (after acceptance)

No further PR is ever needed. For each update:

1. Bump `manifest.json` **and** `versions.json` (the `--bump` flag does both).
2. Cut a new release — e.g. `npm run release:patch` / `release:minor` / `release:major`.
3. Obsidian clients detect the new release automatically and offer the update.

> [!important]
> The plugin `id` is **permanent** once accepted — changing it later breaks users' saved settings and the update path. Double-check `id` before submitting.

## Additional resources

- [Obsidian Sample Plugin](https://github.com/obsidianmd/obsidian-sample-plugin)
- [Obsidian API Docs](https://docs.obsidian.md)
- [Obsidian Plugin Guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines)
- [Submit your plugin (official guide)](https://docs.obsidian.md/Plugins/Releasing/Submit+your+plugin)
- [Community plugins registry (`obsidian-releases`)](https://github.com/obsidianmd/obsidian-releases)
- [axe-core](https://github.com/dequelabs/axe-core)
- [axe-core Rules](https://dequeuniversity.com/rules/axe/4.x/)
