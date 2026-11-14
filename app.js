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

function safeNumericId(val) {
  if (typeof val === "number" && Number.isFinite(val) && val > 0) {
    return Math.floor(val);
  }
  if (typeof val === "string" && /^\d{1,10}$/.test(val.trim())) {
    const num = Number(val.trim());
    if (num > 0 && Number.isSafeInteger(num)) return num;
  }
  return null;
}

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
        ${renderAvatarHtml("", true)}
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
        <button type="button" class="account-hero-btn ${typeof getGrain === "function" && getGrain() ? "is-active" : ""}" data-toggle-grain aria-pressed="${typeof getGrain === "function" && getGrain()}">${typeof getGrain === "function" && getGrain() ? "● " : "○ "}${t("grain_btn")}</button>
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
        <strong class="account-stat-value account-stat-value--fountain"><span class="rating-badge-icon" aria-hidden="true">⛲</span> ${savedMovies.length ? Math.round(average * 10) : 0}</strong>
        <small class="account-stat-sub">${t("fountain_score_label")}</small>
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

  const grainToggle = event.target.closest("[data-toggle-grain]");
  if (grainToggle?.dataset?.toggleGrain !== undefined) {
    event.stopPropagation?.();
    if (typeof setGrain === "function" && typeof getGrain === "function") {
      setGrain(!getGrain());
      account();
    }
    return;
  }

  const filter = event.target.closest("[data-account-filter]");
  if (filter?.dataset?.accountFilter) {
    accountFilter = filter.dataset.accountFilter;
    refreshAccountMovies();
    return;
  }

  const providerBtn = event.target.closest("[data-provider]");
  if (providerBtn?.dataset?.provider && !providerBtn.classList?.contains?.("is-disabled")) {
    changeStreamingProvider(providerBtn.dataset.provider);
    return;
  }

  const regionTrigger = event.target?.closest?.("[data-streaming-region-trigger]");
  if (regionTrigger?.dataset?.streamingRegionTrigger !== undefined) {
    const menu = document.querySelector?.("#streaming-region-menu");
    if (menu) {
      const isHidden = menu.hidden;
      menu.hidden = !isHidden;
      regionTrigger.setAttribute?.("aria-expanded", String(isHidden));
    }
    return;
  }

  const countryBtn = event.target?.closest?.("[data-set-country]");
  if (countryBtn?.dataset?.setCountry) {
    const menu = document.querySelector?.("#streaming-region-menu");
    if (menu) menu.hidden = true;
    changeStreamingCountry(countryBtn.dataset.setCountry);
    return;
  }

  const streamTab = event.target.closest("[data-stream-tab]");
  if (streamTab?.dataset?.streamTab) {
    changeStreamingFilter(streamTab.dataset.streamTab);
    return;
  }

  const loadMoreBtn = event.target.closest("[data-load-more-streaming]");
  if (loadMoreBtn?.dataset?.loadMoreStreaming !== undefined) {
    loadMoreStreaming();
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
  if (event.target.matches("[data-list-sort]")) {
    currentListSort = event.target.value;
    refreshListMovies();
  }
  if (event.target.matches("[data-streaming-sort]")) {
    currentStreamingSort = event.target.value;
    renderStreamingView();
  }
  if (event.target.matches("[data-streaming-country]")) {
    changeStreamingCountry(event.target.value);
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
    `<a class="fountain-nav account-nav" href="#account"><span class="account-nav-label">${t("nav_account")}</span>${renderAvatarHtml()}</a>`,
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
  const movieId = safeNumericId(movie.id) || 0;
  const loadingAttr = eagerPoster ? "" : ' loading="lazy"';
  const poster = movie.poster_path
    ? `<img src="${image(movie.poster_path)}" alt="Poster for ${esc(movie.title)}"${loadingAttr} decoding="async">`
    : '<div class="no-poster">No poster</div>';

  if (decorative === true) {
    const saved = savedMovies.some((m) => m.id === movie.id);
    return `<div class="movie-tile">
      <a class="movie-card" href="#movie/${movieId}" tabindex="-1">
        ${poster}
        ${renderRatingBadge(movie)}
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
    <a class="movie-card" href="#movie/${movieId}">
      ${poster}
      ${renderRatingBadge(movie)}
      ${isWatched ? `<strong class="watched-badge">${t("watched")}</strong>` : ""}
      <div class="card-copy">
        <h3>${esc(movie.title)}</h3>
        <div class="card-meta">
          <span>${year(movie.release_date)}</span>
          ${movie.original_title && movie.original_title !== movie.title ? `<span class="card-orig-title" title="${esc(movie.original_title)}">${esc(movie.original_title)}</span>` : ""}
        </div>
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
    <div class="movie-grid">${movies
      .slice(0, 6)
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

function filteredMovies(movies, filter, letterboxdMovies = [], imdbMovies = []) {
  if (filter === "all") return movies;
  if (filter === "letterboxd") {
    return letterboxdMovies.length
      ? letterboxdMovies
      : movies.filter((movie) => movie.letterboxd_top);
  }
  if (filter === "imdb") {
    return imdbMovies.length
      ? imdbMovies
      : movies.filter((movie) => movie.imdb_top);
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
          <button class="fountain-filter" type="button" data-filter="imdb">${t("genre_imdb")}</button>
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

function bindFountainControls(movies, letterboxdMovies = [], imdbMovies = []) {
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
          filteredMovies(movies, filter, letterboxdMovies, imdbMovies),
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
      .slice(0, 6);
    items.forEach((movie) => seen.add(movie.id));
    return items;
  };
  const letterboxdMovies = takeUnique(shuffleList(data.letterboxd_top)).map(
    (movie) => ({ ...movie, rating_source: "letterboxd" }),
  );
  const imdbMovies = takeUnique(shuffleList(data.imdb_top)).map((movie) => ({
    ...movie,
    rating_source: "imdb",
  }));

  const shelves = [
    shelf(
      t("shelf_trending_title"),
      t("shelf_trending_sub"),
      takeUnique(data.trending),
      "#trending",
    ),
    shelf(
      `${LETTERBOXD_LOGO_SVG} ${t("shelf_letterboxd_title")}`,
      t("shelf_letterboxd_sub"),
      letterboxdMovies,
      "#letterboxd",
    ),
    shelf(
      `${IMDB_LOGO_SVG} ${t("shelf_imdb_title")}`,
      t("shelf_imdb_sub"),
      imdbMovies,
      "#imdb",
    ),
  ];

  if (Array.isArray(data.editors_choice) && data.editors_choice.length) {
    shelves.push(
      shelf(
        `★ ${t("shelf_editors_choice_title")}`,
        t("shelf_editors_choice_sub"),
        takeUnique(data.editors_choice),
        "#editors-choice",
      ),
    );
  }

  shelves.push(
    shelf(
      t("shelf_upcoming_title"),
      t("shelf_upcoming_sub"),
      takeUnique(data.upcoming),
      "#upcoming",
    ),
  );

  return shelves.join("");
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

let currentListMovies = [];
let currentListSort = "default";

function renderMovieListPage({ eyebrow, title, subText, movies }) {
  currentListMovies = movies || [];
  currentListSort = "default";
  const sorted = sortMovieList(currentListMovies, currentListSort);

  app.innerHTML = `<div class="page-heading">
    <p class="eyebrow">${eyebrow}</p>
    <h1>${title}</h1>
    <p class="hero-copy">${esc(subText)}</p>
    <div class="list-toolbar">
      <div class="list-stats">
        <span class="list-count-badge">${pluralFilms(currentListMovies.length)}</span>
      </div>
      <label class="list-sort">
        <span>${t("sort_label")}:</span>
        <select data-list-sort aria-label="${t("sort_label")}">
          <option value="default">${t("sort_default")}</option>
          <option value="rating_desc">${t("sort_rating_desc")}</option>
          <option value="rating_asc">${t("sort_rating_asc")}</option>
          <option value="year_desc">${t("sort_year_desc")}</option>
          <option value="year_asc">${t("sort_year_asc")}</option>
          <option value="title_asc">${t("sort_title_asc")}</option>
        </select>
      </label>
    </div>
  </div>
  <div class="movie-grid" id="list-movie-grid">${sorted.map((m) => card(m)).join("")}</div>`;
}

function refreshListMovies() {
  const grid = document.querySelector("#list-movie-grid");
  if (!grid) return;
  const sorted = sortMovieList(currentListMovies, currentListSort);
  grid.innerHTML = sorted.map((m) => card(m)).join("");
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
    renderMovieListPage({
      eyebrow: t("chart_weekly"),
      title: t("page_trending_title"),
      subText,
      movies,
    });
  } catch (error) {
    app.innerHTML = `<div class="message error">${esc(error.message)}</div>`;
  }
}

async function letterboxdPage() {
  app.innerHTML = `<div class="loading">${t("loading_short")}</div>`;
  try {
    const data = await api("/api/letterboxd");
    const movies = (data.results || []).map((m) => ({
      ...m,
      rating_source: "letterboxd",
    }));
    const subText = t("page_letterboxd_sub").replace(
      /\{count\}/g,
      String(movies.length),
    );
    renderMovieListPage({
      eyebrow: t("curated_collection"),
      title: `${LETTERBOXD_LOGO_SVG} ${t("page_letterboxd_title")}`,
      subText,
      movies,
    });
  } catch (error) {
    app.innerHTML = `<div class="message error">${esc(error.message)}</div>`;
  }
}

async function imdbPage() {
  app.innerHTML = `<div class="loading">${t("loading_short")}</div>`;
  try {
    const data = await api("/api/imdb");
    const movies = (data.results || []).map((m) => ({
      ...m,
      rating_source: "imdb",
    }));
    const subText = t("page_imdb_sub").replace(
      /\{count\}/g,
      String(movies.length),
    );
    renderMovieListPage({
      eyebrow: t("curated_collection"),
      title: `${IMDB_LOGO_SVG} ${t("page_imdb_title")}`,
      subText,
      movies,
    });
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
    renderMovieListPage({
      eyebrow: t("release_calendar"),
      title: t("page_upcoming_title"),
      subText,
      movies,
    });
  } catch (error) {
    app.innerHTML = `<div class="message error">${esc(error.message)}</div>`;
  }
}

async function editorsChoicePage() {
  const movies =
    typeof getEditorsChoiceMovies === "function"
      ? getEditorsChoiceMovies()
      : [];
  const subText = t("page_editors_choice_sub").replace(
    /\{count\}/g,
    String(movies.length),
  );
  renderMovieListPage({
    eyebrow: t("editors_choice_tag"),
    title: `★ ${t("page_editors_choice_title")}`,
    subText,
    movies,
  });
}

const streamingCountryKey = "movie-fountain.watch_country.v1";

const STREAMING_COUNTRIES = [
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "KR", name: "South Korea", flag: "🇰🇷" },
  { code: "TR", name: "Turkey", flag: "🇹🇷" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "RU", name: "Russia", flag: "🇷🇺" },
];

function getStreamingCountry() {
  try {
    const saved = localStorage.getItem(streamingCountryKey);
    if (saved && /^[A-Z]{2}$/i.test(saved)) return saved.toUpperCase();
  } catch {}
  return detectUserCountry();
}

function setStreamingCountry(code) {
  if (!code || !/^[A-Z]{2}$/i.test(code)) return;
  const upper = code.toUpperCase();
  currentStreamingCountry = upper;
  try {
    localStorage.setItem(streamingCountryKey, upper);
  } catch {}
}

const streamingProviderKey = "movie-fountain.streaming_provider.v1";

const PROVIDER_ALIASES = {
  netflix: "netflix",
  apple: "apple",
  appletv: "apple",
  apple_tv: "apple",
  max: "max",
  hbo: "max",
  hbomax: "max",
  hbo_max: "max",
  prime: "prime",
  amazon: "prime",
  primevideo: "prime",
  amazonprime: "prime",
  amazon_prime: "prime",
  hulu: "hulu",
  hulutv: "hulu",
  hulu_tv: "hulu",
  disney: "disney",
  disneyplus: "disney",
  disney_plus: "disney",
  "disney+": "disney",
  dplus: "disney",
  paramount: "paramount",
  paramountplus: "paramount",
  paramount_plus: "paramount",
  "paramount+": "paramount",
  pplus: "paramount",
  googletv: "googletv",
  google: "googletv",
  google_tv: "googletv",
  "google-tv": "googletv",
  googleplay: "googletv",
  google_play: "googletv",
  googleplaymovies: "googletv",
  gtv: "googletv",
  mubi: "mubi",
  mubigo: "mubi",
  mubi_go: "mubi",
  "mubi-go": "mubi",
  mubitv: "mubi",
  mubi_tv: "mubi",
  peacock: "peacock",
  peacocktv: "peacock",
  peacock_tv: "peacock",
  "peacock-tv": "peacock",
  peacockpremium: "peacock",
  peacock_premium: "peacock",
  nbcpeacock: "peacock",
  nbc_peacock: "peacock",
  crunchyroll: "crunchyroll",
  crunchy: "crunchyroll",
  crunchyrolltv: "crunchyroll",
  crunchyroll_tv: "crunchyroll",
  "crunchyroll-tv": "crunchyroll",
  crunchyrollchannel: "crunchyroll",
  crunchyroll_channel: "crunchyroll",
  cr: "crunchyroll",
  okko: "okko",
  okkotv: "okko",
  okko_tv: "okko",
  okkomovies: "okko",
  kinopoisk: "kinopoisk",
  kp: "kinopoisk",
  kino: "kinopoisk",
  kinopoiskhd: "kinopoisk",
  kinopoisk_hd: "kinopoisk"
};

function normalizeStreamingProvider(raw) {
  if (typeof raw !== "string") return null;
  return PROVIDER_ALIASES[raw.trim().toLowerCase()] || null;
}

function getStreamingProvider() {
  try {
    return normalizeStreamingProvider(localStorage.getItem(streamingProviderKey)) || "netflix";
  } catch {}
  return "netflix";
}

function setStreamingProvider(provider) {
  const norm = normalizeStreamingProvider(provider);
  if (!norm) return;
  currentStreamingProvider = norm;
  try {
    localStorage.setItem(streamingProviderKey, norm);
  } catch {}
}

function isStreamingHash() {
  const hash = location.hash;
  if (hash.startsWith("#streaming")) return true;
  const [prefix] = hash.slice(1).split("/");
  return Boolean(normalizeStreamingProvider(prefix));
}

let currentStreamingProvider = getStreamingProvider();
let currentStreamingFilter = "all";
let currentStreamingSort = "default";
let currentStreamingCountry = getStreamingCountry();
let currentStreamingPage = 1;
let streamingTotalPages = 1;
let streamingTotalResults = 0;
let streamingItems = [];
let isLoadingMoreStreaming = false;

async function streamingPage(subFilter = "all", providerOverride = null) {
  fountainAbort?.abort();
  if (typeof window !== "undefined" && typeof window.scrollTo === "function") {
    window.scrollTo(0, 0);
  }
  app.innerHTML = `<div class="loading">${t("loading_short")}</div>`;
  currentStreamingFilter = subFilter || "all";
  currentStreamingSort = "default";
  currentStreamingPage = 1;
  const normOverride = normalizeStreamingProvider(providerOverride);
  if (normOverride) {
    currentStreamingProvider = normOverride;
    try {
      localStorage.setItem(streamingProviderKey, normOverride);
    } catch {}
  }

  try {
    const params = new URLSearchParams({
      provider: currentStreamingProvider,
      country: currentStreamingCountry,
      type: currentStreamingFilter,
      page: "1"
    });
    const data = await api(`/api/streaming?${params}`);
    if (!isStreamingHash()) return;
    streamingItems = Array.isArray(data.results) ? data.results : [];
    streamingTotalPages = Number(data.total_pages) || 1;
    streamingTotalResults = Number(data.total_results) || streamingItems.length;
    renderStreamingView();
  } catch (error) {
    app.innerHTML = `<div class="message error">${esc(error.message)}</div>`;
  }
}

async function changeStreamingProvider(provider) {
  if (!provider || provider === currentStreamingProvider) return;
  setStreamingProvider(provider);
  currentStreamingPage = 1;
  await fetchAndRenderStreaming();
}

async function changeStreamingFilter(tab) {
  if (currentStreamingFilter === tab) return;
  currentStreamingFilter = tab;
  currentStreamingPage = 1;
  await fetchAndRenderStreaming();
}

async function changeStreamingCountry(code) {
  if (!code || code === currentStreamingCountry) return;
  setStreamingCountry(code);
  currentStreamingPage = 1;
  await fetchAndRenderStreaming();
}

async function fetchAndRenderStreaming() {
  const grid = document.getElementById("streaming-movie-grid");
  const loadMoreSlot = document.getElementById("streaming-load-more-container");
  if (grid) {
    grid.innerHTML = `<div class="loading" style="grid-column: 1 / -1; padding: 48px 0;">${t("loading_short")}</div>`;
  }
  if (loadMoreSlot) loadMoreSlot.innerHTML = "";

  try {
    const params = new URLSearchParams({
      provider: currentStreamingProvider,
      country: currentStreamingCountry,
      type: currentStreamingFilter,
      page: "1"
    });
    const data = await api(`/api/streaming?${params}`);
    if (!isStreamingHash()) return;
    streamingItems = Array.isArray(data.results) ? data.results : [];
    streamingTotalPages = Number(data.total_pages) || 1;
    streamingTotalResults = Number(data.total_results) || streamingItems.length;
    renderStreamingView();
  } catch (error) {
    if (grid) {
      grid.innerHTML = `<div class="message error" style="grid-column: 1 / -1;">${esc(error.message)}</div>`;
    }
  }
}

async function loadMoreStreaming() {
  if (isLoadingMoreStreaming || currentStreamingPage >= streamingTotalPages) return;
  isLoadingMoreStreaming = true;

  const btn = document.querySelector("[data-load-more-streaming]");
  if (btn) {
    btn.disabled = true;
    btn.classList.add("is-loading");
    const label = btn.querySelector(".load-more-text");
    if (label) label.textContent = t("loading_more");
  }

  const nextPage = currentStreamingPage + 1;
  try {
    const params = new URLSearchParams({
      provider: currentStreamingProvider,
      country: currentStreamingCountry,
      type: currentStreamingFilter,
      page: String(nextPage)
    });
    const data = await api(`/api/streaming?${params}`);
    if (!isStreamingHash()) return;

    const newItems = Array.isArray(data.results) ? data.results : [];
    currentStreamingPage = nextPage;
    streamingTotalPages = Number(data.total_pages) || streamingTotalPages;
    if (data.total_results) streamingTotalResults = Number(data.total_results);

    // Deduplicate against existing items
    const existingIds = new Set(streamingItems.map((m) => m.id));
    const uniqueNew = newItems.filter((m) => !existingIds.has(m.id));
    streamingItems = [...streamingItems, ...uniqueNew];

    const grid = document.getElementById("streaming-movie-grid");
    if (grid && uniqueNew.length > 0) {
      const fragment = document.createDocumentFragment();
      for (const item of uniqueNew) {
        const temp = document.createElement("div");
        temp.innerHTML = streamingCard(item);
        if (temp.firstElementChild) {
          fragment.appendChild(temp.firstElementChild);
        }
      }
      grid.appendChild(fragment);
    }

    updateStreamingCountAndLoadMoreUI();
  } catch (err) {
    if (btn) {
      btn.disabled = false;
      btn.classList.remove("is-loading");
      const label = btn.querySelector(".load-more-text");
      if (label) label.textContent = t("load_more_titles");
    }
  } finally {
    isLoadingMoreStreaming = false;
  }
}

function updateStreamingCountAndLoadMoreUI() {
  const countEl = document.getElementById("streaming-count-display");
  if (countEl) {
    countEl.textContent = renderStreamingCountText(
      streamingItems.length,
      streamingTotalResults,
      currentStreamingCountry,
      currentStreamingProvider
    );
  }
  const spotlightCountEl = document.querySelector(".streaming-provider.is-active .provider-spotlight-count");
  if (spotlightCountEl) {
    const num = Number(streamingTotalResults || streamingItems.length) || 0;
    spotlightCountEl.textContent = `${num.toLocaleString()} →`;
  }
  const loadMoreSlot = document.getElementById("streaming-load-more-container");
  if (loadMoreSlot) {
    loadMoreSlot.innerHTML = renderStreamingLoadMoreButton();
  }
}

function renderProviderSpotlightDetails(subKey, countryName, countryCode, totalCount) {
  const num = Number(totalCount) > 0 ? Number(totalCount).toLocaleString() : "0";
  return `<span class="provider-spotlight-sub">${t(subKey)}</span><span class="provider-spotlight-footer"><span class="provider-spotlight-region">${esc(countryName)} · ${esc(countryCode)}</span><span class="provider-spotlight-count">${num} →</span></span>`;
}

function renderStreamingCountText(currentCount, totalCount, countryCode, provider) {
  let providerName = t("provider_netflix") || "Netflix";
  if (provider === "apple") {
    providerName = t("provider_apple") || "Apple TV";
  } else if (provider === "max" || provider === "hbo") {
    providerName = t("provider_max") || "HBO Max";
  } else if (provider === "prime" || provider === "amazon") {
    providerName = t("provider_prime") || "Prime Video";
  } else if (provider === "hulu") {
    providerName = t("provider_hulu") || "Hulu";
  } else if (provider === "disney" || provider === "disneyplus") {
    providerName = t("provider_disney") || "Disney+";
  } else if (provider === "paramount" || provider === "paramountplus") {
    providerName = t("provider_paramount") || "Paramount+";
  } else if (provider === "googletv" || provider === "google") {
    providerName = t("provider_googletv") || "Google TV";
  } else if (provider === "mubi") {
    providerName = t("provider_mubi") || "MUBI";
  } else if (provider === "peacock") {
    providerName = t("provider_peacock") || "Peacock";
  } else if (provider === "crunchyroll") {
    providerName = t("provider_crunchyroll") || "Crunchyroll";
  } else if (provider === "okko") {
    providerName = t("provider_okko") || "Okko";
  } else if (provider === "kinopoisk" || provider === "kp") {
    providerName = t("provider_kinopoisk") || "Kinopoisk";
  }
  const formattedTotal = Number(totalCount) > currentCount ? Number(totalCount).toLocaleString() : null;
  if (formattedTotal) {
    return t("stream_count_total")
      .replace(/\{count\}/g, String(currentCount))
      .replace(/\{total\}/g, formattedTotal)
      .replace(/\{provider\}/g, providerName)
      .replace(/\{country\}/g, countryCode);
  }
  return t("stream_count")
    .replace(/\{count\}/g, String(currentCount))
    .replace(/\{provider\}/g, providerName);
}

function renderStreamingLoadMoreButton() {
  if (currentStreamingPage >= streamingTotalPages) {
    if (streamingItems.length > 0) {
      return `<p class="streaming-end-note">✓ ${t("all_titles_loaded")}</p>`;
    }
    return "";
  }
  return `
    <button type="button" class="btn btn-primary streaming-load-more-btn" data-load-more-streaming>
      <span class="load-more-spinner" aria-hidden="true"></span>
      <span class="load-more-text">${t("load_more_titles")}</span>
      <span class="load-more-count">(${streamingItems.length} / ${streamingTotalResults ? streamingTotalResults.toLocaleString() : "…"})</span>
    </button>
  `;
}

function renderStreamingView() {
  const filtered = streamingItems.filter((item) => {
    if (currentStreamingFilter === "movie") return item.media_type === "movie";
    if (currentStreamingFilter === "tv") return item.media_type === "tv";
    if (currentStreamingFilter === "top") return (item.vote_average || 0) >= 7.8;
    return true;
  });

  const sorted = sortMovieList(filtered, currentStreamingSort);
  const currentCountryObj = STREAMING_COUNTRIES.find((c) => c.code === currentStreamingCountry) || STREAMING_COUNTRIES[0];
  const currentCountryName = t("country_" + currentCountryObj.code.toLowerCase()) || currentCountryObj.name;
  const spotlightTotal = streamingTotalResults || sorted.length;

  app.innerHTML = `
    <div class="page-heading streaming-heading" data-active-provider="${currentStreamingProvider}">
      <div class="streaming-ambient-glow" aria-hidden="true"></div>

      <!-- Provider Selector -->
      <div class="streaming-providers" role="tablist" aria-label="Streaming Providers">
        <!-- Netflix -->
        <button type="button" class="streaming-provider streaming-provider--netflix ${currentStreamingProvider === "netflix" ? "is-active" : ""}" data-provider="netflix" role="tab" aria-selected="${currentStreamingProvider === "netflix"}">
          <span class="provider-icon provider-icon--netflix" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path fill="#b81d24" d="M4.5 0h4.8v24H4.5z"/>
              <path fill="#b81d24" d="M14.7 0h4.8v24h-4.8z"/>
              <path fill="#e50914" d="M4.5 0h4.8l10.2 24h-4.8z" style="filter:drop-shadow(-2px 0 2px rgba(0,0,0,0.5));"/>
            </svg>
          </span>
          <div class="provider-meta">
            <div class="provider-name-row">
              <strong>${t("provider_netflix")}</strong>
              ${currentStreamingProvider === "netflix" ? `<span class="provider-status-badge provider-status-badge--netflix">${t("provider_active")}</span>` : `<span class="provider-status-badge provider-status-badge--ready">READY</span>`}
            </div>
            ${renderProviderSpotlightDetails("provider_netflix_sub", currentCountryName, currentStreamingCountry, spotlightTotal)}
          </div>
          <span class="provider-accent-rail" aria-hidden="true"></span>
        </button>

        <!-- Apple TV -->
        <button type="button" class="streaming-provider streaming-provider--apple ${currentStreamingProvider === "apple" ? "is-active" : ""}" data-provider="apple" role="tab" aria-selected="${currentStreamingProvider === "apple"}">
          <span class="provider-icon provider-icon--apple" aria-hidden="true">
            <svg viewBox="0 0 35 17" width="30" height="15" fill="currentColor" aria-hidden="true">
              <!-- Apple silhouette -->
              <path d="M14.7 15.3c-.7 1-1.3 1.9-2.4 1.9-1 0-1.4-.6-2.6-.6-1.2 0-1.6.6-2.6.6-1 0-1.8-1-2.5-2C3.3 13.3 2.3 9.7 3.7 7.3c.7-1.2 1.9-2 3.3-2 1 0 2 .7 2.6.7.6 0 1.8-.8 3-.7.5 0 2 .2 2.9 1.5-.1.1-1.7 1-1.7 3 0 2.4 2.1 3.2 2.1 3.3-.1.1-.3 1.1-1.2 2.2zM12.5 4.9c.5-.6.9-1.5.8-2.3-.8 0-1.7.5-2.2 1.1-.4.5-.8 1.4-.7 2.2.9.1 1.7-.4 2.1-1z"/>
              <!-- t -->
              <path d="M19.4 4.8v2.6h-1.6v2.1h1.6v4.6c0 1.8.8 2.5 2.5 2.5h1.2v-2h-.7c-.9 0-1.2-.3-1.2-1v-4.1h2.2V7.4h-2.2V4.8h-1.8z"/>
              <!-- v -->
              <path d="M25 7.4l2.8 9.2h2.2l2.8-9.2h-2.3l-1.6 6.3-1.6-6.3H25z"/>
            </svg>
          </span>
          <div class="provider-meta">
            <div class="provider-name-row">
              <strong>${t("provider_apple")}</strong>
              ${currentStreamingProvider === "apple" ? `<span class="provider-status-badge provider-status-badge--apple">${t("provider_active")}</span>` : `<span class="provider-status-badge provider-status-badge--ready">READY</span>`}
            </div>
            ${renderProviderSpotlightDetails("provider_apple_sub", currentCountryName, currentStreamingCountry, spotlightTotal)}
          </div>
          <span class="provider-accent-rail" aria-hidden="true"></span>
        </button>

        <!-- HBO Max -->
        <button type="button" class="streaming-provider streaming-provider--max ${currentStreamingProvider === "max" ? "is-active" : ""}" data-provider="max" role="tab" aria-selected="${currentStreamingProvider === "max"}">
          <span class="provider-icon provider-icon--max" aria-hidden="true">
            <svg viewBox="0 0 50 30" width="28" height="17" aria-hidden="true">
              <path fill="#ffffff" d="M1 1h4.6v6.6h5.2V1h4.6v16h-4.6v-6.1H5.6V17H1V1z"/>
              <path fill="#ffffff" fill-rule="evenodd" d="M17.4 1h7.6c3.2 0 5.3 1.5 5.3 4.1 0 1.7-.9 2.9-2.4 3.5 1.9.6 2.9 1.9 2.9 3.9 0 2.9-2.2 4.5-5.6 4.5h-7.8V1zm4.4 3.3v3h2.6c1 0 1.6-.6 1.6-1.5s-.6-1.5-1.6-1.5h-2.6zm0 6.1v3.3h2.9c1.2 0 1.8-.6 1.8-1.6 0-1.1-.7-1.7-1.9-1.7h-2.8z"/>
              <path fill="#ffffff" fill-rule="evenodd" d="M40.3.7c4.9 0 8.5 3.6 8.5 8.3s-3.6 8.3-8.5 8.3-8.5-3.6-8.5-8.3S35.4.7 40.3.7zm0 4.1c-2.3 0-4 1.8-4 4.2s1.7 4.2 4 4.2 4-1.8 4-4.2-1.7-4.2-4-4.2z"/>
              <circle cx="40.3" cy="9" r="2.2" fill="#ffffff"/>
              <path fill="#e2d9ff" d="M7.5 21.5h2.2v1c.5-.8 1.2-1.2 2.2-1.2 1 0 1.8.4 2.2 1.2.5-.8 1.4-1.2 2.4-1.2 1.6 0 2.7 1.1 2.7 2.8V29h-2.3v-4.4c0-.9-.5-1.5-1.3-1.5-.8 0-1.4.6-1.4 1.5V29h-2.2v-4.4c0-.9-.5-1.5-1.3-1.5-.8 0-1.4.6-1.4 1.5V29H7.5v-7.5zm14.3 3.7c0-2.3 1.7-3.9 3.8-3.9 1.1 0 2 .5 2.5 1.3v-1.1h2.2V29h-2.2v-1.1c-.6.8-1.4 1.3-2.5 1.3-2.1 0-3.8-1.6-3.8-4zm2.2 0c0 1.1.8 2 1.9 2s2-.8 2-2-.8-2-2-2-1.9.8-1.9 2zm8.4-3.7H35l1.8 2.5 1.8-2.5h2.5l-2.9 3.7 3.1 3.8h-2.6l-2-2.6-2 2.6h-2.5l3.1-3.8-2.9-3.7z"/>
            </svg>
          </span>
          <div class="provider-meta">
            <div class="provider-name-row">
              <strong>${t("provider_max")}</strong>
              ${currentStreamingProvider === "max" ? `<span class="provider-status-badge provider-status-badge--max">${t("provider_active")}</span>` : `<span class="provider-status-badge provider-status-badge--ready">READY</span>`}
            </div>
            ${renderProviderSpotlightDetails("provider_max_sub", currentCountryName, currentStreamingCountry, spotlightTotal)}
          </div>
          <span class="provider-accent-rail" aria-hidden="true"></span>
        </button>

        <!-- Prime Video -->
        <button type="button" class="streaming-provider streaming-provider--prime ${currentStreamingProvider === "prime" ? "is-active" : ""}" data-provider="prime" role="tab" aria-selected="${currentStreamingProvider === "prime"}">
          <span class="provider-icon provider-icon--prime" aria-hidden="true">
            <svg viewBox="0 0 54 22" width="34" height="15" aria-hidden="true">
              <path fill="#ffffff" d="M3 4.2h2.5v1.8c.6-1.3 1.9-2 3.3-2 2.5 0 4.1 1.8 4.1 4.6 0 2.8-1.7 4.6-4.1 4.6-1.4 0-2.7-.7-3.3-2v5.4H3V4.2zm2.5 4.4c0 1.6 1 2.6 2.3 2.6 1.3 0 2.4-1 2.4-2.6s-1-2.6-2.4-2.6c-1.3 0-2.3 1-2.3 2.6zM14.2 4.2h2.5v1.9c.5-1.3 1.7-2.1 3-2.1h.8v2.7h-1.1c-1.6 0-2.7 1-2.7 2.8v3.7h-2.5V4.2zM22 4.2h2.5v9h-2.5v-9zm0-4h2.5v2.5H22V.2zM26 4.2h2.5v1.6c.5-1.1 1.6-1.8 2.8-1.8 1.3 0 2.2.6 2.6 1.8.6-1.1 1.8-1.8 3-1.8 1.9 0 3.3 1.4 3.3 3.6v5.6h-2.5V7.7c0-1.2-.6-1.9-1.6-1.9s-1.8.7-1.8 1.9v5.5h-2.5V7.7c0-1.2-.6-1.9-1.6-1.9s-1.8.7-1.8 1.9v5.5H26V4.2zM41.8 9h6.2c-.2-2.8-1.7-5-4.4-5-2.8 0-4.6 2-4.6 4.6 0 2.7 1.8 4.7 4.7 4.7 1.8 0 3.3-.8 4-2.1l-1.8-1.1c-.5.7-1.3 1.1-2.2 1.1-1.3 0-2.2-.7-2.3-2.3zm-.1-1.8c.2-1.1 1-1.8 2.1-1.8 1 0 1.8.7 2 1.8h-4.1z"/>
              <path fill="#00a8e1" d="M3.8 16.2c7 3.6 20.8 4 29.8-1.2l-1-.9c2.3.2 4.4.4 6-.2-.8 1.3-1.9 2.8-2.6 4.3l-1-.9c-8.6 4.8-22 4.4-28.5-1l-2.7-.1z"/>
            </svg>
          </span>
          <div class="provider-meta">
            <div class="provider-name-row">
              <strong>${t("provider_prime")}</strong>
              ${currentStreamingProvider === "prime" ? `<span class="provider-status-badge provider-status-badge--prime">${t("provider_active")}</span>` : `<span class="provider-status-badge provider-status-badge--ready">READY</span>`}
            </div>
            ${renderProviderSpotlightDetails("provider_prime_sub", currentCountryName, currentStreamingCountry, spotlightTotal)}
          </div>
          <span class="provider-accent-rail" aria-hidden="true"></span>
        </button>

        <!-- Hulu -->
        <button type="button" class="streaming-provider streaming-provider--hulu ${currentStreamingProvider === "hulu" ? "is-active" : ""}" data-provider="hulu" role="tab" aria-selected="${currentStreamingProvider === "hulu"}">
          <span class="provider-icon provider-icon--hulu" aria-hidden="true">
            <svg viewBox="0 0 57 20" width="28" height="10" aria-hidden="true">
              <g fill="#1ce783">
                <path d="M2 2h4.4v6.2c.9-1.1 2.2-1.7 3.9-1.7 3 0 4.9 1.9 4.9 5v6.5h-4.4v-5.7c0-1.5-.8-2.3-2-2.3-1.4 0-2.4.9-2.4 2.4V18H2V2z"/>
                <path d="M18.2 7h4.4v5.7c0 1.5.8 2.3 2 2.3 1.3 0 2.2-.9 2.2-2.4V7h4.4v11h-4.2v-1.4c-.9 1.1-2.2 1.7-3.8 1.7-3 0-5-1.9-5-5V7z"/>
                <path d="M34.2 2h4.4v16h-4.4V2z"/>
                <path d="M41.6 7H46v5.7c0 1.5.8 2.3 2 2.3 1.3 0 2.2-.9 2.2-2.4V7h4.4v11h-4.2v-1.4c-.9 1.1-2.2 1.7-3.8 1.7-3 0-5-1.9-5-5V7z"/>
              </g>
            </svg>
          </span>
          <div class="provider-meta">
            <div class="provider-name-row">
              <strong>${t("provider_hulu")}</strong>
              ${currentStreamingProvider === "hulu" ? `<span class="provider-status-badge provider-status-badge--hulu">${t("provider_active")}</span>` : `<span class="provider-status-badge provider-status-badge--ready">READY</span>`}
            </div>
            ${renderProviderSpotlightDetails("provider_hulu_sub", currentCountryName, currentStreamingCountry, spotlightTotal)}
          </div>
          <span class="provider-accent-rail" aria-hidden="true"></span>
        </button>

        <!-- Disney+ -->
        <button type="button" class="streaming-provider streaming-provider--disney ${currentStreamingProvider === "disney" ? "is-active" : ""}" data-provider="disney" role="tab" aria-selected="${currentStreamingProvider === "disney"}">
          <span class="provider-icon provider-icon--disney" aria-hidden="true">
            <svg viewBox="0 0 1041 565" width="32" height="18" aria-hidden="true">
              <defs>
                <radialGradient id="disneyArcCard" gradientUnits="userSpaceOnUse" cx="942.524" cy="279.896" r="760.124">
                  <stop offset="0.01" stop-color="#67e8f9" stop-opacity="1"/>
                  <stop offset="0.18" stop-color="#22d3ee" stop-opacity="1"/>
                  <stop offset="0.45" stop-color="#38bdf8" stop-opacity="0.7"/>
                  <stop offset="1" stop-color="#0ea5e9" stop-opacity="0"/>
                </radialGradient>
              </defs>
              <path d="M735.8 365.7 C721.4 369 683.5 370.9 683.5 370.9 L678.7 385.9 C678.7 385.9 697.6 384.3 711.4 385.7 711.4 385.7 715.9 385.2 716.4 390.8 716.6 396 716 401.6 716 401.6 716 401.6 715.7 405 710.9 405.8 705.7 406.7 670.1 408 670.1 408 L664.3 427.5 C664.3 427.5 662.2 432 667 430.7 671.5 429.5 708.8 422.5 713.7 423.5 718.9 424.8 724.7 431.7 723 438.1 721 445.9 683.8 469.7 661.1 468 661.1 468 649.2 468.8 639.1 452.7 629.7 437.4 642.7 408.3 642.7 408.3 642.7 408.3 636.8 394.7 641.1 390.2 641.1 390.2 643.7 387.9 651.1 387.3 L660.2 368.4 C660.2 368.4 649.8 369.1 643.6 361.5 637.8 354.2 637.4 350.9 641.8 348.9 646.5 346.6 689.8 338.7 719.6 339.7 719.6 339.7 730 338.7 738.9 356.7 738.8 356.7 743.2 364 735.8 365.7 Z M623.7 438.3 C619.9 447.3 609.8 456.9 597.3 450.9 584.9 444.9 565.2 404.6 565.2 404.6 565.2 404.6 557.7 389.6 556.3 389.9 556.3 389.9 554.7 387 553.7 403.4 552.7 419.8 553.9 451.7 547.4 456.7 541.2 461.7 533.7 459.7 529.8 453.8 526.3 448 524.8 434.2 526.7 410 529 385.8 534.6 360 541.8 351.9 549 343.9 554.8 349.7 557 351.8 557 351.8 566.6 360.5 582.5 386.1 L585.3 390.8 C585.3 390.8 599.7 415 601.2 414.9 601.2 414.9 602.4 416 603.4 415.2 604.9 414.8 604.3 407 604.3 407 604.3 407 601.3 380.7 588.2 336.1 588.2 336.1 586.2 330.5 587.6 325.3 588.9 320 594.2 322.5 594.2 322.5 594.2 322.5 614.6 332.7 624.4 365.9 634.1 399.4 627.5 429.3 623.7 438.3 Z M523.5 353 C521.8 356.4 520.8 361.3 512.2 362.6 512.2 362.6 429.9 368.2 426 374 426 374 423.1 377.4 427.6 378.4 432.1 379.3 450.7 381.8 459.7 382.3 469.3 382.4 501.7 382.7 513.3 397.2 513.3 397.2 520.2 404.1 519.9 419.7 519.6 435.7 516.8 441.3 510.6 447.1 504.1 452.5 448.3 477.5 412.3 439.1 412.3 439.1 395.7 420.6 418 406.6 418 406.6 434.1 396.9 475 408.3 475 408.3 487.4 412.8 486.8 417.3 486.1 422.1 476.6 427.2 462.8 426.9 449.4 426.5 439.6 420.1 441.5 421.1 443.3 421.8 427.1 413.3 422.1 419.1 417.1 424.4 418.3 427.7 423.2 431 435.7 438.1 484 435.6 498.4 419.6 498.4 419.6 504.1 413.1 495.4 407.8 486.7 402.8 461.8 399.8 452.1 399.3 442.8 398.8 408.2 399.4 403.2 390.2 403.2 390.2 398.2 384 403.7 366.4 409.5 348 449.8 340.9 467.2 339.3 467.2 339.3 515.1 337.6 523.9 347.4 523.8 347.4 525 349.7 523.5 353 Z M387.5 460.9 C381.7 465.2 369.4 463.3 365.9 458.5 362.4 454.2 361.2 437.1 361.9 410.3 362.6 383.2 363.2 349.6 369 344.3 375.2 338.9 379 343.6 381.4 347.3 384 350.9 387.1 354.9 387.8 363.4 388.4 371.9 390.4 416.5 390.4 416.5 390.4 416.5 393 456.7 387.5 460.9 Z M400 317.1 C383.1 322.7 371.5 320.8 361.7 316.6 357.4 324.1 354.9 326.4 351.6 326.9 346.8 327.4 342.5 319.7 341.7 317.2 340.9 315.3 338.6 312.1 341.4 304.5 331.8 295.9 331.1 284.3 332.7 276.5 335.1 267.5 351.3 233.3 400.6 229.3 400.6 229.3 424.7 227.5 428.8 240.4 L429.5 240.4 C429.5 240.4 452.9 240.5 452.4 261.3 452.1 282.2 426.4 308.2 400 317.1 Z M354 270.8 C349 278.8 348.8 283.6 351.1 286.9 356.8 278.2 367.2 264.5 382.5 254.1 370.7 255.1 360.8 260.2 354 270.8 Z M422.1 257.4 C406.6 259.7 382.6 280.5 371.2 297.5 388.7 300.7 419.6 299.5 433.3 271.6 433.2 271.6 439.8 254.3 422.1 257.4 Z M842.9 418.5 C833.6 434.7 807.5 468.5 772.7 460.6 761.2 488.5 751.6 516.6 746.1 558.8 746.1 558.8 744.9 567 738.1 564.1 731.4 561.7 720.2 550.5 718 535 715.6 514.6 724.7 480.1 743.2 440.6 737.8 431.8 734.1 419.2 737.3 401.3 737.3 401.3 742 368.1 775.3 338.1 775.3 338.1 779.3 334.6 781.6 335.7 784.2 336.8 783 347.6 780.9 352.8 778.8 358 763.9 383.8 763.9 383.8 763.9 383.8 754.6 401.2 757.2 414.9 774.7 388 814.5 333.7 839.2 350.8 847.5 356.7 851.3 369.6 851.3 383.5 851.2 395.8 848.3 408.8 842.9 418.5 Z M835.7 375.9 C835.7 375.9 834.3 365.2 823.9 377 814.9 386.9 798.7 405.6 785.6 430.9 799.3 429.4 812.5 421.9 816.5 418.1 823 412.3 838.1 396.7 835.7 375.9 Z M350.2 389.5 C348.3 413.7 339 454.4 273.1 474.5 229.6 487.6 188.5 481.3 166.1 475.6 165.6 484.5 164.6 488.3 163.2 489.8 161.3 491.7 147.1 499.9 139.3 488.3 135.8 482.8 134 472.8 133 463.9 82.6 440.7 59.4 407.3 58.5 405.8 57.4 404.7 45.9 392.7 57.4 378 68.2 364.7 103.5 351.4 135.3 346 136.4 318.8 139.6 298.3 143.4 288.9 148 278 153.8 287.8 158.8 295.2 163 300.7 165.5 324.4 165.7 343.3 186.5 342.3 198.8 343.8 222 348 252.2 353.5 272.4 368.9 270.6 386.4 269.3 403.6 253.5 410.7 247.5 411.2 241.2 411.7 231.4 407.2 231.4 407.2 224.7 404 230.9 401.2 239 397.7 247.8 393.4 245.8 389 245.8 389 242.5 379.4 203.3 372.7 164.3 372.7 164.1 394.2 165.2 429.9 165.7 450.7 193 455.9 213.4 454.9 213.4 454.9 213.4 454.9 313 452.1 316 388.5 319.1 324.8 216.7 263.7 141 244.3 65.4 224.5 22.6 238.3 18.9 240.2 14.9 242.2 18.6 242.8 18.6 242.8 18.6 242.8 22.7 243.4 29.8 245.8 37.3 248.2 31.5 252.1 31.5 252.1 18.6 256.2 4.1 253.6 1.3 247.7 -1.5 241.8 3.2 236.5 8.6 228.9 14 220.9 19.9 221.2 19.9 221.2 113.4 188.8 227.3 247.4 227.3 247.4 334 301.5 352.2 364.9 350.2 389.5 Z M68 386.2 C57.4 391.4 64.7 398.9 64.7 398.9 84.6 420.3 109.1 433.7 132.4 442 135.1 405.1 134.7 392.1 135 373.5 98.6 376 77.6 381.8 68 386.2 Z" fill="#ffffff"/>
              <path d="M1040.9 378.6 L1040.9 391.8 C1040.9 394.7 1038.6 397 1035.7 397 L972.8 397 C972.8 400.3 972.9 403.2 972.9 405.9 972.9 425.4 972.1 441.3 970.2 459.2 969.9 461.9 967.7 463.9 965.1 463.9 L951.5 463.9 C950.1 463.9 948.8 463.3 947.9 462.3 947 461.3 946.5 459.9 946.7 458.5 948.6 440.7 949.5 425 949.5 405.9 949.5 403.1 949.5 400.2 949.4 397 L887.2 397 C884.3 397 882 394.7 882 391.8 L882 378.6 C882 375.7 884.3 373.4 887.2 373.4 L948.5 373.4 C947.2 351.9 944.6 331.2 940.4 310.2 940.2 308.9 940.5 307.6 941.3 306.6 942.1 305.6 943.3 305 944.6 305 L959.3 305 C961.6 305 963.5 306.6 964 308.9 968.1 330.6 970.7 351.7 972 373.4 L1035.7 373.4 C1038.5 373.4 1040.9 375.8 1040.9 378.6 Z" fill="#ffffff"/>
              <path d="M955.3 273.9 C922.8 194 867.9 125.9 796.5 76.9 723.4 26.8 637.7 0.3 548.7 0.3 401.5 0.3 264.9 73.4 183.4 195.9 182.5 197.2 182.3 198.9 182.8 200.4 183.3 202 184.5 203.1 186 203.6 L197.4 207.5 C198.1 207.7 198.8 207.8 199.4 207.8 201.5 207.8 203.5 206.7 204.7 205 242.1 150 292.7 104.3 351.1 72.7 411.4 40.1 479.7 22.8 548.6 22.8 631.9 22.8 712.2 47.4 781 93.8 848.1 139.1 900.2 202.4 931.7 276.7 932.6 278.9 934.8 280.4 937.2 280.4 L950.8 280.4 C952.4 280.4 953.9 279.6 954.7 278.3 955.7 277 955.9 275.4 955.3 273.9 Z" fill="url(#disneyArcCard)"/>
            </svg>
          </span>
          <div class="provider-meta">
            <div class="provider-name-row">
              <strong>${t("provider_disney")}</strong>
              ${currentStreamingProvider === "disney" ? `<span class="provider-status-badge provider-status-badge--disney">${t("provider_active")}</span>` : `<span class="provider-status-badge provider-status-badge--ready">READY</span>`}
            </div>
            ${renderProviderSpotlightDetails("provider_disney_sub", currentCountryName, currentStreamingCountry, spotlightTotal)}
          </div>
          <span class="provider-accent-rail" aria-hidden="true"></span>
        </button>

        <!-- Paramount+ -->
        <button type="button" class="streaming-provider streaming-provider--paramount ${currentStreamingProvider === "paramount" ? "is-active" : ""}" data-provider="paramount" role="tab" aria-selected="${currentStreamingProvider === "paramount"}">
          <span class="provider-icon provider-icon--paramount" aria-hidden="true">
            <svg viewBox="-10 -10 1020 755" width="24" height="18" aria-hidden="true"><path fill="#ffffff" d="m 24.874,562.117 13.808,-20.846 23.943,6.55 -15.622,-19.031 13.409,-20.579 -23.19,9.071 -16.11,-18.986 1.372,24.651 L 0,531.445 23.458,537.596 Z M 21.598,470.28 39.08,452.269 61.43,463.244 49.702,441.69 66.741,423.987 42.31,428.501 30.14,406.727 26.909,431.202 3.011,435.317 24.874,445.85 Z m 14.428,-90.948 20.536,-14.163 19.916,14.871 -7.524,-23.456 20.314,-14.03 -24.962,-0.31 -7.744,-23.634 -7.967,23.545 -24.21,-0.575 19.475,14.384 z m 103.032,-170.17 12.835,21.288 1.771,-24.341 24.031,-5.71 -22.881,-9.515 1.638,-24.74 -16.064,18.765 -22.307,-9.647 12.613,20.712 -16.021,18.633 z m 296.615,-145.609 18.41,-16.286 21.111,12.701 -9.958,-22.925 18.412,-16.641 -24.564,2.257 -9.293,-22.306 -5.444,23.59 -24.43,2.434 21.332,12.834 z m -352.069,671.964 4.956,-24.518 24.651,-2.966 -21.553,-11.772 4.647,-24.032 -18.103,16.993 -21.995,-11.506 10.622,22.309 -17.748,16.417 23.988,-3.099 z m 117.105,-589.688 8.586,23.368 6.462,-23.723 24.607,-0.841 -20.713,-13.72 6.417,-24.121 -19.34,15.27 -20.094,-13.499 8.321,22.749 -19.164,15.181 z m 72.76,-50.719 3.851,24.563 11.021,-22.04 24.297,3.895 -17.792,-17.482 10.888,-22.395 -22.085,11.331 -16.995,-17.083 3.983,23.811 -21.818,11.418 z m 80.15,-11.065 14.871,-19.562 23.234,8.409 -14.118,-20.536 14.915,-19.827 -23.766,6.771 -13.41,-19.96 -0.709,24.209 -23.634,6.859 23.457,8.719 z m -313.831,544.016 6.02,23.809 9.56,-23.233 24.917,1.815 -19.03,-15.626 9.205,-22.747 -20.978,13.276 -19.43,-15.578 6.107,23.987 -20.579,12.659 z m 27.794,-334.81 22.882,-10.135 16.596,18.544 -2.832,-24.43 22.438,-9.958 -24.297,-4.958 -3.098,-24.739 -12.349,21.465 -23.589,-5.134 16.287,17.969 z m 712.813,-150.52 6.374,23.721 8.894,-23.19 24.784,0.665 -19.25,-15.446 8.762,-22.527 -20.312,13.322 -19.12,-15.402 6.282,24.164 -20.935,13.588 z m 38.812,54.171 23.945,5.621 1.637,24.563 13.013,-21.199 24.298,5.532 -15.978,-18.854 12.879,-20.447 -22.395,9.161 -15.979,-18.676 1.638,24.917 z m -111.66,-101.35 10.755,21.997 4.162,-24.386 24.56,-3.939 -21.819,-11.552 4.206,-23.766 -17.305,16.994 -21.819,-11.418 10.755,22.527 -17.749,17.305 z m 185.795,177.827 -2.966,24.297 16.906,-18.278 22.703,10.046 -12.17,-21.553 16.596,-17.57 -23.766,4.824 -12.125,-21.598 -3.1,24.784 -24.343,4.736 z M 603.718,71.431 l 23.278,-8.275 14.741,19.783 -0.664,-25.004 23.456,-8.454 -23.679,-7.17 -0.441,-24.208 -13.764,19.959 -23.503,-7.125 14.914,20.137 z m 373.802,447.002 1.724,-24.606 -16.328,19.164 -23.059,-9.427 13.231,20.623 -15.8,18.942 24.076,-6.196 13.587,20.846 1.593,-24.651 23.457,-5.796 z m -16.509,105.155 24.209,-1.151 -20.314,-13.143 6.151,-23.721 -19.562,15.62 -20.846,-13.63 9.118,22.97 -19.253,15.403 24.918,-1.462 9.382,23.014 z m -47.888,83.339 4.692,24.518 10.799,-22.261 23.943,3.452 -17.571,-16.687 10.755,-22.128 -22.217,11.551 -18.013,-17.347 4.559,24.032 -21.599,11.594 z M 304.848,552.202 c -1.903,-1.549 -25.271,22.219 -40.541,38.812 -5.398,5.755 -8.896,11.2 -10.975,13.766 0,0 -6.728,11.108 -10.313,15.801 -3.629,4.692 -12.613,17.924 -16.596,23.679 -1.373,1.901 -4.913,10.266 -11.861,18.941 -3.452,4.336 -6.948,10.002 -13.72,18.678 -9.028,11.594 -15.845,21.109 -14.295,22.394 0.885,0.617 14.162,-15.447 28.412,-32.707 5.931,-7.214 12.349,-14.605 17.793,-21.644 2.654,-3.405 8.763,-9.115 10.755,-12.037 3.495,-5.179 7.303,-9.117 8.807,-10.357 7.922,-6.46 12.392,-6.946 14.959,-10.619 1.195,-1.814 16.905,-25.449 22.615,-35.053 5.221,-9.073 18.1,-26.822 14.96,-29.654 m 664.438,-149.768 -12.304,21.731 -24.387,-4.78 16.951,17.924 -11.814,21.376 22.395,-10.622 17.257,17.835 -3.052,-24.607 21.952,-10.091 -23.901,-4.427 z m -59.969,-64.306 20.048,14.206 -7.611,23.456 19.918,-14.826 20.579,14.295 -7.879,-23.545 19.606,-14.162 -24.12,0.221 -7.837,-23.369 -7.83,23.679 z M 520.073,59.394 541.316,46.869 559.55,63.2 554.196,38.946 575.392,26.245 550.832,23.678 545.873,0 l -9.735,22.173 -24.429,-2.346 18.497,16.73 z m 3.186,431.465 c 2.302,6.774 10.845,46.693 13.321,54.969 2.565,8.233 5.134,8.676 6.552,11.905 4.954,12.438 12.079,12.924 15.754,13.941 10.269,3.144 11.107,16.906 17.657,29.21 6.109,11.509 11.864,21.863 17.263,34.431 5.398,12.57 33.016,80.64 37.752,90.995 1.591,3.761 14.736,3.761 13.318,0 -3.316,-7.48 -10.886,-26.286 -15.578,-45.053 -2.963,-12.17 8.412,-3.542 1.151,-23.059 -3.364,-8.94 -9.735,-17.835 -13.318,-21.466 -3.675,-3.583 -7.217,-19.03 -10.005,-25.936 -2.963,-6.728 -1.462,-7.08 -7.566,-23.323 -4.562,-11.861 8.231,-7.878 1.062,-26.157 -4.647,-11.903 -28.281,-54.921 -31.025,-59.347 -1.328,-2.436 -5.885,-9.871 -11.508,-18.678 -5.31,-8.364 -9.69,-17.304 -12.215,-21.2 -4.912,-7.876 -13.94,-25.138 -19.03,-32.307 -5.043,-7.215 -11.331,-23.059 -13.941,-20.402 -2.565,2.345 7.611,26.111 11.772,41.247 4.382,15.093 1.195,21.245 -1.415,25.536 -2.436,4.251 -2.436,7.084 -10e-4,14.694 m 160.343,123.213 c 6.952,11.553 8.81,9.251 11.687,9.385 6.549,0.178 21.199,15.934 24.12,20.226 2.788,4.337 26.375,27.838 32.44,33.592 2.655,2.521 21.333,32.704 23.721,30.539 2.524,-2.171 -7.167,-16.818 -8.629,-20.096 -1.326,-3.186 -6.727,-7.922 -9.34,-14.78 -2.433,-6.728 -13.541,-23.679 -17.168,-29.032 -3.589,-5.401 -9.43,-17.352 -15.804,-24.918 -5.885,-6.641 -1.192,-8.454 -7.255,-14.294 -3.675,-3.453 -15.092,-13.591 -17.66,-15.714 -2.433,-2.213 -11.772,-10.488 -17.127,-15.134 -5.313,-4.515 -18.058,-13.368 -17.615,-19.031 0.175,-5.801 -2.613,-16.817 -6.905,-20.492 -3.1,-2.655 -12.215,-17.349 -22.658,-25.847 -5.268,-4.426 -16.51,-16.109 -25.183,-26.244 -8.101,-9.649 -14.207,-18.457 -16.067,-17.217 -2.743,1.771 9.43,18.765 10.666,20.803 1.284,1.945 15.358,26.286 16.685,32.66 1.463,6.463 27.707,50.631 33.327,64.35 3.229,8.011 21.198,18.721 28.765,31.244 m 114.628,42.712 c 0.884,-1.063 -1.638,-4.339 -3.008,-6.816 -1.507,-2.479 -10.446,-12.393 -12.129,-15.181 -1.459,-2.61 -13.054,-19.119 -17.129,-24.518 -7.255,-9.296 -0.617,-12.704 -4.425,-18.455 -1.549,-2.524 -10.842,-13.722 -21.642,-24.785 -5.576,-5.534 -11.772,-10.889 -17.037,-15.625 -8.543,-7.611 -15.003,-13.276 -16.064,-12.346 -1.507,1.504 3.538,7.567 5.707,10.355 2.168,2.654 5.576,7.566 10.091,12.923 7.302,8.721 0.53,15.312 7.521,22.261 1.151,1.151 20.448,22.747 25.186,26.733 7.035,6.283 32.174,36.113 33.944,37.75 2.967,2.789 8.143,8.766 8.985,7.704 M 400.354,515.202 c 1.417,-3.01 5.798,-12.303 5.577,-16.02 0,-0.664 -1.638,-1.815 -3.01,-0.445 -6.462,6.375 -19.605,29.122 -24.606,31.69 -11.242,5.442 -16.155,18.633 -19.519,23.854 -2.39,3.851 -5.487,10.091 -10.843,17.927 -4.691,6.77 -10.046,16.904 -12.038,20.401 -1.947,3.672 -2.656,7.036 0.973,7.036 3.629,0 0.798,5.932 -3.629,12.437 -2.522,3.806 -8.762,22.041 -10.577,26.997 -2.39,6.107 -2.036,13.896 -2.877,16.507 -0.841,2.436 -12.745,27.796 -15.844,33.416 -1.947,3.542 -1.372,4.957 -2.125,6.905 -1.106,2.433 0.267,3.142 2.125,1.371 2.258,-2.258 15.003,-21.6 18.897,-23.898 3.807,-2.391 7.303,-5.93 7.878,-14.252 0.575,-8.32 5.976,-10.577 10.003,-15.445 4.205,-4.825 9.736,-11.286 12.701,-18.058 2.788,-6.991 6.374,-1.682 12.836,-12.081 6.46,-10.488 20.978,-36.335 24.297,-41.336 3.186,-5.004 0.841,-12.217 0.442,-18.191 -0.177,-3.141 0.265,-10.888 2.125,-19.119 1.86,-7.347 5.267,-14.828 7.214,-19.696 m 55.589,-197.476 c 5.354,0 13.188,-9.782 17.436,-18.278 4.383,-9.206 6.596,-14.384 12.083,-26.157 0.221,-0.62 -0.31,-0.62 -0.886,-0.62 -6.239,0 -13.1,6.374 -17.48,11.507 -5.179,6.374 -13.676,18.368 -14.96,26.998 -0.929,4.646 1.106,6.55 3.807,6.55 m 138.26,8.275 c 6.109,3.098 13.677,-10.356 20.271,-22.615 6.549,-12.348 11.772,-27.662 6.24,-29.565 -6.24,-2.522 -14.163,9.516 -20.757,21.819 -6.508,12.304 -11.461,27.618 -5.754,30.361 M 358,317.726 c 5.487,0 13.145,-9.782 17.57,-18.278 4.338,-9.206 6.64,-14.384 11.95,-26.157 0.266,-0.62 -0.266,-0.62 -0.753,-0.62 -6.284,0 -13.145,6.374 -17.481,11.507 -5.179,6.374 -13.764,18.368 -15.048,26.998 -0.928,4.646 1.284,6.55 3.762,6.55 M 297.987,206.505 c 42.487,1.992 67.492,22.837 67.492,45.188 -0.043,39.965 -63.42,46.78 -63.42,46.78 -11.021,55.367 -54.924,76.477 -85.329,76.168 -40.806,-0.31 -40.187,-33.37 -38.813,-37.619 1.725,-4.914 4.247,-9.383 9.382,-9.383 5.09,0 9.339,4.16 9.339,9.383 0,3.143 -1.55,6.107 -4.249,7.656 -5.355,3.32 -4.338,7.48 -4.338,7.48 0,17.57 22.704,18.941 28.68,18.941 60.765,0 53.772,-100.111 107.368,-134.144 2.435,-1.637 4.338,0 2.833,1.682 -16.729,20.978 -23.014,54.791 -23.014,54.791 25.847,0 42.93,-24.607 42.93,-41.735 0,-29.342 -26.422,-41.514 -48.86,-41.514 -62.581,0 -89.755,43.727 -89.755,67.537 0,23.855 15.048,32.485 25.936,32.485 15.181,0 19.916,-10.134 18.057,-15.091 -3.01,-7.789 1.15,-14.295 5.843,-14.295 1.858,0 8.099,-0.31 8.099,10.667 0,10.577 -15.004,21.243 -31.601,21.243 -16.375,0 -40.318,-8.851 -40.318,-35.008 -0.002,-53.021 65.234,-73.159 103.738,-71.212 m 105.377,64.794 c -6.771,15.314 -11.772,26.289 -18.014,40.762 -0.53,1.372 -1.017,3.761 0.268,4.646 1.149,0.531 2.478,0.531 3.229,0 8.011,-3.85 15.048,-13.189 20.581,-23.811 l 9.868,-21.774 h 13.897 l -3.807,8.231 c -0.311,0.443 -0.311,0.708 0,0.443 4.338,-3.275 8.896,-8.188 14.473,-11.242 2.168,-1.018 7.347,-1.018 6.814,2.567 -0.265,3.186 -2.699,5.621 -4.07,8.675 -0.797,1.947 -1.638,4.381 -1.372,5.709 0.575,1.459 2.168,2.256 4.337,0.619 2.169,-1.372 3.851,-2.479 5.843,-4.116 3.451,-3.364 7.833,-6.506 12.745,-9.116 9.87,-4.559 23.28,-7.525 33.105,-1.284 -6.861,15.357 -12.038,26.776 -18.589,41.248 -1.195,2.478 -0.221,3.275 0.575,3.85 0.841,0.531 2.434,0.796 4.647,-0.397 5.398,-2.257 14.959,-12.923 18.765,-21.2 3.63,-7.7 6.905,-15.313 10.755,-23.987 h 14.297 l -3.986,8.409 0.575,0.266 c 3.809,-3.497 13.766,-11.463 21.112,-9.781 4.073,0.841 6.063,5.708 5.755,9.338 4.645,-3.407 9.426,-7.479 16.331,-9.161 9.868,-2.434 13.719,4.425 10.666,11.021 -3.85,9.029 -11.464,26.731 -15.845,35.849 -0.531,0.93 -0.531,2.965 0,3.408 1.106,0.885 3.055,0 3.895,-0.443 4.912,-4.205 7.614,-6.904 11.417,-12.304 1.062,-9.56 6.24,-18.366 13.412,-25.713 7.611,-8.453 19.648,-15.047 31.201,-11.153 4.027,1.328 6.771,5.443 7.878,9.516 0.531,2.168 1.062,3.274 1.062,5.753 6.063,4.427 13.985,-2.788 17.218,-8.187 0.885,-2.214 1.991,-4.648 2.521,-6.33 3.453,0.265 10.222,0 14.25,0 l -17.836,40.762 c -1.147,2.389 -1.415,3.761 -1.415,5.621 0,1.504 1.638,1.77 3.364,1.504 4.912,-0.885 12.921,-10.533 16.948,-18.632 4.515,-10.135 8.987,-18.588 13.413,-28.679 h 14.427 c -5.754,13.631 -12.262,28.148 -16.951,38.77 -1.106,2.168 -2.388,4.381 -1.682,7.39 0.575,1.417 2.479,1.151 3.672,0.62 6.241,-3.629 16.996,-15.578 20.715,-22.97 3.893,-8.763 6.77,-15.313 10.842,-23.811 h 14.827 l -3.541,8.498 c 5.531,-4.382 11.461,-9.073 18.589,-10.224 3.274,-0.442 7.347,-0.266 9.251,3.098 2.213,3.807 0.884,7.833 -0.754,11.507 -4.072,9.294 -8.809,19.385 -12.879,28.37 -0.753,2.212 -0.973,4.293 0.487,5.177 2.257,1.417 12.611,-4.912 17.879,-16.419 4.56,-10.091 7.659,-16.066 11.729,-25.891 h -7.611 l 2.124,-4.426 h 7.655 l 10.931,-23.766 H 798.1 l -10.624,23.766 h 11.11 l -2.082,4.426 h -10.933 c -6.282,13.322 -11.551,24.563 -17.038,37.133 -2.123,4.293 -4.336,11.507 -3.186,15.888 0.843,2.435 3.851,3.054 6.594,2.125 8.409,-2.921 14.163,-10.09 19.075,-17.748 0.267,-0.841 4.734,-0.265 4.381,0.354 -5.799,11.418 -18.321,22.97 -30.316,22.66 -3.583,0 -7.48,-2.213 -9.604,-5.267 -1.015,-1.594 -1.679,-2.921 -2.213,-4.824 -0.753,-3.098 -0.528,-6.595 0,-9.914 -6.505,4.958 -12.745,10.932 -20.977,12.613 -3.586,0.531 -8.187,-0.796 -9.028,-4.646 -0.531,-3.009 -0.267,-6.33 0.842,-9.029 5.177,-11.197 9.779,-21.288 14.691,-33.105 0.4,-0.531 0,-2.478 -0.575,-2.743 -0.798,-0.752 -3.23,-0.752 -5.398,0.885 -10.091,7.612 -15.27,17.481 -19.606,27.571 -3.099,6.772 -6.415,13.632 -9.648,20.271 h -14.516 c 1.682,-4.071 4.116,-9.56 6.018,-13.985 0,-0.265 -0.264,-0.265 -0.264,0 -5.974,5.931 -13.677,12.746 -21.243,14.782 -3.056,0.796 -6.11,-0.221 -7.658,-3.098 -1.727,-2.699 -2.213,-6.727 -0.754,-10.4 0,-0.177 -0.131,-0.177 -0.439,0 -5.401,5.533 -10.666,10.4 -17.927,12.923 -8.275,2.522 -15.709,-3.275 -10.488,-15.313 1.418,-3.232 5.532,-12.304 10.047,-23.191 -3.762,1.548 -8.365,1.548 -10.842,0.796 -0.312,0 -0.312,0 -0.312,0.266 -3.188,15.268 -12.259,29.166 -26.199,35.804 -6.816,3.319 -14.562,4.16 -21.333,-0.487 -3.274,-2.168 -5.223,-7.479 -5.487,-12.083 -7.038,7.126 -15.05,16.109 -25.936,14.561 -1.638,-0.354 -3.008,-1.815 -3.85,-3.319 -2.479,-4.115 -1.021,-8.542 0.53,-12.083 5.224,-10.887 9.516,-21.067 14.739,-33.326 0.839,-1.727 -1.507,-2.966 -3.188,-2.168 -5.177,2.479 -8.365,4.957 -11.239,9.382 -1.551,2.39 -3.1,5.134 -4.339,7.744 -4.826,10.49 -9.869,21.377 -14.252,31.954 h -14.825 c 6.639,-14.914 12.879,-29.431 19.428,-44.168 0.62,-1.372 0.268,-3.319 -0.53,-3.762 -1.284,-0.708 -3.628,0.443 -5.135,1.329 -3.541,2.434 -6.683,5.665 -9.028,9.87 -2.478,4.071 -4.734,8.142 -6.461,12.569 l -11.063,24.164 h -14.474 c 1.417,-3.186 4.116,-9.559 5.753,-12.746 0,-0.265 -0.265,-0.486 -0.265,-0.265 -7.922,6.55 -18.057,15.047 -25.448,13.631 -2.479,-0.266 -4.603,-2.434 -5.178,-4.646 -0.53,-2.788 -0.31,-5.267 0.266,-7.613 0,-0.31 -0.266,-0.31 -0.575,0 -6.33,6.02 -11.994,10.976 -19.961,12.879 -4.559,1.018 -8.851,-1.903 -10.312,-5.266 -2.036,-3.763 -2.522,-9.825 0.752,-16.686 1.947,-4.381 4.072,-8.984 6.771,-12.79 -1.593,0.841 -4.824,1.106 -7.037,0.841 -1.858,-0.265 -3.85,-1.726 -4.824,-3.142 -1.15,-1.239 -1.416,-3.718 -1.416,-5.355 0.266,-0.31 -0.575,-0.31 -1.151,0 -4.336,3.497 -6.283,7.657 -8.452,12.26 l -12.57,28.457 h -14.781 l 5.444,-12.083 c 0.266,-0.221 0,-0.486 -0.266,-0.221 -7.701,6.816 -16.906,14.561 -24.342,13.1 -2.125,-0.354 -4.382,-2.478 -4.913,-4.602 -0.53,-2.567 -0.31,-5.311 0,-7.702 h -0.53 c -6.021,6.02 -11.773,10.887 -19.606,12.569 -4.47,1.416 -8.498,-1.283 -10.225,-5.09 -2.168,-5.577 -1.371,-11.24 0.576,-16.508 5.665,-14.826 16.154,-25.403 30.316,-33.413 8.983,-5.136 22.968,-6.686 32.793,-1.596 M 85.595,500.286 c 0,62.537 16.597,132.995 46.205,190.795 53.507,-49.922 193.893,-208.363 210.003,-226.774 24.475,-28.015 35.052,-10.18 48.196,-25.847 7.037,-8.586 11.152,-11.861 14.25,-13.587 5.046,-3.009 10.8,-10.178 13.676,-12.304 2.877,-2.168 9.383,-10.798 14.429,-15.136 5.09,-4.292 15.047,-10.798 25.183,-19.385 10.091,-8.674 27.263,-28.767 45.983,-28.767 22.261,0 31.557,15.092 33.547,16.907 1.593,1.727 15.314,13.852 17.526,16.154 2.433,2.744 17.127,14.339 25.094,14.339 7.878,0 13.722,8.63 17.969,12.924 9.427,8.585 48.372,49.523 61.164,58.198 5.71,3.938 11.108,3.231 15.356,6.551 4.384,3.229 6.552,5.312 9.028,6.063 2.391,0.664 10.755,-1.462 20.493,10.711 4.515,3.097 5.71,3.63 5.71,3.63 0,0 13.231,11.992 17.969,20.445 4.292,7.303 102.941,138.35 138.259,185.22 32.75,-59.394 51.472,-127.639 51.472,-200.222 C 917.107,270.459 730.871,84.444 501.263,84.444 271.653,84.576 85.595,270.679 85.595,500.286"/></svg>
          </span>
          <div class="provider-meta">
            <div class="provider-name-row">
              <strong>${t("provider_paramount")}</strong>
              ${currentStreamingProvider === "paramount" ? `<span class="provider-status-badge provider-status-badge--paramount">${t("provider_active")}</span>` : `<span class="provider-status-badge provider-status-badge--ready">READY</span>`}
            </div>
            ${renderProviderSpotlightDetails("provider_paramount_sub", currentCountryName, currentStreamingCountry, spotlightTotal)}
          </div>
          <span class="provider-accent-rail" aria-hidden="true"></span>
        </button>

        <!-- Google TV -->
        <button type="button" class="streaming-provider streaming-provider--googletv ${currentStreamingProvider === "googletv" ? "is-active" : ""}" data-provider="googletv" role="tab" aria-selected="${currentStreamingProvider === "googletv"}">
          <span class="provider-icon provider-icon--googletv" aria-hidden="true">
            <svg viewBox="0 0 548.3 400" width="23" height="17" aria-hidden="true"><path fill="#4285F4" d="M477.4,0H153.2c-28.2,0-51.1,22.9-51.1,51.1v51.1h395.1c28.2,0,51.1,22.9,51.1,51.1V70.9 C548.3,31.7,516.6,0,477.4,0L477.4,0z"/><path fill="#34A853" d="M70.9,0C31.7,0,0,31.7,0,70.9v175.9c0,28.2,22.9,51.1,51.1,51.1h51.1V51.1c0,0,0,0,0,0 C102.2,22.9,125,0,153.2,0H70.9L70.9,0z"/><path fill="#FBBC04" d="M70.9,400h324.2c28.2,0,51.1-22.9,51.1-51.1v-51.1H51.1C22.9,297.8,0,275,0,246.8v82.3 C0,368.3,31.7,400,70.9,400L70.9,400z"/><path fill="#EA4335" d="M477.4,400c39.2,0,70.9-31.7,70.9-70.9V153.2c0-28.2-22.9-51.1-51.1-51.1h-51.1v246.8c0,0,0,0,0,0 c0,28.2-22.9,51.1-51.1,51.1H477.4L477.4,400z"/></svg>
          </span>
          <div class="provider-meta">
            <div class="provider-name-row">
              <strong>${t("provider_googletv")}</strong>
              ${currentStreamingProvider === "googletv" ? `<span class="provider-status-badge provider-status-badge--googletv">${t("provider_active")}</span>` : `<span class="provider-status-badge provider-status-badge--ready">READY</span>`}
            </div>
            ${renderProviderSpotlightDetails("provider_googletv_sub", currentCountryName, currentStreamingCountry, spotlightTotal)}
          </div>
          <span class="provider-accent-rail" aria-hidden="true"></span>
        </button>

        <!-- MUBI -->
        <button type="button" class="streaming-provider streaming-provider--mubi ${currentStreamingProvider === "mubi" ? "is-active" : ""}" data-provider="mubi" role="tab" aria-selected="${currentStreamingProvider === "mubi"}">
          <span class="provider-icon provider-icon--mubi" aria-hidden="true">
            <svg viewBox="76.5 272.5 67 66.5" width="21" height="21" aria-hidden="true"><g fill="#ffffff"><circle cx="132.523" cy="305.6" r="8.766"/><circle cx="87.383" cy="305.6" r="8.766"/><circle cx="109.954" cy="305.6" r="8.766"/><circle cx="87.383" cy="283.116" r="8.766"/><circle cx="109.954" cy="283.116" r="8.766"/><circle cx="87.383" cy="328.087" r="8.766"/><circle cx="109.954" cy="328.087" r="8.766"/></g></svg>
          </span>
          <div class="provider-meta">
            <div class="provider-name-row">
              <strong>${t("provider_mubi")}</strong>
              ${currentStreamingProvider === "mubi" ? `<span class="provider-status-badge provider-status-badge--mubi">${t("provider_active")}</span>` : `<span class="provider-status-badge provider-status-badge--ready">READY</span>`}
            </div>
            ${renderProviderSpotlightDetails("provider_mubi_sub", currentCountryName, currentStreamingCountry, spotlightTotal)}
          </div>
          <span class="provider-accent-rail" aria-hidden="true"></span>
        </button>

        <!-- Peacock -->
        <button type="button" class="streaming-provider streaming-provider--peacock ${currentStreamingProvider === "peacock" ? "is-active" : ""}" data-provider="peacock" role="tab" aria-selected="${currentStreamingProvider === "peacock"}">
          <span class="provider-icon provider-icon--peacock" aria-hidden="true">
            <svg viewBox="-2 -2 73.5 72.2" width="20" height="20" aria-hidden="true"><defs><linearGradient id="peacockIconG" x1="63.89" x2="63.89" y1="-0.13" y2="68.21" gradientUnits="userSpaceOnUse"><stop stop-color="#ffdc23"/><stop offset=".16" stop-color="#ff8700"/><stop offset=".21" stop-color="#ff5401"/><stop offset=".37" stop-color="#d9005a"/><stop offset=".42" stop-color="#c814c8"/><stop offset=".58" stop-color="#8250ff"/><stop offset=".63" stop-color="#6e64ff"/><stop offset=".79" stop-color="#00c8ff"/><stop offset=".84" stop-color="#00cc99"/><stop offset=".99" stop-color="#00a637"/></linearGradient></defs><path fill="#ffffff" d="m 48.344254,23.376251 c 0,14.582148 -11.296608,26.178142 -36.607947,29.086577 v 15.47688 H 0 V 24.601791 C 0,9.1049395 10.947966,0 24.698431,0 38.448896,0 48.344254,10.24389 48.344254,23.376251 m -11.736307,0.437376 c 0,-7.180057 -5.429566,-12.60618 -12.349215,-12.60618 -6.919641,0 -12.524649,4.902158 -12.524649,13.394344 v 16.71352 C 21.134238,41.04889 36.605731,35.784844 36.605731,23.813627 Z"/><path fill="url(#peacockIconG)" d="m 69.499016,5.333684 c 0,2.9417574 -2.512018,5.326184 -5.611192,5.326184 -3.099174,0 -5.611193,-2.3844266 -5.611193,-5.326184 0,-2.9417581 2.512019,-5.32618468 5.611193,-5.32618468 3.099174,0 5.611192,2.38442658 5.611192,5.32618468 m -5.611192,9.055365 c -3.099174,0 -5.611193,2.384427 -5.611193,5.326185 0,2.941758 2.512019,5.326185 5.611193,5.326185 3.099174,0 5.611192,-2.384427 5.611192,-5.326185 0,-2.941758 -2.512018,-5.326185 -5.611192,-5.326185 m 0,14.379846 c -3.099174,0 -5.611193,2.384427 -5.611193,5.326185 0,2.941758 2.512019,5.326184 5.611193,5.326184 3.099174,0 5.611192,-2.384426 5.611192,-5.326184 0,-2.941758 -2.512018,-5.326185 -5.611192,-5.326185 m 0,14.379845 c -3.099174,0 -5.611193,2.384427 -5.611193,5.326186 0,2.941758 2.512019,5.326184 5.611193,5.326184 3.099174,0 5.611192,-2.384426 5.611192,-5.326184 0,-2.941759 -2.512018,-5.326186 -5.611192,-5.326186 m 0,14.381551 c -3.099174,0 -5.611193,2.384427 -5.611193,5.326184 0,2.941758 2.512019,5.326185 5.611193,5.326185 3.099174,0 5.611192,-2.384427 5.611192,-5.326185 0,-2.941757 -2.512018,-5.326184 -5.611192,-5.326184"/></svg>
          </span>
          <div class="provider-meta">
            <div class="provider-name-row">
              <strong>${t("provider_peacock")}</strong>
              ${currentStreamingProvider === "peacock" ? `<span class="provider-status-badge provider-status-badge--peacock">${t("provider_active")}</span>` : `<span class="provider-status-badge provider-status-badge--ready">READY</span>`}
            </div>
            ${renderProviderSpotlightDetails("provider_peacock_sub", currentCountryName, currentStreamingCountry, spotlightTotal)}
          </div>
          <span class="provider-accent-rail" aria-hidden="true"></span>
        </button>

        <!-- Crunchyroll -->
        <button type="button" class="streaming-provider streaming-provider--crunchyroll ${currentStreamingProvider === "crunchyroll" ? "is-active" : ""}" data-provider="crunchyroll" role="tab" aria-selected="${currentStreamingProvider === "crunchyroll"}">
          <span class="provider-icon provider-icon--crunchyroll" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="#ff640a" d="M2.909 13.436C2.914 7.61 7.642 2.893 13.468 2.898c5.576.005 10.137 4.339 10.51 9.819q.021-.351.022-.706C24.007 5.385 18.64.006 12.012 0S.007 5.36 0 11.988 5.36 23.994 11.988 24q.412 0 .815-.027c-5.526-.338-9.9-4.928-9.894-10.538Zm16.284.155a4.1 4.1 0 0 1-4.095-4.103 4.1 4.1 0 0 1 2.712-3.855 8.95 8.95 0 0 0-4.187-1.037 9.007 9.007 0 1 0 8.997 9.016q-.001-.847-.15-1.651a4.1 4.1 0 0 1-3.278 1.63Z"/></svg>
          </span>
          <div class="provider-meta">
            <div class="provider-name-row">
              <strong>${t("provider_crunchyroll")}</strong>
              ${currentStreamingProvider === "crunchyroll" ? `<span class="provider-status-badge provider-status-badge--crunchyroll">${t("provider_active")}</span>` : `<span class="provider-status-badge provider-status-badge--ready">READY</span>`}
            </div>
            ${renderProviderSpotlightDetails("provider_crunchyroll_sub", currentCountryName, currentStreamingCountry, spotlightTotal)}
          </div>
          <span class="provider-accent-rail" aria-hidden="true"></span>
        </button>

        <!-- Okko -->
        <button type="button" class="streaming-provider streaming-provider--okko ${currentStreamingProvider === "okko" ? "is-active" : ""}" data-provider="okko" role="tab" aria-selected="${currentStreamingProvider === "okko"}">
          <span class="provider-icon provider-icon--okko" aria-hidden="true">
            <svg viewBox="0 0 2922 1036" width="32" height="12" aria-hidden="true"><g fill="#ffffff"><path d="M401,237C180,237,0,415,0,637c0,221,180,399,401,399c222,0,402-178,402-399C803,415,623,237,401,237z M401,869c-123,0-224-109-224-232c0-124,101-233,224-233c124,0,225,109,225,233C626,760,525,869,401,869z"/><path d="M171,177c48,0,88-40,88-89c0-48-40-88-88-88c-49,0-89,40-89,88C82,137,122,177,171,177z"/><path d="M631,177c48,0,88-40,88-89c0-48-40-88-88-88c-49,0-89,40-89,88C542,137,582,177,631,177z"/><path d="M401,177c48,0,88-40,88-89c0-48-40-88-88-88c-49,0-89,40-89,88C312,137,352,177,401,177z"/><polygon points="2173,251 1978,251 1747,572 1747,13 1570,13 1570,1022 1747,1022 1747,701 1996,1022 2205,1022 1898,632"/><polygon points="1487,251 1292,251 1061,572 1061,13 884,13 884,1022 1061,1022 1061,701 1310,1022 1519,1022 1212,632"/><path d="M2520,237c-221,0-401,178-401,400c0,221,180,399,401,399c222,0,402-178,402-399C2922,415,2742,237,2520,237z M2519,869c-123,0-224-109-224-232c0-124,101-233,224-233c124,0,225,109,225,233C2744,760,2643,869,2519,869z"/></g></svg>
          </span>
          <div class="provider-meta">
            <div class="provider-name-row">
              <strong>${t("provider_okko")}</strong>
              ${currentStreamingProvider === "okko" ? `<span class="provider-status-badge provider-status-badge--okko">${t("provider_active")}</span>` : `<span class="provider-status-badge provider-status-badge--ready">READY</span>`}
            </div>
            ${renderProviderSpotlightDetails("provider_okko_sub", currentCountryName, currentStreamingCountry, spotlightTotal)}
          </div>
          <span class="provider-accent-rail" aria-hidden="true"></span>
        </button>

        <!-- Kinopoisk -->
        <button type="button" class="streaming-provider streaming-provider--kp ${currentStreamingProvider === "kinopoisk" ? "is-active" : ""}" data-provider="kinopoisk" role="tab" aria-selected="${currentStreamingProvider === "kinopoisk"}">
          <span class="provider-icon provider-icon--kp" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path fill="#ffffff" d="M3 2h5.5l-.8 6.5H3z"/>
              <path fill="#ffffff" d="M3 9.5h4.6l-.3 5H3z"/>
              <path fill="#ffffff" d="M3 15.5h4.2L6.5 22H3z"/>
              <path fill="#ffffff" d="M12.5 9.8l5.8-7.8h4.2l-7.2 8.5z"/>
              <path fill="#ffffff" d="M10 11.2l4.8-4.5 2.8 1.8-5.6 4z"/>
              <path fill="#ffffff" d="M10.2 12.8l5.4 3.8-2.6 2-4.8-4.5z"/>
              <path fill="#ffffff" d="M15.2 13.5l7.3 8.5h-4.2l-5.8-7.2z"/>
            </svg>
          </span>
          <div class="provider-meta">
            <div class="provider-name-row">
              <strong>${t("provider_kinopoisk")}</strong>
              ${currentStreamingProvider === "kinopoisk" ? `<span class="provider-status-badge provider-status-badge--kp">${t("provider_active")}</span>` : `<span class="provider-status-badge provider-status-badge--ready">READY</span>`}
            </div>
            ${renderProviderSpotlightDetails("provider_kinopoisk_sub", currentCountryName, currentStreamingCountry, spotlightTotal)}
          </div>
          <span class="provider-accent-rail" aria-hidden="true"></span>
        </button>
      </div>

      <!-- Filter Tabs & Region / Sort Toolbar -->
      <div class="streaming-toolbar">
        <div class="streaming-tabs" role="tablist">
          <button type="button" class="streaming-tab ${currentStreamingFilter === "all" ? "is-active" : ""}" data-stream-tab="all">${t("tab_stream_all")}</button>
          <button type="button" class="streaming-tab ${currentStreamingFilter === "movie" ? "is-active" : ""}" data-stream-tab="movie">${t("tab_stream_movies")}</button>
          <button type="button" class="streaming-tab ${currentStreamingFilter === "tv" ? "is-active" : ""}" data-stream-tab="tv">${t("tab_stream_tv")}</button>
          <button type="button" class="streaming-tab ${currentStreamingFilter === "top" ? "is-active" : ""}" data-stream-tab="top">${t("tab_stream_top")}</button>
        </div>

        <div class="streaming-right-tools">
          <!-- Compact Region Picker Dropdown -->
          <div class="streaming-region-picker" id="streaming-region-picker">
            <button type="button" class="streaming-region-btn" id="streaming-region-trigger" data-streaming-region-trigger aria-haspopup="listbox" aria-expanded="false" title="${t("country_label")}">
              <span class="region-globe-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg></span>
              <span class="region-label-prefix">${t("country_label")}:</span>
              <span class="region-current-name">${esc(currentCountryName)}</span>
              <span class="country-code-pill">${currentStreamingCountry}</span>
              <span class="region-chevron" aria-hidden="true"><svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></span>
            </button>

            <!-- Popover Menu -->
            <div class="streaming-region-menu" id="streaming-region-menu" role="listbox" hidden>
              <div class="region-menu-header">
                <span class="region-menu-title">${t("country_label")}</span>
                <span class="region-menu-hint">${STREAMING_COUNTRIES.length} regions</span>
              </div>
              <div class="region-menu-grid">
                ${STREAMING_COUNTRIES.map((c) => {
                  const translatedName = t("country_" + c.code.toLowerCase()) || c.name;
                  const isActive = c.code === currentStreamingCountry;
                  return `
                    <button type="button" class="region-menu-item ${isActive ? "is-active" : ""}" data-set-country="${c.code}" role="option" aria-selected="${isActive}">
                      <span class="region-menu-code">${c.code}</span>
                      <span class="region-menu-name">${esc(translatedName)}</span>
                      ${isActive ? `<span class="region-menu-check" aria-hidden="true">✓</span>` : ""}
                    </button>
                  `;
                }).join("")}
              </div>
            </div>
          </div>

          <label class="list-sort">
            <span>${t("sort_label")}:</span>
            <select data-streaming-sort aria-label="${t("sort_label")}">
              <option value="default" ${currentStreamingSort === "default" ? "selected" : ""}>${t("sort_default")}</option>
              <option value="rating_desc" ${currentStreamingSort === "rating_desc" ? "selected" : ""}>${t("sort_rating_desc")}</option>
              <option value="date_desc" ${currentStreamingSort === "date_desc" ? "selected" : ""}>${t("sort_date_desc")}</option>
              <option value="title_asc" ${currentStreamingSort === "title_asc" ? "selected" : ""}>${t("sort_title_asc")}</option>
            </select>
          </label>

          <span class="streaming-count-label" id="streaming-count-display">${renderStreamingCountText(sorted.length, streamingTotalResults, currentStreamingCountry, currentStreamingProvider)}</span>
        </div>
      </div>
    </div>

    <!-- Movie & TV Grid -->
    <div class="movie-grid" id="streaming-movie-grid">
      ${sorted.map((item) => streamingCard(item)).join("")}
    </div>

    <!-- Pagination / Load More -->
    <div class="streaming-load-more-wrap" id="streaming-load-more-container">
      ${renderStreamingLoadMoreButton()}
    </div>
  `;
}

function streamingCard(item) {
  movieCache.set(String(item.id), item);
  const movieId = safeNumericId(item.id) || 0;
  const poster = item.poster_path
    ? `<img src="${image(item.poster_path)}" alt="Poster for ${esc(item.title)}" loading="lazy" decoding="async">`
    : '<div class="no-poster">No poster</div>';
  const isWatched = watched.has(item.id);
  const mediaLabel = item.media_type === "tv" ? t("media_tv") : t("media_movie");
  const activeProvider = normalizeStreamingProvider(item.provider) || currentStreamingProvider;
  let providerChip = `<span class="netflix-chip" aria-label="Netflix"><svg viewBox="0 0 72 21" width="46" height="13" aria-hidden="true"><g fill="#ffffff"><path d="M2 2h3l4.2 10.6V2h2.8v17c-1 .1-2 .2-3 .3L4.8 8.1v11.3c-.9.1-1.9.2-2.8.3V2z"/><path d="M14.5 2h7.6v2.7h-4.7v3.9h4.1v2.7h-4.1v4.4c1.6-.1 3.2-.2 4.8-.2v2.7c-2.6.1-5.1.2-7.7.4V2z"/><path d="M24 2h8.4v2.7h-2.8v13.2c-.9 0-1.9 0-2.8.1V4.7H24V2z"/><path d="M34.4 2h7.4v2.7h-4.5v4h3.9v2.7h-3.9v6.3c-1 0-1.9 0-2.9.1V2z"/><path d="M43.8 2h2.9v13.3c1.5 0 3 .1 4.5.2v2.7c-2.5-.1-5-.1-7.4-.1V2z"/><path d="M53.2 2h2.9v16.5c-1 0-1.9-.1-2.9-.1V2z"/><path d="M58.4 2h3.1l2.3 5.3L66.1 2h3.1l-3.7 7.8 4 9.7c-1.1-.1-2.2-.2-3.2-.3l-2.5-6-2.4 5.7c-1-.1-2-.1-3-.2l3.8-8.3L58.4 2z"/></g></svg></span>`;
  let providerCode = "netflix";
  if (activeProvider === "kinopoisk") {
    providerChip = `<span class="kp-chip" aria-label="Kinopoisk"><svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><defs><linearGradient id="kpG${movieId}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ff5500"/><stop offset="65%" stop-color="#ff7a00"/><stop offset="100%" stop-color="#bbff00"/></linearGradient></defs><g fill="url(#kpG${movieId})"><path d="M3 2h5.5l-.8 6.5H3zM3 9.5h4.6l-.3 5H3zM3 15.5h4.2L6.5 22H3zM12.5 9.8l5.8-7.8h4.2l-7.2 8.5zM10 11.2l4.8-4.5 2.8 1.8-5.6 4zM10.2 12.8l5.4 3.8-2.6 2-4.8-4.5zM15.2 13.5l7.3 8.5h-4.2l-5.8-7.2z"/></g></svg><svg viewBox="0 0 92 16" width="54" height="9.5" aria-hidden="true"><g fill="#ffffff"><path d="M1 1.5h2.7v5.4L8 1.5h3.2L6.6 7.4l4.8 7.1H8.1L4.5 9l-.8 1v4.5H1v-13zM13 1.5h2.7v13H13v-13zM18 1.5h2.6l5 8.1V1.5h2.6v13h-2.5l-5.1-8.3v8.3H18v-13z"/><path fill-rule="evenodd" d="M35.8 1.2c3.2 0 5.3 2.5 5.3 6.8s-2.1 6.8-5.3 6.8-5.3-2.5-5.3-6.8 2.1-6.8 5.3-6.8zm0 2.5c-1.5 0-2.5 1.6-2.5 4.3s1 4.3 2.5 4.3 2.5-1.6 2.5-4.3-1-4.3-2.5-4.3zM43.2 1.5h4.7c2.7 0 4.3 1.6 4.3 4.2s-1.6 4.2-4.3 4.2h-2v4.6h-2.7v-13zm2.7 2.4v3.6h1.8c1.1 0 1.8-.6 1.8-1.8s-.7-1.8-1.8-1.8h-1.8zM58.8 1.2c3.2 0 5.3 2.5 5.3 6.8s-2.1 6.8-5.3 6.8-5.3-2.5-5.3-6.8 2.1-6.8 5.3-6.8zm0 2.5c-1.5 0-2.5 1.6-2.5 4.3s1 4.3 2.5 4.3 2.5-1.6 2.5-4.3-1-4.3-2.5-4.3z"/><path d="M66.2 1.5h2.7v13h-2.7v-13zM71.1 11.4l2.3-1.4c.5 1.3 1.4 2.1 2.7 2.1 1.2 0 2-.6 2-1.4 0-.9-.7-1.3-2.2-1.8l-.9-.3c-2.2-.7-3.4-1.8-3.4-3.7 0-2.2 1.8-3.7 4.4-3.7 2.2 0 3.7 1.1 4.4 2.8l-2.2 1.3c-.5-1.1-1.2-1.6-2.2-1.6-1 0-1.7.5-1.7 1.2 0 .8.6 1.2 2 1.6l.9.3c2.4.8 3.6 1.9 3.6 3.9 0 2.4-1.9 4.1-4.8 4.1-2.5 0-4.3-1.2-4.9-3.4zM82.5 1.5h2.7v5.4l4.3-5.4h3.2L88.1 7.4l4.8 7.1h-3.3L86 9l-.8 1v4.5h-2.7v-13z"/></g></svg></span>`;
    providerCode = "kinopoisk";
  } else if (activeProvider === "paramount") {
    providerChip = `<span class="paramount-chip" aria-label="Paramount+"><svg viewBox="-161.599 95.381 1000 230.363" width="54" height="13" aria-hidden="true"><path fill="#ffffff" d="M94.026,154.07c0-39.614-42.017-58.689-91.935-58.689c-53.398,0-102.392,23.657-120.375,60.339 c-4.963,9.773-7.542,20.584-7.528,31.546c-0.227,9.479,2.396,18.807,7.528,26.779c7.705,11.377,21.466,18.527,41.652,18.527 c24.776,0,44.411-13.576,44.411-37.234c0,0,0.364-6.598-7.341-6.598c-6.239,0-7.893,4.399-7.708,6.598 c0.922,18.525-10.092,33.382-29.728,33.382c-22.014,0-31.197-18.708-31.197-38.698c0-40.902,30.829-68.05,62.942-79.786 c15.007-5.667,30.944-8.47,46.985-8.259c36.333,0,66.061,13.942,66.061,51.361c0,31.175-26.24,57.77-57.623,60.157l1.284-4.216 c6.425-22.929,14.315-48.054,27.157-66.58c0.739-1.107,2.02-2.936,3.489-4.768l-1.833-2.203c-2.746,1.666-5.383,3.503-7.897,5.501 c-60.183,46.956-62.011,179.01-142.209,179.01c-2.762,0-5.519-0.184-8.256-0.551c-16.696-2.75-25.51-13.941-25.51-29.523 c0-3.119,1.103-7.34,1.103-9.721c0.127-4.43-3.361-8.123-7.791-8.252c-0.035,0-0.068,0-0.101,0h-0.915 c-7.155,0-10.092,5.678-10.276,13.754c-0.548,23.293,16.696,36.861,43.309,39.434c2.933,0.182,5.87,0.363,8.99,0.363 c62.571,0,100.923-47.32,117.257-104.729c8.273-0.969,16.441-2.686,24.403-5.131C61.374,207.805,94.026,188.373,94.026,154.07z M690.057,167.825h-22.029l-4.949,11.557l-8.629,19.441h-10.269l-3.133,6.604h10.652l-12.853,28.43 c-9.161,19.99-23.479,39.617-31.738,39.617c-1.832,0-2.94-0.738-2.94-2.566c0-1.826,0.547-3.49,2.571-8.623 c2.571-6.057,6.796-14.857,9.914-21.275c4.58-9.354,11.924-23.844,11.924-30.997c0-7.154-4.581-12.841-13.579-12.841 c-10.091,0-19.267,6.059-27.718,14.853l5.511-13.204h-20.729l-16.889,38.516c-6.782,13.574-20.553,36.133-29.182,36.133 c-1.832,0-2.571-1.102-2.571-2.934c0.179-1.648,0.612-3.258,1.286-4.771c0.738-1.65,10.83-25.309,10.83-25.309l18.351-42.001 h-22.384l-17.805,40.898c-5.496,12.658-19.443,34.117-28.442,34.117c-1.567,0.154-2.964-0.992-3.117-2.563c0,0,0,0,0-0.002v-0.738 c0-2.199,1.655-6.236,2.941-9.172l9.353-20.539l19.266-42.001h-22.192l-4.418,9.537c-3.294,6.417-8.806,13.937-17.611,13.937 c-4.225,0-6.235-1.646-7.151-3.299c-1.285-14.124-10.283-21.644-23.493-21.644c-18.351,0-31.381,10.821-40.011,24.029 c-5.653,9.104-10.094,18.906-13.206,29.158c-7.893,13.027-16.146,23.117-22.754,23.117c-1.653,0-2.756-0.922-2.756-3.121 c0-2.201,2.204-7.15,2.938-8.992l14.497-30.811c4.037-9.533,6.796-15.77,6.796-22.007c0-6.604-4.58-11.376-12.116-11.376 c-10.46,0-21.84,6.057-30.83,15.958c0.305-1.572,0.427-3.173,0.366-4.772c0-7.338-3.667-11.191-11.195-11.191 c-9.539,0-19.447,5.692-28.438,15.958l5.873-14.313h-20.189l-17.062,38.528c-8.073,18.16-21.102,36.139-28.445,36.139 c-1.649,0-2.751-0.924-2.751-3.121c0-3.484,3.854-12.105,5.32-15.59l22.573-51.17c1.651-3.85-9.178-6.238-22.94-6.238 c-14.129,0-28.627,6.973-39.267,15.958c-7.523,6.232-13.029,9.354-15.787,9.354c-0.899,0.193-1.785-0.381-1.979-1.279 c-0.026-0.121-0.038-0.246-0.036-0.369c0-3.119,7.523-11.927,7.523-18.711c0-3.117-1.649-5.137-5.875-5.137 c-8.069,0-17.616,7.705-24.588,15.772l5.873-14.125h-19.815l-17.063,38.519c-8.076,18.16-21.472,37.055-28.812,37.055 c-1.653,0-2.749-0.916-2.749-3.121c0-3.484,3.67-11.916,5.687-16.324l22.572-51.352c1.651-3.85-9.177-6.238-22.942-6.238 c-20.369,0-40.189,13.756-50.647,27.879c-11.559,15.219-19.447,31.361-19.633,44.57c-0.18,10.637,5.318,17.238,16.331,17.238 c12.296,0,22.208-9.719,27.893-17.057c-0.337,1.451-0.584,2.922-0.739,4.404c0,7.332,2.937,12.652,11.927,12.652 c7.889,0,18.35-6.602,26.792-17.057l-6.798,15.592h21.467l21.105-47.873c6.989-15.586,14.88-23.654,17.074-23.654 c0.505-0.096,0.993,0.234,1.091,0.738c0.01,0.059,0.016,0.119,0.016,0.178c0,1.652-3.301,6.059-3.301,10.088s2.195,7.15,8.076,7.15 c4.58,0,9.721-2.201,14.31-5.139c-10.826,14.678-18.173,30.084-18.173,42.742c-0.181,10.639,5.318,17.24,16.333,17.24 c11.558,0,22.385-11.006,28.257-18.342c-0.221,1.703-0.343,3.418-0.366,5.135c0,7.156,4.039,13.207,12.295,13.207 c9.172,0,16.515-5.689,25.69-16.873l-6.796,15.406h22.016l20.183-45.672c8.809-19.809,20.734-30.451,26.607-30.451 c1.467-0.151,2.782,0.915,2.935,2.384c0,0.002,0,0.006,0.001,0.008v0.547c-0.242,2.227-0.863,4.398-1.834,6.418l-28.967,66.947 h22.571l20.554-46.59c8.803-19.988,18.533-29.714,25.872-29.714c2.201,0,3.122,1.108,3.122,3.486 c-0.196,2.555-0.882,5.047-2.019,7.346l-19.821,42.18c-1.825,4.061-2.942,8.4-3.304,12.836c0,6.422,3.485,12.117,13.399,12.117 c12.854,0,22.571-9.721,33.577-24.211v3.117c0.921,11.555,7.342,21.643,24.406,21.643c20.184,0,36.524-13.941,46.424-36.129 c3.744-7.801,6.167-16.172,7.165-24.77c2.21,1.121,4.68,1.631,7.151,1.479c3.335,0.037,6.621-0.785,9.545-2.389l-3.486,7.518 c-4.049,8.439-8.452,17.793-11.924,25.686c-2.199,4.666-3.508,9.701-3.855,14.85c0,7.883,4.402,13.574,13.386,13.574 s21.291-8.438,30.098-20.359h0.191c-0.59,2.465-0.901,4.986-0.931,7.518c0,6.605,2.024,12.842,11.199,12.842 c10.653,0,18.898-7.705,26.979-17.428l-6.796,15.41h22.206l17.806-40.352c10.092-22.742,20.183-36.496,29.534-36.496 c1.607-0.057,2.981,1.148,3.133,2.75v0.543c0,3.855-5.511,14.309-10.461,24.762c-4.595,9.539-8.082,16.871-10.461,22.563 c-2.208,4.795-3.514,9.953-3.855,15.219c0,6.967,3.855,12.287,12.485,12.287c12.839,0,25.871-12.471,32.83-21.828 c-1.57,4.486-2.433,9.186-2.557,13.936c0,12.846,7.697,19.264,18.527,19.264c7.196-0.055,14.191-2.363,20.006-6.6 c8.437-5.873,15.234-14.674,20.922-22.744l-3.855-3.672c-5.319,7.521-11.199,14.676-17.258,19.078 c-3.193,2.699-7.199,4.25-11.378,4.402c-4.579,0-7.52-2.387-7.52-8.25s2.748-13.76,6.975-24.4 c0.176-0.178,6.234-13.754,11.923-26.773c4.772-11.012,9.544-21.645,10.461-23.846h14.495l2.938-6.604h-14.315L690.057,167.825z M64.122,273.656c-3.118,0-5.32-1.1-5.32-5.135c0.182-10.824,9.171-30.08,20.372-45.49c7.888-10.637,18.163-18.521,29.174-18.521 L94.4,235.685C83.94,259.166,72.563,273.656,64.122,273.656z M201.383,273.656c-3.117,0-5.319-1.1-5.5-5.135 c0.182-10.824,9.172-30.08,20.369-45.49c7.886-10.637,18.165-18.521,29.175-18.521l-13.95,31.175 c-10.64,24.033-21.466,37.971-30.097,37.971H201.383z M445.071,212.951c-0.547,11.918-11.008,40.709-23.301,57.957 c-4.949,6.969-9.176,8.984-12.839,8.984c-5.143,0-6.62-4.221-5.882-10.455c1.094-10.82,10.092-36.131,22.577-53.555 c5.688-7.887,9.545-11.19,13.947-11.19C443.977,204.692,445.262,208.362,445.071,212.951z M787.559,198.821l20.212-46.649h-23.92 l-20.213,46.649h-50.841l-8.481,19.563h50.856l-20.212,46.648h23.92l20.214-46.648h50.84l8.467-19.563H787.559z"/></svg></span>`;
    providerCode = "paramount";
  } else if (activeProvider === "googletv") {
    providerChip = `<span class="googletv-chip" aria-label="Google TV"><svg viewBox="0 0 2896 500" width="64" height="11" aria-hidden="true"><g fill="#ffffff"><path d="m2500 99.4v286.2h-41.7v-286.2h-91.4v-40.3h224.1v40.3z"/><path d="m2776.8 386.2h-43.8l-114.7-326.4h46.7l89.4 264.9h2l92.9-264.9h46.7z"/><path d="m960 393.2c-101.9 0-187.3-83-187.3-184.9s85.5-184.9 187.3-184.9c56.1 0 96.4 21.9 126.7 50.7l-35.8 35.8c-21.9-20.4-50.7-36.3-90.9-36.3-74.5 0-132.7 60.1-132.7 134.2 0 74.5 58.1 134.2 132.7 134.2 48.2 0 75.5-19.4 93.4-36.8 14.4-14.4 23.9-35.3 27.3-63.6h-120.7v-50.6h170c2 8.9 2.5 19.9 2.5 31.3 0 37.8-10.4 84.5-43.7 118.3-32.4 34.7-73.6 52.6-128.8 52.6z"/><path d="m1395.3 274.5c0 68.6-52.7 118.8-117.3 118.8s-117.3-50.7-117.3-118.8c0-69.1 52.7-118.8 117.3-118.8 64.6.1 117.3 49.7 117.3 118.8zm-51.2 0c0-42.7-30.3-72.1-66.1-72.1-35.3 0-66.1 29.3-66.1 72.1 0 42.2 30.3 72.1 66.1 72.1 35.3 0 66.1-29.8 66.1-72.1z"/><path d="m1658.2 274.4c0 68.6-52.7 118.8-117.3 118.8s-117.3-50.7-117.3-118.8c0-69.1 52.7-118.8 117.3-118.8 64.6-.5 117.3 49.7 117.3 118.8zm-51.2 0c0-42.7-30.3-72.1-66.1-72.1-35.3 0-66.1 29.3-66.1 72.1 0 42.2 30.3 72.1 66.1 72.1 35.3 0 66.1-29.9 66.1-72.1z"/><path d="m1914.6 162.6v213.7c0 88-51.7 123.7-113.3 123.7-57.6 0-92.4-38.8-105.3-70.1l45.7-18.9c7.9 19.4 27.8 42.2 60.1 42.2 39.3 0 63.6-24.3 63.6-70.1v-16.9h-2c-11.9 14.4-34.3 26.8-62.6 26.8-59.6 0-113.8-51.7-113.8-118.3 0-67.1 54.7-119.3 113.8-119.3 28.3 0 50.7 12.4 62.6 26.3h2v-19.4h49.2zm-46.2 112.3c0-41.7-27.8-72.6-63.6-72.6-36.3 0-66.1 30.8-66.1 72.6 0 41.2 30.3 71.6 66.1 71.6 35.7 0 63.6-30.4 63.6-71.6z"/><path d="m2006 36.5v349.8h-52.2v-349.8z"/><path d="m2211.7 313.7 40.7 26.8c-12.9 19.4-44.7 52.7-98.9 52.7-67.6 0-116.3-52.2-116.3-118.8 0-70.6 49.2-118.8 110.3-118.8 61.6 0 91.9 49.2 101.9 75.5l5.5 13.4-159 65.6c11.9 23.9 31.3 36.3 57.6 36.3 26.4.1 44.3-12.9 58.2-32.7zm-125.2-42.8 106.3-44.2c-6-14.9-23.4-25.3-44.2-25.3-26.3 0-63.1 23.3-62.1 69.5z"/></g><path d="m497.4 0h-337.9c-29.3 0-53.2 23.9-53.2 53.2v53.2h411.9c29.3 0 53.2 23.9 53.2 53.2v-85.6c0-41.2-33.3-74-74-74z" fill="#4285f4"/><path d="m74 0c-40.7 0-74 33.3-74 74v183.4c0 29.3 23.9 53.2 53.2 53.2h53.2v-257.4c0-29.3 23.9-53.2 53.2-53.2z" fill="#34a853"/><path d="m74 416.9h337.9c29.3 0 53.2-23.9 53.2-53.2v-53.2h-411.9c-29.3.1-53.2-23.8-53.2-53.1v86c0 40.2 32.8 73.5 74 73.5z" fill="#fbbc04"/><path d="m497.4 416.9c40.7 0 74-33.3 74-74v-183.4c0-29.3-23.9-53.2-53.2-53.2h-53.2v257.4c0 29.3-23.8 53.2-53.2 53.2z" fill="#ea4335"/></svg></span>`;
    providerCode = "googletv";
  } else if (activeProvider === "mubi") {
    providerChip = `<span class="mubi-chip" aria-label="MUBI"><svg viewBox="-71.23 273.35 213.52 65.44" width="49" height="15" aria-hidden="true"><g fill="#ffffff"><path d="m 47.33547,319.67101 a 12.080875,12.080875 0 0 0 -4.146021,-3.88673 10.398125,10.398125 0 0 0 3.116792,-3.25967 q 1.169458,-1.94204 1.172104,-4.74662 a 10.63625,10.63625 0 0 0 -0.915459,-4.45823 10.080625,10.080625 0 0 0 -2.542645,-3.43958 11.467042,11.467042 0 0 0 -3.889375,-2.20134 15.165916,15.165916 0 0 0 -4.945063,-0.77258 H 15.463762 v 40.02881 h 20.865041 a 15.012458,15.012458 0 0 0 5.117042,-0.83079 11.840104,11.840104 0 0 0 3.96875,-2.31246 10.207625,10.207625 0 0 0 2.574396,-3.61421 11.641667,11.641667 0 0 0 0.915458,-4.68577 q 0.0026,-3.42106 -1.568979,-5.82083 z M 22.895907,303.20599 h 11.718396 q 2.57175,0 4.003146,1.23031 1.431396,1.23031 1.42875,3.63008 0,2.39713 -1.42875,3.77296 -1.42875,1.37584 -4.003146,1.37054 H 22.895907 Z m 17.234959,25.92916 q -1.341438,1.51607 -4.373563,1.51607 H 22.895907 v -11.15219 h 12.861396 q 2.973917,0 4.347104,1.6854 a 6.1991874,6.1991874 0 0 1 1.370542,4.03225 q 0,2.40241 -1.344083,3.9026 z"/><path d="m 0.7688036,336.59111 a 15.345833,15.345833 0 0 0 5.2308124,-3.28612 14.210771,14.210771 0 0 0 3.286125,-4.91596 15.904104,15.904104 0 0 0 1.145646,-6.0325 V 296.91684 H 3.0098244 v 25.43969 a 10.548937,10.548937 0 0 1 -0.6693958,3.85233 7.9374999,7.9374999 0 0 1 -1.85208332,2.8575 8.1306457,8.1306457 0 0 1 -2.88660418,1.80182 11.490854,11.490854 0 0 1 -7.4877082,0 8.1412291,8.1412291 0 0 1 -2.8892499,-1.80182 8.0036457,8.0036457 0 0 1 -1.852083,-2.8575 10.607146,10.607146 0 0 1 -0.656167,-3.86027 v -25.43175 h -7.442729 v 25.43969 a 15.954375,15.954375 0 0 0 1.143,6.0325 14.210771,14.210771 0 0 0 3.286125,4.91596 15.433146,15.433146 0 0 0 5.204354,3.28612 20.595166,20.595166 0 0 0 13.8615206,0"/><path d="m -49.078696,336.93507 9.091083,-17.43604 q 0.79375,-1.48431 1.426105,-2.80194 0.632354,-1.31762 1.201208,-2.60085 0.5715,-1.28588 1.116542,-2.62996 0.545041,-1.34408 1.172104,-2.8284 h 0.227541 q -0.116416,1.5875 -0.227541,3.00038 c -0.07937,0.93398 -0.134938,1.83885 -0.171979,2.71462 -0.03704,0.87577 -0.06615,1.7833 -0.08731,2.71727 -0.02117,0.93398 -0.0291,1.93411 -0.0291,3.00038 v 16.86454 h 7.432146 v -40.01823 h -8.28675 l -7.776104,15.20561 q -0.79375,1.54781 -1.457854,2.86014 c -0.439209,0.87577 -0.85725,1.73567 -1.256771,2.57175 -0.399521,0.83609 -0.79375,1.69598 -1.172104,2.5744 -0.378355,0.87841 -0.79375,1.80975 -1.201209,2.79929 q -0.629708,-1.48167 -1.201208,-2.80458 -0.5715,-1.32292 -1.172104,-2.5744 c -0.399521,-0.83608 -0.820209,-1.69598 -1.256771,-2.57175 -0.436563,-0.87577 -0.923396,-1.82827 -1.457854,-2.86015 l -7.776104,-15.20031 h -8.28675 v 40.01823 h 7.4295 v -16.86454 q 0,-1.5875 -0.02646,-3.00038 -0.02646,-1.41287 -0.08731,-2.71727 -0.05556,-1.32291 -0.171979,-2.71462 -0.116417,-1.39171 -0.227542,-3.00038 h 0.227542 q 0.5715,1.48432 1.143,2.8284 0.5715,1.34408 1.145646,2.62996 c 0.378354,0.85725 0.78052,1.72508 1.198562,2.60085 0.418042,0.87577 0.896938,1.8124 1.42875,2.80194 z"/><rect height="40.01823" width="7.4321456" y="296.91684" x="53.706631"/><circle cx="132.52336" cy="305.60046" r="8.765646"/><circle cx="87.382805" cy="305.60046" r="8.765646"/><circle cx="109.95441" cy="305.60046" r="8.765646"/><circle cx="87.382805" cy="283.11618" r="8.765646"/><circle cx="109.95441" cy="283.11618" r="8.765646"/><circle cx="87.382805" cy="328.0874" r="8.765646"/><circle cx="109.95441" cy="328.0874" r="8.765646"/></g></svg></span>`;
    providerCode = "mubi";
  } else if (activeProvider === "peacock") {
    providerChip = `<span class="peacock-chip" aria-label="Peacock"><svg viewBox="0 0 1607 400" width="56" height="14" aria-hidden="true"><defs><linearGradient id="peacockChip${movieId}" x1="1575.74" x2="1575.74" y1="-.83" y2="400.19" gradientUnits="userSpaceOnUse"><stop stop-color="#ffdc23"/><stop offset=".16" stop-color="#ff8700"/><stop offset=".21" stop-color="#ff5401"/><stop offset=".37" stop-color="#d9005a"/><stop offset=".42" stop-color="#c814c8"/><stop offset=".58" stop-color="#8250ff"/><stop offset=".63" stop-color="#6e64ff"/><stop offset=".79" stop-color="#00c8ff"/><stop offset=".84" stop-color="#00cc99"/><stop offset=".99" stop-color="#00a637"/></linearGradient></defs><path fill="url(#peacockChip${movieId})" d="M1606.99 31.25c0 17.26-13.99 31.25-31.25 31.25s-31.25-13.99-31.25-31.25S1558.48 0 1575.74 0s31.25 13.99 31.25 31.25m-31.25 53.13c-17.26 0-31.25 13.99-31.25 31.25s13.99 31.25 31.25 31.25 31.25-13.99 31.25-31.25-13.99-31.25-31.25-31.25m0 84.37c-17.26 0-31.25 13.99-31.25 31.25s13.99 31.25 31.25 31.25 31.25-13.99 31.25-31.25-13.99-31.25-31.25-31.25m0 84.37c-17.26 0-31.25 13.99-31.25 31.25s13.99 31.25 31.25 31.25 31.25-13.99 31.25-31.25-13.99-31.25-31.25-31.25m0 84.38c-17.26 0-31.25 13.99-31.25 31.25s13.99 31.25 31.25 31.25 31.25-13.99 31.25-31.25-13.99-31.25-31.25-31.25"/><path fill="#ffffff" d="M1213.52 89.3501c15.38 0 29.97 3.16 43.38 9.86V155.6c-11.04-9.86-27.61-17.35-44.57-17.35-33.52 0-59.15 27.21-59.15 62.31s25.63 61.91 59.95 61.12c16.96 0 33.12-5.92 43.78-16.56v55.6c-14.2 6.31-28.79 10.65-44.57 10.65-61.92 0-112-49.69-112-110.81s51.27-111.1999 113.19-111.1999zM217.7 194.64c0 65.68-50.87 117.91-164.85 131.01v69.71H0v-195.2c0-69.8 49.3-110.8099 111.22-110.8099S217.7 135.49 217.7 194.64m-52.85 1.97c0-32.34-24.45-56.78-55.61-56.78s-56.4 22.08-56.4 60.33v75.28c42.33-1.2 112-24.91 112-78.83zm536.36 3.94c0 61.12 49.69 110.81 112 110.81 15.38 0 30.37-4.34 44.18-10.65v-55.6c-10.25 10.25-26.82 16.56-43.38 16.56-34.31.79-59.95-26.42-59.95-61.12s25.63-62.31 59.15-62.31c16.96 0 33.13 7.49 44.18 17.35V99.2001c-13.41-6.7-28-9.86-42.6-9.86-62.71 0-113.58 49.6899-113.58 111.1999zm780.88 104.5-91.82-108.36 81.57-101.0399h-64.68l-77.3 102.5399V5.36011h-53.24V305.06h53.24V201.17l87.95 103.89h64.28zm-795.07-94.64v94.64h-52.85v-22.7c-16.27 18.33-39.33 29.01-65.86 29.01-56.4 0-102.54-49.69-102.54-110.02S513.09 89.3501 577.38 89.3501c71.78 0 109.64 52.8399 109.64 121.0599m-53.24-9.86c0-35.1-24.45-62.31-57.58-62.31s-58.77 27.21-58.77 62.31 25.64 61.91 58.77 61.91 57.58-26.82 57.58-61.91m453.93 0c0 61.12-50.48 110.81-112.4 110.81s-112-49.69-112-110.81 50.87-111.1999 112-111.1999 112.4 50.0799 112.4 111.1999m-52.85 0c0-35.49-26.03-62.31-59.55-62.31s-59.15 27.21-59.15 62.31 25.63 61.91 59.15 61.91 59.55-27.21 59.55-61.91m-583.68-2.36c0 5.13-.4 13.8-1.18 22.87H285.4c7.99 25.74 31.55 41.8 64.83 41.8 25.24 0 49.3-9.07 69.8-26.42v54.81c-17.75 12.62-42.59 20.11-71.38 20.11-68.62 0-117.53-45.35-117.53-109.23s50.09-112.7799 112-112.7799S451.58 137.85 451.18 198.19M285.8 178.87h110.56c-6.82-24.48-26.88-41.01-53.63-41.01s-48.96 16.56-56.92 41.01z"/></svg></span>`;
    providerCode = "peacock";
  } else if (activeProvider === "crunchyroll") {
    providerChip = `<span class="crunchyroll-chip" aria-label="Crunchyroll"><svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true" style="margin-right:4px;flex:none;"><path d="M2.909 13.436C2.914 7.61 7.642 2.893 13.468 2.898c5.576.005 10.137 4.339 10.51 9.819q.021-.351.022-.706C24.007 5.385 18.64.006 12.012 0S.007 5.36 0 11.988 5.36 23.994 11.988 24q.412 0 .815-.027c-5.526-.338-9.9-4.928-9.894-10.538Zm16.284.155a4.1 4.1 0 0 1-4.095-4.103 4.1 4.1 0 0 1 2.712-3.855 8.95 8.95 0 0 0-4.187-1.037 9.007 9.007 0 1 0 8.997 9.016q-.001-.847-.15-1.651a4.1 4.1 0 0 1-3.278 1.63Z"/></svg>Crunchyroll</span>`;
    providerCode = "crunchyroll";
  } else if (activeProvider === "okko") {
    providerChip = `<span class="okko-chip" aria-label="Okko"><svg viewBox="0 0 2922 1036" width="44" height="16" aria-hidden="true"><g fill="#ffffff"><path d="M401,237C180,237,0,415,0,637c0,221,180,399,401,399c222,0,402-178,402-399C803,415,623,237,401,237z M401,869c-123,0-224-109-224-232c0-124,101-233,224-233c124,0,225,109,225,233C626,760,525,869,401,869z"/><path d="M171,177c48,0,88-40,88-89c0-48-40-88-88-88c-49,0-89,40-89,88C82,137,122,177,171,177z"/><path d="M631,177c48,0,88-40,88-89c0-48-40-88-88-88c-49,0-89,40-89,88C542,137,582,177,631,177z"/><path d="M401,177c48,0,88-40,88-89c0-48-40-88-88-88c-49,0-89,40-89,88C312,137,352,177,401,177z"/><polygon points="2173,251 1978,251 1747,572 1747,13 1570,13 1570,1022 1747,1022 1747,701 1996,1022 2205,1022 1898,632"/><polygon points="1487,251 1292,251 1061,572 1061,13 884,13 884,1022 1061,1022 1061,701 1310,1022 1519,1022 1212,632"/><path d="M2520,237c-221,0-401,178-401,400c0,221,180,399,401,399c222,0,402-178,402-399C2922,415,2742,237,2520,237z M2519,869c-123,0-224-109-224-232c0-124,101-233,224-233c124,0,225,109,225,233C2744,760,2643,869,2519,869z"/></g></svg></span>`;
    providerCode = "okko";
  } else if (activeProvider === "disney") {
    providerChip = `<span class="disney-chip" aria-label="Disney+"><svg viewBox="0 0 1041 565" width="42" height="23" aria-hidden="true"><defs><radialGradient id="disneyArcChip${movieId}" gradientUnits="userSpaceOnUse" cx="942.524" cy="279.896" r="760.124"><stop offset="0.01" stop-color="#67e8f9" stop-opacity="1"/><stop offset="0.18" stop-color="#22d3ee" stop-opacity="1"/><stop offset="0.45" stop-color="#38bdf8" stop-opacity="0.7"/><stop offset="1" stop-color="#0ea5e9" stop-opacity="0"/></radialGradient></defs><path d="M735.8 365.7 C721.4 369 683.5 370.9 683.5 370.9 L678.7 385.9 C678.7 385.9 697.6 384.3 711.4 385.7 711.4 385.7 715.9 385.2 716.4 390.8 716.6 396 716 401.6 716 401.6 716 401.6 715.7 405 710.9 405.8 705.7 406.7 670.1 408 670.1 408 L664.3 427.5 C664.3 427.5 662.2 432 667 430.7 671.5 429.5 708.8 422.5 713.7 423.5 718.9 424.8 724.7 431.7 723 438.1 721 445.9 683.8 469.7 661.1 468 661.1 468 649.2 468.8 639.1 452.7 629.7 437.4 642.7 408.3 642.7 408.3 642.7 408.3 636.8 394.7 641.1 390.2 641.1 390.2 643.7 387.9 651.1 387.3 L660.2 368.4 C660.2 368.4 649.8 369.1 643.6 361.5 637.8 354.2 637.4 350.9 641.8 348.9 646.5 346.6 689.8 338.7 719.6 339.7 719.6 339.7 730 338.7 738.9 356.7 738.8 356.7 743.2 364 735.8 365.7 Z M623.7 438.3 C619.9 447.3 609.8 456.9 597.3 450.9 584.9 444.9 565.2 404.6 565.2 404.6 565.2 404.6 557.7 389.6 556.3 389.9 556.3 389.9 554.7 387 553.7 403.4 552.7 419.8 553.9 451.7 547.4 456.7 541.2 461.7 533.7 459.7 529.8 453.8 526.3 448 524.8 434.2 526.7 410 529 385.8 534.6 360 541.8 351.9 549 343.9 554.8 349.7 557 351.8 557 351.8 566.6 360.5 582.5 386.1 L585.3 390.8 C585.3 390.8 599.7 415 601.2 414.9 601.2 414.9 602.4 416 603.4 415.2 604.9 414.8 604.3 407 604.3 407 604.3 407 601.3 380.7 588.2 336.1 588.2 336.1 586.2 330.5 587.6 325.3 588.9 320 594.2 322.5 594.2 322.5 594.2 322.5 614.6 332.7 624.4 365.9 634.1 399.4 627.5 429.3 623.7 438.3 Z M523.5 353 C521.8 356.4 520.8 361.3 512.2 362.6 512.2 362.6 429.9 368.2 426 374 426 374 423.1 377.4 427.6 378.4 432.1 379.3 450.7 381.8 459.7 382.3 469.3 382.4 501.7 382.7 513.3 397.2 513.3 397.2 520.2 404.1 519.9 419.7 519.6 435.7 516.8 441.3 510.6 447.1 504.1 452.5 448.3 477.5 412.3 439.1 412.3 439.1 395.7 420.6 418 406.6 418 406.6 434.1 396.9 475 408.3 475 408.3 487.4 412.8 486.8 417.3 486.1 422.1 476.6 427.2 462.8 426.9 449.4 426.5 439.6 420.1 441.5 421.1 443.3 421.8 427.1 413.3 422.1 419.1 417.1 424.4 418.3 427.7 423.2 431 435.7 438.1 484 435.6 498.4 419.6 498.4 419.6 504.1 413.1 495.4 407.8 486.7 402.8 461.8 399.8 452.1 399.3 442.8 398.8 408.2 399.4 403.2 390.2 403.2 390.2 398.2 384 403.7 366.4 409.5 348 449.8 340.9 467.2 339.3 467.2 339.3 515.1 337.6 523.9 347.4 523.8 347.4 525 349.7 523.5 353 Z M387.5 460.9 C381.7 465.2 369.4 463.3 365.9 458.5 362.4 454.2 361.2 437.1 361.9 410.3 362.6 383.2 363.2 349.6 369 344.3 375.2 338.9 379 343.6 381.4 347.3 384 350.9 387.1 354.9 387.8 363.4 388.4 371.9 390.4 416.5 390.4 416.5 390.4 416.5 393 456.7 387.5 460.9 Z M400 317.1 C383.1 322.7 371.5 320.8 361.7 316.6 357.4 324.1 354.9 326.4 351.6 326.9 346.8 327.4 342.5 319.7 341.7 317.2 340.9 315.3 338.6 312.1 341.4 304.5 331.8 295.9 331.1 284.3 332.7 276.5 335.1 267.5 351.3 233.3 400.6 229.3 400.6 229.3 424.7 227.5 428.8 240.4 L429.5 240.4 C429.5 240.4 452.9 240.5 452.4 261.3 452.1 282.2 426.4 308.2 400 317.1 Z M354 270.8 C349 278.8 348.8 283.6 351.1 286.9 356.8 278.2 367.2 264.5 382.5 254.1 370.7 255.1 360.8 260.2 354 270.8 Z M422.1 257.4 C406.6 259.7 382.6 280.5 371.2 297.5 388.7 300.7 419.6 299.5 433.3 271.6 433.2 271.6 439.8 254.3 422.1 257.4 Z M842.9 418.5 C833.6 434.7 807.5 468.5 772.7 460.6 761.2 488.5 751.6 516.6 746.1 558.8 746.1 558.8 744.9 567 738.1 564.1 731.4 561.7 720.2 550.5 718 535 715.6 514.6 724.7 480.1 743.2 440.6 737.8 431.8 734.1 419.2 737.3 401.3 737.3 401.3 742 368.1 775.3 338.1 775.3 338.1 779.3 334.6 781.6 335.7 784.2 336.8 783 347.6 780.9 352.8 778.8 358 763.9 383.8 763.9 383.8 763.9 383.8 754.6 401.2 757.2 414.9 774.7 388 814.5 333.7 839.2 350.8 847.5 356.7 851.3 369.6 851.3 383.5 851.2 395.8 848.3 408.8 842.9 418.5 Z M835.7 375.9 C835.7 375.9 834.3 365.2 823.9 377 814.9 386.9 798.7 405.6 785.6 430.9 799.3 429.4 812.5 421.9 816.5 418.1 823 412.3 838.1 396.7 835.7 375.9 Z M350.2 389.5 C348.3 413.7 339 454.4 273.1 474.5 229.6 487.6 188.5 481.3 166.1 475.6 165.6 484.5 164.6 488.3 163.2 489.8 161.3 491.7 147.1 499.9 139.3 488.3 135.8 482.8 134 472.8 133 463.9 82.6 440.7 59.4 407.3 58.5 405.8 57.4 404.7 45.9 392.7 57.4 378 68.2 364.7 103.5 351.4 135.3 346 136.4 318.8 139.6 298.3 143.4 288.9 148 278 153.8 287.8 158.8 295.2 163 300.7 165.5 324.4 165.7 343.3 186.5 342.3 198.8 343.8 222 348 252.2 353.5 272.4 368.9 270.6 386.4 269.3 403.6 253.5 410.7 247.5 411.2 241.2 411.7 231.4 407.2 231.4 407.2 224.7 404 230.9 401.2 239 397.7 247.8 393.4 245.8 389 245.8 389 242.5 379.4 203.3 372.7 164.3 372.7 164.1 394.2 165.2 429.9 165.7 450.7 193 455.9 213.4 454.9 213.4 454.9 213.4 454.9 313 452.1 316 388.5 319.1 324.8 216.7 263.7 141 244.3 65.4 224.5 22.6 238.3 18.9 240.2 14.9 242.2 18.6 242.8 18.6 242.8 18.6 242.8 22.7 243.4 29.8 245.8 37.3 248.2 31.5 252.1 31.5 252.1 18.6 256.2 4.1 253.6 1.3 247.7 -1.5 241.8 3.2 236.5 8.6 228.9 14 220.9 19.9 221.2 19.9 221.2 113.4 188.8 227.3 247.4 227.3 247.4 334 301.5 352.2 364.9 350.2 389.5 Z M68 386.2 C57.4 391.4 64.7 398.9 64.7 398.9 84.6 420.3 109.1 433.7 132.4 442 135.1 405.1 134.7 392.1 135 373.5 98.6 376 77.6 381.8 68 386.2 Z" fill="#ffffff"/><path d="M1040.9 378.6 L1040.9 391.8 C1040.9 394.7 1038.6 397 1035.7 397 L972.8 397 C972.8 400.3 972.9 403.2 972.9 405.9 972.9 425.4 972.1 441.3 970.2 459.2 969.9 461.9 967.7 463.9 965.1 463.9 L951.5 463.9 C950.1 463.9 948.8 463.3 947.9 462.3 947 461.3 946.5 459.9 946.7 458.5 948.6 440.7 949.5 425 949.5 405.9 949.5 403.1 949.5 400.2 949.4 397 L887.2 397 C884.3 397 882 394.7 882 391.8 L882 378.6 C882 375.7 884.3 373.4 887.2 373.4 L948.5 373.4 C947.2 351.9 944.6 331.2 940.4 310.2 940.2 308.9 940.5 307.6 941.3 306.6 942.1 305.6 943.3 305 944.6 305 L959.3 305 C961.6 305 963.5 306.6 964 308.9 968.1 330.6 970.7 351.7 972 373.4 L1035.7 373.4 C1038.5 373.4 1040.9 375.8 1040.9 378.6 Z" fill="#ffffff"/><path d="M955.3 273.9 C922.8 194 867.9 125.9 796.5 76.9 723.4 26.8 637.7 0.3 548.7 0.3 401.5 0.3 264.9 73.4 183.4 195.9 182.5 197.2 182.3 198.9 182.8 200.4 183.3 202 184.5 203.1 186 203.6 L197.4 207.5 C198.1 207.7 198.8 207.8 199.4 207.8 201.5 207.8 203.5 206.7 204.7 205 242.1 150 292.7 104.3 351.1 72.7 411.4 40.1 479.7 22.8 548.6 22.8 631.9 22.8 712.2 47.4 781 93.8 848.1 139.1 900.2 202.4 931.7 276.7 932.6 278.9 934.8 280.4 937.2 280.4 L950.8 280.4 C952.4 280.4 953.9 279.6 954.7 278.3 955.7 277 955.9 275.4 955.3 273.9 Z" fill="url(#disneyArcChip${movieId})"/></svg></span>`;
    providerCode = "disney";
  } else if (activeProvider === "hulu") {
    providerChip = `<span class="hulu-chip" aria-label="Hulu"><svg viewBox="0 0 57 20" width="38" height="13" aria-hidden="true"><g fill="#040405"><path d="M2 2h4.4v6.2c.9-1.1 2.2-1.7 3.9-1.7 3 0 4.9 1.9 4.9 5v6.5h-4.4v-5.7c0-1.5-.8-2.3-2-2.3-1.4 0-2.4.9-2.4 2.4V18H2V2z"/><path d="M18.2 7h4.4v5.7c0 1.5.8 2.3 2 2.3 1.3 0 2.2-.9 2.2-2.4V7h4.4v11h-4.2v-1.4c-.9 1.1-2.2 1.7-3.8 1.7-3 0-5-1.9-5-5V7z"/><path d="M34.2 2h4.4v16h-4.4V2z"/><path d="M41.6 7H46v5.7c0 1.5.8 2.3 2 2.3 1.3 0 2.2-.9 2.2-2.4V7h4.4v11h-4.2v-1.4c-.9 1.1-2.2 1.7-3.8 1.7-3 0-5-1.9-5-5V7z"/></g></svg></span>`;
    providerCode = "hulu";
  } else if (activeProvider === "prime") {
    providerChip = `<span class="prime-chip" aria-label="Prime Video"><svg viewBox="0 0 62 23" width="38" height="14" aria-hidden="true"><path fill="#ffffff" fill-rule="evenodd" d="M2 4.5h3.2v1.1c.8-.9 1.9-1.4 3.3-1.4 2.8 0 4.8 2.1 4.8 5s-2 5-4.8 5c-1.4 0-2.5-.5-3.3-1.4v4.7H2V4.5zm3.3 4.7c0 1.6 1 2.7 2.4 2.7s2.4-1.1 2.4-2.7-1-2.7-2.4-2.7-2.4 1.1-2.4 2.7zM15.2 4.5h3.2v1.6c.7-1.2 1.8-1.9 3.3-1.9.4 0 .8.1 1.1.2v3c-.4-.1-.8-.1-1.3-.1-1.8 0-3 1-3 3.1V14h-3.3V4.5zm9.2-3.7h3.4v2.6h-3.4V.8zm0 3.7h3.4V14h-3.4V4.5zm5.8 0h3.2v1.3c.7-1 1.8-1.6 3.2-1.6 1.5 0 2.6.6 3.2 1.7.8-1.1 2-1.7 3.5-1.7 2.4 0 4 1.6 4 4.1V14H44V8.9c0-1.4-.7-2.2-1.9-2.2s-2.1.8-2.1 2.2V14h-3.3V8.9c0-1.4-.7-2.2-1.9-2.2s-2.1.8-2.1 2.2V14h-3.3V4.5zm29.4 5.6h-6.8c.2 1.3 1.2 2 2.7 2 1 0 1.9-.3 2.6-.9l1.4 1.8c-1 .8-2.3 1.3-4.1 1.3-3.4 0-5.8-2.1-5.8-5s2.3-5.1 5.3-5.1c3.1 0 4.9 2.1 4.9 4.9 0 .4 0 .7-.2 1zm-6.8-1.8h4c-.1-1.2-.9-2-2-2-1.1 0-1.8.8-2 2z"/><path fill="#ffffff" d="M11.3 16.4c9.7 4.7 24.1 5 34.4-.5l-1.6-1.1c2.6-.2 5.4-.1 7.1.6-.5 1.9-1.4 4.1-2.6 5.6l-1.3-1.4c-10.8 6.2-26.6 5.7-37.2-.7-.7-.4-.1-1.8 1.2-2.5z"/></svg></span>`;
    providerCode = "prime";
  } else if (activeProvider === "max") {
    providerChip = `<span class="max-chip" aria-label="HBO Max"><svg viewBox="0 0 92 18" width="54" height="11" aria-hidden="true"><path fill="#ffffff" d="M1 1h4.6v6.6h5.2V1h4.6v16h-4.6v-6.1H5.6V17H1V1z"/><path fill="#ffffff" fill-rule="evenodd" d="M17.4 1h7.6c3.2 0 5.3 1.5 5.3 4.1 0 1.7-.9 2.9-2.4 3.5 1.9.6 2.9 1.9 2.9 3.9 0 2.9-2.2 4.5-5.6 4.5h-7.8V1zm4.4 3.3v3h2.6c1 0 1.6-.6 1.6-1.5s-.6-1.5-1.6-1.5h-2.6zm0 6.1v3.3h2.9c1.2 0 1.8-.6 1.8-1.6 0-1.1-.7-1.7-1.9-1.7h-2.8z"/><path fill="#ffffff" fill-rule="evenodd" d="M40.3.7c4.9 0 8.5 3.6 8.5 8.3s-3.6 8.3-8.5 8.3-8.5-3.6-8.5-8.3S35.4.7 40.3.7zm0 4.1c-2.3 0-4 1.8-4 4.2s1.7 4.2 4 4.2 4-1.8 4-4.2-1.7-4.2-4-4.2z"/><circle cx="40.3" cy="9" r="2.2" fill="#ffffff"/><path fill="#ffffff" fill-rule="evenodd" d="M51.5 5.2h2.7v1.2c.6-.9 1.5-1.4 2.7-1.4 1.3 0 2.2.5 2.7 1.5.7-1 1.7-1.5 3-1.5 2 0 3.3 1.3 3.3 3.5V16h-2.8v-6.9c0-1.1-.6-1.8-1.5-1.8-.9 0-1.6.7-1.6 1.8V16h-2.7V9.1c0-1.1-.6-1.8-1.5-1.8-.9 0-1.6.7-1.6 1.8V16h-2.7V5.2zM67.2 10.6c0-3.2 2.2-5.6 5.1-5.6 1.4 0 2.5.6 3.2 1.6V5.2h2.7V16h-2.7v-1.4c-.7 1-1.8 1.6-3.2 1.6-2.9 0-5.1-2.4-5.1-5.6zm2.7 0c0 1.8 1.1 3.1 2.7 3.1 1.5 0 2.7-1.2 2.7-3.1 0-1.8-1.2-3.1-2.7-3.1-1.6 0-2.7 1.3-2.7 3.1zM80 5.2h3.1l2.4 3.4 2.4-3.4H91l-3.7 5.2L91.2 16h-3.1l-2.6-3.7-2.6 3.7h-3.1l3.9-5.6L80 5.2z"/></svg></span>`;
    providerCode = "max";
  } else if (activeProvider === "apple") {
    providerChip = `<span class="apple-chip"><svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor" style="vertical-align:-1px;margin-right:3px;"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.4c.64-.78 1.08-1.86.96-2.95-1 .04-2.12.67-2.78 1.45-.58.67-1.1 1.77-.96 2.83 1.12.09 2.15-.56 2.78-1.33z"/></svg>Apple TV</span>`;
    providerCode = "apple";
  }

  return `<div class="movie-tile streaming-tile" data-media-type="${esc(item.media_type || "movie")}" data-provider="${providerCode}">
    <a class="movie-card" href="#movie/${movieId}">
      ${poster}
      <div class="streaming-card-badges">
        ${providerChip}
        <span class="media-type-chip">${mediaLabel}</span>
      </div>
      ${renderRatingBadge(item)}
      ${isWatched ? `<strong class="watched-badge">${t("watched")}</strong>` : ""}
      <div class="card-copy">
        <h3>${esc(item.title)}</h3>
        <div class="card-meta"><span>${year(item.release_date)}</span></div>
      </div>
      <div class="card-preview">
        <p>${esc(item.overview || t("no_overview"))}</p>
      </div>
    </a>
    ${saveButton(item)}
    ${extraActions(item)}
  </div>`;
}

async function fountainPage() {
  app.innerHTML = '<div class="loading">Pouring the fountain…</div>';
  try {
    const data = await api("/api/home?v=fountain-lb500");
    if (location.hash !== "#fountain") return;
    const movies = fountainMovies(data).slice(0, fountainMovieLimit);
    const letterboxdMovies = shuffleList(data.letterboxd_top || [])
      .slice(0, fountainMovieLimit)
      .map((m) => ({ ...m, rating_source: "letterboxd" }));
    const imdbMovies = shuffleList(data.imdb_top || [])
      .slice(0, fountainMovieLimit)
      .map((m) => ({ ...m, rating_source: "imdb" }));
    app.innerHTML = fountain(data);
    bindFountainControls(movies, letterboxdMovies, imdbMovies);
    enhanceFountain(movies, letterboxdMovies, imdbMovies);
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
    : `<span class="score-unavailable">${t("no_rating_yet")}</span>`;
  const tmdbVotes = `${Number(m.vote_count || 0).toLocaleString("en-US")} ${t("votes")}`;

  let imdbScore = `<span class="score-unavailable">${t("no_rating_yet")}</span>`;
  if (typeof r.imdb === "number") {
    imdbScore = `<strong class="score-value">${r.imdb.toFixed(1)}<small>/10</small></strong>`;
  } else if (r.imdb_rating) {
    imdbScore = `<strong class="score-value">${esc(r.imdb_rating)}</strong>`;
  } else if (loading) {
    imdbScore = `<span class="score-unavailable">${t("loading_short")}</span>`;
  } else if (m.rating_source === "imdb" && m.vote_average) {
    imdbScore = `<strong class="score-value">${Number(m.vote_average).toFixed(1)}<small>/10</small></strong>`;
  }

  let letterboxdScore = `<span class="score-unavailable">${t("no_rating_yet")}</span>`;
  if (typeof r.letterboxd === "number") {
    letterboxdScore = `<strong class="score-value">${r.letterboxd.toFixed(2)}<small>/5</small></strong>`;
  } else if (loading) {
    letterboxdScore = `<span class="score-unavailable">${t("loading_short")}</span>`;
  } else if (
    typeof KNOWN_LETTERBOXD_SCORES !== "undefined" &&
    KNOWN_LETTERBOXD_SCORES[m.id]
  ) {
    letterboxdScore = `<strong class="score-value">${Number(KNOWN_LETTERBOXD_SCORES[m.id]).toFixed(2)}<small>/5</small></strong>`;
  }

  let rottenScore = `<span class="score-unavailable">${t("no_rating_yet")}</span>`;
  if (typeof r.rotten === "number") {
    rottenScore = `<strong class="score-value">${Math.round(r.rotten)}<small>%</small></strong>`;
  } else if (r.rotten_rating) {
    rottenScore = `<strong class="score-value">${esc(r.rotten_rating)}</strong>`;
  } else if (loading) {
    rottenScore = `<span class="score-unavailable">${t("loading_short")}</span>`;
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
    const isMasterpiece = fountain.score >= 90;
    const tagMarkup = isMasterpiece
      ? `<span class="fountain-score-tag fountain-score-tag--masterpiece">${t("score_masterpiece")}</span>`
      : "";

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
          ${tagMarkup}
        </div>
        <p class="fountain-score-desc">${esc(desc)}</p>
        <p class="fountain-score-formula"><span class="formula-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px;"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg></span> <span>${esc(t("fountain_score_formula"))}</span></p>
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
      <div class="score-source-row">
        <svg class="score-logo-mark" viewBox="0 0 28 14" width="28" height="14" aria-hidden="true">
          <defs>
            <linearGradient id="tmdb-bar" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#90cea1"/>
              <stop offset="100%" stop-color="#01b4e4"/>
            </linearGradient>
          </defs>
          <rect width="28" height="14" rx="3" fill="url(#tmdb-bar)"/>
          <text x="14" y="10.5" fill="#0d253f" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="900" font-size="8.5" text-anchor="middle" letter-spacing="-0.4">TMDB</text>
        </svg>
        <span class="score-source">TMDB</span>
      </div>
      ${tmdbScore}
      <span class="score-note">${tmdbVotes} · <a href="https://www.themoviedb.org/movie/${Number(m.id)}" target="_blank" rel="noopener noreferrer">Open</a></span>
    </div>
    <div class="score-card imdb-score">
      <div class="score-source-row">
        <svg class="score-logo-mark" viewBox="0 0 32 16" width="32" height="16" aria-hidden="true" style="border-radius:3px;">
          <rect width="32" height="16" rx="3" fill="#f5c518"/>
          <text x="16" y="12" fill="#000000" font-family="Impact, sans-serif" font-weight="900" font-size="11" text-anchor="middle" letter-spacing="0.5">IMDb</text>
        </svg>
        <span class="score-source">IMDb</span>
      </div>
      ${imdbScore}
      <span class="score-note">Audience rating · ${imdbUrl ? `<a href="${esc(imdbUrl)}" target="_blank" rel="noopener noreferrer">Open</a>` : "Not listed"}</span>
    </div>
    <div class="score-card letterboxd-score">
      <div class="score-source-row">
        <svg class="score-logo-mark" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <circle cx="6" cy="12" r="4.6" fill="#00e054"/>
          <circle cx="12" cy="12" r="4.6" fill="#ff8000"/>
          <circle cx="18" cy="12" r="4.6" fill="#40bcf4"/>
        </svg>
        <span class="score-source">Letterboxd</span>
      </div>
      ${letterboxdScore}
      <span class="score-note">Member rating · <a href="${esc(letterboxdUrl)}" target="_blank" rel="noopener noreferrer">Open</a></span>
    </div>
    <div class="score-card rotten-score">
      <div class="score-source-row">
        <svg class="score-logo-mark" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path fill="#fa320a" d="M12 2c-1.5 1-2.5 2.5-2.5 4-2-.5-4 1-4 3.5C5.5 16 8.5 22 12 22s6.5-6 6.5-12.5c0-2.5-2-4-4-3.5 0-1.5-1-3-2.5-4z"/>
          <path fill="#46d33a" d="M12 2c-.5 1.5-.5 3-1 4.5 1-.5 2-.5 3-1-.5-1-1.5-2.5-2-3.5z"/>
        </svg>
        <span class="score-source">Rotten Tomatoes</span>
      </div>
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
      <a class="text-link" href="#cast/${Number(m.id)}">${t("full_cast")}</a>
    </div>`;
  }
  const query = encodeURIComponent(
    `${m.title || ""} ${year(m.release_date)} official trailer`.trim(),
  );
  return `<div class="detail-links">
    <a class="trailer-button" href="https://www.youtube.com/results?search_query=${query}" target="_blank" rel="noopener noreferrer">${t("watch_trailer")}</a>
    <a class="text-link" href="#cast/${Number(m.id)}">${t("full_cast")}</a>
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

function countryFlag(code) {
  if (typeof code !== "string" || code.length !== 2) return "";
  const base = 127397;
  return String.fromCodePoint(
    ...code.toUpperCase().split("").map((c) => base + c.charCodeAt(0)),
  );
}

function detectUserCountry() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (
      tz.includes("Moscow") ||
      tz.includes("Yekaterinburg") ||
      tz.includes("Samara") ||
      tz.includes("Novosibirsk") ||
      tz.includes("Vladivostok")
    )
      return "RU";
    if (tz.includes("America/") || tz.includes("US/")) return "US";
    if (tz.includes("London")) return "GB";
    if (tz.includes("Berlin")) return "DE";
    if (tz.includes("Paris")) return "FR";
    if (
      tz.includes("Toronto") ||
      tz.includes("Vancouver") ||
      tz.includes("Montreal")
    )
      return "CA";
  } catch {}
  return savedLang === "ru" ? "RU" : "US";
}

const STREAMING_HUB_PROVIDER_MAP = {
  8: "netflix",
  175: "netflix",
  1796: "netflix",
  350: "apple",
  2: "apple",
  2243: "apple",
  1899: "max",
  384: "max",
  1825: "max",
  616: "max",
  9: "prime",
  119: "prime",
  10: "prime",
  2100: "prime",
  613: "prime",
  15: "hulu",
  337: "disney",
  531: "paramount",
  2303: "paramount",
  2616: "paramount",
  2304: "paramount",
  582: "paramount",
  633: "paramount",
  1853: "paramount",
  3: "googletv",
  11: "mubi",
  201: "mubi",
  386: "peacock",
  387: "peacock",
  283: "crunchyroll",
  1968: "crunchyroll",
  115: "okko",
  117: "kinopoisk",
};

const HUB_PROVIDER_DEFAULTS = {
  netflix: { region: "US", id: 8, name: "Netflix", logo_path: "inline:netflix" },
  apple: { region: "US", id: 350, name: "Apple TV", logo_path: "inline:apple" },
  max: { region: "US", id: 1899, name: "HBO Max", logo_path: "inline:max" },
  prime: { region: "US", id: 9, name: "Prime Video", logo_path: "inline:prime" },
  hulu: { region: "US", id: 15, name: "Hulu", logo_path: "inline:hulu" },
  disney: { region: "US", id: 337, name: "Disney+", logo_path: "inline:disney" },
  paramount: { region: "US", id: 531, name: "Paramount+", logo_path: "inline:paramount" },
  googletv: { region: "US", section: "buy", id: 3, name: "Google TV", logo_path: "inline:googletv" },
  mubi: { region: "US", id: 11, name: "MUBI", logo_path: "inline:mubi" },
  peacock: { region: "US", id: 386, name: "Peacock", logo_path: "inline:peacock" },
  crunchyroll: { region: "US", id: 283, name: "Crunchyroll", logo_path: "inline:crunchyroll" },
  okko: { region: "RU", id: 115, name: "Okko", logo_path: "inline:okko" },
  kinopoisk: { region: "RU", id: 117, name: "Kinopoisk", logo_path: "inline:kinopoisk" },
};

function matchStreamingHubProvider(provider) {
  if (!provider || typeof provider !== "object") return null;
  const byId = STREAMING_HUB_PROVIDER_MAP[Number(provider.id)];
  if (byId) return byId;
  const name = String(provider.name || "").trim().toLowerCase();
  if (!name) return null;
  if (/\bnetflix\b/.test(name)) return "netflix";
  if (/apple\s*tv/.test(name)) return "apple";
  if (/^(hbo\s*)?max(\b|\s)/.test(name)) return "max";
  if (/\bprime\s*video\b|\bamazon\s*(prime\s*)?video\b/.test(name)) return "prime";
  if (/\bhulu\b/.test(name)) return "hulu";
  if (/\bdisney\s*(?:\+|plus\b)/.test(name)) return "disney";
  if (/\bparamount\s*(?:\+|plus\b)/.test(name)) return "paramount";
  if (/\bgoogle\s*(?:tv|play(?:\s*movies)?)\b/.test(name)) return "googletv";
  if (/\bmubi\b/.test(name)) return "mubi";
  if (/\bpeacock\b/.test(name)) return "peacock";
  if (/\bcrunchyroll\b/.test(name)) return "crunchyroll";
  if (/\bokko\b|окко/.test(name)) return "okko";
  if (/kinopoisk|кинопоиск/.test(name)) return "kinopoisk";
  return null;
}

let watchLogoUid = 0;

function renderWatchProviderLogo(provider, hubProvider) {
  const logoPath = String(provider?.logo_path || "");
  if (logoPath === "inline:kinopoisk" || hubProvider === "kinopoisk") {
    watchLogoUid += 1;
    return `<span class="watch-provider-logo watch-provider-logo--inline watch-provider-logo--kp" aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20"><defs><linearGradient id="kpW${watchLogoUid}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ff5500"/><stop offset="65%" stop-color="#ff7a00"/><stop offset="100%" stop-color="#bbff00"/></linearGradient></defs><g fill="url(#kpW${watchLogoUid})"><path d="M3 2h5.5l-.8 6.5H3zM3 9.5h4.6l-.3 5H3zM3 15.5h4.2L6.5 22H3zM12.5 9.8l5.8-7.8h4.2l-7.2 8.5zM10 11.2l4.8-4.5 2.8 1.8-5.6 4zM10.2 12.8l5.4 3.8-2.6 2-4.8-4.5zM15.2 13.5l7.3 8.5h-4.2l-5.8-7.2z"/></g></svg></span>`;
  }
  if (logoPath === "inline:netflix") {
    return `<span class="watch-provider-logo watch-provider-logo--inline watch-provider-logo--netflix" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18"><path fill="#e50914" d="M5 2h3.4l5.2 14V2H17v20h-3.3L8.4 7.8V22H5V2z"/></svg></span>`;
  }
  if (logoPath === "inline:apple") {
    return `<span class="watch-provider-logo watch-provider-logo--inline watch-provider-logo--apple" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="#ffffff"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.4c.64-.78 1.08-1.86.96-2.95-1 .04-2.12.67-2.78 1.45-.58.67-1.1 1.77-.96 2.83 1.12.09 2.15-.56 2.78-1.33z"/></svg></span>`;
  }
  if (logoPath === "inline:max") {
    return `<span class="watch-provider-logo watch-provider-logo--inline watch-provider-logo--max" aria-hidden="true"><svg viewBox="0 0 40 16" width="24" height="10"><path fill="#ffffff" fill-rule="evenodd" d="M2 3h2.3v1c.5-.8 1.3-1.2 2.3-1.2 1.1 0 1.9.4 2.4 1.3.6-.9 1.5-1.3 2.6-1.3 1.7 0 2.9 1.1 2.9 3V13h-2.3V6.9c0-1-.5-1.6-1.3-1.6-.8 0-1.4.6-1.4 1.6V13H7.2V6.9c0-1-.5-1.6-1.3-1.6-.8 0-1.4.6-1.4 1.6V13H2V3zm13.7 5c0-2.8 1.9-5 4.5-5 1.2 0 2.2.5 2.8 1.4V3h2.3v10H23v-1.2c-.6.9-1.6 1.4-2.8 1.4-2.6 0-4.5-2.1-4.5-5zm2.4 0c0 1.6 1 2.8 2.4 2.8 1.3 0 2.4-1.1 2.4-2.8s-1.1-2.8-2.4-2.8c-1.4 0-2.4 1.2-2.4 2.8zM27.3 3H30l2.1 3 2.1-3h2.7L33.6 8l3.5 5h-2.7l-2.3-3.2L29.8 13h-2.7l3.4-5-3.2-5z"/></svg></span>`;
  }
  if (logoPath === "inline:prime") {
    return `<span class="watch-provider-logo watch-provider-logo--inline watch-provider-logo--prime" aria-hidden="true"><svg viewBox="0 0 36 16" width="24" height="11"><path fill="#ffffff" d="M5 10.2c6.8 3.3 16.8 3.5 24-.4l-1.1-.8c1.8-.1 3.8-.1 5 .4-.4 1.3-1 2.9-1.8 3.9l-.9-1C22.6 16.6 11.6 16.3 4.2 11.8c-.5-.3-.1-1.2.8-1.6z"/><text x="4" y="8.5" fill="#ffffff" font-family="system-ui,sans-serif" font-size="8" font-weight="800" letter-spacing="-0.3">prime</text></svg></span>`;
  }
  if (logoPath === "inline:hulu") {
    return `<span class="watch-provider-logo watch-provider-logo--inline watch-provider-logo--hulu" aria-hidden="true"><svg viewBox="0 0 57 20" width="26" height="9"><g fill="#1ce783"><path d="M2 2h4.4v6.2c.9-1.1 2.2-1.7 3.9-1.7 3 0 4.9 1.9 4.9 5v6.5h-4.4v-5.7c0-1.5-.8-2.3-2-2.3-1.4 0-2.4.9-2.4 2.4V18H2V2z"/><path d="M18.2 7h4.4v5.7c0 1.5.8 2.3 2 2.3 1.3 0 2.2-.9 2.2-2.4V7h4.4v11h-4.2v-1.4c-.9 1.1-2.2 1.7-3.8 1.7-3 0-5-1.9-5-5V7z"/><path d="M34.2 2h4.4v16h-4.4V2z"/><path d="M41.6 7H46v5.7c0 1.5.8 2.3 2 2.3 1.3 0 2.2-.9 2.2-2.4V7h4.4v11h-4.2v-1.4c-.9 1.1-2.2 1.7-3.8 1.7-3 0-5-1.9-5-5V7z"/></g></svg></span>`;
  }
  if (logoPath === "inline:disney") {
    watchLogoUid += 1;
    return `<span class="watch-provider-logo watch-provider-logo--inline watch-provider-logo--disney" aria-hidden="true"><svg viewBox="0 0 1041 565" width="28" height="16"><defs><radialGradient id="disneyArcW${watchLogoUid}" gradientUnits="userSpaceOnUse" cx="942.524" cy="279.896" r="760.124"><stop offset="0.01" stop-color="#67e8f9" stop-opacity="1"/><stop offset="0.18" stop-color="#22d3ee" stop-opacity="1"/><stop offset="0.45" stop-color="#38bdf8" stop-opacity="0.7"/><stop offset="1" stop-color="#0ea5e9" stop-opacity="0"/></radialGradient></defs><path d="M735.8 365.7 C721.4 369 683.5 370.9 683.5 370.9 L678.7 385.9 C678.7 385.9 697.6 384.3 711.4 385.7 711.4 385.7 715.9 385.2 716.4 390.8 716.6 396 716 401.6 716 401.6 716 401.6 715.7 405 710.9 405.8 705.7 406.7 670.1 408 670.1 408 L664.3 427.5 C664.3 427.5 662.2 432 667 430.7 671.5 429.5 708.8 422.5 713.7 423.5 718.9 424.8 724.7 431.7 723 438.1 721 445.9 683.8 469.7 661.1 468 661.1 468 649.2 468.8 639.1 452.7 629.7 437.4 642.7 408.3 642.7 408.3 642.7 408.3 636.8 394.7 641.1 390.2 641.1 390.2 643.7 387.9 651.1 387.3 L660.2 368.4 C660.2 368.4 649.8 369.1 643.6 361.5 637.8 354.2 637.4 350.9 641.8 348.9 646.5 346.6 689.8 338.7 719.6 339.7 719.6 339.7 730 338.7 738.9 356.7 738.8 356.7 743.2 364 735.8 365.7 Z M623.7 438.3 C619.9 447.3 609.8 456.9 597.3 450.9 584.9 444.9 565.2 404.6 565.2 404.6 565.2 404.6 557.7 389.6 556.3 389.9 556.3 389.9 554.7 387 553.7 403.4 552.7 419.8 553.9 451.7 547.4 456.7 541.2 461.7 533.7 459.7 529.8 453.8 526.3 448 524.8 434.2 526.7 410 529 385.8 534.6 360 541.8 351.9 549 343.9 554.8 349.7 557 351.8 557 351.8 566.6 360.5 582.5 386.1 L585.3 390.8 C585.3 390.8 599.7 415 601.2 414.9 601.2 414.9 602.4 416 603.4 415.2 604.9 414.8 604.3 407 604.3 407 604.3 407 601.3 380.7 588.2 336.1 588.2 336.1 586.2 330.5 587.6 325.3 588.9 320 594.2 322.5 594.2 322.5 594.2 322.5 614.6 332.7 624.4 365.9 634.1 399.4 627.5 429.3 623.7 438.3 Z M523.5 353 C521.8 356.4 520.8 361.3 512.2 362.6 512.2 362.6 429.9 368.2 426 374 426 374 423.1 377.4 427.6 378.4 432.1 379.3 450.7 381.8 459.7 382.3 469.3 382.4 501.7 382.7 513.3 397.2 513.3 397.2 520.2 404.1 519.9 419.7 519.6 435.7 516.8 441.3 510.6 447.1 504.1 452.5 448.3 477.5 412.3 439.1 412.3 439.1 395.7 420.6 418 406.6 418 406.6 434.1 396.9 475 408.3 475 408.3 487.4 412.8 486.8 417.3 486.1 422.1 476.6 427.2 462.8 426.9 449.4 426.5 439.6 420.1 441.5 421.1 443.3 421.8 427.1 413.3 422.1 419.1 417.1 424.4 418.3 427.7 423.2 431 435.7 438.1 484 435.6 498.4 419.6 498.4 419.6 504.1 413.1 495.4 407.8 486.7 402.8 461.8 399.8 452.1 399.3 442.8 398.8 408.2 399.4 403.2 390.2 403.2 390.2 398.2 384 403.7 366.4 409.5 348 449.8 340.9 467.2 339.3 467.2 339.3 515.1 337.6 523.9 347.4 523.8 347.4 525 349.7 523.5 353 Z M387.5 460.9 C381.7 465.2 369.4 463.3 365.9 458.5 362.4 454.2 361.2 437.1 361.9 410.3 362.6 383.2 363.2 349.6 369 344.3 375.2 338.9 379 343.6 381.4 347.3 384 350.9 387.1 354.9 387.8 363.4 388.4 371.9 390.4 416.5 390.4 416.5 390.4 416.5 393 456.7 387.5 460.9 Z M400 317.1 C383.1 322.7 371.5 320.8 361.7 316.6 357.4 324.1 354.9 326.4 351.6 326.9 346.8 327.4 342.5 319.7 341.7 317.2 340.9 315.3 338.6 312.1 341.4 304.5 331.8 295.9 331.1 284.3 332.7 276.5 335.1 267.5 351.3 233.3 400.6 229.3 400.6 229.3 424.7 227.5 428.8 240.4 L429.5 240.4 C429.5 240.4 452.9 240.5 452.4 261.3 452.1 282.2 426.4 308.2 400 317.1 Z M354 270.8 C349 278.8 348.8 283.6 351.1 286.9 356.8 278.2 367.2 264.5 382.5 254.1 370.7 255.1 360.8 260.2 354 270.8 Z M422.1 257.4 C406.6 259.7 382.6 280.5 371.2 297.5 388.7 300.7 419.6 299.5 433.3 271.6 433.2 271.6 439.8 254.3 422.1 257.4 Z M842.9 418.5 C833.6 434.7 807.5 468.5 772.7 460.6 761.2 488.5 751.6 516.6 746.1 558.8 746.1 558.8 744.9 567 738.1 564.1 731.4 561.7 720.2 550.5 718 535 715.6 514.6 724.7 480.1 743.2 440.6 737.8 431.8 734.1 419.2 737.3 401.3 737.3 401.3 742 368.1 775.3 338.1 775.3 338.1 779.3 334.6 781.6 335.7 784.2 336.8 783 347.6 780.9 352.8 778.8 358 763.9 383.8 763.9 383.8 763.9 383.8 754.6 401.2 757.2 414.9 774.7 388 814.5 333.7 839.2 350.8 847.5 356.7 851.3 369.6 851.3 383.5 851.2 395.8 848.3 408.8 842.9 418.5 Z M835.7 375.9 C835.7 375.9 834.3 365.2 823.9 377 814.9 386.9 798.7 405.6 785.6 430.9 799.3 429.4 812.5 421.9 816.5 418.1 823 412.3 838.1 396.7 835.7 375.9 Z M350.2 389.5 C348.3 413.7 339 454.4 273.1 474.5 229.6 487.6 188.5 481.3 166.1 475.6 165.6 484.5 164.6 488.3 163.2 489.8 161.3 491.7 147.1 499.9 139.3 488.3 135.8 482.8 134 472.8 133 463.9 82.6 440.7 59.4 407.3 58.5 405.8 57.4 404.7 45.9 392.7 57.4 378 68.2 364.7 103.5 351.4 135.3 346 136.4 318.8 139.6 298.3 143.4 288.9 148 278 153.8 287.8 158.8 295.2 163 300.7 165.5 324.4 165.7 343.3 186.5 342.3 198.8 343.8 222 348 252.2 353.5 272.4 368.9 270.6 386.4 269.3 403.6 253.5 410.7 247.5 411.2 241.2 411.7 231.4 407.2 231.4 407.2 224.7 404 230.9 401.2 239 397.7 247.8 393.4 245.8 389 245.8 389 242.5 379.4 203.3 372.7 164.3 372.7 164.1 394.2 165.2 429.9 165.7 450.7 193 455.9 213.4 454.9 213.4 454.9 213.4 454.9 313 452.1 316 388.5 319.1 324.8 216.7 263.7 141 244.3 65.4 224.5 22.6 238.3 18.9 240.2 14.9 242.2 18.6 242.8 18.6 242.8 18.6 242.8 22.7 243.4 29.8 245.8 37.3 248.2 31.5 252.1 31.5 252.1 18.6 256.2 4.1 253.6 1.3 247.7 -1.5 241.8 3.2 236.5 8.6 228.9 14 220.9 19.9 221.2 19.9 221.2 113.4 188.8 227.3 247.4 227.3 247.4 334 301.5 352.2 364.9 350.2 389.5 Z M68 386.2 C57.4 391.4 64.7 398.9 64.7 398.9 84.6 420.3 109.1 433.7 132.4 442 135.1 405.1 134.7 392.1 135 373.5 98.6 376 77.6 381.8 68 386.2 Z" fill="#ffffff"/><path d="M1040.9 378.6 L1040.9 391.8 C1040.9 394.7 1038.6 397 1035.7 397 L972.8 397 C972.8 400.3 972.9 403.2 972.9 405.9 972.9 425.4 972.1 441.3 970.2 459.2 969.9 461.9 967.7 463.9 965.1 463.9 L951.5 463.9 C950.1 463.9 948.8 463.3 947.9 462.3 947 461.3 946.5 459.9 946.7 458.5 948.6 440.7 949.5 425 949.5 405.9 949.5 403.1 949.5 400.2 949.4 397 L887.2 397 C884.3 397 882 394.7 882 391.8 L882 378.6 C882 375.7 884.3 373.4 887.2 373.4 L948.5 373.4 C947.2 351.9 944.6 331.2 940.4 310.2 940.2 308.9 940.5 307.6 941.3 306.6 942.1 305.6 943.3 305 944.6 305 L959.3 305 C961.6 305 963.5 306.6 964 308.9 968.1 330.6 970.7 351.7 972 373.4 L1035.7 373.4 C1038.5 373.4 1040.9 375.8 1040.9 378.6 Z" fill="#ffffff"/><path d="M955.3 273.9 C922.8 194 867.9 125.9 796.5 76.9 723.4 26.8 637.7 0.3 548.7 0.3 401.5 0.3 264.9 73.4 183.4 195.9 182.5 197.2 182.3 198.9 182.8 200.4 183.3 202 184.5 203.1 186 203.6 L197.4 207.5 C198.1 207.7 198.8 207.8 199.4 207.8 201.5 207.8 203.5 206.7 204.7 205 242.1 150 292.7 104.3 351.1 72.7 411.4 40.1 479.7 22.8 548.6 22.8 631.9 22.8 712.2 47.4 781 93.8 848.1 139.1 900.2 202.4 931.7 276.7 932.6 278.9 934.8 280.4 937.2 280.4 L950.8 280.4 C952.4 280.4 953.9 279.6 954.7 278.3 955.7 277 955.9 275.4 955.3 273.9 Z" fill="url(#disneyArcW${watchLogoUid})"/></svg></span>`;
  }
  if (logoPath === "inline:paramount" || hubProvider === "paramount") {
    return `<span class="watch-provider-logo watch-provider-logo--inline watch-provider-logo--paramount" aria-hidden="true"><svg viewBox="-10 -10 1020 755" width="22" height="17"><path fill="#ffffff" d="m 24.874,562.117 13.808,-20.846 23.943,6.55 -15.622,-19.031 13.409,-20.579 -23.19,9.071 -16.11,-18.986 1.372,24.651 L 0,531.445 23.458,537.596 Z M 21.598,470.28 39.08,452.269 61.43,463.244 49.702,441.69 66.741,423.987 42.31,428.501 30.14,406.727 26.909,431.202 3.011,435.317 24.874,445.85 Z m 14.428,-90.948 20.536,-14.163 19.916,14.871 -7.524,-23.456 20.314,-14.03 -24.962,-0.31 -7.744,-23.634 -7.967,23.545 -24.21,-0.575 19.475,14.384 z m 103.032,-170.17 12.835,21.288 1.771,-24.341 24.031,-5.71 -22.881,-9.515 1.638,-24.74 -16.064,18.765 -22.307,-9.647 12.613,20.712 -16.021,18.633 z m 296.615,-145.609 18.41,-16.286 21.111,12.701 -9.958,-22.925 18.412,-16.641 -24.564,2.257 -9.293,-22.306 -5.444,23.59 -24.43,2.434 21.332,12.834 z m -352.069,671.964 4.956,-24.518 24.651,-2.966 -21.553,-11.772 4.647,-24.032 -18.103,16.993 -21.995,-11.506 10.622,22.309 -17.748,16.417 23.988,-3.099 z m 117.105,-589.688 8.586,23.368 6.462,-23.723 24.607,-0.841 -20.713,-13.72 6.417,-24.121 -19.34,15.27 -20.094,-13.499 8.321,22.749 -19.164,15.181 z m 72.76,-50.719 3.851,24.563 11.021,-22.04 24.297,3.895 -17.792,-17.482 10.888,-22.395 -22.085,11.331 -16.995,-17.083 3.983,23.811 -21.818,11.418 z m 80.15,-11.065 14.871,-19.562 23.234,8.409 -14.118,-20.536 14.915,-19.827 -23.766,6.771 -13.41,-19.96 -0.709,24.209 -23.634,6.859 23.457,8.719 z m -313.831,544.016 6.02,23.809 9.56,-23.233 24.917,1.815 -19.03,-15.626 9.205,-22.747 -20.978,13.276 -19.43,-15.578 6.107,23.987 -20.579,12.659 z m 27.794,-334.81 22.882,-10.135 16.596,18.544 -2.832,-24.43 22.438,-9.958 -24.297,-4.958 -3.098,-24.739 -12.349,21.465 -23.589,-5.134 16.287,17.969 z m 712.813,-150.52 6.374,23.721 8.894,-23.19 24.784,0.665 -19.25,-15.446 8.762,-22.527 -20.312,13.322 -19.12,-15.402 6.282,24.164 -20.935,13.588 z m 38.812,54.171 23.945,5.621 1.637,24.563 13.013,-21.199 24.298,5.532 -15.978,-18.854 12.879,-20.447 -22.395,9.161 -15.979,-18.676 1.638,24.917 z m -111.66,-101.35 10.755,21.997 4.162,-24.386 24.56,-3.939 -21.819,-11.552 4.206,-23.766 -17.305,16.994 -21.819,-11.418 10.755,22.527 -17.749,17.305 z m 185.795,177.827 -2.966,24.297 16.906,-18.278 22.703,10.046 -12.17,-21.553 16.596,-17.57 -23.766,4.824 -12.125,-21.598 -3.1,24.784 -24.343,4.736 z M 603.718,71.431 l 23.278,-8.275 14.741,19.783 -0.664,-25.004 23.456,-8.454 -23.679,-7.17 -0.441,-24.208 -13.764,19.959 -23.503,-7.125 14.914,20.137 z m 373.802,447.002 1.724,-24.606 -16.328,19.164 -23.059,-9.427 13.231,20.623 -15.8,18.942 24.076,-6.196 13.587,20.846 1.593,-24.651 23.457,-5.796 z m -16.509,105.155 24.209,-1.151 -20.314,-13.143 6.151,-23.721 -19.562,15.62 -20.846,-13.63 9.118,22.97 -19.253,15.403 24.918,-1.462 9.382,23.014 z m -47.888,83.339 4.692,24.518 10.799,-22.261 23.943,3.452 -17.571,-16.687 10.755,-22.128 -22.217,11.551 -18.013,-17.347 4.559,24.032 -21.599,11.594 z M 304.848,552.202 c -1.903,-1.549 -25.271,22.219 -40.541,38.812 -5.398,5.755 -8.896,11.2 -10.975,13.766 0,0 -6.728,11.108 -10.313,15.801 -3.629,4.692 -12.613,17.924 -16.596,23.679 -1.373,1.901 -4.913,10.266 -11.861,18.941 -3.452,4.336 -6.948,10.002 -13.72,18.678 -9.028,11.594 -15.845,21.109 -14.295,22.394 0.885,0.617 14.162,-15.447 28.412,-32.707 5.931,-7.214 12.349,-14.605 17.793,-21.644 2.654,-3.405 8.763,-9.115 10.755,-12.037 3.495,-5.179 7.303,-9.117 8.807,-10.357 7.922,-6.46 12.392,-6.946 14.959,-10.619 1.195,-1.814 16.905,-25.449 22.615,-35.053 5.221,-9.073 18.1,-26.822 14.96,-29.654 m 664.438,-149.768 -12.304,21.731 -24.387,-4.78 16.951,17.924 -11.814,21.376 22.395,-10.622 17.257,17.835 -3.052,-24.607 21.952,-10.091 -23.901,-4.427 z m -59.969,-64.306 20.048,14.206 -7.611,23.456 19.918,-14.826 20.579,14.295 -7.879,-23.545 19.606,-14.162 -24.12,0.221 -7.837,-23.369 -7.83,23.679 z M 520.073,59.394 541.316,46.869 559.55,63.2 554.196,38.946 575.392,26.245 550.832,23.678 545.873,0 l -9.735,22.173 -24.429,-2.346 18.497,16.73 z m 3.186,431.465 c 2.302,6.774 10.845,46.693 13.321,54.969 2.565,8.233 5.134,8.676 6.552,11.905 4.954,12.438 12.079,12.924 15.754,13.941 10.269,3.144 11.107,16.906 17.657,29.21 6.109,11.509 11.864,21.863 17.263,34.431 5.398,12.57 33.016,80.64 37.752,90.995 1.591,3.761 14.736,3.761 13.318,0 -3.316,-7.48 -10.886,-26.286 -15.578,-45.053 -2.963,-12.17 8.412,-3.542 1.151,-23.059 -3.364,-8.94 -9.735,-17.835 -13.318,-21.466 -3.675,-3.583 -7.217,-19.03 -10.005,-25.936 -2.963,-6.728 -1.462,-7.08 -7.566,-23.323 -4.562,-11.861 8.231,-7.878 1.062,-26.157 -4.647,-11.903 -28.281,-54.921 -31.025,-59.347 -1.328,-2.436 -5.885,-9.871 -11.508,-18.678 -5.31,-8.364 -9.69,-17.304 -12.215,-21.2 -4.912,-7.876 -13.94,-25.138 -19.03,-32.307 -5.043,-7.215 -11.331,-23.059 -13.941,-20.402 -2.565,2.345 7.611,26.111 11.772,41.247 4.382,15.093 1.195,21.245 -1.415,25.536 -2.436,4.251 -2.436,7.084 -10e-4,14.694 m 160.343,123.213 c 6.952,11.553 8.81,9.251 11.687,9.385 6.549,0.178 21.199,15.934 24.12,20.226 2.788,4.337 26.375,27.838 32.44,33.592 2.655,2.521 21.333,32.704 23.721,30.539 2.524,-2.171 -7.167,-16.818 -8.629,-20.096 -1.326,-3.186 -6.727,-7.922 -9.34,-14.78 -2.433,-6.728 -13.541,-23.679 -17.168,-29.032 -3.589,-5.401 -9.43,-17.352 -15.804,-24.918 -5.885,-6.641 -1.192,-8.454 -7.255,-14.294 -3.675,-3.453 -15.092,-13.591 -17.66,-15.714 -2.433,-2.213 -11.772,-10.488 -17.127,-15.134 -5.313,-4.515 -18.058,-13.368 -17.615,-19.031 0.175,-5.801 -2.613,-16.817 -6.905,-20.492 -3.1,-2.655 -12.215,-17.349 -22.658,-25.847 -5.268,-4.426 -16.51,-16.109 -25.183,-26.244 -8.101,-9.649 -14.207,-18.457 -16.067,-17.217 -2.743,1.771 9.43,18.765 10.666,20.803 1.284,1.945 15.358,26.286 16.685,32.66 1.463,6.463 27.707,50.631 33.327,64.35 3.229,8.011 21.198,18.721 28.765,31.244 m 114.628,42.712 c 0.884,-1.063 -1.638,-4.339 -3.008,-6.816 -1.507,-2.479 -10.446,-12.393 -12.129,-15.181 -1.459,-2.61 -13.054,-19.119 -17.129,-24.518 -7.255,-9.296 -0.617,-12.704 -4.425,-18.455 -1.549,-2.524 -10.842,-13.722 -21.642,-24.785 -5.576,-5.534 -11.772,-10.889 -17.037,-15.625 -8.543,-7.611 -15.003,-13.276 -16.064,-12.346 -1.507,1.504 3.538,7.567 5.707,10.355 2.168,2.654 5.576,7.566 10.091,12.923 7.302,8.721 0.53,15.312 7.521,22.261 1.151,1.151 20.448,22.747 25.186,26.733 7.035,6.283 32.174,36.113 33.944,37.75 2.967,2.789 8.143,8.766 8.985,7.704 M 400.354,515.202 c 1.417,-3.01 5.798,-12.303 5.577,-16.02 0,-0.664 -1.638,-1.815 -3.01,-0.445 -6.462,6.375 -19.605,29.122 -24.606,31.69 -11.242,5.442 -16.155,18.633 -19.519,23.854 -2.39,3.851 -5.487,10.091 -10.843,17.927 -4.691,6.77 -10.046,16.904 -12.038,20.401 -1.947,3.672 -2.656,7.036 0.973,7.036 3.629,0 0.798,5.932 -3.629,12.437 -2.522,3.806 -8.762,22.041 -10.577,26.997 -2.39,6.107 -2.036,13.896 -2.877,16.507 -0.841,2.436 -12.745,27.796 -15.844,33.416 -1.947,3.542 -1.372,4.957 -2.125,6.905 -1.106,2.433 0.267,3.142 2.125,1.371 2.258,-2.258 15.003,-21.6 18.897,-23.898 3.807,-2.391 7.303,-5.93 7.878,-14.252 0.575,-8.32 5.976,-10.577 10.003,-15.445 4.205,-4.825 9.736,-11.286 12.701,-18.058 2.788,-6.991 6.374,-1.682 12.836,-12.081 6.46,-10.488 20.978,-36.335 24.297,-41.336 3.186,-5.004 0.841,-12.217 0.442,-18.191 -0.177,-3.141 0.265,-10.888 2.125,-19.119 1.86,-7.347 5.267,-14.828 7.214,-19.696 m 55.589,-197.476 c 5.354,0 13.188,-9.782 17.436,-18.278 4.383,-9.206 6.596,-14.384 12.083,-26.157 0.221,-0.62 -0.31,-0.62 -0.886,-0.62 -6.239,0 -13.1,6.374 -17.48,11.507 -5.179,6.374 -13.676,18.368 -14.96,26.998 -0.929,4.646 1.106,6.55 3.807,6.55 m 138.26,8.275 c 6.109,3.098 13.677,-10.356 20.271,-22.615 6.549,-12.348 11.772,-27.662 6.24,-29.565 -6.24,-2.522 -14.163,9.516 -20.757,21.819 -6.508,12.304 -11.461,27.618 -5.754,30.361 M 358,317.726 c 5.487,0 13.145,-9.782 17.57,-18.278 4.338,-9.206 6.64,-14.384 11.95,-26.157 0.266,-0.62 -0.266,-0.62 -0.753,-0.62 -6.284,0 -13.145,6.374 -17.481,11.507 -5.179,6.374 -13.764,18.368 -15.048,26.998 -0.928,4.646 1.284,6.55 3.762,6.55 M 297.987,206.505 c 42.487,1.992 67.492,22.837 67.492,45.188 -0.043,39.965 -63.42,46.78 -63.42,46.78 -11.021,55.367 -54.924,76.477 -85.329,76.168 -40.806,-0.31 -40.187,-33.37 -38.813,-37.619 1.725,-4.914 4.247,-9.383 9.382,-9.383 5.09,0 9.339,4.16 9.339,9.383 0,3.143 -1.55,6.107 -4.249,7.656 -5.355,3.32 -4.338,7.48 -4.338,7.48 0,17.57 22.704,18.941 28.68,18.941 60.765,0 53.772,-100.111 107.368,-134.144 2.435,-1.637 4.338,0 2.833,1.682 -16.729,20.978 -23.014,54.791 -23.014,54.791 25.847,0 42.93,-24.607 42.93,-41.735 0,-29.342 -26.422,-41.514 -48.86,-41.514 -62.581,0 -89.755,43.727 -89.755,67.537 0,23.855 15.048,32.485 25.936,32.485 15.181,0 19.916,-10.134 18.057,-15.091 -3.01,-7.789 1.15,-14.295 5.843,-14.295 1.858,0 8.099,-0.31 8.099,10.667 0,10.577 -15.004,21.243 -31.601,21.243 -16.375,0 -40.318,-8.851 -40.318,-35.008 -0.002,-53.021 65.234,-73.159 103.738,-71.212 m 105.377,64.794 c -6.771,15.314 -11.772,26.289 -18.014,40.762 -0.53,1.372 -1.017,3.761 0.268,4.646 1.149,0.531 2.478,0.531 3.229,0 8.011,-3.85 15.048,-13.189 20.581,-23.811 l 9.868,-21.774 h 13.897 l -3.807,8.231 c -0.311,0.443 -0.311,0.708 0,0.443 4.338,-3.275 8.896,-8.188 14.473,-11.242 2.168,-1.018 7.347,-1.018 6.814,2.567 -0.265,3.186 -2.699,5.621 -4.07,8.675 -0.797,1.947 -1.638,4.381 -1.372,5.709 0.575,1.459 2.168,2.256 4.337,0.619 2.169,-1.372 3.851,-2.479 5.843,-4.116 3.451,-3.364 7.833,-6.506 12.745,-9.116 9.87,-4.559 23.28,-7.525 33.105,-1.284 -6.861,15.357 -12.038,26.776 -18.589,41.248 -1.195,2.478 -0.221,3.275 0.575,3.85 0.841,0.531 2.434,0.796 4.647,-0.397 5.398,-2.257 14.959,-12.923 18.765,-21.2 3.63,-7.7 6.905,-15.313 10.755,-23.987 h 14.297 l -3.986,8.409 0.575,0.266 c 3.809,-3.497 13.766,-11.463 21.112,-9.781 4.073,0.841 6.063,5.708 5.755,9.338 4.645,-3.407 9.426,-7.479 16.331,-9.161 9.868,-2.434 13.719,4.425 10.666,11.021 -3.85,9.029 -11.464,26.731 -15.845,35.849 -0.531,0.93 -0.531,2.965 0,3.408 1.106,0.885 3.055,0 3.895,-0.443 4.912,-4.205 7.614,-6.904 11.417,-12.304 1.062,-9.56 6.24,-18.366 13.412,-25.713 7.611,-8.453 19.648,-15.047 31.201,-11.153 4.027,1.328 6.771,5.443 7.878,9.516 0.531,2.168 1.062,3.274 1.062,5.753 6.063,4.427 13.985,-2.788 17.218,-8.187 0.885,-2.214 1.991,-4.648 2.521,-6.33 3.453,0.265 10.222,0 14.25,0 l -17.836,40.762 c -1.147,2.389 -1.415,3.761 -1.415,5.621 0,1.504 1.638,1.77 3.364,1.504 4.912,-0.885 12.921,-10.533 16.948,-18.632 4.515,-10.135 8.987,-18.588 13.413,-28.679 h 14.427 c -5.754,13.631 -12.262,28.148 -16.951,38.77 -1.106,2.168 -2.388,4.381 -1.682,7.39 0.575,1.417 2.479,1.151 3.672,0.62 6.241,-3.629 16.996,-15.578 20.715,-22.97 3.893,-8.763 6.77,-15.313 10.842,-23.811 h 14.827 l -3.541,8.498 c 5.531,-4.382 11.461,-9.073 18.589,-10.224 3.274,-0.442 7.347,-0.266 9.251,3.098 2.213,3.807 0.884,7.833 -0.754,11.507 -4.072,9.294 -8.809,19.385 -12.879,28.37 -0.753,2.212 -0.973,4.293 0.487,5.177 2.257,1.417 12.611,-4.912 17.879,-16.419 4.56,-10.091 7.659,-16.066 11.729,-25.891 h -7.611 l 2.124,-4.426 h 7.655 l 10.931,-23.766 H 798.1 l -10.624,23.766 h 11.11 l -2.082,4.426 h -10.933 c -6.282,13.322 -11.551,24.563 -17.038,37.133 -2.123,4.293 -4.336,11.507 -3.186,15.888 0.843,2.435 3.851,3.054 6.594,2.125 8.409,-2.921 14.163,-10.09 19.075,-17.748 0.267,-0.841 4.734,-0.265 4.381,0.354 -5.799,11.418 -18.321,22.97 -30.316,22.66 -3.583,0 -7.48,-2.213 -9.604,-5.267 -1.015,-1.594 -1.679,-2.921 -2.213,-4.824 -0.753,-3.098 -0.528,-6.595 0,-9.914 -6.505,4.958 -12.745,10.932 -20.977,12.613 -3.586,0.531 -8.187,-0.796 -9.028,-4.646 -0.531,-3.009 -0.267,-6.33 0.842,-9.029 5.177,-11.197 9.779,-21.288 14.691,-33.105 0.4,-0.531 0,-2.478 -0.575,-2.743 -0.798,-0.752 -3.23,-0.752 -5.398,0.885 -10.091,7.612 -15.27,17.481 -19.606,27.571 -3.099,6.772 -6.415,13.632 -9.648,20.271 h -14.516 c 1.682,-4.071 4.116,-9.56 6.018,-13.985 0,-0.265 -0.264,-0.265 -0.264,0 -5.974,5.931 -13.677,12.746 -21.243,14.782 -3.056,0.796 -6.11,-0.221 -7.658,-3.098 -1.727,-2.699 -2.213,-6.727 -0.754,-10.4 0,-0.177 -0.131,-0.177 -0.439,0 -5.401,5.533 -10.666,10.4 -17.927,12.923 -8.275,2.522 -15.709,-3.275 -10.488,-15.313 1.418,-3.232 5.532,-12.304 10.047,-23.191 -3.762,1.548 -8.365,1.548 -10.842,0.796 -0.312,0 -0.312,0 -0.312,0.266 -3.188,15.268 -12.259,29.166 -26.199,35.804 -6.816,3.319 -14.562,4.16 -21.333,-0.487 -3.274,-2.168 -5.223,-7.479 -5.487,-12.083 -7.038,7.126 -15.05,16.109 -25.936,14.561 -1.638,-0.354 -3.008,-1.815 -3.85,-3.319 -2.479,-4.115 -1.021,-8.542 0.53,-12.083 5.224,-10.887 9.516,-21.067 14.739,-33.326 0.839,-1.727 -1.507,-2.966 -3.188,-2.168 -5.177,2.479 -8.365,4.957 -11.239,9.382 -1.551,2.39 -3.1,5.134 -4.339,7.744 -4.826,10.49 -9.869,21.377 -14.252,31.954 h -14.825 c 6.639,-14.914 12.879,-29.431 19.428,-44.168 0.62,-1.372 0.268,-3.319 -0.53,-3.762 -1.284,-0.708 -3.628,0.443 -5.135,1.329 -3.541,2.434 -6.683,5.665 -9.028,9.87 -2.478,4.071 -4.734,8.142 -6.461,12.569 l -11.063,24.164 h -14.474 c 1.417,-3.186 4.116,-9.559 5.753,-12.746 0,-0.265 -0.265,-0.486 -0.265,-0.265 -7.922,6.55 -18.057,15.047 -25.448,13.631 -2.479,-0.266 -4.603,-2.434 -5.178,-4.646 -0.53,-2.788 -0.31,-5.267 0.266,-7.613 0,-0.31 -0.266,-0.31 -0.575,0 -6.33,6.02 -11.994,10.976 -19.961,12.879 -4.559,1.018 -8.851,-1.903 -10.312,-5.266 -2.036,-3.763 -2.522,-9.825 0.752,-16.686 1.947,-4.381 4.072,-8.984 6.771,-12.79 -1.593,0.841 -4.824,1.106 -7.037,0.841 -1.858,-0.265 -3.85,-1.726 -4.824,-3.142 -1.15,-1.239 -1.416,-3.718 -1.416,-5.355 0.266,-0.31 -0.575,-0.31 -1.151,0 -4.336,3.497 -6.283,7.657 -8.452,12.26 l -12.57,28.457 h -14.781 l 5.444,-12.083 c 0.266,-0.221 0,-0.486 -0.266,-0.221 -7.701,6.816 -16.906,14.561 -24.342,13.1 -2.125,-0.354 -4.382,-2.478 -4.913,-4.602 -0.53,-2.567 -0.31,-5.311 0,-7.702 h -0.53 c -6.021,6.02 -11.773,10.887 -19.606,12.569 -4.47,1.416 -8.498,-1.283 -10.225,-5.09 -2.168,-5.577 -1.371,-11.24 0.576,-16.508 5.665,-14.826 16.154,-25.403 30.316,-33.413 8.983,-5.136 22.968,-6.686 32.793,-1.596 M 85.595,500.286 c 0,62.537 16.597,132.995 46.205,190.795 53.507,-49.922 193.893,-208.363 210.003,-226.774 24.475,-28.015 35.052,-10.18 48.196,-25.847 7.037,-8.586 11.152,-11.861 14.25,-13.587 5.046,-3.009 10.8,-10.178 13.676,-12.304 2.877,-2.168 9.383,-10.798 14.429,-15.136 5.09,-4.292 15.047,-10.798 25.183,-19.385 10.091,-8.674 27.263,-28.767 45.983,-28.767 22.261,0 31.557,15.092 33.547,16.907 1.593,1.727 15.314,13.852 17.526,16.154 2.433,2.744 17.127,14.339 25.094,14.339 7.878,0 13.722,8.63 17.969,12.924 9.427,8.585 48.372,49.523 61.164,58.198 5.71,3.938 11.108,3.231 15.356,6.551 4.384,3.229 6.552,5.312 9.028,6.063 2.391,0.664 10.755,-1.462 20.493,10.711 4.515,3.097 5.71,3.63 5.71,3.63 0,0 13.231,11.992 17.969,20.445 4.292,7.303 102.941,138.35 138.259,185.22 32.75,-59.394 51.472,-127.639 51.472,-200.222 C 917.107,270.459 730.871,84.444 501.263,84.444 271.653,84.576 85.595,270.679 85.595,500.286"/></svg></span>`;
  }
  if (logoPath === "inline:googletv" || hubProvider === "googletv") {
    return `<span class="watch-provider-logo watch-provider-logo--inline watch-provider-logo--googletv" aria-hidden="true"><svg viewBox="0 0 548.3 400" width="21" height="15"><path fill="#4285F4" d="M477.4,0H153.2c-28.2,0-51.1,22.9-51.1,51.1v51.1h395.1c28.2,0,51.1,22.9,51.1,51.1V70.9 C548.3,31.7,516.6,0,477.4,0L477.4,0z"/><path fill="#34A853" d="M70.9,0C31.7,0,0,31.7,0,70.9v175.9c0,28.2,22.9,51.1,51.1,51.1h51.1V51.1c0,0,0,0,0,0 C102.2,22.9,125,0,153.2,0H70.9L70.9,0z"/><path fill="#FBBC04" d="M70.9,400h324.2c28.2,0,51.1-22.9,51.1-51.1v-51.1H51.1C22.9,297.8,0,275,0,246.8v82.3 C0,368.3,31.7,400,70.9,400L70.9,400z"/><path fill="#EA4335" d="M477.4,400c39.2,0,70.9-31.7,70.9-70.9V153.2c0-28.2-22.9-51.1-51.1-51.1h-51.1v246.8c0,0,0,0,0,0 c0,28.2-22.9,51.1-51.1,51.1H477.4L477.4,400z"/></svg></span>`;
  }
  if (logoPath === "inline:mubi") {
    return `<span class="watch-provider-logo watch-provider-logo--inline watch-provider-logo--mubi" aria-hidden="true"><svg viewBox="76.5 272.5 67 66.5" width="20" height="20"><g fill="#ffffff"><circle cx="132.523" cy="305.6" r="8.766"/><circle cx="87.383" cy="305.6" r="8.766"/><circle cx="109.954" cy="305.6" r="8.766"/><circle cx="87.383" cy="283.116" r="8.766"/><circle cx="109.954" cy="283.116" r="8.766"/><circle cx="87.383" cy="328.087" r="8.766"/><circle cx="109.954" cy="328.087" r="8.766"/></g></svg></span>`;
  }
  if (logoPath === "inline:peacock" || hubProvider === "peacock") {
    watchLogoUid += 1;
    return `<span class="watch-provider-logo watch-provider-logo--inline watch-provider-logo--peacock" aria-hidden="true"><svg viewBox="-2 -2 73.5 72.2" width="19" height="19"><defs><linearGradient id="peacockW${watchLogoUid}" x1="63.89" x2="63.89" y1="-0.13" y2="68.21" gradientUnits="userSpaceOnUse"><stop stop-color="#ffdc23"/><stop offset=".16" stop-color="#ff8700"/><stop offset=".21" stop-color="#ff5401"/><stop offset=".37" stop-color="#d9005a"/><stop offset=".42" stop-color="#c814c8"/><stop offset=".58" stop-color="#8250ff"/><stop offset=".63" stop-color="#6e64ff"/><stop offset=".79" stop-color="#00c8ff"/><stop offset=".84" stop-color="#00cc99"/><stop offset=".99" stop-color="#00a637"/></linearGradient></defs><path fill="#ffffff" d="m 48.344254,23.376251 c 0,14.582148 -11.296608,26.178142 -36.607947,29.086577 v 15.47688 H 0 V 24.601791 C 0,9.1049395 10.947966,0 24.698431,0 38.448896,0 48.344254,10.24389 48.344254,23.376251 m -11.736307,0.437376 c 0,-7.180057 -5.429566,-12.60618 -12.349215,-12.60618 -6.919641,0 -12.524649,4.902158 -12.524649,13.394344 v 16.71352 C 21.134238,41.04889 36.605731,35.784844 36.605731,23.813627 Z"/><path fill="url(#peacockW${watchLogoUid})" d="m 69.499016,5.333684 c 0,2.9417574 -2.512018,5.326184 -5.611192,5.326184 -3.099174,0 -5.611193,-2.3844266 -5.611193,-5.326184 0,-2.9417581 2.512019,-5.32618468 5.611193,-5.32618468 3.099174,0 5.611192,2.38442658 5.611192,5.32618468 m -5.611192,9.055365 c -3.099174,0 -5.611193,2.384427 -5.611193,5.326185 0,2.941758 2.512019,5.326185 5.611193,5.326185 3.099174,0 5.611192,-2.384427 5.611192,-5.326185 0,-2.941758 -2.512018,-5.326185 -5.611192,-5.326185 m 0,14.379846 c -3.099174,0 -5.611193,2.384427 -5.611193,5.326185 0,2.941758 2.512019,5.326184 5.611193,5.326184 3.099174,0 5.611192,-2.384426 5.611192,-5.326184 0,-2.941758 -2.512018,-5.326185 -5.611192,-5.326185 m 0,14.379845 c -3.099174,0 -5.611193,2.384427 -5.611193,5.326186 0,2.941758 2.512019,5.326184 5.611193,5.326184 3.099174,0 5.611192,-2.384426 5.611192,-5.326184 0,-2.941759 -2.512018,-5.326186 -5.611192,-5.326186 m 0,14.381551 c -3.099174,0 -5.611193,2.384427 -5.611193,5.326184 0,2.941758 2.512019,5.326185 5.611193,5.326185 3.099174,0 5.611192,-2.384427 5.611192,-5.326185 0,-2.941757 -2.512018,-5.326184 -5.611192,-5.326184"/></svg></span>`;
  }
  if (logoPath === "inline:crunchyroll" || hubProvider === "crunchyroll") {
    return `<span class="watch-provider-logo watch-provider-logo--inline watch-provider-logo--crunchyroll" aria-hidden="true"><svg viewBox="0 0 24 24" width="19" height="19"><path fill="#ff640a" d="M2.909 13.436C2.914 7.61 7.642 2.893 13.468 2.898c5.576.005 10.137 4.339 10.51 9.819q.021-.351.022-.706C24.007 5.385 18.64.006 12.012 0S.007 5.36 0 11.988 5.36 23.994 11.988 24q.412 0 .815-.027c-5.526-.338-9.9-4.928-9.894-10.538Zm16.284.155a4.1 4.1 0 0 1-4.095-4.103 4.1 4.1 0 0 1 2.712-3.855 8.95 8.95 0 0 0-4.187-1.037 9.007 9.007 0 1 0 8.997 9.016q-.001-.847-.15-1.651a4.1 4.1 0 0 1-3.278 1.63Z"/></svg></span>`;
  }
  if (logoPath === "inline:okko") {
    return `<span class="watch-provider-logo watch-provider-logo--inline watch-provider-logo--okko" aria-hidden="true"><svg viewBox="0 0 2922 1036" width="26" height="9"><g fill="#ffffff"><path d="M401,237C180,237,0,415,0,637c0,221,180,399,401,399c222,0,402-178,402-399C803,415,623,237,401,237z M401,869c-123,0-224-109-224-232c0-124,101-233,224-233c124,0,225,109,225,233C626,760,525,869,401,869z"/><path d="M171,177c48,0,88-40,88-89c0-48-40-88-88-88c-49,0-89,40-89,88C82,137,122,177,171,177z"/><path d="M631,177c48,0,88-40,88-89c0-48-40-88-88-88c-49,0-89,40-89,88C542,137,582,177,631,177z"/><path d="M401,177c48,0,88-40,88-89c0-48-40-88-88-88c-49,0-89,40-89,88C312,137,352,177,401,177z"/><polygon points="2173,251 1978,251 1747,572 1747,13 1570,13 1570,1022 1747,1022 1747,701 1996,1022 2205,1022 1898,632"/><polygon points="1487,251 1292,251 1061,572 1061,13 884,13 884,1022 1061,1022 1061,701 1310,1022 1519,1022 1212,632"/><path d="M2520,237c-221,0-401,178-401,400c0,221,180,399,401,399c222,0,402-178,402-399C2922,415,2742,237,2520,237z M2519,869c-123,0-224-109-224-232c0-124,101-233,224-233c124,0,225,109,225,233C2744,760,2643,869,2519,869z"/></g></svg></span>`;
  }
  return `<img class="watch-provider-logo" src="https://image.tmdb.org/t/p/w92${esc(logoPath)}" alt="${esc(provider.name)}" loading="lazy">`;
}

function mergeCachedProviderIntoWatch(providers, cachedProvider) {
  const key = normalizeStreamingProvider(cachedProvider);
  const spec = key && HUB_PROVIDER_DEFAULTS[key];
  if (!spec) return providers;
  const result = providers && typeof providers === "object" ? { ...providers } : {};
  const existing = result[spec.region]
    ? {
        ...result[spec.region],
        flatrate: [...(result[spec.region].flatrate || [])],
        rent: [...(result[spec.region].rent || [])],
        buy: [...(result[spec.region].buy || [])],
        free: [...(result[spec.region].free || [])],
      }
    : { link: null, flatrate: [], rent: [], buy: [], free: [] };
  const all = [...existing.flatrate, ...existing.free, ...existing.rent, ...existing.buy];
  if (!all.some((p) => matchStreamingHubProvider(p) === key)) {
    const targetList = spec.section === "buy" ? existing.buy : existing.flatrate;
    targetList.push({ id: spec.id, name: spec.name, logo_path: spec.logo_path });
  }
  result[spec.region] = existing;
  return result;
}

function cleanWatchProviderName(name) {
  return String(name || "")
    .replace(/\s+(?:Standard\s+|Free\s+)?with\s+Ads$/i, "")
    .replace(/^Paramount\s*(?:\+|Plus)(?:\s+(?:Premium|Essential))?$/i, "Paramount+")
    .replace(/^Google\s+Play\s+Movies(?:\s+(?:&|and)\s+TV)?$/i, "Google TV")
    .replace(/^MUBI(?:\s+(?:Go|Amazon\s+Channel|Apple\s+TV\s+Channel))?$/i, "MUBI")
    .replace(/^Peacock(?:\s+(?:Premium(?:\s+Plus)?|with\s+Ads|Amazon\s+Channel|Apple\s+TV\s+Channel))?$/i, "Peacock")
    .replace(/^Crunchyroll(?:\s+(?:Amazon\s+Channel|Apple\s+TV\s+Channel))?$/i, "Crunchyroll")
    .trim();
}

function watchProviderCanonicalKey(provider) {
  const hub = matchStreamingHubProvider(provider);
  if (hub) return `hub:${hub}`;

  let s = String(provider?.name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
  if (!s) return "";
  s = s.replace(/\s+(amazon|apple\s*tv|roku\s*premium|youtube)\s*channel\s*$/i, "");
  s = s.replace(/\s+(standard\s+with\s+ads|free\s+with\s+ads|with\s+ads|ad[- ]supported|no\s+ads|essential|basic)\s*$/i, "");
  s = s.replace(/\s+premium(\s+plus)?\s*$/i, "");
  s = s.replace(/\s*plus\b/gi, "+");
  s = s.replace(/\s+\+/g, "+");
  s = s.replace(/[^a-z0-9а-яё+]+/gi, " ").trim();
  return s;
}

function watchProviderRankPenalty(provider) {
  const name = String(provider?.name || "").trim();
  const id = Number(provider?.id);
  if (id === 3 || id === 8 || id === 9 || id === 11 || id === 15 || id === 115 || id === 117 || id === 119 || id === 283 || id === 337 || id === 350 || id === 386 || id === 531 || id === 1899) return 0;
  let penalty = 0;
  if (/\b(amazon|apple\s*tv|roku\s*premium|youtube)\s*channel\b/i.test(name)) penalty += 30;
  if (/\b(with\s+ads|ad[- ]supported|free\s+with\s+ads)\b/i.test(name)) penalty += 20;
  if (/\b(kids|essential|basic|standard|no\s+ads|premium\s+plus|store)\b/i.test(name)) penalty += 10;
  return penalty + name.length * 0.01;
}

function dedupeWatchProviderList(items) {
  if (!Array.isArray(items) || !items.length) return [];
  const winners = new Map();
  items.forEach((raw, idx) => {
    if (!raw || typeof raw !== "object") return;
    const key = watchProviderCanonicalKey(raw);
    if (!key) return;
    const penalty = watchProviderRankPenalty(raw);
    const cleaned = {
      ...raw,
      name: cleanWatchProviderName(raw.name) || raw.name,
    };
    const existing = winners.get(key);
    if (!existing || penalty < existing.penalty) {
      winners.set(key, {
        index: existing ? existing.index : idx,
        penalty,
        item: cleaned,
      });
    }
  });
  return [...winners.values()]
    .sort((a, b) => a.index - b.index)
    .map((entry) => entry.item);
}

function renderWatchProviders(providers, selectedCountry = null) {
  if (!providers || typeof providers !== "object") return "";

  const availableCodes = Object.keys(providers);
  if (!availableCodes.length) return "";

  const detected = detectUserCountry();
  const country =
    selectedCountry && providers[selectedCountry]
      ? selectedCountry
      : providers[detected]
        ? detected
        : providers.RU && savedLang === "ru"
          ? "RU"
          : providers.US
            ? "US"
            : availableCodes[0];

  const data = providers[country];
  if (!data) return "";

  const flatrate = dedupeWatchProviderList(data.flatrate || []);
  const free = dedupeWatchProviderList(data.free || []);
  const rent = data.rent || [];
  const buy = data.buy || [];

  const renderList = (items) =>
    items
      .map((p) => {
        const hubProvider = matchStreamingHubProvider(p);
        const logoMarkup = renderWatchProviderLogo(p, hubProvider);
        if (hubProvider) {
          return `<a class="watch-provider-item watch-provider-link" href="#streaming/${hubProvider}" data-hub-provider="${hubProvider}" title="${esc(p.name)} — ${esc(t("watch_open_in_hub"))}">
            ${logoMarkup}
            <span class="watch-provider-name">${esc(p.name)}</span>
            <span class="watch-provider-arrow" aria-hidden="true">→</span>
          </a>`;
        }
        return `<div class="watch-provider-item" title="${esc(p.name)}">
            ${logoMarkup}
            <span class="watch-provider-name">${esc(p.name)}</span>
          </div>`;
      })
      .join("");

  let groupsHtml = "";
  if (flatrate.length) {
    groupsHtml += `<div class="watch-provider-group">
      <span class="watch-group-label">${t("provider_stream")}</span>
      <div class="watch-provider-list">${renderList(flatrate)}</div>
    </div>`;
  }
  if (free.length) {
    groupsHtml += `<div class="watch-provider-group">
      <span class="watch-group-label">${t("provider_free")}</span>
      <div class="watch-provider-list">${renderList(free)}</div>
    </div>`;
  }
  const rentBuyCombined = dedupeWatchProviderList([...rent, ...buy]);
  const flatrateHubs = new Set(
    flatrate.map((p) => matchStreamingHubProvider(p)).filter(Boolean),
  );
  const rentBuyItems = flatrate.length
    ? rentBuyCombined.filter((p) => {
        const hub = matchStreamingHubProvider(p);
        return hub && !flatrateHubs.has(hub);
      })
    : rentBuyCombined;
  if (rentBuyItems.length) {
    groupsHtml += `<div class="watch-provider-group">
      <span class="watch-group-label">${t("provider_rent_buy")}</span>
      <div class="watch-provider-list">${renderList(rentBuyItems.slice(0, 6))}</div>
    </div>`;
  }

  const preferred = ["RU", "US", "GB", "DE", "FR", "CA"];
  const pills = [
    ...preferred.filter((code) => providers[code]),
    ...availableCodes.filter((code) => !preferred.includes(code)),
  ].slice(0, 5);

  const countryPills =
    pills.length > 1
      ? `<div class="watch-country-pills" role="tablist" aria-label="${t("where_to_watch")}">
          ${pills
            .map(
              (c) =>
                `<button type="button" class="watch-country-pill ${c === country ? "is-active" : ""}" data-watch-country="${esc(c)}" aria-label="${c}">
                  <span>${countryFlag(c)}</span>
                  <span>${c}</span>
                </button>`,
            )
            .join("")}
        </div>`
      : "";

  const justWatchLink = data.link
    ? `<a class="watch-justwatch-link" href="${esc(data.link)}" target="_blank" rel="noopener noreferrer">${t("view_on_justwatch")} ↗</a>`
    : "";

  return `<section class="detail-watch-section" id="movie-watch-providers" aria-label="${t("where_to_watch")}">
    <div class="watch-header">
      <div class="watch-title-col">
        <span class="watch-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:5px;"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M17 2l-5 5-5-5"></path></svg></span>
        <h2 class="watch-title">${t("where_to_watch")}</h2>
      </div>
      ${countryPills}
    </div>
    <div class="watch-body">
      ${groupsHtml || `<p class="watch-empty-note">${t("no_stream_in_region")}</p>`}
    </div>
    <div class="watch-footer">
      <span class="watch-attribution">${t("provided_by_justwatch")}</span>
      ${justWatchLink}
    </div>
  </section>`;
}

function bindWatchProviderEvents(providers) {
  if (!providers) return;
  document.querySelectorAll(".watch-country-pill").forEach((btn) => {
    btn.addEventListener("click", () => {
      const code = btn.dataset.watchCountry;
      if (!code) return;
      const section = document.querySelector("#movie-watch-providers");
      if (section) {
        section.outerHTML = renderWatchProviders(providers, code);
        bindWatchProviderEvents(providers);
      }
    });
  });
}

async function movie(rawId) {
  const validId = safeNumericId(rawId);
  if (!validId) {
    app.innerHTML = `<div class="message error">${esc(t("not_found"))}</div>`;
    return;
  }
  const id = String(validId);
  const cachedEntry = movieCache.get(id);
  const typeQuery = cachedEntry?.media_type === "tv" ? "?type=tv" : "";
  app.innerHTML = `<div class="loading">${t("loading_short")}</div>`;
  try {
    const target = `#movie/${id}`;
    const data = await api(`/api/movie/${id}${typeQuery}`);
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

    const edChoice =
      typeof isEditorsChoice === "function" && isEditorsChoice(m.id);
    const edMarkup = edChoice
      ? `<a href="#editors-choice" class="detail-editors-choice" aria-label="${t("editors_choice")}" title="${t("editors_choice")}">
          <span class="editors-choice-icon" aria-hidden="true">★</span>
          <span class="editors-choice-title">${t("editors_choice")}</span>
        </a>`
      : "";

    const watchProviders = mergeCachedProviderIntoWatch(
      data.watch_providers,
      cachedEntry?.provider,
    );
    const cachedNormProvider = normalizeStreamingProvider(cachedEntry?.provider);
    const initialWatchCountry =
      (cachedNormProvider === "kinopoisk" || cachedNormProvider === "okko") &&
      watchProviders?.RU
        ? "RU"
        : null;
    const watchMarkup = renderWatchProviders(watchProviders, initialWatchCountry);

    app.innerHTML = `<article class="detail">
      <div>${poster}</div>
      <div class="detail-content">
        <div class="detail-header-row">
          <div class="detail-title-col">
            <p class="eyebrow">${t("movie_details")}</p>
            <h1>${esc(m.title)}</h1>
            ${originalTitle}
          </div>
          ${edMarkup}
        </div>
        <p class="detail-meta">${year(m.release_date)} · ${runtimeText} · <span class="detail-fountain-score" title="${t("fountain_score_label")}: ${getMovieScore(m)}/100">⛲ ${getMovieScore(m)}/100</span></p>
        <p class="overview">${esc(m.overview || t("no_overview"))}</p>
        <div class="chips">${genresMarkup}</div>
        <p class="detail-meta">${t("directed_by")} ${directorMarkup}</p>
        ${renderTrailerControls(m, data.trailer)}
      </div>
    </article>
    <div id="trailer-embed-slot"></div>
    ${watchMarkup}
    <section class="shelf" id="movie-ratings" aria-label="Ratings">
      ${renderRatingsSection(m, null)}
    </section>
    ${shelf(t("recommendations_title"), t("recommendations_sub"), data.recommendations)}
    ${shelf(data.director ? `${t("more_from_prefix")} ${esc(data.director.name)}` : t("more_from_generic"), t("other_films_director"), data.director_movies)}`;

    bindWatchProviderEvents(watchProviders);

    const imdbParam = m.imdb_id
      ? `?imdb_id=${encodeURIComponent(m.imdb_id)}`
      : "";
    api(`/api/movie/${encodeURIComponent(m.id)}/ratings${imdbParam}`)
      .then((res) => {
        const ratingsEl = document.querySelector?.("#movie-ratings");
        if (ratingsEl && location.hash === `#movie/${id}`) {
          const rData = res.ratings || {};
          ratingsEl.innerHTML = renderRatingsSection(m, rData);
          const computed = computeFountainScore(m, rData);
          if (computed?.score) {
            const topScoreEl = document.querySelector?.(".detail-fountain-score");
            if (topScoreEl) {
              topScoreEl.innerHTML = `<span class="score-fountain-label">Fountain</span> ${computed.score}/100`;
              topScoreEl.title = `${t("fountain_score_label")}: ${computed.score}/100`;
            }
          }
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

async function cast(rawId) {
  const validId = safeNumericId(rawId);
  if (!validId) {
    app.innerHTML = `<div class="message error">${esc(t("not_found"))}</div>`;
    return;
  }
  const id = String(validId);
  lastMovieId = id;
  try {
    const data = await api(`/api/movie/${id}/cast`);
    const castMarkup = (data.cast || [])
      .map((person) => {
        const photo = person.profile_path
          ? `<img src="${image(person.profile_path)}" alt="">`
          : '<div class="cast-photo">?</div>';
        const pId = safeNumericId(person.id) || 0;
        return `<a class="cast-card" href="#person/${pId}">
          ${photo}
          <span>
            <strong>${esc(person.name)}</strong>
            <small>${esc(person.character || "Cast")}</small>
          </span>
        </a>`;
      })
      .join("");

    app.innerHTML = `<a class="back" href="#movie/${esc(id)}">${t("back_to_movie")}</a>
    <div class="page-heading">
      <p class="eyebrow">${t("full_cast")}</p>
      <h1>${esc(data.movie?.title || "")}</h1>
    </div>
    <div class="cast-grid">${castMarkup}</div>`;
  } catch (error) {
    app.innerHTML = `<div class="message error">${esc(error.message)}</div>`;
  }
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

async function person(rawId) {
  const validId = safeNumericId(rawId);
  if (!validId) {
    app.innerHTML = `<div class="message error">${esc(t("not_found"))}</div>`;
    return;
  }
  const id = String(validId);
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
    const backId = safeNumericId(lastMovieId);
    const backMarkup = backId
      ? `<a class="back" href="#movie/${backId}">${t("back_to_movie")}</a>`
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
  const rawHash = location.hash.slice(1);
  const [kind, ...rest] = rawHash.split("/");
  const rawId = rest.join("/");
  if (!kind) return home();
  if (kind === "account" || kind === "watchlist") return account();
  const routeProv = normalizeStreamingProvider(kind);
  if (kind === "streaming" || routeProv) {
    const prov = routeProv || normalizeStreamingProvider(rawId);
    return streamingPage("all", prov);
  }
  if (kind === "trending") return trendingPage();
  if (kind === "editors" || kind === "editors-choice") return editorsChoicePage();
  if (kind === "letterboxd") return letterboxdPage();
  if (kind === "imdb" || kind === "imdb250") return imdbPage();
  if (kind === "upcoming") return upcomingPage();
  if (kind === "search") {
    let cleanQuery = "";
    try {
      cleanQuery = decodeURIComponent(rawId || "");
    } catch {
      cleanQuery = rawId || "";
    }
    return search(cleanQuery);
  }
  if (kind === "fountain") return fountainPage();
  if (kind === "movie") return movie(rawId);
  if (kind === "cast") return cast(rawId);
  if (kind === "person") return person(rawId);
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

if (typeof document !== "undefined" && document !== app && typeof document.addEventListener === "function") {
  document.addEventListener("click", (event) => {
    const menu = document.querySelector?.("#streaming-region-menu");
    const trigger = document.querySelector?.("#streaming-region-trigger");
    if (menu && !menu.hidden && !menu.contains?.(event.target) && !trigger?.contains?.(event.target)) {
      menu.hidden = true;
      trigger?.setAttribute?.("aria-expanded", "false");
    }
  });
}

window.addEventListener?.("keydown", (event) => {
  const activeEl = document.activeElement;
  const isInput = activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA" || activeEl.isContentEditable);

  // Press "/" to focus search
  if (event.key === "/" && !isInput) {
    event.preventDefault();
    const searchInput = document.querySelector?.("#search");
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
    return;
  }

  // Press "Escape" to dismiss dropdowns, trailer, modal or search
  if (event.key === "Escape") {
    const regionMenu = document.querySelector?.("#streaming-region-menu");
    if (regionMenu && !regionMenu.hidden) {
      regionMenu.hidden = true;
      document.querySelector?.("#streaming-region-trigger")?.setAttribute?.("aria-expanded", "false");
      return;
    }
    const closeTrailer = document.querySelector?.("[data-close-trailer]");
    if (closeTrailer) {
      closeTrailer.click();
      return;
    }
    const avatarModal = document.querySelector?.("#avatar-modal");
    if (avatarModal && !avatarModal.hidden) {
      avatarModal.hidden = true;
      return;
    }
    if (isInput) {
      activeEl.blur();
    }
  }
});

route();
