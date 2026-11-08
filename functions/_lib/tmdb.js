export async function tmdb(path, env, params = {}) {
  if (!env.TMDB_API_KEY)
    throw new Error("TMDB_API_KEY is not configured in Cloudflare Pages");
  const url = new URL(`https://api.themoviedb.org/3${path}`);
  url.searchParams.set("api_key", env.TMDB_API_KEY);
  url.searchParams.set("language", "en-US");
  for (const [key, value] of Object.entries(params))
    url.searchParams.set(key, value);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`TMDB request failed: ${response.status}`);
  return response.json();
}

export function extractLang(request) {
  try {
    const url = new URL(request?.url || "");
    return url.searchParams.get("lang") === "ru" ? "ru-RU" : "en-US";
  } catch {
    return "en-US";
  }
}

export function numericId(value) {
  const id = String(value || "");
  if (!/^\d{1,10}$/.test(id)) throw new Error("Invalid resource identifier");
  return id;
}

export function searchQuery(value) {
  return String(value || "")
    .trim()
    .slice(0, 120);
}

export function safeError(error) {
  console.error("Movie API request failed", error);
  return new Response(
    JSON.stringify({ error: "Movie service temporarily unavailable" }),
    {
      status: 502,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
      },
    },
  );
}
