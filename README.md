![Movie Fountain — Let the next movie find you](docs/banner.svg)

# Movie Fountain

[Open the live site](https://movie-fountain.pages.dev/) · [Give feedback](https://github.com/Snowstormme/movie-fountain/issues/new/choose) · [Privacy](https://movie-fountain.pages.dev/privacy.html) · [Contribute](CONTRIBUTING.md)

![Version](https://img.shields.io/badge/version-0.2.0-c9a6d0) ![Platform](https://img.shields.io/badge/Cloudflare-Pages-f38020) ![Storage](https://img.shields.io/badge/lists-local_only-a7d6d2)

## A movie night, without the endless scrolling

Watch posters flow through the Fountain, narrow the selection by genre or mood, and save anything that catches your eye.

| Explore | Make it yours |
| --- | --- |
| Animated Fountain with speed and pause controls | Local watchlist and watched marks |
| Search, cast, details and recommendations | Import/export your watchlist as JSON |
| Mobile-friendly controls and reduced motion | Share a public movie link |

### How to use it

1. Open **Fountain**, then choose a genre or mood.
2. Expand **Year, length & watched** to narrow your selection.
3. Tap **♡** to save a movie, or **Mark watched** to hide it from discovery.
4. Open **Watchlist** for your saved collection and backup tools.

Lists stay in the current browser; export before clearing site data or moving devices. Import merges without deleting existing selections. Mood labels are genre-based approximations. Discovery currently uses the first page of matching TMDB results, not the full catalog. Unknown runtimes are excluded when a time limit is selected. Movie Fountain helps discover movies; it does not stream them.

### Public testing

Try these flows and report what felt confusing or broken through [GitHub feedback](https://github.com/Snowstormme/movie-fountain/issues/new/choose):

1. On a phone, open Fountain and change speed, pause, genre, year, and length.
2. Mark one movie watched, reload, and confirm it stays hidden when requested.
3. Save a movie, export the Watchlist, and import it again.
4. Share a movie link and open it in a new browser tab.

Please include the device, browser, page URL, and steps to reproduce. Never include API keys, cookies, or private files.

Movie Fountain is a movie discovery interface built around a continuously moving “fountain” of films. It combines TMDB discovery data with search, movie details, cast, recommendations, and an expressive liquid-glass UI.

Live site: [movie-fountain.pages.dev](https://movie-fountain.pages.dev/)

## What is included

- Cloudflare Pages single-page application for the production site.
- Cloudflare Pages Functions that proxy TMDB requests without exposing the API key to the browser.
- Fountain mode with speed controls, pause/play, shuffle, keyboard focus states, and reduced-motion support.
- Movie, cast, person, search, recommendation, and rating views.
- A legacy Flask implementation for local/server-rendered development.

## Quick start

### Cloudflare Pages deployment

The production deployment is connected to the `main` branch. Configure `TMDB_API_KEY` as a Cloudflare Pages environment variable for the project; keep it in the Cloudflare dashboard, never in Git or client-side JavaScript.

The site is static at the repository root. Pages Functions are discovered from [`functions/`](./functions/).

### Local Flask development

```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install flask requests python-dotenv
cp .env.example .env
# Edit .env and add a real TMDB_API_KEY locally.
python3 app.py
```

Open <http://127.0.0.1:5000>.

### Local frontend preview

The root frontend expects `/api/*` routes supplied by Cloudflare Pages Functions. Use Cloudflare’s local Pages tooling when testing the deployed architecture, or use the Flask server for the server-rendered path. Do not put a TMDB key in browser code.

## Configuration

| Variable | Required | Used by | Description |
| --- | --- | --- | --- |
| `TMDB_API_KEY` | Yes | Pages Functions and Flask | Server-side TMDB credential |
| `OMDB_API_KEY` | No | Flask fallback | Optional ratings fallback for the legacy server |

See [`.env.example`](./.env.example) for safe placeholders. The real `.env` file is ignored by Git.

## Documentation

- [Architecture](./docs/ARCHITECTURE.md) — runtime boundaries, data flow, and design decisions.
- [Versioning](./docs/VERSIONING.md) — release and changelog policy.
- [Security](./SECURITY.md) — reporting vulnerabilities and security controls.
- [Privacy](./PRIVACY.md) — data handling and third-party services.
- [Contributing](./CONTRIBUTING.md) — local workflow, standards, and pull requests.
- [Changelog](./CHANGELOG.md) — notable project changes.

## Third-party data

This product uses the TMDB API but is not endorsed or certified by TMDB.

Movie metadata, posters, ratings, and links come from TMDB and other clearly identified sources. Movie Fountain is not affiliated with TMDB, IMDb, Letterboxd, or Rotten Tomatoes. Their terms, availability, rate limits, and attribution requirements apply to the data they provide.

## License

No license has been selected for this repository yet. Until a license is added, the code should be treated as all rights reserved. Dependencies and third-party content remain subject to their own licenses and terms.
