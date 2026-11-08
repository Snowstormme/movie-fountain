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
  const actionLabel = `${saved ? t("remove") : t("save")} ${esc(movie.title)} ${saved ? t("from_watchlist") : t("to_watchlist")}`;
  return `<button class="save-movie" type="button" data-save="${movie.id}" aria-pressed="${saved}" aria-label="${actionLabel}">${saved ? t("saved") : t("save")}</button>`;
}

function getCinephileRank(watchedCount) {
  if (watchedCount >= 50) return t("rank_historian");
  if (watchedCount >= 25) return t("rank_auteur");
  if (watchedCount >= 15) return t("rank_scholar");
  if (watchedCount >= 5) return t("rank_cinephile_2");
  if (watchedCount >= 1) return t("rank_cinephile_1");
  return t("rank_enthusiast");
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
      ? t("theme_liquid")
      : t("theme_classic");
  const lastWatchedTitle = watchedMovies.length
    ? watchedMovies[watchedMovies.length - 1].title
    : t("stat_none_yet");

  app.innerHTML = `<section class="account-page">
    <div class="account-hero">
      <div class="account-profile">
        <div class="account-avatar" aria-hidden="true">M</div>
        <div class="account-name-wrap">
          <p class="eyebrow">${t("personal_library")}</p>
          <h1>${t("cinema_passport")}</h1>
          <div class="account-badges">
            <span class="account-rank-badge">★ ${esc(rank)}</span>
            <span class="account-count-badge">${pluralFilms(savedMovies.length)}</span>
          </div>
        </div>
      </div>
      <div class="account-hero-actions">
        <button type="button" class="account-hero-btn" data-lang-toggle aria-label="Toggle language">🌐 ${savedLang === "ru" ? "Русский" : "English"}</button>
        <button type="button" class="account-hero-btn" data-open-style>${t("theme_btn")}: ${theme}</button>
        <button type="button" class="account-hero-btn" id="export-list">${t("export_json")}</button>
        <label class="account-hero-btn account-hero-btn--primary">
          ${t("import_json")}
          <input type="file" id="import-list" accept="application/json,.json" style="display:none">
        </label>
        <a class="account-hero-btn" href="/privacy.html">${t("privacy")}</a>
      </div>
    </div>

    <div class="account-stats-row" aria-label="${t("filter_watchlist")}">
      <div class="account-stat-card">
        <span class="account-stat-label">${t("stat_completion")}</span>
        <strong class="account-stat-value">${completionRate}%</strong>
        <div class="account-progress-track">
          <div class="account-progress-fill" style="width: ${completionRate}%"></div>
        </div>
        <small class="account-stat-sub">${watchedCount} ${t("stat_of")} ${savedMovies.length} ${t("stat_completion_sub")}</small>
      </div>

      <div class="account-stat-card">
        <span class="account-stat-label">${t("stat_watchlist")}</span>
        <strong class="account-stat-value">${savedMovies.length}</strong>
        <small class="account-stat-sub">${toWatchCount} ${t("stat_waiting")}</small>
      </div>

      <div class="account-stat-card">
        <span class="account-stat-label">${t("stat_watched")}</span>
        <strong class="account-stat-value account-stat-value--accent">${watchedCount}</strong>
        <small class="account-stat-sub" title="${esc(lastWatchedTitle)}">${esc(lastWatchedTitle)}</small>
      </div>

      <div class="account-stat-card">
        <span class="account-stat-label">${t("stat_library_score")}</span>
        <strong class="account-stat-value account-stat-value--gold">★ ${average}</strong>
        <small class="account-stat-sub">${t("stat_avg_rating")}</small>
      </div>
    </div>

    <div class="account-shelf-header">
      <div class="account-tabs" role="group" aria-label="${t("filter_watchlist")}">
        <button type="button" data-account-filter="all" class="account-tab">${t("tab_all")} (${savedMovies.length})</button>
        <button type="button" data-account-filter="unwatched" class="account-tab">${t("tab_to_watch")} (${toWatchCount})</button>
        <button type="button" data-account-filter="watched" class="account-tab">${t("tab_watched")} (${watchedCount})</button>
      </div>
      <label class="account-sort">
        ${t("sort_label")}
        <select data-account-sort>
          <option value="saved">${t("sort_saved")}</option>
          <option value="rating">${t("sort_rating")}</option>
          <option value="release">${t("sort_release")}</option>
          <option value="title">${t("sort_title")}</option>
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
      <strong>${t("empty_watchlist")}</strong>
      <span>${t("empty_watchlist_sub")}</span>
      <a class="text-link" href="#fountain">${t("explore_fountain")}</a>
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
  const langToggle = event.target.closest("[data-lang-toggle]");
  if (langToggle?.dataset?.langToggle !== undefined) {
    event.preventDefault?.();
    event.stopPropagation?.();
    setLang(savedLang === "ru" ? "en" : "ru");
    return;
  }

  const styleLink = event.target.closest("[data-open-style]");
  if (styleLink?.dataset?.openStyle !== undefined) {
    event.stopPropagation?.();
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
      trigger.textContent = t("watch_trailer");
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
      trailerBtn.textContent = t("watch_trailer");
    } else {
      slot.innerHTML = renderTrailerEmbed(
        trailerBtn.dataset.trailerKey,
        trailerBtn.dataset.trailerName || t("official_trailer"),
      );
      trailerBtn.setAttribute("aria-expanded", "true");
      trailerBtn.textContent = t("close_trailer");
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
    ? t("saved_status_remove")
    : t("saved_status_add");

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

document.addEventListener("langchange", () => {
  applyLang(savedLang);
  if (location.hash === "#account" || location.hash === "#watchlist") {
    account();
  } else {
    route();
  }
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
  ?.insertAdjacentHTML(
    "beforeend",
    `<a class="fountain-nav" href="#account">${t("nav_account")}</a>`,
  );
applyLang(savedLang);
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
      <span class="save-movie" aria-hidden="true">${saved ? t("saved") : t("save")}</span>
      <div class="movie-actions" aria-hidden="true">
        <button type="button" tabindex="-1">${watched.has(movie.id) ? t("watched") : t("mark_watched")}</button>
        <button type="button" tabindex="-1">${t("share")}</button>
      </div>
    </div>`;
  }

  const isWatched = watched.has(movie.id);
  return `<div class="movie-tile">
    <a class="movie-card" href="#movie/${movie.id}">
      ${poster}
      <strong class="rating-badge">★ ${(movie.vote_average || 0).toFixed(1)}</strong>
      ${isWatched ? `<strong class="watched-badge">${t("watched")}</strong>` : ""}
      <div class="card-copy">
        <h3>${esc(movie.title)}</h3>
        <div class="card-meta"><span>${year(movie.release_date)}</span></div>
      </div>
      <div class="card-preview">
        <p>${esc(movie.overview || t("no_overview"))}</p>
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
      <button class="fountain-settings" type="button" aria-expanded="false" aria-controls="fountain-settings-panel">${t("settings")}</button>
    </div>
    <div class="fountain-settings-panel" id="fountain-settings-panel" hidden>
      <section class="fountain-settings-group">
        <div class="fountain-settings-label"><span>${t("playback")}</span></div>
        <div class="fountain-controls" role="group" aria-label="Fountain controls">
          <button class="fountain-control" type="button" data-speed="slow">${t("speed_slow")}</button>
          <button class="fountain-control is-active" type="button" data-speed="normal">${t("speed_normal")}</button>
          <button class="fountain-control" type="button" data-speed="fast">${t("speed_fast")}</button>
          <button class="fountain-control pause-control" type="button" data-action="pause" aria-pressed="false">${t("pause")}</button>
        </div>
      </section>
      <section class="fountain-settings-group">
        <div class="fountain-settings-label"><span>${t("browse")}</span></div>
        <div class="fountain-filters" role="group" aria-label="Filter the Fountain">
          <button class="fountain-filter is-active" type="button" data-filter="all">${t("all_movies")}</button>
          <button class="fountain-filter" type="button" data-filter="letterboxd">${t("genre_letterboxd")}</button>
          <button class="fountain-filter" type="button" data-filter="action">${t("genre_action")}</button>
          <button class="fountain-filter" type="button" data-filter="comedy">${t("genre_comedy")}</button>
          <button class="fountain-filter" type="button" data-filter="drama">${t("genre_drama")}</button>
          <button class="fountain-filter" type="button" data-filter="horror">${t("genre_horror")}</button>
          <button class="fountain-filter" type="button" data-filter="scifi">${t("genre_scifi")}</button>
          <button class="fountain-filter" type="button" data-filter="animation">${t("genre_animation")}</button>
          <button class="fountain-filter" type="button" data-filter="exciting">${t("mood_exciting")}</button>
          <button class="fountain-filter" type="button" data-filter="dark">${t("mood_dark")}</button>
          <button class="fountain-filter" type="button" data-filter="feelgood">${t("mood_feel_good")}</button>
          <button class="fountain-filter" type="button" data-filter="romantic">${t("mood_romantic")}</button>
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
    pause.textContent = paused ? t("play") : t("pause");
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
  let target = path;
  if (savedLang === "ru" && !path.includes("/ratings")) {
    const sep = path.includes("?") ? "&" : "?";
    target = `${path}${sep}lang=ru`;
  }
  const response = await fetch(target, {
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
      t("shelf_trending_title"),
      t("shelf_trending_sub"),
      takeUnique(data.trending),
      "#trending",
    ),
    shelf(
      t("shelf_letterboxd_title"),
      t("shelf_letterboxd_sub"),
      takeUnique(shuffleList(data.letterboxd_top)),
      "#letterboxd",
    ),
    shelf(
      t("shelf_upcoming_title"),
      t("shelf_upcoming_sub"),
      takeUnique(data.upcoming),
      "#upcoming",
    ),
  ].join("");
}

async function home() {
  app.innerHTML = `<div class="loading">${t("loading_short")}</div>`;
  try {
    const data = await api("/api/home?v=fountain-lb500");
    app.innerHTML = homeShelves(data);
  } catch (error) {
    app.innerHTML = `<div class="message error">${esc(error.message)}</div>`;
  }
}

async function trendingPage() {
  app.innerHTML = `<div class="loading">${t("loading_short")}</div>`;
  try {
    const data = await api("/api/trending");
    const movies = data.results || [];
    const subText = t("page_trending_sub").replace(
      /\{count\}/g,
      String(movies.length),
    );
    app.innerHTML = `<div class="page-heading">
      <p class="eyebrow">${t("chart_weekly")}</p>
      <h1>${t("page_trending_title")}</h1>
      <p class="hero-copy">${esc(subText)}</p>
    </div>
    <div class="movie-grid">${movies.map((m) => card(m)).join("")}</div>`;
  } catch (error) {
    app.innerHTML = `<div class="message error">${esc(error.message)}</div>`;
  }
}

async function letterboxdPage() {
  app.innerHTML = `<div class="loading">${t("loading_short")}</div>`;
  try {
    const data = await api("/api/letterboxd");
    const movies = data.results || [];
    const subText = t("page_letterboxd_sub").replace(
      /\{count\}/g,
      String(movies.length),
    );
    app.innerHTML = `<div class="page-heading">
      <p class="eyebrow">${t("curated_collection")}</p>
      <h1>${t("page_letterboxd_title")}</h1>
      <p class="hero-copy">${esc(subText)}</p>
    </div>
    <div class="movie-grid">${movies.map((m) => card(m)).join("")}</div>`;
  } catch (error) {
    app.innerHTML = `<div class="message error">${esc(error.message)}</div>`;
  }
}

async function upcomingPage() {
  app.innerHTML = `<div class="loading">${t("loading_short")}</div>`;
  try {
    const data = await api("/api/upcoming");
    const movies = data.results || [];
    const subText = t("page_upcoming_sub").replace(
      /\{count\}/g,
      String(movies.length),
    );
    app.innerHTML = `<div class="page-heading">
      <p class="eyebrow">${t("release_calendar")}</p>
      <h1>${t("page_upcoming_title")}</h1>
      <p class="hero-copy">${esc(subText)}</p>
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
  app.innerHTML = `<div class="loading">${t("loading_short")}</div>`;
  try {
    const data = await api(`/api/search?q=${encodeURIComponent(query)}`);
    const people = data.people || [];
    const movies = data.results || [];

    const peopleSection = people.length
      ? `<section class="shelf">
          <div class="shelf-heading">
            <div>
              <h2>${t("search_people_heading")}</h2>
              <p>${t("search_people_sub")}</p>
            </div>
          </div>
          <div class="cast-grid">${people.map(personCard).join("")}</div>
        </section>`
      : "";

    const countLabel =
      movies.length === 1 ? t("result_one") : t("results_count");
    const moviesSection = movies.length
      ? `<section class="shelf">
          <div class="shelf-heading">
            <div>
              <h2>${t("search_movies_heading")}</h2>
              <p>${movies.length} ${countLabel}</p>
            </div>
          </div>
          <div class="movie-grid">${movies.map((m) => card(m)).join("")}</div>
        </section>`
      : "";

    const emptyMessage =
      !people.length && !movies.length
        ? `<div class="message">${t("search_empty")}</div>`
        : "";

    app.innerHTML = `<div class="page-heading">
      <p class="eyebrow">${t("search_heading")}</p>
      <h1>${t("results_for")} “${esc(query)}”</h1>
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
    let tag = t("score_recommended");
    if (fountain.score >= 85) tag = t("score_acclaim");
    else if (fountain.score >= 75) tag = t("score_highly_rated");
    else if (fountain.score >= 60) tag = t("score_favorable");
    else if (fountain.score >= 45) tag = t("score_mixed");
    else tag = t("score_underwhelming");

    const desc = loading
      ? t("consensus_initial")
      : savedLang === "ru"
        ? `Универсальный консенсус рассчитан по ${fountain.sourcesCount} ${fountain.sourcesCount === 1 ? "источнику" : "источникам"} (${fountain.sourcesList}).`
        : `Universal consensus calculated from ${fountain.sourcesCount} ${fountain.sourcesCount === 1 ? "source" : "sources"} (${fountain.sourcesList}).`;

    fountainCard = `<div class="fountain-score-card">
      <div class="fountain-score-badge">
        <span class="fountain-score-num">${fountain.score}</span>
        <span class="fountain-score-max">/ 100</span>
      </div>
      <div class="fountain-score-info">
        <div class="fountain-score-title">
          <span class="fountain-score-label">${t("fountain_score_label")}</span>
          <span class="fountain-score-tag">${tag}</span>
        </div>
        <p class="fountain-score-desc">${esc(desc)}</p>
      </div>
    </div>`;
  }

  return `<div class="shelf-heading">
    <div>
      <h2>${t("ratings_heading")}</h2>
      <p>${t("ratings_sub")}</p>
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
    const label = trailer?.name || t("official_trailer");
    return `<div class="detail-links">
      <button type="button" class="trailer-button" data-trailer-key="${esc(key)}" data-trailer-name="${esc(label)}" aria-expanded="false">${t("watch_trailer")}</button>
      <a class="text-link" href="https://www.youtube.com/watch?v=${esc(key)}" target="_blank" rel="noopener noreferrer">YouTube</a>
      <a class="text-link" href="#cast/${Number(m.id)}">View full cast</a>
    </div>`;
  }
  const query = encodeURIComponent(
    `${m.title || ""} ${year(m.release_date)} official trailer`.trim(),
  );
  return `<div class="detail-links">
    <a class="trailer-button" href="https://www.youtube.com/results?search_query=${query}" target="_blank" rel="noopener noreferrer">${t("watch_trailer")}</a>
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
        <button type="button" data-close-trailer aria-label="${t("close_trailer")}">${t("close_trailer")}</button>
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
  app.innerHTML = `<div class="loading">${t("loading_short")}</div>`;
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
      : t("runtime_unknown");
    const genresMarkup = (m.genres || [])
      .map((g) => `<span>${esc(g.name)}</span>`)
      .join("");
    const directorMarkup = data.director
      ? `<a href="#person/${data.director.id}">${esc(data.director.name)}</a>`
      : "Unknown";
    const originalTitle =
      m.original_title && m.original_title !== m.title
        ? `<p class="original-title">${esc(m.original_title)}</p>`
        : "";

    app.innerHTML = `<article class="detail">
      <div>${poster}</div>
      <div>
        <p class="eyebrow">${t("movie_details")}</p>
        <h1>${esc(m.title)}</h1>
        ${originalTitle}
        <p class="detail-meta">${year(m.release_date)} · ${runtimeText} · ★ ${(m.vote_average || 0).toFixed(1)}</p>
        <p class="overview">${esc(m.overview || t("no_overview"))}</p>
        <div class="chips">${genresMarkup}</div>
        <p class="detail-meta">${t("directed_by")} ${directorMarkup}</p>
        ${renderTrailerControls(m, data.trailer)}
      </div>
    </article>
    <div id="trailer-embed-slot"></div>
    <section class="shelf" id="movie-ratings" aria-label="Ratings">
      ${renderRatingsSection(m, null)}
    </section>
    ${shelf(t("recommendations_title"), t("recommendations_sub"), data.recommendations)}
    ${shelf(data.director ? `${t("more_from_prefix")} ${esc(data.director.name)}` : t("more_from_generic"), t("other_films_director"), data.director_movies)}`;

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
  app.innerHTML = `<div class="loading">${t("loading_short")}</div>`;
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
      ? `<a class="back" href="#movie/${esc(lastMovieId)}">${t("back_to_movie")}</a>`
      : "";

    const metaParts = [];
    if (isDirector && directedMovies.length) {
      metaParts.push(t("role_director"));
    } else if (actingMovies.length) {
      metaParts.push(t("role_actor"));
    }
    if (p.birthday) {
      metaParts.push(
        p.deathday
          ? `${p.birthday} – ${p.deathday}`
          : `${t("born")} ${p.birthday}`,
      );
    }
    if (p.place_of_birth) {
      metaParts.push(p.place_of_birth);
    }
    const counts = [];
    if (directedMovies.length)
      counts.push(`${directedMovies.length} ${t("films_directed")}`);
    if (actingMovies.length)
      counts.push(`${actingMovies.length} ${t("films_acting")}`);
    if (counts.length) metaParts.push(counts.join(" · "));

    const directedMarkup = filmographySection(
      t("directed_heading"),
      t("films_directed_by") + " " + esc(p.name),
      directedMovies,
    );
    const actingMarkup = filmographySection(
      t("acting_heading"),
      t("acting_by") + " " + esc(p.name),
      actingMovies,
    );

    app.innerHTML = `${backMarkup}
    <article class="person">
      <div>${photo}</div>
      <div>
        <p class="eyebrow">${isDirector ? t("director_filmography") : t("biography_filmography")}</p>
        <h1>${esc(p.name)}</h1>
        <p class="detail-meta">${esc(metaParts.join(" · "))}</p>
        <p class="overview">${esc(p.biography || t("no_biography"))}</p>
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
