const app = document.querySelector("#app");
const image = (path) => (path ? `https://image.tmdb.org/t/p/w500${path}` : "");
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );
const year = (date) => (date ? date.slice(0, 4) : "Year unknown");

const genreIds = {
  action: 28,
  comedy: 35,
  drama: 18,
  horror: 27,
  scifi: 878,
  animation: 16,
};

const moodFilters = {
  exciting: [28, 12, 53, 878],
  dark: [27, 80, 9648, 53],
  feelgood: [35, 10751, 16, 10402],
  romantic: [10749, 18, 35],
};

const fountainMovieLimit = 100;
const movieCache = new Map();
const watchlistKey = "movie-fountain.watchlist.v1";

function readWatchlist() {
  try {
    const value = JSON.parse(localStorage.getItem(watchlistKey) || "[]");
    return normalizeMovies(value);
  } catch {
    return [];
  }
}

let savedMovies = readWatchlist();
let accountFilter = "all";
let accountSort = "saved";
let lastMovieId = "";

function saveButton(movie) {
  const saved = savedMovies.some((m) => m.id === movie.id);
  const actionLabel = `${saved ? "Remove" : "Save"} ${esc(movie.title)} ${saved ? "from" : "to"} watchlist`;
  return `<button class="save-movie" type="button" data-save="${movie.id}" aria-pressed="${saved}" aria-label="${actionLabel}">${saved ? "Saved" : "Save"}</button>`;
}

function getCinephileRank(watchedCount) {
  if (watchedCount >= 30) return "Cinema Connoisseur";
  if (watchedCount >= 15) return "Level 3 Cinephile";
  if (watchedCount >= 5) return "Level 2 Cinephile";
  if (watchedCount >= 1) return "Level 1 Cinephile";
  return "Film Enthusiast";
}

function account() {
  const watchedMovies = savedMovies.filter((movie) => watched.has(movie.id));
  const watchedCount = watchedMovies.length;
  const toWatchCount = savedMovies.length - watchedCount;
  const completionRate = savedMovies.length
    ? Math.round((watchedCount / savedMovies.length) * 100)
    : 0;
  const average = savedMovies.length
    ? (
        savedMovies.reduce((sum, movie) => sum + (movie.vote_average || 0), 0) /
        savedMovies.length
      ).toFixed(1)
    : "—";
  const rank = getCinephileRank(watchedCount);
  const theme =
    typeof savedTheme === "string" && savedTheme === "liquid"
      ? "Liquid Glass"
      : "Classic";
  const lastWatchedTitle = watchedMovies.length
    ? watchedMovies[watchedMovies.length - 1].title
    : "None yet";

  app.innerHTML = `<section class="account-page">
    <div class="account-hero">
      <div class="account-profile">
        <div class="account-avatar" aria-hidden="true">M</div>
        <div class="account-name-wrap">
          <p class="eyebrow">Personal library</p>
          <h1>Cinema Passport</h1>
          <div class="account-badges">
            <span class="account-rank-badge">★ ${esc(rank)}</span>
            <span class="account-count-badge">${savedMovies.length} ${savedMovies.length === 1 ? "film" : "films"}</span>
          </div>
        </div>
      </div>
      <div class="account-hero-actions">
        <button type="button" class="account-hero-btn" data-open-style>Theme: ${theme}</button>
        <button type="button" class="account-hero-btn" id="export-list">Export JSON</button>
        <label class="account-hero-btn account-hero-btn--primary">
          + Import JSON
          <input type="file" id="import-list" accept="application/json,.json" style="display:none">
        </label>
        <a class="account-hero-btn" href="/privacy.html">Privacy</a>
      </div>
    </div>

    <div class="account-stats-row" aria-label="Watchlist summary">
      <div class="account-stat-card">
        <span class="account-stat-label">Completion</span>
        <strong class="account-stat-value">${completionRate}%</strong>
        <div class="account-progress-track">
          <div class="account-progress-fill" style="width: ${completionRate}%"></div>
        </div>
        <small class="account-stat-sub">${watchedCount} of ${savedMovies.length} watched</small>
      </div>

      <div class="account-stat-card">
        <span class="account-stat-label">Watchlist</span>
        <strong class="account-stat-value">${savedMovies.length}</strong>
        <small class="account-stat-sub">${toWatchCount} waiting to watch</small>
      </div>

      <div class="account-stat-card">
        <span class="account-stat-label">Watched</span>
        <strong class="account-stat-value account-stat-value--accent">${watchedCount}</strong>
        <small class="account-stat-sub" title="${esc(lastWatchedTitle)}">${esc(lastWatchedTitle)}</small>
      </div>

      <div class="account-stat-card">
        <span class="account-stat-label">Library Score</span>
        <strong class="account-stat-value account-stat-value--gold">★ ${average}</strong>
        <small class="account-stat-sub">Average rating</small>
      </div>
    </div>

    <div class="account-shelf-header">
      <div class="account-tabs" role="group" aria-label="Filter watchlist">
        <button type="button" data-account-filter="all" class="account-tab">All Movies (${savedMovies.length})</button>
        <button type="button" data-account-filter="unwatched" class="account-tab">To Watch (${toWatchCount})</button>
        <button type="button" data-account-filter="watched" class="account-tab">Watched (${watchedCount})</button>
      </div>
      <label class="account-sort">
        Sort
        <select data-account-sort>
          <option value="saved">Recently saved</option>
          <option value="rating">Highest rated</option>
          <option value="release">Release date</option>
          <option value="title">Title A–Z</option>
        </select>
      </label>
    </div>

    <div class="movie-grid" id="account-movie-grid">${accountMovieMarkup()}</div>
  </section>`;

  app.querySelectorAll?.("[data-account-filter]").forEach((button) => {
    button.classList.toggle(
      "is-active",
      button.dataset.accountFilter === accountFilter,
    );
  });
  const sortControl = app.querySelector?.("[data-account-sort]");
  if (sortControl) sortControl.value = accountSort;
}

