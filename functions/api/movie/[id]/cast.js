import { tmdb, safeError, numericId } from "../../../_lib/tmdb.js";

export async function onRequestGet({ params, env }) {
  try {
    const id = numericId(params.id);
    const movie = await tmdb(`/movie/${id}`, env, {
      append_to_response: "credits",
    });
    return Response.json({ movie, cast: movie.credits?.cast || [] });
  } catch (error) {
    return safeError(error);
  }
}
