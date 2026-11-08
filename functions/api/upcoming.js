import { tmdb, safeError, extractLang } from "../_lib/tmdb.js";

export async function onRequestGet({ request, env }) {
  try {
    const language = extractLang(request);
    const pages = [1, 2, 3, 4, 5];
    const responses = await Promise.all(
      pages.map((page) => tmdb("/movie/upcoming", env, { page, language })),
    );
    const seen = new Set();
    const results = [];
    for (const response of responses) {
      for (const movie of response.results || []) {
        if (!movie?.id || seen.has(movie.id) || !movie.poster_path) continue;
        seen.add(movie.id);
        results.push(movie);
        if (results.length >= 60) break;
      }
      if (results.length >= 60) break;
    }

    return Response.json(
      { results },
      {
        headers: {
          "Cache-Control":
            "public, max-age=300, s-maxage=300, stale-while-revalidate=60",
        },
      },
    );
  } catch (error) {
    return safeError(error);
  }
}
