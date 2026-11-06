import { tmdb, safeError } from '../_lib/tmdb.js';

export async function onRequestGet({ env }) {
  try {
    const keys = ['trending', 'popular', 'now_playing', 'top_rated', 'upcoming'];
    const requests = keys.flatMap(key =>
      [1, 2].map(page =>
        tmdb(key === 'trending' ? '/trending/movie/week' : `/movie/${key}`, env, { page })
      )
    );
    const responses = await Promise.all(requests);
    const lists = Object.fromEntries(
      keys.map((key, i) => {
        const movies = [...(responses[i * 2].results || []), ...(responses[i * 2 + 1].results || [])];
        return [
          key,
          movies.filter((movie, index, all) => all.findIndex(item => item.id === movie.id) === index),
        ];
      })
    );
    return Response.json(lists, {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    return safeError(error);
  }
}
