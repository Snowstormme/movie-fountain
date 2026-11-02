# Contributing

Thanks for helping improve Movie Fountain.

## Before you start

Read the [README](./README.md), [architecture](./docs/ARCHITECTURE.md), and [security policy](./SECURITY.md). For substantial behavior or architecture changes, open an issue or discussion first so the approach can be agreed before implementation.

## Local setup

```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install flask requests python-dotenv
cp .env.example .env
python3 app.py
```

Keep credentials local. Never paste a real key into an issue, pull request, browser URL, or commit.

## Change standards

- Keep the production Pages Functions path and the local Flask path understandable when touching shared behavior.
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

There is not yet an automated test suite. New behavior should include a small reproducible manual test plan until automated coverage is added.

## Pull requests

Use the pull request template. Explain the user impact, implementation boundary, testing performed, and any deployment/configuration changes. Screenshots are welcome for visual changes, but redact secrets and personal data.
