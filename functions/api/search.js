import { tmdb, safeError } from '../_lib/tmdb.js';
export async function onRequestGet({ request, env }) {
  try { return Response.json(await tmdb('/search/movie', env, { query: new URL(request.url).searchParams.get('q') || '' })); }
  catch (error) { return safeError(error); }
}
