import { tmdb, safeError, numericId } from "../../_lib/tmdb.js";

function uniqueDirectedMovies(crew, currentMovieId) {
  const seen = new Set([Number(currentMovieId)]);
  return (crew || [])
    .filter((item) => {
      if (!item || item.job !== "Director" || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    })
    .sort((a, b) => (b.release_date || "").localeCompare(a.release_date || ""))
    .slice(0, 6);
}

export function pickTrailer(videos) {
  const list = Array.isArray(videos?.results) ? videos.results : [];
  const candidates = list.filter(
    (item) =>
      item &&
      item.site === "YouTube" &&
      typeof item.key === "string" &&
      /^[a-zA-Z0-9_-]{6,20}$/.test(item.key) &&
      (item.type === "Trailer" || item.type === "Teaser"),
  );
  candidates.sort((a, b) => {
    const typeScore = (item) => (item.type === "Trailer" ? 2 : 1);
    if (typeScore(b) !== typeScore(a)) return typeScore(b) - typeScore(a);
    return Number(Boolean(b.official)) - Number(Boolean(a.official));
  });
  const best = candidates[0];
  return best
    ? {
        key: best.key,
        name: best.name || "Official Trailer",
        type: best.type,
      }
    : null;
}

export async function onRequestGet({ params, env }) {
  try {
    const id = numericId(params.id);
    const movie = await tmdb(`/movie/${id}`, env, {
      append_to_response: "credits,recommendations,videos",
    });
    const director =
      (movie.credits?.crew || []).find((person) => person.job === "Director") ||
      null;
    let directorMovies = [];
    if (director?.id) {
      try {
        const credits = await tmdb(
          `/person/${numericId(director.id)}/movie_credits`,
          env,
        );
        directorMovies = uniqueDirectedMovies(credits.crew, id);
      } catch {
        directorMovies = [];
      }
    }
    return Response.json({
      movie,
      trailer: pickTrailer(movie.videos),
      director,
      director_movies: directorMovies,
      cast: (movie.credits?.cast || []).slice(0, 6),
      recommendations: (movie.recommendations?.results || []).slice(0, 6),
    });
  } catch (error) {
    return safeError(error);
  }
}
