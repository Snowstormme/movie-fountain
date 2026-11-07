import { numericId, safeError } from "../../../_lib/tmdb.js";

const RATINGS_API_URL = "https://whatson-api.onrender.com";
const OMDB_API_URL = "https://www.omdbapi.com/";
const RATINGS_CACHE = new Map();
const RATINGS_CACHE_MS = 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 256;

const SCORE_SOURCES = {
  imdb: ["imdb", "users_rating", 10],
  letterboxd: ["letterboxd", "users_rating", 5],
  rotten: ["rotten_tomatoes", "critics_rating", 100],
  rotten_audience: ["rotten_tomatoes", "users_rating", 100],
};

export function parseWhatsonRatings(data, movieId) {
  if (
    !data ||
    typeof data !== "object" ||
    Number(data.id) !== Number(movieId)
  ) {
    return {};
  }

  const ratings = {};
  for (const [name, [source, field, maximum]] of Object.entries(
    SCORE_SOURCES,
  )) {
    const entry = data[source];
    const value = entry && typeof entry === "object" ? entry[field] : null;
    if (
      typeof value === "number" &&
      Number.isFinite(value) &&
      value >= 0 &&
      value <= maximum
    ) {
      ratings[name] = value;
    }
  }

  // Construct destination URLs from validated IDs rather than trusting upstream links.
  const imdbId =
    data.imdb && typeof data.imdb === "object" ? data.imdb.id : null;
  if (typeof imdbId === "string" && /^tt\d{7,10}$/.test(imdbId)) {
    ratings.imdb_id = imdbId;
    ratings.imdb_url = `https://www.imdb.com/title/${imdbId}/`;
  }

  const letterboxdId =
    data.letterboxd && typeof data.letterboxd === "object"
      ? data.letterboxd.id
      : null;
  if (
    typeof letterboxdId === "string" &&
    /^[a-zA-Z0-9-]+$/.test(letterboxdId)
  ) {
    ratings.letterboxd_url = `https://letterboxd.com/film/${letterboxdId}/`;
  }

  const rottenId =
    data.rotten_tomatoes && typeof data.rotten_tomatoes === "object"
      ? data.rotten_tomatoes.id
      : null;
  if (typeof rottenId === "string" && /^[a-zA-Z0-9_-]+$/.test(rottenId)) {
    ratings.rotten_url = `https://www.rottentomatoes.com/m/${rottenId}`;
  }

  const updatedAt = String(data.updated_at || "").slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(updatedAt)) {
    ratings.updated_at = updatedAt;
  }

  return ratings;
}

export function parseOmdbRatings(omdbData) {
  if (
    !omdbData ||
    typeof omdbData !== "object" ||
    omdbData.Response !== "True"
  ) {
    return {};
  }

  const fallback = {};
  const list = Array.isArray(omdbData.Ratings) ? omdbData.Ratings : [];
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    if (
      item.Source === "Internet Movie Database" &&
      typeof item.Value === "string" &&
      /^\d(\.\d)?\/10$/.test(item.Value)
    ) {
      fallback.imdb_rating = item.Value;
    }
    if (
      item.Source === "Rotten Tomatoes" &&
      typeof item.Value === "string" &&
      /^\d{1,3}%$/.test(item.Value)
    ) {
      fallback.rotten_rating = item.Value;
    }
  }
  return fallback;
}

async function fetchWhatson(movieId) {
  const cached = RATINGS_CACHE.get(movieId);
  if (cached && Date.now() - cached.timestamp < RATINGS_CACHE_MS) {
    return cached.ratings;
  }

  try {
    const response = await fetch(`${RATINGS_API_URL}/movie/${movieId}`, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(7000),
    });
    if (!response.ok) return {};
    const data = await response.json();
    const ratings = parseWhatsonRatings(data, movieId);

    if (Object.keys(ratings).length > 0) {
      if (RATINGS_CACHE.size >= MAX_CACHE_ENTRIES) {
        const oldestKey = RATINGS_CACHE.keys().next().value;
        RATINGS_CACHE.delete(oldestKey);
      }
      RATINGS_CACHE.set(movieId, { timestamp: Date.now(), ratings });
    }
    return ratings;
  } catch {
    return {};
  }
}

async function fetchOmdbFallback(imdbId, apiKey) {
  try {
    const url = new URL(OMDB_API_URL);
    url.searchParams.set("apikey", apiKey);
    url.searchParams.set("i", imdbId);
    const response = await fetch(url, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) return {};
    return parseOmdbRatings(await response.json());
  } catch {
    return {};
  }
}

export async function onRequestGet({ request, params, env }) {
  try {
    const id = numericId(params.id);
    const queryImdbId = new URL(request.url).searchParams.get("imdb_id") || "";
    const validQueryImdbId = /^tt\d{7,10}$/.test(queryImdbId)
      ? queryImdbId
      : "";

    const ratings = { ...(await fetchWhatson(id)) };
    const imdbId = ratings.imdb_id || validQueryImdbId;
    if (!ratings.imdb_url && imdbId) {
      ratings.imdb_url = `https://www.imdb.com/title/${imdbId}/`;
    }

    if (
      env?.OMDB_API_KEY &&
      imdbId &&
      (ratings.imdb === undefined || ratings.rotten === undefined)
    ) {
      const fallback = await fetchOmdbFallback(imdbId, env.OMDB_API_KEY);
      if (ratings.imdb === undefined && fallback.imdb_rating) {
        ratings.imdb_rating = fallback.imdb_rating;
      }
      if (ratings.rotten === undefined && fallback.rotten_rating) {
        ratings.rotten_rating = fallback.rotten_rating;
      }
    }

    const hasScores =
      ratings.imdb !== undefined ||
      ratings.letterboxd !== undefined ||
      ratings.rotten !== undefined ||
      Boolean(ratings.imdb_rating || ratings.rotten_rating);

    return Response.json(
      { ratings },
      {
        headers: {
          "Cache-Control": hasScores
            ? "public, max-age=3600, s-maxage=3600, stale-while-revalidate=600"
            : "public, max-age=300, s-maxage=300",
        },
      },
    );
  } catch (error) {
    return safeError(error);
  }
}
