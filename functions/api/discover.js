import { tmdb, safeError, extractLang } from "../_lib/tmdb.js";
import { LETTERBOXD_TOP_500 } from "../_lib/letterboxd500.js";

export async function onRequestGet({ request, env }) {
  const q = new URL(request.url).searchParams;
  const year = q.get("year") || "";
  const runtime = q.get("runtime") || "";
  const genres = q.get("genres") || "";
  const source = q.get("source") || "";

  if (
    (year && !/^(19|20)\d{2}$/.test(year)) ||
    (runtime && !["90", "120", "180"].includes(runtime)) ||
    (genres && !/^\d{1,5}([|,]\d{1,5}){0,8}$/.test(genres)) ||
    (source && source !== "letterboxd")
  ) {
    return Response.json({ error: "Invalid filters" }, { status: 400 });
  }

  if (source === "letterboxd") {
    const results = LETTERBOXD_TOP_500.filter((movie) =>
      year ? String(movie.release_date || "").startsWith(year) : true,
    ).slice(0, 100);
    return Response.json(
      { results },
      { headers: { "Cache-Control": "public, max-age=300" } },
    );
  }

  try {
    const params = {
      include_adult: "false",
      sort_by: "popularity.desc",
      "vote_count.gte": "20",
      "primary_release_date.lte": new Date().toISOString().slice(0, 10),
      language: extractLang(request),
    };
    if (year) params.primary_release_year = year;
    if (runtime) {
      params["with_runtime.lte"] = runtime;
      params["with_runtime.gte"] = "1";
    }
    if (genres) params.with_genres = genres;

    return Response.json(await tmdb("/discover/movie", env, params), {
      headers: { "Cache-Control": "public, max-age=300" },
    });
  } catch (error) {
    return safeError(error);
  }
}
