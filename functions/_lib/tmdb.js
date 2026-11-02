export async function tmdb(path, env, params = {}) {
  if (!env.TMDB_API_KEY) throw new Error('TMDB_API_KEY is not configured in Cloudflare Pages');
  const url = new URL(`https://api.themoviedb.org/3${path}`);
  url.searchParams.set('api_key', env.TMDB_API_KEY);
  url.searchParams.set('language', 'en-US');
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`TMDB request failed: ${response.status}`);
  return response.json();
}

export function safeError(error) {
  return new Response(JSON.stringify({ error: error.message || 'Movie service unavailable' }), { status: 502, headers: { 'content-type': 'application/json' } });
}