function watchlist() {
  account();
}

function accountMovieMarkup() {
  let movies = savedMovies.filter(
    (movie) =>
      accountFilter === "all" ||
      (accountFilter === "watched"
        ? watched.has(movie.id)
        : !watched.has(movie.id)),
  );
  if (accountSort === "rating") {
    movies = [...movies].sort(
      (a, b) => (b.vote_average || 0) - (a.vote_average || 0),
    );
  }
  if (accountSort === "release") {
    movies = [...movies].sort((a, b) =>
      String(b.release_date || "").localeCompare(String(a.release_date || "")),
    );
  }
  if (accountSort === "title") {
    movies = [...movies].sort((a, b) => a.title.localeCompare(b.title));
  }
  return (
    movies.map(card).join("") ||
    `<div class="account-empty">
      <strong>Your watchlist is empty here.</strong>
      <span>Save movies from the Fountain and they will appear in this section.</span>
      <a class="text-link" href="#fountain">Explore the Fountain</a>
    </div>`
  );
}

function refreshAccountMovies() {
  const grid = document.querySelector?.("#account-movie-grid");
  if (!grid) return;
  grid.innerHTML = accountMovieMarkup();
  document.querySelectorAll?.("[data-account-filter]").forEach((button) => {
    button.classList.toggle(
      "is-active",
      button.dataset.accountFilter === accountFilter,
    );
  });
}

app.addEventListener("click", (event) => {
  const styleLink = event.target.closest("[data-open-style]");
  if (styleLink?.dataset?.openStyle !== undefined) {
    event.stopPropagation();
    setTheme(savedTheme === "liquid" ? "classic" : "liquid");
    return;
  }

  const filter = event.target.closest("[data-account-filter]");
  if (filter?.dataset?.accountFilter) {
    accountFilter = filter.dataset.accountFilter;
    refreshAccountMovies();
    return;
  }

  const closeTrailer = event.target.closest("[data-close-trailer]");
  if (closeTrailer?.dataset?.closeTrailer !== undefined) {
    const slot = document.querySelector?.("#trailer-embed-slot");
    const trigger = document.querySelector?.("[data-trailer-key]");
    if (slot) slot.innerHTML = "";
    if (trigger) {
      trigger.setAttribute?.("aria-expanded", "false");
      trigger.textContent = "▶ Watch trailer";
    }
    return;
  }

  const trailerBtn = event.target.closest("[data-trailer-key]");
  if (trailerBtn?.dataset?.trailerKey) {
    const slot = document.querySelector?.("#trailer-embed-slot");
    if (!slot) return;
    const isOpen = trailerBtn.getAttribute("aria-expanded") === "true";
    if (isOpen) {
      slot.innerHTML = "";
      trailerBtn.setAttribute("aria-expanded", "false");
      trailerBtn.textContent = "▶ Watch trailer";
    } else {
      slot.innerHTML = renderTrailerEmbed(
        trailerBtn.dataset.trailerKey,
        trailerBtn.dataset.trailerName || "Official Trailer",
      );
      trailerBtn.setAttribute("aria-expanded", "true");
      trailerBtn.textContent = "Hide trailer";
      slot.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
    }
    return;
  }

  const button = event.target.closest("[data-save]");
  if (!button) return;
  const item = movieCache.get(button.dataset.save);
  if (!item) return;

  const exists = savedMovies.some((m) => m.id === item.id);
  const next = exists
    ? savedMovies.filter((m) => m.id !== item.id)
    : [
        ...savedMovies,
        {
          id: item.id,
          title: item.title,
          poster_path: item.poster_path,
          release_date: item.release_date,
          vote_average: item.vote_average,
          overview: item.overview,
        },
      ];

  try {
    localStorage.setItem(watchlistKey, JSON.stringify(next));
  } catch {
    document.querySelector("#save-status").textContent =
      "Could not save. Browser storage is unavailable or full.";
    return;
  }

  savedMovies = next;
  document.querySelector("#save-status").textContent = exists
    ? "Removed from watchlist."
    : "Saved to watchlist.";

  if (location.hash === "#account" || location.hash === "#watchlist") {
    account();
  } else {
    app.querySelectorAll(`[data-save="${item.id}"]`).forEach((control) => {
      control.outerHTML = saveButton(item);
    });
  }
});

app.addEventListener("change", (event) => {
  if (event.target.matches("[data-account-sort]")) {
    accountSort = event.target.value;
    refreshAccountMovies();
  }
});

app.addEventListener("watchedchange", () => {
  if (location.hash === "#account" || location.hash === "#watchlist") account();
});

document.addEventListener("themechange", () => {
  if (location.hash === "#account" || location.hash === "#watchlist") account();
});

window.addEventListener("storage", (event) => {
  if (event.key === watchlistKey || event.key === null) {
    savedMovies = readWatchlist();
    if (location.hash === "#account" || location.hash === "#watchlist") {
      account();
    } else {
      app.querySelectorAll("[data-save]").forEach((control) => {
        const item = movieCache.get(control.dataset.save);
        if (item) control.outerHTML = saveButton(item);
      });
    }
  }
});

document
  .querySelector(".topbar-left")
  .insertAdjacentHTML(
    "beforeend",
    '<a class="fountain-nav" href="#account">Account</a>',
  );
document.body.insertAdjacentHTML(
  "beforeend",
  '<p id="save-status" class="visually-hidden" role="status"></p>',
);
document.addEventListener("visibilitychange", () =>
  document.documentElement.classList.toggle("page-hidden", document.hidden),
);

let rowDragState = null;
app.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "touch" || event.button !== 0) return;
  if (event.target.closest?.("button")) return;
  const row = event.target.closest?.(".movie-row");
  if (!row) return;
  rowDragState = {
    row,
    startX: event.clientX,
    scrollLeft: row.scrollLeft,
    moved: false,
  };
});

