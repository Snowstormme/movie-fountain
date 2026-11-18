import { tmdb, extractLang } from "../_lib/tmdb.js";
import { NETFLIX_CATALOG } from "../_lib/netflix_catalog.js";
import { APPLE_CATALOG } from "../_lib/apple_catalog.js";
import { MAX_CATALOG } from "../_lib/max_catalog.js";
import { PRIME_CATALOG } from "../_lib/prime_catalog.js";
import { HULU_CATALOG } from "../_lib/hulu_catalog.js";
import { DISNEY_CATALOG } from "../_lib/disney_catalog.js";
import { PARAMOUNT_CATALOG } from "../_lib/paramount_catalog.js";
import { GOOGLETV_CATALOG } from "../_lib/googletv_catalog.js";
import { MUBI_CATALOG } from "../_lib/mubi_catalog.js";
import { PEACOCK_CATALOG } from "../_lib/peacock_catalog.js";
import { CRUNCHYROLL_CATALOG } from "../_lib/crunchyroll_catalog.js";
import { OKKO_CATALOG } from "../_lib/okko_catalog.js";
import { KINOPOISK_CATALOG } from "../_lib/kinopoisk_catalog.js";

const PROVIDERS = {
  netflix: {
    id: "netflix",
    name: "Netflix",
    watchProviderId: "8",
    networkId: "213",
    catalog: NETFLIX_CATALOG
  },
  apple: {
    id: "apple",
    name: "Apple TV+",
    watchProviderId: "350",
    networkId: "2552",
    catalog: APPLE_CATALOG
  },
  max: {
    id: "max",
    name: "HBO Max",
    watchProviderId: "1899|384",
    networkId: "49|3186",
    catalog: MAX_CATALOG
  },
  prime: {
    id: "prime",
    name: "Prime Video",
    watchProviderId: "9|119",
    networkId: "1024",
    catalog: PRIME_CATALOG
  },
  hulu: {
    id: "hulu",
    name: "Hulu",
    watchProviderId: "15",
    networkId: "453",
    catalog: HULU_CATALOG
  },
  disney: {
    id: "disney",
    name: "Disney+",
    watchProviderId: "337",
    networkId: "2739",
    catalog: DISNEY_CATALOG
  },
  paramount: {
    id: "paramount",
    name: "Paramount+",
    watchProviderId: "531|2303|2616|582",
    networkId: "4330",
    catalog: PARAMOUNT_CATALOG
  },
  googletv: {
    id: "googletv",
    name: "Google TV",
    watchProviderId: "3",
    networkId: null,
    catalog: GOOGLETV_CATALOG
  },
  mubi: {
    id: "mubi",
    name: "MUBI",
    watchProviderId: "11|201",
    networkId: null,
    catalog: MUBI_CATALOG
  },
  peacock: {
    id: "peacock",
    name: "Peacock",
    watchProviderId: "386|387",
    networkId: "3353",
    catalog: PEACOCK_CATALOG
  },
  crunchyroll: {
    id: "crunchyroll",
    name: "Crunchyroll",
    watchProviderId: "283|1968",
    networkId: "1112",
    catalog: CRUNCHYROLL_CATALOG
  },
  okko: {
    id: "okko",
    name: "Okko",
    watchProviderId: "115",
    networkId: "3871",
    defaultRegion: "RU",
    catalog: OKKO_CATALOG
  },
  kinopoisk: {
    id: "kinopoisk",
    name: "Kinopoisk",
    watchProviderId: "117",
    networkId: "3827",
    defaultRegion: "RU",
    catalog: KINOPOISK_CATALOG
  }
};

function normalizeMediaItem(item, defaultType = "movie", provider = "netflix") {
  if (!item || typeof item !== "object") return null;
  const isTv = defaultType === "tv" || Boolean(item.name && !item.title);
  const title = String(item.title || item.name || item.original_title || item.original_name || "").trim();
  const date = String(item.release_date || item.first_air_date || "").slice(0, 10);
  const poster = typeof item.poster_path === "string" ? item.poster_path : null;
  const backdrop = typeof item.backdrop_path === "string" ? item.backdrop_path : null;
  const score = typeof item.vote_average === "number" ? Math.round(item.vote_average * 10) / 10 : 0;
  const id = Number(item.id);

  if (!id || !title || !poster) return null;

  return {
    id,
    title,
    media_type: isTv ? "tv" : "movie",
    release_date: date,
    poster_path: poster,
    backdrop_path: backdrop,
    vote_average: score,
    overview: typeof item.overview === "string" ? item.overview : "",
    provider
  };
}

