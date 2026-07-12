# A11y Inspector

An [Obsidian](https://obsidian.md) plugin that scans installed plugins for
accessibility violations using [axe-core](https://github.com/dequelabs/axe-core)
and writes an actionable Markdown report — with ready-to-paste GitHub issue
templates — directly to your vault.

## Why

Most Obsidian plugins fail basic WCAG Level A requirements: buttons without
labels, form fields without descriptions, links that convey no meaning to a
screen reader. These bugs are invisible to sighted users and invisible to plugin
developers who have never seen a bug report about them.

A11y Inspector makes them visible. It attributes each violation to the specific
plugin that caused it and generates a pre-written issue text so that filing a
bug report is one copy-paste away.

## What it checks

A11y Inspector runs a curated subset of axe-core rules — chosen because they
catch real bugs in plugin code, not theme or Obsidian-core issues:

| Rule | Why |
| --- | --- |
| `button-name` | Icon buttons without an accessible label |
| `label` | Form fields without a description |
| `aria-input-field-name` | The TalkBack bug reported in 2023 |
| `link-name` | Links that are icon-only |
| `scrollable-region-focusable` | Scrollable areas unreachable by keyboard |
| `aria-prohibited-attr` | Misused ARIA attributes |
| `aria-valid-attr-value` | ARIA attributes with invalid values |
| `aria-required-attr` | Missing required ARIA attributes |
| `image-alt` | Images without alt text |

`color-contrast` is intentionally excluded — it depends on the active theme,
not the plugin, and would produce noise that cannot be attributed accurately.

## How to use

1. Install and enable the plugin.
2. Open the **Command Palette** (Cmd/Ctrl+P).
3. Run **A11y Inspector: Run audit**.
4. A Markdown file `a11y-report-YYYY-MM-DD.md` opens in your vault with:
   - A summary of all violations grouped by plugin.
   - A ready-to-paste GitHub issue template per violation.

## Limitations

- axe-core detects roughly 30–40 % of real accessibility problems. Keyboard
  navigation order, meaningful reading order, and cognitive accessibility
  cannot be checked automatically.
- The plugin scans settings tabs (exact plugin attribution) and currently open
  plugin views (view type used as identifier). It cannot scan UI that has never
  been rendered.
- This plugin is desktop-only (`isDesktopOnly: true`).

## Development

See [DEVELOPMENT.md](DEVELOPMENT.md) for setup, build commands, and the release
process.

## License

[MIT](LICENSE)
