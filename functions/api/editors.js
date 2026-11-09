import { EDITORS_CHOICE_MOVIES } from "../_lib/editors_choice.js";

export async function onRequestGet() {
  return Response.json(
    { results: EDITORS_CHOICE_MOVIES },
    { headers: { "Cache-Control": "public, max-age=3600" } },
  );
}
