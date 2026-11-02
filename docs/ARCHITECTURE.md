# Architecture

## Context and goals

Movie Fountain is a small, public movie-discovery site. The architecture keeps the browser experience fast and expressive while ensuring provider credentials remain server-side. It is intentionally low-operations: static assets are served by Cloudflare Pages and API calls are handled by Pages Functions.

## System overview

```text
Browser
  |
  | static HTML/CSS/JS
  v
Cloudflare Pages  --->  Pages Functions (/api/*)  --->  TMDB API
                              |
                              +--> optional external rating providers (legacy Flask path)
```

### Production path

1. The browser loads `index.html`, `site.css`, and `app.js` from Cloudflare Pages.
2. The SPA reads the URL hash to select home, fountain, search, movie, cast, or person views.
3. The browser requests same-origin `/api/*` endpoints.
4. Pages Functions read `TMDB_API_KEY` from the Cloudflare environment and call TMDB.
5. Functions return JSON; the browser renders escaped text and TMDB-hosted poster images.

### Local Flask path

`app.py` and `templates/` provide a server-rendered fallback/development implementation. It reads `.env` locally and calls TMDB from the server. Production changes should target the Pages Functions path first and keep the Flask path compatible where practical.

## Repository layout

| Path | Responsibility |
| --- | --- |
| `index.html` | Production shell and accessible search form |
| `app.js` | SPA routing, rendering, fountain interactions, output escaping |
| `site.css` | Production visual system and responsive layout |
| `functions/` | Cloudflare Pages API handlers and TMDB adapter |
| `app.py` | Legacy/local Flask server |
| `templates/`, `static/` | Flask-rendered views and styles |
| `docs/` | Architecture and project operating standards |
| `.github/` | Pull request and collaboration templates |
| `_headers` | Cloudflare Pages security response headers |

## Boundaries and responsibilities

- The browser owns presentation, hash navigation, animation, and user interaction.
- Pages Functions own credentialed provider access and normalize API errors.
- TMDB owns movie metadata, images, and provider-side rate limiting.
- Cloudflare owns static delivery, TLS, deployment, and secret storage.

No application database is currently used. The client does not persist personal profiles, watch history, or account data.

## Key decisions

### Same-origin API proxy

API calls go through Pages Functions so `TMDB_API_KEY` is never sent to the browser. This adds a lightweight server boundary without introducing a separate backend service.

### Hash-based navigation

The SPA uses URL hashes to keep routing simple on static hosting. A future migration to path-based routing would require Cloudflare fallback configuration and should be recorded as an ADR.

### Defensive rendering

User and provider text is passed through `esc()` before being placed into HTML. New UI code should preserve this rule and avoid interpolating untrusted HTML.

### Generic public errors

Provider details are logged server-side and replaced with a generic client response. This prevents configuration details and upstream response text from becoming part of the public API contract.

## Operational considerations

- Configure `TMDB_API_KEY` in Cloudflare Pages Production and Preview environments as needed.
- Check Cloudflare deployment logs when `/api/*` returns a 502.
- Never debug by printing credentials or full provider URLs containing query parameters.
- Respect TMDB and other provider terms, attribution, caching, and rate limits.