window.addEventListener("pointermove", (event) => {
  if (!rowDragState) return;
  const delta = event.clientX - rowDragState.startX;
  if (!rowDragState.moved && Math.abs(delta) > 6) {
    rowDragState.moved = true;
    rowDragState.row.classList.add("is-dragging");
  }
  if (rowDragState.moved) {
    event.preventDefault();
    rowDragState.row.scrollLeft = rowDragState.scrollLeft - delta;
  }
});

window.addEventListener("pointerup", () => {
  if (!rowDragState) return;
  const { row, moved } = rowDragState;
  row.classList.remove("is-dragging");
  if (moved) {
    row.dataset.justDragged = "1";
    setTimeout(() => {
      delete row.dataset.justDragged;
    }, 80);
  }
  rowDragState = null;
});

document.addEventListener(
  "click",
  (event) => {
    const row = event.target.closest?.(".movie-row");
    if (row?.dataset?.justDragged) {
      event.preventDefault();
      event.stopPropagation();
    }
  },
  true,
);

function card(movie, decorative = false, eagerPoster = false) {
  movieCache.set(String(movie.id), movie);
  const loadingAttr = eagerPoster ? "" : ' loading="lazy"';
  const poster = movie.poster_path
    ? `<img src="${image(movie.poster_path)}" alt="Poster for ${esc(movie.title)}"${loadingAttr} decoding="async">`
    : '<div class="no-poster">No poster</div>';

  if (decorative === true) {
    const saved = savedMovies.some((m) => m.id === movie.id);
    return `<div class="movie-tile">
      <a class="movie-card" href="#movie/${movie.id}" tabindex="-1">
        ${poster}
        <strong class="rating-badge">★ ${(movie.vote_average || 0).toFixed(1)}</strong>
        <div class="card-copy">
          <h3>${esc(movie.title)}</h3>
          <div class="card-meta"><span>${year(movie.release_date)}</span></div>
        </div>
      </a>
      <span class="save-movie" aria-hidden="true">${saved ? "Saved" : "Save"}</span>
      <div class="movie-actions" aria-hidden="true">
        <button type="button" tabindex="-1">${watched.has(movie.id) ? "✓ Watched" : "Mark watched"}</button>
        <button type="button" tabindex="-1">Share</button>
      </div>
    </div>`;
  }

  const isWatched = watched.has(movie.id);
  return `<div class="movie-tile">
    <a class="movie-card" href="#movie/${movie.id}">
      ${poster}
      <strong class="rating-badge">★ ${(movie.vote_average || 0).toFixed(1)}</strong>
      ${isWatched ? '<strong class="watched-badge">✓ Watched</strong>' : ""}
      <div class="card-copy">
        <h3>${esc(movie.title)}</h3>
        <div class="card-meta"><span>${year(movie.release_date)}</span></div>
      </div>
      <div class="card-preview">
        <p>${esc(movie.overview || "Open the details to learn more about this movie.")}</p>
      </div>
    </a>
    ${saveButton(movie)}
    ${extraActions(movie)}
  </div>`;
}

function shelf(title, subtitle, movies, href = "") {
  if (!movies?.length) return "";
  const headingTitle = href
    ? `<h2><a class="shelf-title-link" href="${href}">${title}</a></h2>`
    : `<h2>${title}</h2>`;
  return `<section class="shelf">
    <div class="shelf-heading">
      <div>
        ${headingTitle}
        <p>${subtitle}</p>
      </div>
    </div>
    <div class="movie-row">${movies
      .slice(0, 12)
      .map((movie) => card(movie))
      .join("")}</div>
  </section>`;
}

function fountainMovies(data) {
  return [
    ...(data.trending || []),
    ...(data.popular || []),
    ...(data.now_playing || []),
    ...(data.top_rated || []),
    ...(data.upcoming || []),
  ].filter(
    (movie, index, all) =>
      all.findIndex((item) => item.id === movie.id) === index,
  );
}

function movieGenres(movie) {
  return movie.genre_ids || (movie.genres || []).map((genre) => genre.id);
}

function filteredMovies(movies, filter, letterboxdMovies = []) {
  if (filter === "all") return movies;
  if (filter === "letterboxd") {
    return letterboxdMovies.length
      ? letterboxdMovies
      : movies.filter((movie) => movie.letterboxd_top);
  }
  const ids = genreIds[filter] ? [genreIds[filter]] : moodFilters[filter] || [];
  return movies.filter((movie) =>
    movieGenres(movie).some((id) => ids.includes(id)),
  );
}

function fountainColumns(movies) {
  if (!movies.length) {
    return '<div class="fountain-empty">No movies found for this filter.</div>';
  }
  const columns = [0, 1, 2, 3, 4].map((column) =>
    movies.filter((_, index) => index % 5 === column),
  );
  return columns
    .map((column, columnIndex) => {
      const items = column
        .map(
          (movie, index) =>
            `<div class="fountain-item" style="--delay:${index * 0.35 + columnIndex * 0.2}s">${card(movie, false, true)}</div>`,
        )
        .join("");
      const decorativeItems = column
        .map(
          (movie, index) =>
            `<div class="fountain-item" style="--delay:${index * 0.35 + columnIndex * 0.2}s">${card(movie, true, true)}</div>`,
        )
        .join("");
      return `<div class="fountain-column fountain-column-${columnIndex + 1}">
        <div class="fountain-track">
          <div class="fountain-set">${items}</div>
          <div class="fountain-set" aria-hidden="true" inert>${decorativeItems}</div>
        </div>
      </div>`;
    })
    .join("");
}