const PROVIDER_ALIASES = {
  appletv: "apple",
  apple_tv: "apple",
  hbo: "max",
  hbomax: "max",
  hbo_max: "max",
  amazon: "prime",
  primevideo: "prime",
  amazonprime: "prime",
  amazon_prime: "prime",
  hulutv: "hulu",
  hulu_tv: "hulu",
  disneyplus: "disney",
  disney_plus: "disney",
  "disney+": "disney",
  dplus: "disney",
  paramountplus: "paramount",
  paramount_plus: "paramount",
  "paramount+": "paramount",
  pplus: "paramount",
  google: "googletv",
  google_tv: "googletv",
  "google-tv": "googletv",
  googleplay: "googletv",
  google_play: "googletv",
  googleplaymovies: "googletv",
  gtv: "googletv",
  mubigo: "mubi",
  mubi_go: "mubi",
  "mubi-go": "mubi",
  mubitv: "mubi",
  mubi_tv: "mubi",
  peacocktv: "peacock",
  peacock_tv: "peacock",
  "peacock-tv": "peacock",
  peacockpremium: "peacock",
  peacock_premium: "peacock",
  nbcpeacock: "peacock",
  nbc_peacock: "peacock",
  crunchy: "crunchyroll",
  crunchyrolltv: "crunchyroll",
  crunchyroll_tv: "crunchyroll",
  "crunchyroll-tv": "crunchyroll",
  crunchyrollchannel: "crunchyroll",
  crunchyroll_channel: "crunchyroll",
  cr: "crunchyroll",
  okkotv: "okko",
  okko_tv: "okko",
  okkomovies: "okko",
  kp: "kinopoisk",
  kino: "kinopoisk",
  kinopoiskhd: "kinopoisk",
  kinopoisk_hd: "kinopoisk"
};

/** Maps any accepted provider spelling to its canonical id ("mine" stays "mine"). */
export function resolveProvider(raw) {
  const key = String(raw || "").trim().toLowerCase();
  if (key === "mine" || PROVIDERS[key]) return key;
  return PROVIDER_ALIASES[key] || key;
}

/**
 * Genre filter keys -> TMDB genre ids. TMDB has no TV equivalent for horror,
 * romance and thriller, so those return films only.
 * `names` is used for the offline curated catalogs.
 */
export const STREAMING_GENRES = {
  action: { movie: "28", tv: "10759", names: ["Action"] },
  adventure: { movie: "12", tv: "10759", names: ["Adventure"] },
  animation: { movie: "16", tv: "16", names: ["Animation"] },
  comedy: { movie: "35", tv: "35", names: ["Comedy"] },
  crime: { movie: "80", tv: "80", names: ["Crime"] },
  documentary: { movie: "99", tv: "99", names: ["Documentary"] },
  drama: { movie: "18", tv: "18", names: ["Drama"] },
  family: { movie: "10751", tv: "10751", names: ["Family"] },
  fantasy: { movie: "14", tv: "10765", names: ["Fantasy"] },
  horror: { movie: "27", tv: null, names: ["Horror"] },
  mystery: { movie: "9648", tv: "9648", names: ["Mystery"] },
  romance: { movie: "10749", tv: null, names: ["Romance"] },
  scifi: { movie: "878", tv: "10765", names: ["Sci-Fi", "Science Fiction"] },
  thriller: { movie: "53", tv: null, names: ["Thriller"] }
};

/** Decade filter keys -> [from, to] release-date range (inclusive). */
export const STREAMING_DECADES = {
  "2020s": ["2020-01-01", "2029-12-31"],
  "2010s": ["2010-01-01", "2019-12-31"],
  "2000s": ["2000-01-01", "2009-12-31"],
  "1990s": ["1990-01-01", "1999-12-31"],
  "1980s": ["1980-01-01", "1989-12-31"],
  older: [null, "1979-12-31"]
};

export const STREAMING_SORTS = ["popular", "rating", "date", "title"];

const MAX_PAGE = 50;
const SEARCH_CANDIDATES = 16;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function earlierDate(a, b) {
  if (!a) return b;
  if (!b) return a;
  return a < b ? a : b;
}

