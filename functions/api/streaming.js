import { tmdb, safeError, extractLang } from "../_lib/tmdb.js";
import { NETFLIX_CATALOG } from "../_lib/netflix_catalog.js";

function normalizeMediaItem(item, defaultType = "movie") {
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
    provider: "netflix"
  };
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const provider = (url.searchParams.get("provider") || "netflix").toLowerCase();
  const type = (url.searchParams.get("type") || "all").toLowerCase();
  const sort = (url.searchParams.get("sort") || "popular").toLowerCase();

  if (provider !== "netflix") {
    return Response.json(
      { error: "Currently only Netflix catalog is supported", supported: ["netflix"] },
      { status: 400 }
    );
  }

  let items = [...NETFLIX_CATALOG];

  if (env?.TMDB_API_KEY) {
    try {
      const language = extractLang(request);
      const requests = [];

      if (type === "all" || type === "movie") {
        requests.push(
          tmdb("/discover/movie", env, {
            with_watch_providers: "8",
            watch_region: "US",
            sort_by: "popularity.desc",
            "vote_count.gte": "25",
            language
          }).catch(() => null)
        );
      }

      if (type === "all" || type === "tv") {
        requests.push(
          tmdb("/discover/tv", env, {
            with_networks: "213",
            sort_by: "popularity.desc",
            "vote_count.gte": "25",
            language
          }).catch(() => null)
        );
      }

      const responses = await Promise.all(requests);
      const liveItems = [];

      for (const res of responses) {
        if (!res?.results || !Array.isArray(res.results)) continue;
        for (const raw of res.results) {
          const norm = normalizeMediaItem(raw);
          if (norm) liveItems.push(norm);
        }
      }

      if (liveItems.length > 0) {
        // Merge with catalog, prioritizing live items but preserving catalog items
        const map = new Map();
        for (const item of liveItems) map.set(item.id, item);
        for (const item of items) {
          if (!map.has(item.id)) map.set(item.id, item);
        }
        items = Array.from(map.values());
      }
    } catch {
      // Fallback silently to static curated catalog on error
    }
  }

  // Filter by media_type
  if (type === "movie" || type === "tv") {
    items = items.filter((m) => m.media_type === type);
  } else if (type === "top") {
    items = items.filter((m) => (m.vote_average || 0) >= 8.0);
  }

  // Sorting
  if (sort === "rating") {
    items.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
  } else if (sort === "date") {
    items.sort((a, b) => (b.release_date || "").localeCompare(a.release_date || ""));
  } else if (sort === "title") {
    items.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
  }

  return Response.json(
    {
      provider: "netflix",
      provider_name: "Netflix",
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
