const watchedKey = "movie-fountain.watched.v1";
const themeKey = "movie-fountain.theme.v1";

function applyTheme(theme) {
  if (document.documentElement?.dataset) {
    document.documentElement.dataset.theme =
      theme === "liquid" ? "liquid" : "current";
  }
}

let savedTheme = "classic";
try {
  savedTheme =
    localStorage.getItem(themeKey) === "liquid" ? "liquid" : "classic";
} catch {}
applyTheme(savedTheme);

function readWatched() {
  try {
    const data = JSON.parse(localStorage.getItem(watchedKey) || "[]");
    return new Set(
      Array.isArray(data) ? data.filter(Number.isSafeInteger) : [],
    );
  } catch {
    return new Set();
  }
}

let watched = readWatched();

function announce(text) {
  document.querySelector("#save-status").textContent = text;
}

function setTheme(theme) {
  savedTheme = theme === "liquid" ? "liquid" : "classic";
  applyTheme(savedTheme);
  try {
    localStorage.setItem(themeKey, savedTheme);
  } catch {}
  document.dispatchEvent(new Event("themechange"));
}

function normalizeMovies(data) {
  if (!Array.isArray(data) || data.length > 2000) {
    throw new Error("Choose a list of up to 2,000 movies.");
  }

  const unique = new Map();
  for (const m of data) {
    if (
      !m ||
      !Number.isSafeInteger(m.id) ||
      m.id <= 0 ||
      typeof m.title !== "string"
    ) {
      throw new Error("Invalid movie in file.");
    }

    const posterPath =
      typeof m.poster_path === "string" &&
      /^\/[a-zA-Z0-9_.-]+$/.test(m.poster_path)
        ? m.poster_path
        : null;
    const releaseDate =
      typeof m.release_date === "string" ? m.release_date.slice(0, 10) : "";
    const voteAverage =
      typeof m.vote_average === "number" && Number.isFinite(m.vote_average)
        ? Math.max(0, Math.min(10, m.vote_average))
        : 0;
    const overview =
      typeof m.overview === "string" ? m.overview.slice(0, 3000) : "";

    unique.set(m.id, {
      id: m.id,
      title: m.title.slice(0, 300),
      poster_path: posterPath,
      release_date: releaseDate,
      vote_average: voteAverage,
      overview,
    });
  }

  return [...unique.values()];
}

function extraActions(m) {
  const isWatched = watched.has(m.id);
  return `<div class="movie-actions">
    <button type="button" data-watched="${m.id}" aria-pressed="${isWatched}">
      ${isWatched ? "✓ Watched" : "Mark watched"}
    </button>
    <button type="button" data-share="${m.id}">Share</button>
  </div>`;
}

function libraryTools() {
  return `<div class="library-tools">
    <button type="button" id="export-list">Export watchlist</button>
    <label class="import-label">
      Import watchlist
      <input type="file" id="import-list" accept="application/json,.json">
    </label>
    <p>Import merges with your current list. Files stay on your device.</p>
  </div>`;
}

function filterFields() {
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from(
    { length: currentYear - 1899 },
    (_, i) => currentYear - i,
  )
    .map((y) => `<option>${y}</option>`)
    .join("");

  return `<label>
    Year
    <select name="year">
      <option value="">Any year</option>
      ${yearOptions}
    </select>
  </label>
  <label>
    Length
    <select name="runtime">
      <option value="">Any length</option>
      <option value="90">Up to 90 min</option>
      <option value="120">Up to 2 hours</option>
      <option value="180">Up to 3 hours</option>
    </select>
  </label>`;
}

async function discoverMovies(form, genre = "all") {
  const q = new URLSearchParams();
  for (const name of ["year", "runtime"]) {
    if (form.elements[name].value) {
      q.set(name, form.elements[name].value);
    }
  }
  if (genre === "letterboxd") {
    q.set("source", "letterboxd");
  }
  const ids = genreIds[genre] ? [genreIds[genre]] : moodFilters[genre] || [];
  if (ids.length) {
    q.set("genres", ids.join("|"));
  }
  return (await api("/api/discover?" + q)).results || [];
}

let fountainAbort;

