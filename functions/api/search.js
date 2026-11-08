import { tmdb, safeError, searchQuery, extractLang } from "../_lib/tmdb.js";

export async function onRequestGet({ request, env }) {
  try {
    const query = searchQuery(new URL(request.url).searchParams.get("q"));
    if (!query) return Response.json({ results: [], people: [] });
    const language = extractLang(request);

    const [moviesData, peopleData] = await Promise.all([
      tmdb("/search/movie", env, { query, language }),
      tmdb("/search/person", env, { query, language }),
    ]);

    const people = (peopleData.results || [])
      .filter(
        (person) =>
          person &&
          (person.known_for_department === "Directing" ||
            person.known_for_department === "Acting" ||
            (person.known_for || []).length > 0),
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
