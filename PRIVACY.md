# Privacy notice

Movie Fountain is a public movie-discovery site and does not currently provide accounts or personal profiles.

## Data handled

- Watchlist selections are stored in localStorage on your browser, including movie titles, identifiers, poster paths and summaries. They are not uploaded or synchronized. Remove individual movies with the heart button, or clear site data to remove the entire list.

- Search terms are sent to the site’s same-origin API endpoint so the site can query TMDB. They are not stored by the application.
- Movie and person identifiers in the URL hash are used to load the requested page.
- The browser may receive standard operational data from Cloudflare, such as request metadata, for security and delivery.
- Posters and movie metadata are loaded from TMDB’s image and API services. Those services may process request metadata under their own policies.

Watched movie IDs are also stored locally under `movie-fountain.watched.v1`. These marks are not uploaded. Genre, year and runtime filters are sent to the same-origin discovery API and TMDB. Sharing sends a public movie URL through your chosen app or clipboard. Imported JSON files are processed locally; exported files reveal your saved movie selections to anyone you share them with.

Movie Fountain does not intentionally collect names, email addresses, passwords, payment data, or precise location. See the visitor-facing [privacy page](https://movie-fountain.pages.dev/privacy.html).

## Third parties

TMDB and other displayed rating providers supply content and may have their own cookies, logs, policies, and terms. Review their policies for details. Movie Fountain does not control those providers.

## Retention and choices

The application has no user database and does not intentionally retain search history. You can clear browser history, cached site data, or network-level logs held by your provider. Do not submit sensitive personal information into the search field.

## Changes and contact

This notice will be updated when the product begins collecting additional data or adds accounts, analytics, personalization, or other tracking. Security concerns should follow [`SECURITY.md`](./SECURITY.md).
