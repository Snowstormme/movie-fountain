# Contributing

Thanks for helping improve Movie Fountain.

## Before you start

Read the [README](./README.md), [architecture](./docs/ARCHITECTURE.md), and [security policy](./SECURITY.md). For substantial behavior or architecture changes, open an issue or discussion first so the approach can be agreed before implementation.

## Local setup

```bash
cp .env.example .dev.vars
# Add your TMDB_API_KEY in .dev.vars for local Cloudflare Pages Functions preview:
npx wrangler pages dev .
```

Run the test suite with Node built-ins (no package installation required):

```bash
node --test tests/features.cjs
```

Keep credentials local. Never paste a real key into an issue, pull request, browser URL, or commit.

## Change standards

- Keep the SPA (`app.js`, `features.js`) and Cloudflare Pages Functions (`functions/`) clean, readable, and well-tested.
- Escape untrusted text before inserting it into HTML.
- Keep API keys server-side.
- Preserve keyboard access, visible focus, responsive layout, and `prefers-reduced-motion` behavior.
- Prefer small, focused commits with an imperative subject line.
- Update documentation and [`CHANGELOG.md`](./CHANGELOG.md) for user-visible behavior.

## Verification checklist

Before opening a pull request:

- Run the local app and exercise home, search, movie, cast, person, and fountain views.
- Check the browser console for errors.
- Test a narrow mobile viewport and keyboard navigation.
- Confirm no `.env`, token, or generated artifact is staged: `git status --short`.
- Review the final diff for accidental secrets or unrelated changes.

Run `node --test tests/*.cjs`, `node --check app.js`, `node --check features.js`, and `git diff --check`. Also exercise Fountain filters, watched exclusion, share/copy fallback, watchlist export/import, invalid JSON, and storage failure. The tests use Node built-ins without package installation.

## Pull requests

Use the pull request template. Explain the user impact, implementation boundary, testing performed, and any deployment/configuration changes. Screenshots are welcome for visual changes, but redact secrets and personal data.