function syncFountainFlow(stream, reset = false) {
  const pixelsPerSecond =
    { slow: 50, normal: 100, fast: 150 }[stream?.dataset.speed] || 100;
  const rate = pixelsPerSecond / 100;
  const tracks = [...(stream?.querySelectorAll(".fountain-track") || [])];
  if (!tracks.length) return;

  if (reset) {
    tracks.forEach((track) => {
      track.style.animation = "none";
    });
    stream.offsetHeight;
    tracks.forEach((track) => {
      track.style.animation = "";
    });
    const heights = tracks.map((track) => track.scrollHeight);
    tracks.forEach((track, i) => {
      track.style.animationDuration = `${Math.max(1, heights[i] / 2 / 100)}s`;
    });
  }

  tracks.forEach((track) => {
    const animations =
      typeof track.getAnimations === "function" ? track.getAnimations() : [];
    if (animations.length) {
      animations.forEach((anim) => {
        if (typeof anim.updatePlaybackRate === "function") {
          anim.updatePlaybackRate(rate);
        } else {
          anim.playbackRate = rate;
        }
      });
    } else if (!reset) {
      track.style.animationDuration = `${Math.max(1, track.scrollHeight / 2 / pixelsPerSecond)}s`;
    }
  });
}

function fountain(data) {
  const movies = fountainMovies(data).slice(0, fountainMovieLimit);
  return `<section class="fountain" id="fountain-stream" data-speed="normal" data-filter="all" aria-label="Movie Fountain">
    <div class="fountain-toolbar">
      <button class="fountain-settings" type="button" aria-expanded="false" aria-controls="fountain-settings-panel">Settings</button>
    </div>
    <div class="fountain-settings-panel" id="fountain-settings-panel" hidden>
      <section class="fountain-settings-group">
        <div class="fountain-settings-label"><span>Playback</span></div>
        <div class="fountain-controls" role="group" aria-label="Fountain controls">
          <button class="fountain-control" type="button" data-speed="slow">Slow</button>
          <button class="fountain-control is-active" type="button" data-speed="normal">Normal</button>
          <button class="fountain-control" type="button" data-speed="fast">Fast</button>
          <button class="fountain-control pause-control" type="button" data-action="pause" aria-pressed="false">Pause</button>
        </div>
      </section>
      <section class="fountain-settings-group">
        <div class="fountain-settings-label"><span>Browse</span></div>
        <div class="fountain-filters" role="group" aria-label="Filter the Fountain">
          <button class="fountain-filter is-active" type="button" data-filter="all">All movies</button>
          <button class="fountain-filter" type="button" data-filter="letterboxd">Letterboxd Top 500</button>
          <button class="fountain-filter" type="button" data-filter="action">Action</button>
          <button class="fountain-filter" type="button" data-filter="comedy">Comedy</button>
          <button class="fountain-filter" type="button" data-filter="drama">Drama</button>
          <button class="fountain-filter" type="button" data-filter="horror">Horror</button>
          <button class="fountain-filter" type="button" data-filter="scifi">Sci-fi</button>
          <button class="fountain-filter" type="button" data-filter="animation">Animation</button>
          <button class="fountain-filter" type="button" data-filter="exciting">Exciting</button>
          <button class="fountain-filter" type="button" data-filter="dark">Dark</button>
          <button class="fountain-filter" type="button" data-filter="feelgood">Feel-good</button>
          <button class="fountain-filter" type="button" data-filter="romantic">Romantic</button>
        </div>
      </section>
    </div>
    <div id="fountain-grid" class="fountain-grid">${fountainColumns(movies)}</div>
  </section>`;
}

function bindFountainControls(movies, letterboxdMovies = []) {
  fountainAbort?.abort();
  const stream = document.querySelector("#fountain-stream");
  if (!stream) return;

  const settings = document.querySelector(".fountain-settings");
  const panel = document.querySelector("#fountain-settings-panel");
  settings?.addEventListener("click", () => {
    const open = panel.hidden;
    panel.hidden = !open;
    settings.setAttribute("aria-expanded", String(open));
  });

  document.querySelectorAll(".fountain-control[data-speed]").forEach((button) =>
    button.addEventListener("click", () => {
      if (stream.dataset.speed === button.dataset.speed) return;
      stream.dataset.speed = button.dataset.speed;
      document
        .querySelectorAll(".fountain-control[data-speed]")
        .forEach((control) =>
          control.classList.toggle("is-active", control === button),
        );
      syncFountainFlow(stream, false);
    }),
  );

  const pause = document.querySelector(".pause-control");
  pause?.addEventListener("click", () => {
    const paused = stream.classList.toggle("is-paused");
    pause.textContent = paused ? "Play" : "Pause";
    pause.setAttribute("aria-pressed", String(paused));
  });

  document.querySelectorAll(".fountain-filter").forEach((button) =>
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;
      stream.dataset.filter = filter;
      document
        .querySelectorAll(".fountain-filter")
        .forEach((control) =>
          control.classList.toggle("is-active", control === button),
        );
      if (!document.querySelector("#advanced-filters")) {
        const grid = document.querySelector(".fountain-grid") || stream;
        grid.innerHTML = fountainColumns(
          filteredMovies(movies, filter, letterboxdMovies),
        );
        syncFountainFlow(stream, true);
      }
    }),
  );

  syncFountainFlow(stream, true);
}

