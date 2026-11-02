import { tmdb, safeError, numericId } from '../../_lib/tmdb.js';
export async function onRequestGet({ params, env }) {
  try {
    const id = numericId(params.id);
    const movie = await tmdb(`/movie/${id}`, env, { append_to_response: 'credits,recommendations' });
    const director = (movie.credits?.crew || []).find(person => person.job === 'Director') || null;
    return Response.json({ movie, director, cast: (movie.credits?.cast || []).slice(0, 6), recommendations: (movie.recommendations?.results || []).slice(0, 6) });
  } catch (error) { return safeError(error); }
}
