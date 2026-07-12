# Contributing to A11y Inspector

Thanks for taking the time to contribute. This guide explains how to report
issues, propose changes, and get a pull request merged.

> [!important]
> **Licensing note.** A11y Inspector is licensed under the [MIT License](LICENSE).
> By submitting a contribution (issue, code, or documentation) you agree that
> your contribution is provided under the same MIT License.

## Ways to contribute

- **Report a bug** — open an [issue](https://github.com/christian-luger-at/obsidian-a11y-inspector/issues).
- **Request a feature** — open an issue describing the problem you want solved.
- **Improve the docs** — fixes to the README, DEVELOPMENT.md, or in-code docs are welcome.
- **Send code** — bug fixes and small, well-scoped features via pull request.

For anything larger than a small fix, please **open an issue first** so we can
agree on the approach before you invest time.

## Reporting bugs

A good bug report includes:

1. **What you did** — the steps to reproduce.
2. **What you expected** to happen.
3. **What actually happened** (screenshots or console output help a lot).
4. **Environment** — Obsidian version, operating system, A11y Inspector version.

## Development setup

The full setup (test vault, symlink, watch mode) is documented in
**[DEVELOPMENT.md](DEVELOPMENT.md)**. In short:

```bash
nvm use          # activate the Node version from .nvmrc
npm install      # install dependencies
npm run dev      # start esbuild in watch mode
```

## Before you open a pull request

Run all checks locally — CI runs the same ones:

```bash
npm run lint     # eslint (incl. eslint-plugin-obsidianmd rules)
npm test         # vitest — all tests must pass
npm run build    # type-check + production bundle
```

If you change behaviour, **add or update tests**. Check coverage with:

```bash
npm run test:coverage
```

## Coding guidelines

- **TypeScript, strict mode.** Match the style of the surrounding code.
- **Respect the Obsidian API guidelines** enforced by `eslint-plugin-obsidianmd`.
- **Keep changes focused.** One logical change per pull request.

## Commit messages

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — a new user-facing feature (→ **Features** in the release notes)
- `fix:` — a bug fix (→ **Fixes**)
- `chore:`, `ci:`, `test:`, `docs:`, `style:`, `build:`, `refactor:`, `perf:` — omitted from release notes

## Pull request checklist

- [ ] There is a related issue (for anything beyond a trivial fix).
- [ ] `npm run lint`, `npm test`, and `npm run build` all pass.
- [ ] New or changed behaviour is covered by tests.
- [ ] Commits follow Conventional Commits.
- [ ] The PR description explains **what** changed and **why**.

## Releases

Releases are cut by the author with `release.sh`. Contributors should leave
`manifest.json`, `package.json`, and `versions.json` version numbers unchanged.

## Questions

Not sure about something? Open an issue with the **question** label.
