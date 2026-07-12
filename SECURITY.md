# Security Policy

A11y Inspector is a source-available Obsidian plugin maintained by a single person.
It runs entirely inside Obsidian on your own device: it scans the DOM of open plugin
views and settings tabs using axe-core, and writes a Markdown report to your vault.
It has no backend, sends no telemetry, and makes no network requests of its own.
Security reports are still very welcome.

## Supported versions

Only the latest released version receives security fixes. Please reproduce any
issue on the current release before reporting it.

| Version | Supported |
| --- | --- |
| Latest release | Yes |
| Older releases | No |

## Reporting a vulnerability

**Please do not open a public issue for a security vulnerability.**

Report it privately through GitHub: go to the
[Security tab](https://github.com/christian-luger-at/obsidian-a11y-inspector/security)
of the repository and choose **Report a vulnerability**. This opens a private
advisory that only you and the maintainer can see until a fix is available.

To help triage, please include where practical:

- The plugin version and your Obsidian version and platform.
- A description of the issue and its impact.
- Steps to reproduce, ideally with a minimal example.
- Any proof-of-concept, logs, or screenshots.

## What to expect

As a single-maintainer project, response times are best-effort:

- **Acknowledgement:** within 5 business days.
- **Assessment and triage:** within 10 business days of acknowledgement.
- **Fix:** valid, in-scope issues are addressed as quickly as is practical and
  released in a patch version. You will be credited in the release notes unless
  you prefer to stay anonymous.

Please practice coordinated disclosure: give a reasonable window to ship a fix
before disclosing the issue publicly.

## Scope

Because the plugin runs locally and only reads the DOM, the security-relevant
surface is small. Examples of **in-scope** reports:

- Writing to or deleting files outside the intended report file or outside the vault.
- Executing arbitrary code or commands as a result of processing a crafted plugin view or DOM element.
- Leaking vault contents off the device (any unexpected network activity).

Examples of **out of scope** reports:

- Vulnerabilities in Obsidian itself, axe-core, or any other third-party dependency. Report those to the respective project.
- Issues that require an already-compromised device, a malicious Obsidian plugin, or physical access.
- Missing hardening that has no demonstrated impact (best-practice suggestions are welcome as normal issues).

## No bug bounty

There is no paid bug-bounty program. Credit in the release notes is offered as
thanks for responsible disclosure.
