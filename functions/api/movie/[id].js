import { tmdb, safeError, numericId, extractLang } from "../../_lib/tmdb.js";
import { NETFLIX_CATALOG } from "../../_lib/netflix_catalog.js";
import { APPLE_CATALOG } from "../../_lib/apple_catalog.js";
import { MAX_CATALOG } from "../../_lib/max_catalog.js";
import { PRIME_CATALOG } from "../../_lib/prime_catalog.js";
import { KINOPOISK_CATALOG } from "../../_lib/kinopoisk_catalog.js";

const HUB_CATALOGS = [
  {
    key: "netflix",
    region: "US",
    id: 8,
    name: "Netflix",
    logo: "inline:netflix",
    namePattern: /\bnetflix\b/i,
    ids: new Set(NETFLIX_CATALOG.map((m) => Number(m.id))),
  },
  {
    key: "apple",
    region: "US",
    id: 350,
    name: "Apple TV",
    logo: "inline:apple",
    namePattern: /apple\s*tv/i,
    ids: new Set(APPLE_CATALOG.map((m) => Number(m.id))),
  },
  {
    key: "max",
    region: "US",
    id: 1899,
    name: "HBO Max",
    logo: "inline:max",
    namePattern: /^(hbo\s*)?max(\b|\s)/i,
    ids: new Set(MAX_CATALOG.map((m) => Number(m.id))),
  },
  {
    key: "prime",
    region: "US",
    id: 9,
    name: "Prime Video",
    logo: "inline:prime",
    namePattern: /\bprime\s*video\b|\bamazon\s*(prime\s*)?video\b/i,
    ids: new Set(PRIME_CATALOG.map((m) => Number(m.id))),
  },
  {
    key: "kinopoisk",
    region: "RU",
    id: 117,
    name: "Kinopoisk",
    logo: "inline:kinopoisk",
    namePattern: /kinopoisk|кинопоиск/i,
    ids: new Set(KINOPOISK_CATALOG.map((m) => Number(m.id))),
  },
];

export function enrichWatchProvidersWithCatalogs(watchProviders, itemId) {
  const numId = Number(itemId);
  const base =
    watchProviders && typeof watchProviders === "object"
      ? { ...watchProviders }
      : {};

  for (const hub of HUB_CATALOGS) {
    if (!hub.ids.has(numId)) continue;
    const regionData = base[hub.region]
      ? {
          ...base[hub.region],
          flatrate: [...(base[hub.region].flatrate || [])],
          rent: [...(base[hub.region].rent || [])],
          buy: [...(base[hub.region].buy || [])],
          free: [...(base[hub.region].free || [])],
        }
      : { link: null, flatrate: [], rent: [], buy: [], free: [] };

    const allInRegion = [
      ...regionData.flatrate,
      ...regionData.free,
      ...regionData.rent,
      ...regionData.buy,
    ];
    const alreadyPresent = allInRegion.some(
      (p) =>
        p &&
        (Number(p.id) === hub.id ||
          (hub.key === "kinopoisk" && Number(p.id) === 115) ||
          hub.namePattern.test(String(p.name || ""))),
    );
    if (!alreadyPresent) {
      regionData.flatrate.push({
        id: hub.id,
        name: hub.name,
        logo_path: hub.logo,
      });
    }
    base[hub.region] = regionData;
  }

  return Object.keys(base).length ? base : null;
}

