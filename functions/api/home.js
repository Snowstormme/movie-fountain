import { tmdb, safeError } from '../_lib/tmdb.js';
export async function onRequestGet({ env }) {
  try {
    const keys = ['trending','popular','now_playing','top_rated','upcoming'];
    const responses = await Promise.all(keys.map(key => tmdb(key === 'trending' ? '/trending/movie/week' : `/movie/${key}`, env)));
    return Response.json(Object.fromEntries(keys.map((key, i) => [key, responses[i].results || []])));
  } catch (error) { return safeError(error); }
}
