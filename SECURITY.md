# Security policy

## Supported versions

Only the latest commit on `main` is actively maintained. This project does not currently publish long-lived release branches.

## Reporting a vulnerability

Do not open a public issue for a suspected credential leak, authentication bypass, injection, or other security vulnerability. Report it privately through [GitHub Private Vulnerability Reporting](https://github.com/Snowstormme/movie-fountain/security/advisories/new) (`Security` → `Report a vulnerability`), including:

- a clear description and impact;
- affected URL, file, or commit;
- reproducible steps or a minimal proof of concept;
- any suggested mitigation.

Remove real credentials from the report. If a key may have been exposed, rotate it immediately in TMDB/Cloudflare and then report the incident.

## Security controls

- Provider keys are stored in Cloudflare environment variables or local `.dev.vars` / `.env`, never in client code.
- `.dev.vars`, `.env`, and common local/build artifacts are ignored by Git.
- Pages Functions return generic public errors and log details server-side.
- User/provider text is escaped before client-side HTML interpolation.
- Cloudflare Pages sends restrictive content, framing, referrer, and permissions headers through [`_headers`](./_headers).
- The frontend does not implement accounts, payments, or user-generated content.
- Automated security checks run via GitHub CodeQL code scanning ([`.github/workflows/codeql.yml`](./.github/workflows/codeql.yml)) and Dependabot alerts ([`.github/dependabot.yml`](./.github/dependabot.yml)).

## Development rules

- Watchlist imports accept at most 2 MB and 2,000 records. Records are normalized, identifiers validated, poster paths restricted, and text escaped before rendering. Imports are never evaluated as code or uploaded.
- Local movie selections are not encrypted and can be read by scripts running on this origin. Exported backups should be treated as personal viewing preferences.
- Discovery accepts only bounded year, runtime and genre parameters; arbitrary upstream URLs are not accepted.

- Never commit API keys, tokens, cookies, dumps, or screenshots containing secrets.
- Do not add `innerHTML` interpolation without escaping or a reviewed trusted template.
- Validate provider IDs and query parameters before using them in requests.
- Keep dependencies and deployment configuration reviewed in pull requests.
