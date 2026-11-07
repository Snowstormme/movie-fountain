import { tmdb, safeError, searchQuery } from '../_lib/tmdb.js';

export async function onRequestGet({ request, env }) {
  try {
    const query = searchQuery(new URL(request.url).searchParams.get('q'));
    if (!query) return Response.json({ results: [], people: [] });

    const [moviesData, peopleData] = await Promise.all([
      tmdb('/search/movie', env, { query }),
      tmdb('/search/person', env, { query }),
    ]);

    const people = (peopleData.results || [])
      .filter(
        person =>
          person &&
          (person.known_for_department === 'Directing' ||
            person.known_for_department === 'Acting' ||
            (person.known_for || []).length > 0)
      )
      .slice(0, 9);

    return Response.json({
      results: moviesData.results || [],
      people,
    });
  } catch (error) {
    return safeError(error);
  }
}