function uniqueDirectedMovies(crew, currentMovieId) {
  const seen = new Set([Number(currentMovieId)]);
  return (crew || [])
    .filter((item) => {
      if (!item || item.job !== "Director" || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    })
    .sort((a, b) => (b.release_date || "").localeCompare(a.release_date || ""))
    .slice(0, 6);
}

export function extractWatchProviders(watchData) {
  const results = watchData?.results;
  if (!results || typeof results !== "object") return null;

  const sanitizeList = (list) =>
    (Array.isArray(list) ? list : [])
      .filter((p) => p && typeof p.provider_name === "string" && p.logo_path)
      .map((p) => ({
        id: p.provider_id,
        name: p.provider_name,
        logo_path: p.logo_path,
      }))
      .slice(0, 8);

  const countries = {};
  for (const [code, data] of Object.entries(results)) {
    if (!data || typeof data !== "object") continue;
    const flatrate = sanitizeList(data.flatrate);
    const rent = sanitizeList(data.rent);
    const buy = sanitizeList(data.buy);
    const free = sanitizeList(data.free || data.ads);

    if (flatrate.length || rent.length || buy.length || free.length) {
      countries[code] = {
        link:
          typeof data.link === "string" && data.link.startsWith("https://")
            ? data.link
            : null,
        flatrate,
        rent,
        buy,
        free,
      };
    }
  }

  return Object.keys(countries).length ? countries : null;
}

export function pickTrailer(videos) {
  const list = Array.isArray(videos?.results) ? videos.results : [];
  const candidates = list.filter(
    (item) =>
      item &&
      item.site === "YouTube" &&
      typeof item.key === "string" &&
      /^[a-zA-Z0-9_-]{6,20}$/.test(item.key) &&
      (item.type === "Trailer" || item.type === "Teaser"),
  );
  candidates.sort((a, b) => {
    const typeScore = (item) => (item.type === "Trailer" ? 2 : 1);
    if (typeScore(b) !== typeScore(a)) return typeScore(b) - typeScore(a);
    return Number(Boolean(b.official)) - Number(Boolean(a.official));
  });
  const best = candidates[0];
  return best
    ? {
        key: best.key,
        name: best.name || "Official Trailer",
        type: best.type,
      }
    : null;
}

export async function onRequestGet({ request, params, env }) {
  try {
    const id = numericId(params.id);
    const language = extractLang(request);
    const isRu = language === "ru-RU";
    const requestedType = new URL(request.url).searchParams.get("type");

    let movie;
    let isTv = requestedType === "tv";

    if (isTv) {
      movie = await tmdb(`/tv/${id}`, env, {
        language,
        append_to_response: "credits,recommendations,videos,watch/providers",
      });
    } else {
      try {
        movie = await tmdb(`/movie/${id}`, env, {
          language,
          append_to_response: "credits,recommendations,videos,watch/providers",
        });
      } catch (err) {
        try {
          movie = await tmdb(`/tv/${id}`, env, {
            language,
            append_to_response: "credits,recommendations,videos,watch/providers",
          });
          isTv = true;
        } catch {
          throw err;
        }
      }
    }

    if (isTv && movie) {
      movie.title = movie.name || movie.original_name || "TV Series";
      movie.release_date = movie.first_air_date || "";
      movie.runtime = movie.episode_run_time?.[0] || null;
    }

    if (isRu && (!movie.overview || !pickTrailer(movie.videos))) {
      try {
        const enMovie = await tmdb(isTv ? `/tv/${id}` : `/movie/${id}`, env, {
          language: "en-US",
          append_to_response: "videos",
        });
        if (!movie.overview && enMovie.overview) {
          movie.overview = enMovie.overview;
        }
        if (!pickTrailer(movie.videos) && enMovie.videos) {
          movie.videos = enMovie.videos;
        }
      } catch {}
    }

    const director =
      (movie.credits?.crew || []).find((person) => person.job === "Director") ||
      (Array.isArray(movie.created_by) && movie.created_by[0]
        ? { id: movie.created_by[0].id, name: movie.created_by[0].name, job: "Creator" }
        : null) ||
      null;
    let directorMovies = [];
    if (director?.id) {
      try {
        const credits = await tmdb(
          `/person/${numericId(director.id)}/movie_credits`,
          env,
          { language },
        );
        directorMovies = uniqueDirectedMovies(credits.crew, id);
      } catch {
        directorMovies = [];
      }
    }
    return Response.json({
      movie,
      trailer: pickTrailer(movie.videos),
      director,
      director_movies: directorMovies,
      cast: (movie.credits?.cast || []).slice(0, 6),
      recommendations: (movie.recommendations?.results || []).slice(0, 6),
      watch_providers: enrichWatchProvidersWithCatalogs(
        extractWatchProviders(
          movie["watch/providers"] || movie.watch_providers,
        ),
        id,
      ),
    });
  } catch (error) {
    return safeError(error);
  }
}
