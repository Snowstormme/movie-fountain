# Changelog

All notable changes to Movie Fountain are recorded here.

## [Unreleased]

- Port multi-source external ratings (IMDb, Letterboxd, Rotten Tomatoes Critics & Audience via What's on? API with optional OMDb fallback) to Cloudflare Pages Functions (`/api/movie/[id]/ratings`) and the SPA movie details view.
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
