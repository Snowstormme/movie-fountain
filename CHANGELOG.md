# Changelog

All notable changes to Movie Fountain are recorded here.

## [0.9.2] - 2026-11-12

- Add full **Amazon Prime Video** streaming integration (`#streaming/prime`, `#prime`, `#amazon`, `#primevideo`): explore acclaimed Amazon Originals and cinema (*Sound of Metal*, *Manchester by the Sea*, *Air*, *Saltburn*, *The Boys*, *Fallout*, *Fleabag*, *The Marvelous Mrs. Maisel*, *Reacher*, *Invincible*, *The Rings of Power*, *Good Omens*, *The Expanse*), powered by TMDB watch provider IDs `9|119` and network ID `1024` with dedicated curated catalog fallback (`functions/_lib/prime_catalog.js`).
- Add active **Prime Video Provider Card & Ambient Palette**: signature Amazon azure cyan ambient glow (`#00a8e1`), official Prime Video smile arrow vector lockup, interactive active/ready status pills, and localized EN/RU subtitles.
- Add **Prime Video Platform Chip**: custom deep navy and cyan border chip (`PRIME` with vector smile arrow) on streaming movie and series cards.
- Add **Route & Storage Persistence**: direct hash routes (`#prime`, `#amazon`, `#primevideo`) activate the Prime Video catalog, persist user choice in `localStorage`, and integrate with compact regional country dropdowns and sorting tools.

## [0.9.1] - 2026-11-12

- Add full **Max (HBO)** streaming integration (`#streaming/max`, `#max`, `#hbo`, `#hbomax`): explore acclaimed HBO original series and Warner Bros. cinema (*Dune: Part Two*, *The Dark Knight*, *The Sopranos*, *Succession*, *The Last of Us*, *Game of Thrones*, *Chernobyl*, *True Detective*, *House of the Dragon*, *The Wire*, *The Penguin*, *Barry*, *Hacks*, *Spirited Away*, *The Matrix*), powered by TMDB provider IDs `1899|384` and network IDs `49|3186` with dedicated curated catalog fallback (`functions/_lib/max_catalog.js`).
- Add active **Max Provider Switcher & Visual Identity**: signature electric royal blue ambient glow, official Max vector typography with bullseye lettermark, interactive active/ready status pills, and localized EN/RU subtitles.
- Add **Max Platform Chip**: custom electric royal blue and deep purple gradient chip (`MAX`) on streaming movie and series cards.
- Add **Route & Storage Persistence**: direct hash navigation (`#max`, `#hbo`, `#hbomax`) automatically activates the Max catalog, stores preferences in `localStorage`, and seamlessly integrates with compact regional country dropdowns and sort options.

## [0.8.0] - 2026-11-09

- Add full **Apple TV+** streaming integration (`#streaming/apple`, `#apple`, `#appletv`): explore acclaimed Apple Original movies and series (*Severance*, *Ted Lasso*, *CODA*, *Killers of the Flower Moon*, *Slow Horses*, *Silo*, *The Morning Show*, *Foundation*, *Bad Sisters*, *Wolfwalkers*, *Pachinko*), powered by TMDB provider ID 350 and network ID 2552 with dedicated offline catalog fallback (`functions/_lib/apple_catalog.js`).
- Add active **Streaming Provider Switcher**: one-click toggling between Netflix and Apple TV+ with custom theme glow styling (crimson neon for Netflix, titanium silver for Apple TV+), official SVG logos, and persistent preference stored in `localStorage`.
- Add **Regional Country Selector Bar**: rapid one-click selection across 14 global streaming regions (`🇺🇸 US`, `🇬🇧 GB`, `🇨🇦 CA`, `🇩🇪 DE`, `🇫🇷 FR`, `🇯🇵 JP`, `🇰🇷 KR`, `🇹🇷 TR`, `🇪🇸 ES`, `🇮🇹 IT`, `🇧🇷 BR`, `🇦🇺 AU`, `🇮🇳 IN`, `🇷🇺 RU`) with localized flag pills and immediate catalog refetch.
- Add dynamic **Pagination & Incremental Loading**: "Load More Titles" button with real-time count indicator (`Showing X of Y titles`), background chunk requests, and robust deduplication.
- Enhance streaming movie cards with vertically stacked platform chip (` Apple TV+` / `NETFLIX`) and media type badge (`Movie` / `Series`), eliminating overlap with watchlist action buttons.
- Bump asset cache key to `v55`.

## [0.7.0] - 2026-11-09