function interleave(lists) {
  const out = [];
  const max = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < max; i++) {
    for (const list of lists) {
      if (i < list.length) out.push(list[i]);
    }
  }
  return out;
}

function dedupe(items) {
  const seen = new Set();
  return items.filter((m) => {
    const key = `${m.media_type}:${m.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Builds a pseudo-provider covering every service in a comma list
 * (e.g. "netflix,max"). TMDB treats "|" in with_watch_providers as OR, so one
 * request returns titles available on ANY of the chosen services.
 */
export function buildMineConfig(list) {
  const ids = [
    ...new Set(
      String(list || "")
        .split(",")
        .map(resolveProvider)
        .filter((id) => id && id !== "mine" && PROVIDERS[id])
    )
  ];
  if (ids.length === 0) return null;
  const configs = ids.map((id) => PROVIDERS[id]);
  return {
    id: "mine",
    name: "My services",
    providers: ids,
    watchProviderId: configs.map((c) => c.watchProviderId).join("|"),
    networkId: configs.map((c) => c.networkId).filter(Boolean).join("|") || null,
    defaultRegion: configs.every((c) => c.defaultRegion === "RU") ? "RU" : "US",
    catalog: dedupe(interleave(configs.map((c) => c.catalog)))
  };
}

function inDateRange(date, [from, to]) {
  if (!date) return !from && !to;
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

function sortItems(list, sort) {
  if (sort === "rating") list.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
  else if (sort === "date") list.sort((a, b) => (b.release_date || "").localeCompare(a.release_date || ""));
  else if (sort === "title") list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
  return list;
}

function voteMinimum(kind, opts, viaNetwork = false) {
  if (opts.type === "top") return "100";
  if (opts.sort === "rating") return kind === "tv" ? "100" : "200";
  return viaNetwork ? "5" : "15";
}

function discoverParams(kind, opts, region, viaNetwork = false) {
  const isTv = kind === "tv";
  const params = {
    sort_by: isTv ? opts.tvSortBy : opts.movieSortBy,
    "vote_count.gte": voteMinimum(kind, opts, viaNetwork),
    language: opts.language,
    page: String(opts.page)
  };
  if (viaNetwork) {
    params.with_networks = opts.config.networkId;
  } else {
    params.with_watch_providers = opts.config.watchProviderId;
    params.watch_region = region;
  }
  const genre = opts.genre ? STREAMING_GENRES[opts.genre] : null;
  if (genre) params.with_genres = isTv ? genre.tv : genre.movie;
  const [from, to] = opts.dateRange;
  const field = isTv ? "first_air_date" : "primary_release_date";
  if (from) params[`${field}.gte`] = from;
  if (to) params[`${field}.lte`] = to;
  return params;
}

function hasResults(res) {
  return Boolean(res?.results && res.results.length > 0);
}

async function discoverMovies(env, opts) {
  const res = await tmdb("/discover/movie", env, discoverParams("movie", opts, opts.country)).catch(() => null);
  if (hasResults(res) || opts.country === opts.fallbackRegion) return res;
  return tmdb("/discover/movie", env, discoverParams("movie", opts, opts.fallbackRegion)).catch(() => null);
}

async function discoverTv(env, opts) {
  const res = await tmdb("/discover/tv", env, discoverParams("tv", opts, opts.country)).catch(() => null);
  if (hasResults(res)) return res;
  if (opts.country !== opts.fallbackRegion) {
    const regional = await tmdb("/discover/tv", env, discoverParams("tv", opts, opts.fallbackRegion)).catch(() => null);
    if (hasResults(regional)) return regional;
  }
  if (opts.config.networkId) {
    return tmdb("/discover/tv", env, discoverParams("tv", opts, null, true)).catch(() => null);
  }
  return null;
}

function matchesFilters(item, opts) {
  if (opts.type === "movie" && item.media_type !== "movie") return false;
  if (opts.type === "tv" && item.media_type !== "tv") return false;
  if (opts.type === "top" && (item.vote_average || 0) < 7.8) return false;
  if (opts.genre) {
    const genre = STREAMING_GENRES[opts.genre];
    if (item.media_type === "tv" ? !genre.tv : !genre.movie) return false;
  }
  if (opts.decade && !inDateRange(item.release_date, STREAMING_DECADES[opts.decade])) return false;
  return true;
}

/**
 * Search inside one service (or "My services"): TMDB multi-search, then keep
 * only titles whose watch-provider list for the region includes the service.
 */
export async function searchWithinProvider(env, opts) {
  const res = await tmdb("/search/multi", env, {
    query: opts.q,
    include_adult: "false",
    language: opts.language,
    page: "1"
  });
  const allowed = new Set(String(opts.config.watchProviderId).split("|"));
  const genre = opts.genre ? STREAMING_GENRES[opts.genre] : null;
  const candidates = (Array.isArray(res?.results) ? res.results : [])
    .filter((r) => r && (r.media_type === "movie" || r.media_type === "tv") && r.poster_path)
    .filter((r) => {
      if (!genre) return true;
      const wanted = r.media_type === "tv" ? genre.tv : genre.movie;
      return Boolean(wanted && Array.isArray(r.genre_ids) && r.genre_ids.map(String).includes(wanted));
    })
    .slice(0, SEARCH_CANDIDATES);

  const checks = await Promise.all(
    candidates.map(async (c) => {
      try {
        const wp = await tmdb(`/${c.media_type}/${c.id}/watch/providers`, env, {});
        const regions = wp?.results || {};
        const entry = regions[opts.country] || regions[opts.fallbackRegion];
        if (!entry) return false;
        return ["flatrate", "free", "ads", "buy", "rent"].some(
          (k) => Array.isArray(entry[k]) && entry[k].some((p) => allowed.has(String(p.provider_id)))
        );
      } catch {
        return false;
      }
    })
  );

  const items = candidates
    .filter((_, i) => checks[i])
    .map((c) => normalizeMediaItem(c, c.media_type, opts.config.id))
    .filter((m) => m && matchesFilters(m, opts));
  return opts.sort === "popular" ? items : sortItems(items, opts.sort);
}

function catalogResults(opts) {
  let catalog = [...opts.config.catalog];
  if (opts.q) {
    const needle = opts.q.toLowerCase();
    catalog = catalog.filter((m) => String(m.title || "").toLowerCase().includes(needle));
  }
  if (opts.genre) {
    const genre = STREAMING_GENRES[opts.genre];
    catalog = catalog.filter((m) => Array.isArray(m.genres) && m.genres.some((g) => genre.names.includes(g)));
  }
  if (opts.decade) {
    catalog = catalog.filter((m) => inDateRange(m.release_date, STREAMING_DECADES[opts.decade]));
  }
  if (opts.sort === "date") {
    const today = todayIso();
    catalog = catalog.filter((m) => !m.release_date || m.release_date <= today);
  }

  if (opts.type === "movie") {
    catalog = catalog.filter((m) => m.media_type === "movie");
  } else if (opts.type === "tv") {
    catalog = catalog.filter((m) => m.media_type === "tv");
  } else if (opts.type === "top") {
    catalog = catalog.filter((m) => (m.vote_average || 0) >= 7.8);
  } else {
    catalog = interleave([
      catalog.filter((m) => m.media_type === "movie"),
      catalog.filter((m) => m.media_type === "tv")
    ]);
  }

  sortItems(catalog, opts.sort);

  const totalResults = catalog.length;
  const totalPages = Math.max(1, Math.ceil(catalog.length / 20));
  const start = (opts.page - 1) * 20;
  let items = catalog.slice(start, start + 20);
  if (items.length === 0 && opts.page === 1) items = catalog;
  return { items, totalResults, totalPages };
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const provider = resolveProvider(url.searchParams.get("provider") || "netflix");
  const rawType = (url.searchParams.get("type") || "all").toLowerCase();
  const type = ["all", "movie", "tv", "top"].includes(rawType) ? rawType : "all";
  const rawSort = (url.searchParams.get("sort") || "popular").toLowerCase();
  const sort = STREAMING_SORTS.includes(rawSort) ? rawSort : "popular";
  const rawCountry = (url.searchParams.get("country") || "US").toUpperCase().trim();
  const country = /^[A-Z]{2}$/.test(rawCountry) ? rawCountry : "US";
  const rawPage = parseInt(url.searchParams.get("page") || "1", 10);
  const page = Number.isInteger(rawPage) && rawPage >= 1 ? Math.min(rawPage, MAX_PAGE) : 1;
  const rawGenre = (url.searchParams.get("genre") || "").toLowerCase();
  const genre = Object.hasOwn(STREAMING_GENRES, rawGenre) ? rawGenre : null;
  const rawDecade = (url.searchParams.get("decade") || "").toLowerCase();
  const decade = Object.hasOwn(STREAMING_DECADES, rawDecade) ? rawDecade : null;
  const rawQuery = String(url.searchParams.get("q") || "").trim().slice(0, 80);
  const q = rawQuery.length >= 2 ? rawQuery : "";

  let config = PROVIDERS[provider];
  if (provider === "mine") {
    config = buildMineConfig(url.searchParams.get("providers"));
    if (!config) {
      return Response.json(
        { error: "Choose at least one service for My services", supported: Object.keys(PROVIDERS) },
        { status: 400 }
      );
    }
  }
  if (!config) {
    return Response.json(
      { error: `Currently supported streaming providers: ${Object.keys(PROVIDERS).join(", ")}, mine`, supported: Object.keys(PROVIDERS) },
      { status: 400 }
    );
  }

  let dateRange = decade ? [...STREAMING_DECADES[decade]] : [null, null];
  if (sort === "date") dateRange = [dateRange[0], earlierDate(dateRange[1], todayIso())];

  const opts = {
    config,
    type,
    sort,
    country,
    page,
    genre,
    decade,
    q,
    dateRange,
    fallbackRegion: config.defaultRegion || "US",
    language: extractLang(request),
    movieSortBy: { rating: "vote_average.desc", date: "primary_release_date.desc", title: "original_title.asc" }[sort] || "popularity.desc",
    tvSortBy: { rating: "vote_average.desc", date: "first_air_date.desc", title: "original_name.asc" }[sort] || "popularity.desc"
  };

  let items = [];
  let totalResults = 0;
  let totalPages = 1;

  if (env?.TMDB_API_KEY) {
    try {
      if (q) {
        items = page === 1 ? await searchWithinProvider(env, opts) : [];
        totalResults = items.length;
        totalPages = 1;
      } else {
        const genreConfig = genre ? STREAMING_GENRES[genre] : null;
        const wantMovies = ["all", "movie", "top"].includes(type) && (!genreConfig || Boolean(genreConfig.movie));
        const wantTv = ["all", "tv", "top"].includes(type) && (!genreConfig || Boolean(genreConfig.tv));

        const [resMovie, resTv] = await Promise.all([
          wantMovies ? discoverMovies(env, opts) : Promise.resolve(null),
          wantTv ? discoverTv(env, opts) : Promise.resolve(null)
        ]);

        const liveMovies = (resMovie?.results || [])
          .map((raw) => normalizeMediaItem(raw, "movie", config.id))
          .filter(Boolean);
        const liveTv = (resTv?.results || [])
          .map((raw) => normalizeMediaItem(raw, "tv", config.id))
          .filter(Boolean);

        if (type === "movie") {
          items = liveMovies;
          totalResults = resMovie?.total_results || liveMovies.length;
          totalPages = resMovie?.total_pages || 1;
        } else if (type === "tv") {
          items = liveTv;
          totalResults = resTv?.total_results || liveTv.length;
          totalPages = resTv?.total_pages || 1;
        } else {
          items = dedupe(interleave([liveMovies, liveTv]));
          totalResults = (resMovie?.total_results || 0) + (resTv?.total_results || 0);
          totalPages = Math.max(resMovie?.total_pages || 1, resTv?.total_pages || 1);
        }

        if (type === "top") {
          items = items.filter((m) => (m.vote_average || 0) >= 7.8);
        }
      }
    } catch {
      // Fall back to the curated catalog below
    }
  }

  // Fallback to static curated catalog if no live items returned (offline dev / unit tests)
  if (items.length === 0) {
    ({ items, totalResults, totalPages } = catalogResults(opts));
  }

  return Response.json(
    {
      provider: config.id,
      provider_name: config.name,
      providers: config.providers || [config.id],
      country,
      page,
      sort,
      genre,
      decade,
      q,
      total_pages: Math.min(totalPages, MAX_PAGE),
      total_results: totalResults,
      total: items.length,
      results: items
    },
    {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=1800, s-maxage=1800, stale-while-revalidate=600",
        "x-content-type-options": "nosniff"
      }
    }
  );
}
