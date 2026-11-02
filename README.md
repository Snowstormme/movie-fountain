# Movie Fountain

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

Movie metadata, posters, ratings, and links come from TMDB and other clearly identified sources. Movie Fountain is not affiliated with TMDB, IMDb, Letterboxd, or Rotten Tomatoes. Their terms, availability, rate limits, and attribution requirements apply to the data they provide.

## License

No license has been selected for this repository yet. Until a license is added, the code should be treated as all rights reserved. Dependencies and third-party content remain subject to their own licenses and terms.
