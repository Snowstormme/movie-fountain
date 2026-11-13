import { tmdb, extractLang } from "../_lib/tmdb.js";
import { NETFLIX_CATALOG } from "../_lib/netflix_catalog.js";
import { APPLE_CATALOG } from "../_lib/apple_catalog.js";
import { MAX_CATALOG } from "../_lib/max_catalog.js";
import { PRIME_CATALOG } from "../_lib/prime_catalog.js";
import { HULU_CATALOG } from "../_lib/hulu_catalog.js";
import { DISNEY_CATALOG } from "../_lib/disney_catalog.js";
import { PARAMOUNT_CATALOG } from "../_lib/paramount_catalog.js";
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

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const rawProvider = (url.searchParams.get("provider") || "netflix").toLowerCase();
  let provider = rawProvider;
  if (rawProvider === "appletv" || rawProvider === "apple_tv") {
    provider = "apple";
  } else if (rawProvider === "hbo" || rawProvider === "hbomax" || rawProvider === "hbo_max") {
    provider = "max";
  } else if (
    rawProvider === "amazon" ||
    rawProvider === "primevideo" ||
    rawProvider === "amazonprime" ||
    rawProvider === "amazon_prime"
  ) {
    provider = "prime";
  } else if (rawProvider === "hulutv" || rawProvider === "hulu_tv") {
    provider = "hulu";
  } else if (
    rawProvider === "disneyplus" ||
    rawProvider === "disney_plus" ||
    rawProvider === "disney+" ||
    rawProvider === "dplus"
  ) {
    provider = "disney";
  } else if (
    rawProvider === "paramountplus" ||
    rawProvider === "paramount_plus" ||
    rawProvider === "paramount+" ||
    rawProvider === "pplus"
  ) {
    provider = "paramount";
  } else if (rawProvider === "okkotv" || rawProvider === "okko_tv" || rawProvider === "okkomovies") {
    provider = "okko";
  } else if (
    rawProvider === "kp" ||
    rawProvider === "kino" ||
    rawProvider === "kinopoiskhd" ||
    rawProvider === "kinopoisk_hd"
  ) {
    provider = "kinopoisk";
  }
  const type = (url.searchParams.get("type") || "all").toLowerCase();
  const sort = (url.searchParams.get("sort") || "popular").toLowerCase();
  const rawCountry = (url.searchParams.get("country") || "US").toUpperCase().trim();
  const country = /^[A-Z]{2}$/.test(rawCountry) ? rawCountry : "US";
  const rawPage = parseInt(url.searchParams.get("page") || "1", 10);
  const page = Number.isInteger(rawPage) && rawPage >= 1 ? Math.min(rawPage, 50) : 1;

  const config = PROVIDERS[provider];
  if (!config) {
    return Response.json(
      { error: "Currently supported streaming providers: netflix, apple, max, prime, hulu, disney, paramount, okko, kinopoisk", supported: Object.keys(PROVIDERS) },
      { status: 400 }
    );
  }

  let items = [];
  let totalResults = 0;
  let totalPages = 1;

  if (env?.TMDB_API_KEY) {
    try {
      const language = extractLang(request);
      const fallbackRegion = config.defaultRegion || "US";
      let movieSortBy = "popularity.desc";
      let tvSortBy = "popularity.desc";

      if (sort === "rating") {
        movieSortBy = "vote_average.desc";
        tvSortBy = "vote_average.desc";
      } else if (sort === "date") {
        movieSortBy = "primary_release_date.desc";
        tvSortBy = "first_air_date.desc";
      } else if (sort === "title") {
        movieSortBy = "original_title.asc";
        tvSortBy = "original_name.asc";
      }

      const requests = [];

      if (type === "all" || type === "movie" || type === "top") {
        requests.push(
          tmdb("/discover/movie", env, {
            with_watch_providers: config.watchProviderId,
            watch_region: country,
            sort_by: movieSortBy,
            "vote_count.gte": type === "top" ? "100" : "15",
            language,
            page: String(page)
          }).then(async (res) => {
            if (res?.results && res.results.length > 0) return res;
            if (country !== fallbackRegion) {
              return tmdb("/discover/movie", env, {
                with_watch_providers: config.watchProviderId,
                watch_region: fallbackRegion,
                sort_by: movieSortBy,
                "vote_count.gte": type === "top" ? "100" : "15",
                language,
                page: String(page)
              }).catch(() => null);
            }
            return res;
          }).catch(() => null)
        );
      } else {
        requests.push(Promise.resolve(null));
      }

      if (type === "all" || type === "tv" || type === "top") {
        requests.push(
          tmdb("/discover/tv", env, {
            with_watch_providers: config.watchProviderId,
            watch_region: country,
            sort_by: tvSortBy,
            "vote_count.gte": type === "top" ? "100" : "15",
            language,
            page: String(page)
          }).then(async (res) => {
            if (res?.results && res.results.length > 0) return res;
            if (country !== fallbackRegion) {
              const regionFallback = await tmdb("/discover/tv", env, {
                with_watch_providers: config.watchProviderId,
                watch_region: fallbackRegion,
                sort_by: tvSortBy,
                "vote_count.gte": type === "top" ? "100" : "15",
                language,
                page: String(page)
              }).catch(() => null);
              if (regionFallback?.results && regionFallback.results.length > 0) return regionFallback;
            }
            return tmdb("/discover/tv", env, {
              with_networks: config.networkId,
              sort_by: tvSortBy,
              "vote_count.gte": type === "top" ? "100" : "5",
              language,
              page: String(page)
            }).catch(() => null);
          }).catch(() => null)
        );
      } else {
        requests.push(Promise.resolve(null));
      }

      const [resMovie, resTv] = await Promise.all(requests);

      const liveMovies = [];
      if (resMovie?.results && Array.isArray(resMovie.results)) {
        for (const raw of resMovie.results) {
          const norm = normalizeMediaItem(raw, "movie", config.id);
          if (norm) liveMovies.push(norm);
        }
      }

      const liveTv = [];
      if (resTv?.results && Array.isArray(resTv.results)) {
        for (const raw of resTv.results) {
          const norm = normalizeMediaItem(raw, "tv", config.id);
          if (norm) liveTv.push(norm);
        }
      }

      if (type === "movie") {
        items = liveMovies;
        totalResults = resMovie?.total_results || liveMovies.length;
        totalPages = resMovie?.total_pages || 1;
      } else if (type === "tv") {
        items = liveTv;
        totalResults = resTv?.total_results || liveTv.length;
        totalPages = resTv?.total_pages || 1;
      } else {
        const maxLen = Math.max(liveMovies.length, liveTv.length);
        const combined = [];
        for (let i = 0; i < maxLen; i++) {
          if (i < liveMovies.length) combined.push(liveMovies[i]);
          if (i < liveTv.length) combined.push(liveTv[i]);
        }
        items = combined;
        totalResults = (resMovie?.total_results || 0) + (resTv?.total_results || 0);
        totalPages = Math.max(resMovie?.total_pages || 1, resTv?.total_pages || 1);
      }

      if (type === "top") {
        items = items.filter((m) => (m.vote_average || 0) >= 7.8);
      }
    } catch {
      // Fallback silently on error
    }
  }

  // Fallback to static curated catalog if no live items returned (offline dev / unit tests)
  if (items.length === 0) {
    let catalog = [...config.catalog];
    if (type === "movie") {
      catalog = catalog.filter((m) => m.media_type === "movie");
    } else if (type === "tv") {
      catalog = catalog.filter((m) => m.media_type === "tv");
    } else if (type === "top") {
      catalog = catalog.filter((m) => (m.vote_average || 0) >= 7.8);
    } else {
      const catMovies = catalog.filter((m) => m.media_type === "movie");
      const catTv = catalog.filter((m) => m.media_type === "tv");
      const inter = [];
      const mLen = Math.max(catMovies.length, catTv.length);
      for (let i = 0; i < mLen; i++) {
        if (i < catMovies.length) inter.push(catMovies[i]);
        if (i < catTv.length) inter.push(catTv[i]);
      }
      catalog = inter;
    }

    if (sort === "rating") {
      catalog.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
    } else if (sort === "date") {
      catalog.sort((a, b) => (b.release_date || "").localeCompare(a.release_date || ""));
    } else if (sort === "title") {
      catalog.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    }

    totalResults = catalog.length;
    totalPages = Math.max(1, Math.ceil(catalog.length / 20));
    const start = (page - 1) * 20;
    items = catalog.slice(start, start + 20);
    if (items.length === 0 && page === 1) {
      items = catalog;
    }
  }

  return Response.json(
    {
      provider: config.id,
      provider_name: config.name,
      country,
      page,
      total_pages: totalPages,
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
