# Changelog

All notable changes to Movie Fountain are recorded here.

## [0.4.0] - 2026-11-07

- Add curated **Letterboxd Top 500** dataset (`functions/_lib/letterboxd500.js`) with a rotating homepage shelf and a dedicated **Letterboxd Top 500** browse mode in the Fountain (including year refinement via `/api/discover?source=letterboxd`).
- Redesign the **Classic** theme with a **Jet Black (`#0a0a0c`), Soft White (`#f2efe9`), and Flame Orange (`#ff5a1f`)** cinema palette and gold rating badges (`#d6ae61`).
- Update Fountain playback speeds to `50` / `100` / `150` px/s (`Slow` / `Normal` / `Fast`) with smooth in-place `playbackRate` transitions.
- Redesign the Fountain settings panel into a compact horizontal layout and fix stream reset and poster loading issues during continuous scrolling.
- Remove redundant `View details` label from movie card hover previews to show more of the synopsis.

## [0.3.0] - 2026-11-07

- Port multi-source external ratings (IMDb, Letterboxd, Rotten Tomatoes Critics & Audience via What's on? API with optional OMDb fallback and 1-hour edge cache) to Cloudflare Pages Functions (`/api/movie/[id]/ratings`) and the SPA movie details view.
- Add director and actor search (`/search/person`) alongside movie search, and enrich director/person pages with birth metadata, film counts, and full directed/acting grids.
- Replace the duplicate Cast shelf on movie detail pages with other films by the movie's director (`More from [Director]`), ordered after recommendations.
- Streamline the homepage to three deduplicated shelves (`Trending now`, `Top rated`, `Coming soon`) and fix card action buttons (`Save`, `Mark watched`, `Share`) across all items in a row.
- Optimize Fountain settings toggle responsiveness with CSS containment (`contain: strict`) and batched reflow calculations.
- Remove the legacy Flask server (`app.py`, `templates/`, `static/`) so the repository is a single unified Cloudflare Pages application.
- Format `app.js`, `features.js`, `functions/`, and `tests/features.cjs` for readability and add GitHub Actions CI (`node --test tests/features.cjs`).

## [0.2.0] - 2026-11-03

- Add Tonight movie selection with genre/mood, year and runtime filters.
- Add local watchlist, watched marks, public movie sharing and validated JSON import/export.
- Add mobile-friendly filters, reduced-motion browsing and hidden-tab animation pause.
- Add visitor privacy page and refresh repository presentation and architecture.
- Add public testing guidance, feedback link, and GitHub issue templates.

- Repository standards and security/privacy documentation.
- Safer public error responses for Pages Functions.
- Cloudflare Pages security headers and a safe environment template.

## [0.1.0] - 2026-11-02

- Added the Movie Fountain continuous discovery view.
- Added speed controls, pause/play, shuffle, and movie quick previews.
- Added Cloudflare Pages Functions for server-side TMDB access.
- Added search, movie details, cast, person, recommendations, and ratings views.