async function api(path) {
  const response = await fetch(path, {
    headers: { accept: "application/json" },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Could not load movies");
  return data;
}

function shuffleList(list) {
  const copy = [...(list || [])];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function homeShelves(data) {
  const seen = new Set();
  const takeUnique = (list) => {
    const items = (list || [])
      .filter((movie) => !seen.has(movie.id))
      .slice(0, 12);
    items.forEach((movie) => seen.add(movie.id));
    return items;
  };
  return [
    shelf(
      "Trending now",
      "What people are watching this week",
      takeUnique(data.trending),
      "#trending",
    ),
    shelf(
      "Letterboxd Top 500",
      "Rotating selection from the 500 highest-rated narrative films on Letterboxd",
      takeUnique(shuffleList(data.letterboxd_top)),
      "#letterboxd",
    ),
    shelf(
      "Coming soon",
      "Keep an eye on what is next",
      takeUnique(data.upcoming),
      "#upcoming",
    ),
  ].join("");
}

async function home() {
  app.innerHTML = '<div class="loading">Loading movies…</div>';
  try {
    const data = await api("/api/home?v=fountain-lb500");
    app.innerHTML = homeShelves(data);
  } catch (error) {
    app.innerHTML = `<div class="message error">${esc(error.message)}</div>`;
  }
}

async function trendingPage() {
  app.innerHTML = '<div class="loading">Loading trending movies…</div>';
  try {
    const data = await api("/api/trending");
    const movies = data.results || [];
    app.innerHTML = `<div class="page-heading">
      <p class="eyebrow">Weekly chart</p>
      <h1>Trending now</h1>
      <p class="hero-copy">The ${movies.length} most watched and talked-about movies this week, ordered from #1 to #${movies.length}.</p>
    </div>
    <div class="movie-grid">${movies.map((m) => card(m)).join("")}</div>`;
  } catch (error) {
    app.innerHTML = `<div class="message error">${esc(error.message)}</div>`;
  }
}

async function letterboxdPage() {
  app.innerHTML = '<div class="loading">Loading Letterboxd Top 500…</div>';
  try {
    const data = await api("/api/letterboxd");
    const movies = data.results || [];
    app.innerHTML = `<div class="page-heading">
      <p class="eyebrow">Curated collection</p>
      <h1>Letterboxd Top 500</h1>
      <p class="hero-copy">The ${movies.length} highest-rated narrative feature films on Letterboxd, ordered from #1 to #${movies.length}.</p>
    </div>
    <div class="movie-grid">${movies.map((m) => card(m)).join("")}</div>`;
  } catch (error) {
    app.innerHTML = `<div class="message error">${esc(error.message)}</div>`;
  }
}

async function upcomingPage() {
  app.innerHTML = '<div class="loading">Loading upcoming movies…</div>';
  try {
    const data = await api("/api/upcoming");
    const movies = data.results || [];
    app.innerHTML = `<div class="page-heading">
      <p class="eyebrow">Release calendar</p>
      <h1>Coming soon</h1>
      <p class="hero-copy">${movies.length} upcoming theatrical and digital releases worth keeping on your radar.</p>
    </div>
    <div class="movie-grid">${movies.map((m) => card(m)).join("")}</div>`;
  } catch (error) {
    app.innerHTML = `<div class="message error">${esc(error.message)}</div>`;
  }
}

async function fountainPage() {
  app.innerHTML = '<div class="loading">Pouring the fountain…</div>';
  try {
    const data = await api("/api/home?v=fountain-lb500");
    if (location.hash !== "#fountain") return;
    const movies = fountainMovies(data).slice(0, fountainMovieLimit);
    const letterboxdMovies = shuffleList(data.letterboxd_top || []).slice(
      0,
      fountainMovieLimit,
    );
    app.innerHTML = fountain(data);
    bindFountainControls(movies, letterboxdMovies);
    enhanceFountain(movies, letterboxdMovies);
  } catch (error) {
    app.innerHTML = `<div class="message error">${esc(error.message)}</div>`;
  }
}

function personCard(person) {
  const photo = person.profile_path
    ? `<img src="${image(person.profile_path)}" alt="" loading="lazy" decoding="async">`
    : '<div class="cast-photo">?</div>';
  const role =
    person.known_for_department === "Directing"
      ? "Director"
      : person.known_for_department === "Acting"
        ? "Actor"
        : person.known_for_department || "Film";
  const knownFor = (person.known_for || [])
    .map((item) => item.title || item.name)
    .filter(Boolean)
    .slice(0, 2)
    .join(", ");
  const subtitle = knownFor ? `${role} · ${knownFor}` : role;

  return `<a class="cast-card" href="#person/${person.id}">
    ${photo}
    <span>
      <strong>${esc(person.name)}</strong>
      <small>${esc(subtitle)}</small>
    </span>
  </a>`;
}

async function search(query) {
  app.innerHTML = '<div class="loading">Searching…</div>';
  try {
    const data = await api(`/api/search?q=${encodeURIComponent(query)}`);
    const people = data.people || [];
    const movies = data.results || [];

    const peopleSection = people.length
      ? `<section class="shelf">
          <div class="shelf-heading">
            <div>
              <h2>Directors & Actors</h2>
              <p>Open a person to view their biography and full filmography</p>
            </div>
          </div>
          <div class="cast-grid">${people.map(personCard).join("")}</div>
        </section>`
      : "";

    const moviesSection = movies.length
      ? `<section class="shelf">
          <div class="shelf-heading">
            <div>
              <h2>Movies</h2>
              <p>${movies.length} ${movies.length === 1 ? "result" : "results"}</p>
            </div>
          </div>
          <div class="movie-grid">${movies.map((m) => card(m)).join("")}</div>
        </section>`
      : "";

    const emptyMessage =
      !people.length && !movies.length
        ? '<div class="message">No movies, directors, or actors found.</div>'
        : "";

    app.innerHTML = `<div class="page-heading">
      <p class="eyebrow">Search results</p>
      <h1>Results for “${esc(query)}”</h1>
    </div>
    ${peopleSection}
    ${moviesSection}
    ${emptyMessage}`;
  } catch (error) {
    app.innerHTML = `<div class="message error">${esc(error.message)}</div>`;
  }
}

function computeFountainScore(m, r = {}) {
  const parts = [];

  // IMDb: weight 30
  if (typeof r.imdb === "number" && r.imdb > 0) {
    parts.push({ score: r.imdb * 10, weight: 30, name: "IMDb" });
  } else if (r.imdb_rating) {
    const parsed = parseFloat(r.imdb_rating);
    if (!isNaN(parsed) && parsed > 0) {
      parts.push({ score: parsed * 10, weight: 30, name: "IMDb" });
    }
  }

  // Letterboxd: weight 30
  if (typeof r.letterboxd === "number" && r.letterboxd > 0) {
    parts.push({
      score: (r.letterboxd / 5) * 100,
      weight: 30,
      name: "Letterboxd",
    });
  }

  // Rotten Tomatoes: weight 25
  const rtScores = [];
  if (typeof r.rotten === "number" && r.rotten >= 0) rtScores.push(r.rotten);
  else if (r.rotten_rating) {
    const parsed = parseInt(r.rotten_rating, 10);
    if (!isNaN(parsed) && parsed >= 0) rtScores.push(parsed);
  }
  if (typeof r.rotten_audience === "number" && r.rotten_audience >= 0) {
    rtScores.push(r.rotten_audience);
  }
  if (rtScores.length) {
    const avgRt = rtScores.reduce((a, b) => a + b, 0) / rtScores.length;
    parts.push({ score: avgRt, weight: 25, name: "Rotten Tomatoes" });
  }

  // TMDB: weight 15
  if (
    m?.vote_count &&
    typeof m.vote_average === "number" &&
    m.vote_average > 0
  ) {
    parts.push({ score: m.vote_average * 10, weight: 15, name: "TMDB" });
  }

  if (!parts.length) return null;

  const totalWeight = parts.reduce((sum, p) => sum + p.weight, 0);
  const weightedSum = parts.reduce((sum, p) => sum + p.score * p.weight, 0);
  const finalScore = Math.round(weightedSum / totalWeight);

  return {
    score: Math.max(0, Math.min(100, finalScore)),
    sourcesCount: parts.length,
    sourcesList: parts.map((p) => p.name).join(", "),
  };
}

function renderRatingsSection(m, ratings = null) {
  const r = ratings || {};
  const loading = ratings === null;
  const validImdbId =
    typeof m.imdb_id === "string" && /^tt\d{7,10}$/.test(m.imdb_id)
      ? m.imdb_id
      : "";
  const imdbUrl =
    r.imdb_url ||
    (validImdbId ? `https://www.imdb.com/title/${validImdbId}/` : "");
  const letterboxdUrl =
    r.letterboxd_url || `https://letterboxd.com/tmdb/${Number(m.id)}/`;
  const rottenUrl =
    r.rotten_url ||
    `https://www.rottentomatoes.com/search?search=${encodeURIComponent(m.title || "")}`;

  const tmdbScore = m.vote_count
    ? `<strong class="score-value">${Number(m.vote_average || 0).toFixed(1)}<small>/10</small></strong>`
    : '<span class="score-unavailable">No rating yet</span>';
  const tmdbVotes = `${Number(m.vote_count || 0).toLocaleString("en-US")} votes`;

  let imdbScore = '<span class="score-unavailable">No rating yet</span>';
  if (typeof r.imdb === "number") {
    imdbScore = `<strong class="score-value">${r.imdb.toFixed(1)}<small>/10</small></strong>`;
  } else if (r.imdb_rating) {
    imdbScore = `<strong class="score-value">${esc(r.imdb_rating)}</strong>`;
  } else if (loading) {
    imdbScore = '<span class="score-unavailable">Loading…</span>';
  }

  let letterboxdScore = '<span class="score-unavailable">No rating yet</span>';
  if (typeof r.letterboxd === "number") {
    letterboxdScore = `<strong class="score-value">${r.letterboxd.toFixed(2)}<small>/5</small></strong>`;
  } else if (loading) {
    letterboxdScore = '<span class="score-unavailable">Loading…</span>';
  }

  let rottenScore = '<span class="score-unavailable">No rating yet</span>';
  if (typeof r.rotten === "number") {
    rottenScore = `<strong class="score-value">${Math.round(r.rotten)}<small>%</small></strong>`;
  } else if (r.rotten_rating) {
    rottenScore = `<strong class="score-value">${esc(r.rotten_rating)}</strong>`;
  } else if (loading) {
    rottenScore = '<span class="score-unavailable">Loading…</span>';
  }

  const rottenAudience =
    typeof r.rotten_audience === "number"
      ? `<span class="score-extra">Audience ${Math.round(r.rotten_audience)}%</span>`
      : "";

  const hasWhatson =
    typeof r.imdb === "number" ||
    typeof r.letterboxd === "number" ||
    typeof r.rotten === "number";
  const hasOmdb = Boolean(r.imdb_rating || r.rotten_rating);

  let attribution = "";
  if (hasWhatson) {
    const updatedNote = r.updated_at ? ` · Updated ${esc(r.updated_at)}` : "";
    const omdbNote = hasOmdb
      ? ' Missing scores via <a href="https://www.omdbapi.com/" target="_blank" rel="noopener noreferrer">OMDb</a>.'
      : "";
    attribution = `<p class="rating-attribution">External ratings via <a href="https://github.com/pierrevano/whatson-api" target="_blank" rel="noopener noreferrer">What's on? API</a>${updatedNote}. Scores may differ from source sites.${omdbNote}</p>`;
  } else if (hasOmdb) {
    attribution =
      '<p class="rating-attribution">IMDb and Rotten Tomatoes scores via <a href="https://www.omdbapi.com/" target="_blank" rel="noopener noreferrer">OMDb</a>.</p>';
  }

  const fountain = computeFountainScore(m, r);
  let fountainCard = "";
  if (fountain) {
    let tag = "Recommended";
    if (fountain.score >= 85) tag = "Universal Acclaim";
    else if (fountain.score >= 75) tag = "Highly Rated";
    else if (fountain.score >= 60) tag = "Generally Favorable";
    else if (fountain.score >= 45) tag = "Mixed Reviews";
    else tag = "Underwhelming";

    const desc = loading
      ? "Initial consensus based on TMDB · Calculating full cross-platform consensus…"
      : `Universal consensus calculated from ${fountain.sourcesCount} ${fountain.sourcesCount === 1 ? "source" : "sources"} (${fountain.sourcesList}).`;

    fountainCard = `<div class="fountain-score-card">
      <div class="fountain-score-badge">
        <span class="fountain-score-num">${fountain.score}</span>
        <span class="fountain-score-max">/ 100</span>
      </div>
      <div class="fountain-score-info">
        <div class="fountain-score-title">
          <span class="fountain-score-label">Fountain Score</span>
          <span class="fountain-score-tag">${tag}</span>
        </div>
        <p class="fountain-score-desc">${esc(desc)}</p>
      </div>
    </div>`;
  }

  return `<div class="shelf-heading">
    <div>
      <h2>Ratings &amp; Consensus</h2>
      <p>Weighted consensus score and direct links across movie databases</p>
    </div>
  </div>
  ${fountainCard}
  <div class="ratings-grid">
    <div class="score-card tmdb-score">
      <span class="score-source">TMDB</span>
      ${tmdbScore}
      <span class="score-note">${tmdbVotes} · <a href="https://www.themoviedb.org/movie/${Number(m.id)}" target="_blank" rel="noopener noreferrer">Open</a></span>
    </div>
    <div class="score-card imdb-score">
      <span class="score-source">IMDb</span>
      ${imdbScore}
      <span class="score-note">Audience rating · ${imdbUrl ? `<a href="${esc(imdbUrl)}" target="_blank" rel="noopener noreferrer">Open</a>` : "Not listed"}</span>
    </div>
    <div class="score-card letterboxd-score">
      <span class="score-source">Letterboxd</span>
      ${letterboxdScore}
      <span class="score-note">Member rating · <a href="${esc(letterboxdUrl)}" target="_blank" rel="noopener noreferrer">Open</a></span>
    </div>
    <div class="score-card rotten-score">
      <span class="score-source">Rotten Tomatoes</span>
      ${rottenScore}
      ${rottenAudience}
      <span class="score-note">Critics · <a href="${esc(rottenUrl)}" target="_blank" rel="noopener noreferrer">Open</a></span>
    </div>
  </div>
  ${attribution}`;
}

function validYoutubeKey(key) {
  return typeof key === "string" && /^[a-zA-Z0-9_-]{6,20}$/.test(key)
    ? key
    : null;
}

function renderTrailerControls(m, trailer) {
  const key = validYoutubeKey(trailer?.key);
  if (key) {
    const label = trailer?.name || "Official Trailer";
    return `<div class="detail-links">
      <button type="button" class="trailer-button" data-trailer-key="${esc(key)}" data-trailer-name="${esc(label)}" aria-expanded="false">▶ Watch trailer</button>
      <a class="text-link" href="https://www.youtube.com/watch?v=${esc(key)}" target="_blank" rel="noopener noreferrer">YouTube</a>
      <a class="text-link" href="#cast/${Number(m.id)}">View full cast</a>
    </div>`;
  }
  const query = encodeURIComponent(
    `${m.title || ""} ${year(m.release_date)} official trailer`.trim(),
  );
  return `<div class="detail-links">
    <a class="trailer-button" href="https://www.youtube.com/results?search_query=${query}" target="_blank" rel="noopener noreferrer">▶ Watch trailer</a>
    <a class="text-link" href="#cast/${Number(m.id)}">View full cast</a>
  </div>`;
}

function renderTrailerEmbed(key, name = "Official Trailer") {
  const safeKey = validYoutubeKey(key);
  if (!safeKey) return "";
  return `<section class="trailer-player" aria-label="Movie trailer">
    <div class="trailer-player-bar">
      <strong>${esc(name)}</strong>
      <div class="trailer-player-actions">
        <a href="https://www.youtube.com/watch?v=${esc(safeKey)}" target="_blank" rel="noopener noreferrer">Open on YouTube</a>
        <button type="button" data-close-trailer>Close</button>
      </div>
    </div>
    <div class="trailer-frame-wrap">
      <iframe
        src="https://www.youtube-nocookie.com/embed/${esc(safeKey)}?autoplay=1&rel=0"
        title="${esc(name)}"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
      ></iframe>
    </div>
  </section>`;
}

async function movie(id) {
  app.innerHTML = '<div class="loading">Loading movie…</div>';
  try {
    const target = `#movie/${id}`;
    const data = await api(`/api/movie/${id}`);
    if (location.hash !== target) return;
    const m = data?.movie;
    if (!m?.id) throw new Error("Movie details are unavailable right now.");
    lastMovieId = String(m.id);
    movieCache.set(String(m.id), m);
    const poster = m.poster_path
      ? `<img class="detail-poster" src="${image(m.poster_path)}" alt="Poster for ${esc(m.title)}">`
      : "";
    const runtimeText = m.runtime
      ? `${Math.floor(m.runtime / 60)}h ${m.runtime % 60}m`
      : "Runtime unknown";
    const genresMarkup = (m.genres || [])
      .map((g) => `<span>${esc(g.name)}</span>`)
      .join("");
    const directorMarkup = data.director
      ? `<a href="#person/${data.director.id}">${esc(data.director.name)}</a>`
      : "Unknown";

    app.innerHTML = `<article class="detail">
      <div>${poster}</div>
      <div>
        <p class="eyebrow">Movie details</p>
        <h1>${esc(m.title)}</h1>
        <p class="detail-meta">${year(m.release_date)} · ${runtimeText} · ★ ${(m.vote_average || 0).toFixed(1)}</p>
        <p class="overview">${esc(m.overview || "No overview available.")}</p>
        <div class="chips">${genresMarkup}</div>
        <p class="detail-meta">Directed by ${directorMarkup}</p>
        ${renderTrailerControls(m, data.trailer)}
      </div>
    </article>
    <div id="trailer-embed-slot"></div>
    <section class="shelf" id="movie-ratings" aria-label="Ratings">
      ${renderRatingsSection(m, null)}
    </section>
    ${shelf("You may also like", "More movies to explore", data.recommendations)}
    ${shelf(data.director ? `More from ${esc(data.director.name)}` : "More from this director", "Other films by this director", data.director_movies)}`;

    const imdbParam = m.imdb_id
      ? `?imdb_id=${encodeURIComponent(m.imdb_id)}`
      : "";
    api(`/api/movie/${encodeURIComponent(m.id)}/ratings${imdbParam}`)
      .then((res) => {
        const ratingsEl = document.querySelector?.("#movie-ratings");
        if (ratingsEl && location.hash === `#movie/${id}`) {
          ratingsEl.innerHTML = renderRatingsSection(m, res.ratings || {});
        }
      })
      .catch(() => {
        const ratingsEl = document.querySelector?.("#movie-ratings");
        if (ratingsEl && location.hash === `#movie/${id}`) {
          ratingsEl.innerHTML = renderRatingsSection(m, {});
        }
      });
  } catch (error) {
    app.innerHTML = `<div class="message error">${esc(error.message)}</div>`;
  }
}

async function cast(id) {
  lastMovieId = String(id);
  const data = await api(`/api/movie/${id}/cast`);
  const castMarkup = data.cast
    .map((person) => {
      const photo = person.profile_path
        ? `<img src="${image(person.profile_path)}" alt="">`
        : '<div class="cast-photo">?</div>';
      return `<a class="cast-card" href="#person/${person.id}">
        ${photo}
        <span>
          <strong>${esc(person.name)}</strong>
          <small>${esc(person.character || "Cast")}</small>
        </span>
      </a>`;
    })
    .join("");

  app.innerHTML = `<a class="back" href="#movie/${id}">Back to movie</a>
  <div class="page-heading">
    <p class="eyebrow">Full cast</p>
    <h1>${esc(data.movie.title)}</h1>
  </div>
  <div class="cast-grid">${castMarkup}</div>`;
}

function filmographySection(title, subtitle, movies) {
  if (!movies?.length) return "";
  return `<section class="shelf">
    <div class="shelf-heading">
      <div>
        <h2>${title}</h2>
        <p>${subtitle} · ${movies.length} ${movies.length === 1 ? "film" : "films"}</p>
      </div>
    </div>
    <div class="movie-grid">${movies.map((m) => card(m)).join("")}</div>
  </section>`;
}

async function person(id) {
  app.innerHTML = '<div class="loading">Loading biography & filmography…</div>';
  try {
    const data = await api(`/api/person/${id}`);
    const p = data.person;
    const directedMovies = data.directed_movies || [];
    const actingMovies = data.acting_movies || [];
    const isDirector =
      p.known_for_department === "Directing" ||
      directedMovies.length >= actingMovies.length;

    const photo = p.profile_path
      ? `<img class="person-photo" src="${image(p.profile_path)}" alt="Photo of ${esc(p.name)}">`
      : '<div class="person-photo no-poster">No photo</div>';
    const backMarkup = lastMovieId
      ? `<a class="back" href="#movie/${esc(lastMovieId)}">Back to movie</a>`
      : "";

    const metaParts = [];
    if (isDirector && directedMovies.length) {
      metaParts.push("Director");
    } else if (actingMovies.length) {
      metaParts.push("Actor");
    }
    if (p.birthday) {
      metaParts.push(
        p.deathday ? `${p.birthday} – ${p.deathday}` : `Born ${p.birthday}`,
      );
    }
    if (p.place_of_birth) {
      metaParts.push(p.place_of_birth);
    }
    const counts = [];
    if (directedMovies.length) counts.push(`${directedMovies.length} directed`);
    if (actingMovies.length) counts.push(`${actingMovies.length} acting`);
    if (counts.length) metaParts.push(counts.join(" · "));

    const directedMarkup = filmographySection(
      "Directed",
      "Films directed by " + esc(p.name),
      directedMovies,
    );
    const actingMarkup = filmographySection(
      "Acting",
      "Acting appearances by " + esc(p.name),
      actingMovies,
    );

    app.innerHTML = `${backMarkup}
    <article class="person">
      <div>${photo}</div>
      <div>
        <p class="eyebrow">${isDirector ? "Director & Filmography" : "Biography & Filmography"}</p>
        <h1>${esc(p.name)}</h1>
        <p class="detail-meta">${esc(metaParts.join(" · "))}</p>
        <p class="overview">${esc(p.biography || "No biography available.")}</p>
      </div>
    </article>
    ${isDirector ? directedMarkup + actingMarkup : actingMarkup + directedMarkup}`;
  } catch (error) {
    app.innerHTML = `<div class="message error">${esc(error.message)}</div>`;
  }
}

async function route() {
  fountainAbort?.abort();
  const [kind, id] = location.hash.slice(1).split("/");
  if (!kind) return home();
  if (kind === "account" || kind === "watchlist") return account();
  if (kind === "trending") return trendingPage();
  if (kind === "letterboxd") return letterboxdPage();
  if (kind === "upcoming") return upcomingPage();
  if (kind === "search") return search(decodeURIComponent(id || ""));
  if (kind === "fountain") return fountainPage();
  if (kind === "movie") return movie(id);
  if (kind === "cast") return cast(id);
  if (kind === "person") return person(id);
  return home();
}

document.querySelector("#search-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const q = new FormData(event.currentTarget).get("q").trim();
  if (q) {
    location.hash = `search/${encodeURIComponent(q)}`;
    search(q);
  }
});

window.addEventListener("hashchange", route);
route();
