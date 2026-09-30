# Accessibility audit

`axe-audit.mjs` scans the signed-in pages of the student, lecturer, and admin
roles with [axe-core](https://github.com/dequelabs/axe-core) (WCAG 2.0/2.1 A and
AA rules). Each role is checked in English and Chinese at 1280px and 390px
widths. A page that redirects instead of rendering is reported as `redirected`,
never as clean.

## Run

1. Start the stack with seeded accounts: `make db migrate seed-db`, then `make dev-local`.
2. Install the two tools next to the script (they are not project dependencies):
   `cd scripts/a11y && npm init -y && npm i playwright-core axe-core`
3. Run `node axe-audit.mjs` (or `node axe-audit.mjs student`).

Environment variables: `BASE_URL` (default `http://127.0.0.1:5100`),
`CHROMIUM_PATH` (a Chrome/Chromium binary; otherwise Playwright's default),
`AXE_OUT` (JSON results file, default `axe-results.json`), and `CI=1` to pass
`--no-sandbox` when running as root in a container.

The scan covers the pages listed at the top of the script in their seeded state.
It does not open dialogs, submit forms, or read a generated practice report, and
it cannot judge focus order or screen-reader wording.