- Add **Streaming Services Hub** with dedicated Netflix catalog (`#streaming` / `#netflix`): explore acclaimed Netflix original and licensed films and series (*Stranger Things*, *Squid Game*, *Dark*, *Mindhunter*, *The Queen's Gambit*, *Wednesday*, *Roma*, *The Irishman*, *All Quiet on the Western Front*), with one-click type filtering (`All`, `Movies`, `TV Series`, `Top Rated`) and integrated watchlist controls.
- Add TV series support to movie detail API and route handlers with automatic `/tv/[id]` fallback and creator credits.
- Add **Where to Watch** (Streaming Providers) powered by JustWatch and TMDB data: displays real-time streaming options (subscription, rent, buy, free) with authentic provider logos, regional country switchers (e.g., RU, US, GB, DE, FR, CA), and direct links.
- Add animated continuous Fountain stream hero GIF (`docs/hero-fountain.gif`) for interactive repository showcase.

## [0.6.4] - 2026-11-09

- Simplify consensus score verdicts by removing generic tags and exclusively awarding a golden **Masterpiece** verdict badge for films scoring 90 and above.

## [0.6.3] - 2026-11-09

- Remove redundant YouTube external link from movie detail action buttons, streamlining movie actions to the primary inline trailer button and localized full cast link.

## [0.6.2] - 2026-11-09

- Expand **Editor's Choice** collection to 34 cinema masterpieces, adding *Eyes Wide Shut*, *Life, and Nothing More...*, *Blade Runner 2049*, *Where Is The Friend's House?*, *Good Will Hunting*, *Once Upon a Time in America*, *A Bronx Tale*, *Through the Olive Trees*, *The Green Mile*, *Primal Fear*, *GoodFellas*, *Oppenheimer*, *Interstellar*, *The Dark Knight*, *The Wind Will Carry Us*, *Donnie Darko*, *Requiem for a Dream*, *Scent of a Woman*, *Home Alone 2: Lost in New York*, and *Papillon*.
- Include verified multi-source rating snapshots and instant interactive Editor's Choice badges.

## [0.6.1] - 2026-11-09

- Expand **Editor's Choice** collection to 14 films, adding *The Irishman*, *The Shawshank Redemption*, *Close-Up*, *10 Things I Hate About You*, *Batman Begins*, *2001: A Space Odyssey*, *Arrival*, *The Godfather*, and *The Prestige* with full metadata, verified external ratings snapshot, and interactive badges.
- Resolve GitHub CodeQL security alert for Client-side XSS (`js/xss`) with strict numeric identifier validation and route error handling.

## [0.6.0] - 2026-11-08

- Add curated **IMDb Top 250** dataset (`functions/_lib/imdb250.js`) with a dedicated full-page chart (`#imdb`), homepage shelf, and streaming Fountain filter mode (`?source=imdb`).
- Add multi-criteria **in-list sorting** across all curated charts (`#letterboxd`, `#imdb`, `#trending`, `#upcoming`): sort by rating (highest/lowest), release date (newest/oldest), and title (A–Z/Z–A).
- Integrate **official vector platform logos** for IMDb (gold badge) and Letterboxd (iconic 3-circle logomark) into movie card rating badges, homepage shelves, and chart headers.
- Add local **profile picture customization** in the Cinephile Passport (`#account`) with film avatar presets, custom photo upload with client-side Canvas 200×200 JPEG compression, and desktop/mobile topbar indicators without requiring backend accounts.
- Redesign **Liquid Glass** theme with a **Midnight Sapphire** palette (`#0b0f18` midnight base, royal cobalt glow, and ice-sapphire active button/tab highlights), eliminating legacy purple and teal color leaks.
- Modernize base styles in `site.css` and `privacy.html` with Flame Orange (`#ff5a1f`) and Jet Black (`#0a0a0c`), adding static `data-theme="current"` to eliminate theme flash on first load.

## [0.5.0] - 2026-11-08

- Add composite **Fountain Score** (0–100 universal rating) synthesizing IMDb, Letterboxd, Rotten Tomatoes critics/audience, and TMDB with dynamic fallback weighting, qualitative verdict badges (_Universal Acclaim_, _Strong Consensus_, _Solid_, _Mixed_, _Skip_), and breakdown tooltips.
- Redesign the **Account** view into a **Cinephile Passport** interface featuring dynamic cinephile ranks (_Casual Viewer_, _Movie Buff_, _Cinephile_, _Film Scholar_, _Auteur in the Making_, _Film Historian_), completion progress bars, tabbed filtering (`All`, `To Watch`, `Watched`), and visual card badges.
- Add dedicated full-page movie charts for `#trending` (Top 100 films) and `#upcoming` (60 most anticipated releases) powered by edge-cached Cloudflare Pages Functions (`/api/trending`, `/api/upcoming`).
- Integrate official **YouTube trailer playback** (`▶ Watch trailer`) with an inline responsive privacy-enhanced player modal (`youtube-nocookie.com`) and updated CSP frame policies.
- Enhance homepage shelves with single-row drag-to-scroll carousel navigation and direct links to dedicated charts.
- Implement comprehensive SEO optimizations: Schema.org JSON-LD structured data, XML sitemap with IndexNow protocol integration, and Google Search Console verification.
- Add legal TMDB API attribution notice and nominative fair use disclaimers.

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
