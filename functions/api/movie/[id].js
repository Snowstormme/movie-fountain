import { tmdb, safeError, numericId } from '../../_lib/tmdb.js';

function uniqueDirectedMovies(crew, currentMovieId) {
  const seen = new Set([Number(currentMovieId)]);
  return (crew || [])
    .filter(item => {
      if (!item || item.job !== 'Director' || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    })
    .sort((a, b) => (b.release_date || '').localeCompare(a.release_date || ''))
    .slice(0, 6);
}

export async function onRequestGet({ params, env }) {
  try {
    const id = numericId(params.id);
    const movie = await tmdb(`/movie/${id}`, env, {
      append_to_response: 'credits,recommendations',
    });
    const director = (movie.credits?.crew || []).find(person => person.job === 'Director') || null;
    let directorMovies = [];
    if (director?.id) {
      try {
        const credits = await tmdb(`/person/${numericId(director.id)}/movie_credits`, env);
        directorMovies = uniqueDirectedMovies(credits.crew, id);
      } catch {
        directorMovies = [];
      }
    }
    return Response.json({
      movie,
      director,
      director_movies: directorMovies,
      cast: (movie.credits?.cast || []).slice(0, 6),
      recommendations: (movie.recommendations?.results || []).slice(0, 6),
    });
  } catch (error) {
    return safeError(error);
  }
}
