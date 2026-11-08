import { tmdb, safeError, extractLang } from "../_lib/tmdb.js";
import { LETTERBOXD_TOP_500 } from "../_lib/letterboxd500.js";

function sampleLetterboxdTop(count = 100) {
  const pool = [...LETTERBOXD_TOP_500];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

export async function onRequestGet({ request, env }) {
  try {
    const language = extractLang(request);
    const keys = [
      "trending",
      "popular",
      "now_playing",
      "top_rated",
      "upcoming",
    ];
    const requests = keys.flatMap((key) =>
      [1, 2].map((page) =>
        tmdb(
          key === "trending" ? "/trending/movie/week" : `/movie/${key}`,
          env,
          { page, language },
        ),
      ),
    );
    const responses = await Promise.all(requests);
    const lists = Object.fromEntries(
      keys.map((key, i) => {
        const movies = [
          ...(responses[i * 2].results || []),
          ...(responses[i * 2 + 1].results || []),
        ];
        return [
          key,
          movies.filter(
            (movie, index, all) =>
              all.findIndex((item) => item.id === movie.id) === index,
          ),
        ];
      }),
    );
    lists.letterboxd_top = sampleLetterboxdTop(100);

    return Response.json(lists, {
      headers: {
        "Cache-Control":
          "public, max-age=300, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    return safeError(error);
  }
}
