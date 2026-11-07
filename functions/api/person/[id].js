import { tmdb, safeError, numericId } from "../../_lib/tmdb.js";

function uniqueByReleaseDate(list) {
  const seen = new Set();
  return (list || [])
    .filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    })
    .sort((a, b) => (b.release_date || "").localeCompare(a.release_date || ""));
}

export async function onRequestGet({ params, env }) {
  try {
    const id = numericId(params.id);
    const person = await tmdb(`/person/${id}`, env, {
      append_to_response: "movie_credits",
    });
    const credits = person.movie_credits || {};
    return Response.json({
      person,
      acting_movies: uniqueByReleaseDate(credits.cast),
      directed_movies: uniqueByReleaseDate(
        (credits.crew || []).filter((item) => item.job === "Director"),
      ),
    });
  } catch (error) {
    return safeError(error);
  }
}
