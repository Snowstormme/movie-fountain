import { tmdb, safeError, searchQuery } from '../_lib/tmdb.js';
export async function onRequestGet({ request, env }) {
  try {
    const query = searchQuery(new URL(request.url).searchParams.get('q'));
    if (!query) return Response.json({ results: [] });
    return Response.json(await tmdb('/search/movie', env, { query }));
  }
  catch (error) { return safeError(error); }
}