function enhanceFountain(movies, letterboxdMovies = []) {
  const panel = document.querySelector("#fountain-settings-panel");
  const stream = document.querySelector("#fountain-stream");
  const grid = document.querySelector("#fountain-grid");
  if (!panel || !stream || !grid) return;

  panel.insertAdjacentHTML(
    "beforeend",
    `<section class="fountain-settings-group fountain-settings-group--refine">
      <div class="fountain-settings-label"><span>Refine</span></div>
      <form class="discovery-form fountain-advanced-filters" id="advanced-filters">
        ${filterFields()}
        <label><input name="hide" type="checkbox" checked> Hide watched</label>
        <button>Apply filters</button>
        <button type="button" id="reset-filters">Reset</button>
      </form>
      <p id="filter-status" role="status"></p>
    </section>`,
  );

  const form = document.querySelector("#advanced-filters");
  let sequence = 0;
  let current = movies;

  const render = () => {
    const visible = form.elements.hide.checked
      ? current.filter((m) => !watched.has(m.id))
      : current;
    grid.innerHTML = fountainColumns(visible);
    syncFountainFlow(stream, true);
  };

  const update = async () => {
    const token = ++sequence;
    const status = document.querySelector("#filter-status");
    const genre = stream.dataset.filter;
    try {
      status.textContent = "Loading…";
      const result =
        form.elements.year.value || form.elements.runtime.value
          ? await discoverMovies(form, genre)
          : filteredMovies(movies, genre, letterboxdMovies);
      if (token !== sequence) return;
      current = result;
      render();
      const visibleCount = (
        form.elements.hide.checked
          ? current.filter((m) => !watched.has(m.id))
          : current
      ).length;
      status.textContent = `${visibleCount} matching movies`;
    } catch {
      if (token === sequence) {
        status.textContent = "Could not update filters. Try again.";
      }
    }
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    update();
  });

  document.querySelector("#reset-filters").addEventListener("click", () => {
    form.reset();
    document.querySelector('[data-filter="all"]').click();
  });

  document
    .querySelectorAll("[data-filter]")
    .forEach((b) => b.addEventListener("click", update));
  fountainAbort = new AbortController();
  app.addEventListener("watchedchange", render, {
    signal: fountainAbort.signal,
  });
  if (watched.size > 0) {
    render();
  }
}

document.addEventListener("click", async (event) => {
  const seen = event.target.closest("[data-watched]");
  if (seen) {
    const id = Number(seen.dataset.watched);
    const next = new Set(watched);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }

    try {
      localStorage.setItem(watchedKey, JSON.stringify([...next]));
      watched = next;
    } catch {
      announce("Could not save watched status.");
      return;
    }

    document.querySelectorAll(`[data-watched="${id}"]`).forEach((b) => {
      b.textContent = watched.has(id) ? "✓ Watched" : "Mark watched";
      b.setAttribute("aria-pressed", String(watched.has(id)));
    });
    app.dispatchEvent(new Event("watchedchange"));
    announce("Watched status updated.");
  }

  const share = event.target.closest("[data-share]");
  if (share) {
    const url = `${location.origin}/#movie/${Number(share.dataset.share)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Movie Fountain", url });
      } else {
        await navigator.clipboard.writeText(url);
        announce("Movie link copied.");
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        const box = document.createElement("input");
        box.value = url;
        box.readOnly = true;
        box.setAttribute("aria-label", "Copy movie link");
        share.after(box);
        box.select();
        announce("Copy the displayed link.");
      }
    }
  }

  if (event.target.closest("#export-list")) {
    const payload = JSON.stringify(
      { version: 1, movies: savedMovies },
      null,
      2,
    );
    const url = URL.createObjectURL(
      new Blob([payload], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "movie-fountain-watchlist.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
});

document.addEventListener("change", async (event) => {
  if (event.target.id !== "import-list") return;
  const file = event.target.files[0];
  if (!file) return;

  try {
    if (file.size > 2_000_000) {
      throw new Error("File is too large (maximum 2 MB).");
    }
    const data = JSON.parse(await file.text());
    if (data.version !== 1) {
      throw new Error("Unsupported watchlist format.");
    }
    const imported = normalizeMovies(data.movies);
    const merged = normalizeMovies([...savedMovies, ...imported]);
    localStorage.setItem(watchlistKey, JSON.stringify(merged));
    savedMovies = merged;
    account();
    announce(`Imported ${imported.length} movies.`);
  } catch (error) {
    announce(
      error instanceof SyntaxError
        ? "This file is not valid JSON."
        : error.message,
    );
  }
});
