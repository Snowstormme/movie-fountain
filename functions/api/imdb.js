import { IMDB_TOP_250 } from "../_lib/imdb250.js";

export async function onRequestGet() {
  return Response.json(
    { results: IMDB_TOP_250 },
    { headers: { "Cache-Control": "public, max-age=3600" } },
  );
}
