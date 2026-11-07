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
                               +--> What's on? API & optional OMDb fallback (/api/movie/[id]/ratings)
```

### Production path

1. The browser loads `index.html`, `site.css`, `features.js`, and `app.js` from Cloudflare Pages.
2. The SPA reads the URL hash to select home, fountain, search, movie, cast, person, or account views.
3. The browser requests same-origin `/api/*` endpoints.
4. Pages Functions read `TMDB_API_KEY` (and optional `OMDB_API_KEY`) from the Cloudflare environment to call TMDB and external rating providers.
5. Functions return JSON; the browser renders escaped text and TMDB-hosted poster images.

## Repository layout

| Path | Responsibility |
| --- | --- |
| `index.html` | Production shell and accessible search form |
| `app.js` | SPA routing, rendering, multi-source ratings display, fountain interactions, output escaping |
| `features.js` | Theme switching, watched marks, watchlist JSON import/export, sharing, Fountain filters |
| `site.css` | Production visual system (Classic and Liquid Glass themes) and responsive layout |
| `functions/` | Cloudflare Pages API handlers, TMDB adapter, and multi-source ratings aggregator |
| `tests/` | Node unit tests for frontend logic and Pages Functions rating validation |
| `docs/` | Architecture and project operating standards |
| `.github/` | CI workflow, pull request, and collaboration templates |
| `_headers` | Cloudflare Pages security response headers |

## Boundaries and responsibilities

- The browser owns presentation, hash navigation, animation, and user interaction.
- Pages Functions own credentialed provider access and normalize API errors.
- TMDB owns movie metadata, images, and provider-side rate limiting.
- What's on? API and optional OMDb provide external rating scores; Pages Functions validate all numeric ranges and construct outbound URLs strictly from validated IDs.
- Cloudflare owns static delivery, TLS, deployment, and secret storage.

No application database is used. The browser persists watchlist metadata and watched IDs in localStorage. `features.js` handles validated import/export, sharing, watched marks, and Fountain filters. `/api/discover` validates year/runtime/genre parameters and requests one page of released movies from TMDB. Credentials remain in Pages Functions. Privacy details are available in `privacy.html` and `PRIVACY.md`.

## Key decisions

### Same-origin API proxy

API calls go through Pages Functions so `TMDB_API_KEY` and `OMDB_API_KEY` are never sent to the browser. This adds a lightweight server boundary without introducing a separate backend service.

### Non-blocking external ratings

Movie details (`/api/movie/[id]`) render immediately from TMDB, while external ratings (`/api/movie/[id]/ratings`) load asynchronously and cache at the edge for 1 hour (`Cache-Control: public, max-age=3600, s-maxage=3600`). This ensures slow upstream responses never block movie detail navigation.

### Hash-based navigation

The SPA uses URL hashes to keep routing simple on static hosting. A future migration to path-based routing would require Cloudflare fallback configuration and should be recorded as an ADR.

### Defensive rendering

User and provider text is passed through `esc()` before being placed into HTML. New UI code should preserve this rule and avoid interpolating untrusted HTML.

### Generic public errors

Provider details are logged server-side and replaced with a generic client response. This prevents configuration details and upstream response text from becoming part of the public API contract.

## Operational considerations

- Configure `TMDB_API_KEY` (and optionally `OMDB_API_KEY`) in Cloudflare Pages Production and Preview environments as needed.
- Check Cloudflare deployment logs when `/api/*` returns a 502.
- Never debug by printing credentials or full provider URLs containing query parameters.
- Respect TMDB and other provider terms, attribution, caching, and rate limits.
