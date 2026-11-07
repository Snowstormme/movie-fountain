import { LETTERBOXD_TOP_500 } from "../_lib/letterboxd500.js";

export async function onRequestGet() {
  return Response.json(
    { results: LETTERBOXD_TOP_500 },
    { headers: { "Cache-Control": "public, max-age=3600" } },
  );
}
