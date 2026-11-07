![Movie Fountain — Let the next movie find you](docs/banner.svg)

# Movie Fountain

[Open the live site](https://movie-fountain.pages.dev/) · [Give feedback](https://github.com/Snowstormme/movie-fountain/issues/new/choose) · [Privacy](https://movie-fountain.pages.dev/privacy.html) · [Contribute](CONTRIBUTING.md)

![Version](https://img.shields.io/badge/version-0.4.0-ff5a1f) ![Platform](https://img.shields.io/badge/Cloudflare-Pages-f38020) ![Storage](https://img.shields.io/badge/lists-local_only-a7d6d2) ![License](https://img.shields.io/badge/license-Apache_2.0-d6ae61)

## A movie night, without the endless scrolling

Watch posters flow through the Fountain, narrow the selection by genre or mood, and save anything that catches your eye.

| Explore | Make it yours |
| --- | --- |
| Animated Fountain with speed and pause controls | Account area with local watchlist, filters, sort, and stats |
| Rotating Letterboxd Top 500 shelf and Fountain filter mode | Classic (Jet Black & Flame Orange) and Liquid Glass themes |
| Search movies, directors, and actors with full filmographies | Import/export your watchlist as JSON & share movie links |
| Multi-source ratings (TMDB, IMDb, Letterboxd, Rotten Tomatoes) | Privacy-first local browser storage with zero tracking |

### How to use it

1. Open **Fountain**, then open **Settings** to choose playback speed, genre/mood, year, length, or hide watched films.
2. Tap **Save** on any card to add a movie to your watchlist, or **Mark watched** to track what you have seen.
3. Search for any **movie, director, or actor** in the top bar to explore ratings, recommendations, other films by the director, and full biographies/filmographies.
4. Open **Account** to filter/sort your saved movies, switch between **Classic** and **Liquid Glass** appearance, or export/import your backup JSON.

Lists stay in the current browser; export before clearing site data or moving devices. Import merges without deleting existing selections. Mood labels are genre-based approximations. Discovery currently uses the first page of matching TMDB results, not the full catalog. Unknown runtimes are excluded when a time limit is selected. Movie Fountain helps discover movies; it does not stream them.

### Public testing

Try these flows and report what felt confusing or broken through [GitHub feedback](https://github.com/Snowstormme/movie-fountain/issues/new/choose):

1. On a phone, open Fountain and change speed, pause, genre, year, and length.
2. Mark one movie watched, reload, and confirm it stays hidden when requested.
3. Save a movie, open **Account**, and export/import your Watchlist.
4. Share a movie link and open it in a new browser tab.

Please include the device, browser, page URL, and steps to reproduce. Never include API keys, cookies, or private files.

Movie Fountain is a movie discovery interface built around a continuously moving “fountain” of films. It combines TMDB discovery data with search, movie details, cast, recommendations, and an expressive liquid-glass UI.

Live site: [movie-fountain.pages.dev](https://movie-fountain.pages.dev/)

## What is included

- Cloudflare Pages single-page application for the production site.
- Cloudflare Pages Functions that proxy TMDB and external ratings requests without exposing API keys to the browser.
- Fountain mode with speed controls, pause/play, genre/mood filters, year/runtime refinement, keyboard focus states, and reduced-motion support.
- Movie, cast, person, search, recommendation, and multi-source rating views (TMDB, IMDb, Letterboxd, and Rotten Tomatoes).

## Quick start

### Cloudflare Pages deployment

The production deployment is connected to the `main` branch. Configure `TMDB_API_KEY` (and optionally `OMDB_API_KEY`) as Cloudflare Pages environment variables for the project; keep them in the Cloudflare dashboard, never in Git or client-side JavaScript.

The site is static at the repository root. Pages Functions are discovered from [`functions/`](./functions/).

### Local development & testing

The root frontend expects `/api/*` routes supplied by Cloudflare Pages Functions. Run the unit and syntax checks with Node built-ins:

```bash
node --test tests/features.cjs
```

To preview the full stack locally with Cloudflare Pages Functions, copy `.env.example` to `.dev.vars` with your `TMDB_API_KEY` and run `npx wrangler pages dev .`. Do not put a TMDB key in browser code.

## Configuration

| Variable | Required | Used by | Description |
| --- | --- | --- | --- |
| `TMDB_API_KEY` | Yes | Pages Functions | Server-side TMDB credential |
| `OMDB_API_KEY` | No | Pages Functions (`/api/movie/[id]/ratings`) | Optional fallback for IMDb and Rotten Tomatoes ratings |

See [`.env.example`](./.env.example) for safe placeholders. Real credential files (`.env`, `.dev.vars`) are ignored by Git.

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

Licensed under the [Apache License 2.0](./LICENSE). Third-party dependencies and movie metadata remain subject to their respective licenses and terms.
