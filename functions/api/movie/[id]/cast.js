import { tmdb, safeError } from '../../../_lib/tmdb.js';
export async function onRequestGet({ params, env }) {
  try { const movie = await tmdb(`/movie/${params.id}`, env, { append_to_response: 'credits' }); return Response.json({ movie, cast: movie.credits?.cast || [] }); }
  catch (error) { return safeError(error); }
}
