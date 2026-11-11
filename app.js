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

function getStreamingProvider() {
  try {
    const saved = localStorage.getItem(streamingProviderKey);
    if (saved === "apple" || saved === "netflix") return saved;
  } catch {}
  return "netflix";
}

function setStreamingProvider(provider) {
  if (provider !== "netflix" && provider !== "apple") return;
  currentStreamingProvider = provider;
  try {
    localStorage.setItem(streamingProviderKey, provider);
  } catch {}
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
  app.innerHTML = `<div class="loading">${t("loading_short")}</div>`;
  currentStreamingFilter = subFilter || "all";
  currentStreamingSort = "default";
  currentStreamingPage = 1;
  if (providerOverride === "apple" || providerOverride === "netflix") {
    currentStreamingProvider = providerOverride;
    try {
      localStorage.setItem(streamingProviderKey, providerOverride);
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
    if (
      !location.hash.startsWith("#streaming") &&
      !location.hash.startsWith("#netflix") &&
      !location.hash.startsWith("#appletv") &&
      !location.hash.startsWith("#apple")
    )
      return;
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
    if (
      !location.hash.startsWith("#streaming") &&
      !location.hash.startsWith("#netflix") &&
      !location.hash.startsWith("#appletv") &&
      !location.hash.startsWith("#apple")
    )
      return;
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
    if (
      !location.hash.startsWith("#streaming") &&
      !location.hash.startsWith("#netflix") &&
      !location.hash.startsWith("#appletv") &&
      !location.hash.startsWith("#apple")
    )
      return;

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
  const loadMoreSlot = document.getElementById("streaming-load-more-container");
  if (loadMoreSlot) {
    loadMoreSlot.innerHTML = renderStreamingLoadMoreButton();
  }
}

function renderStreamingCountText(currentCount, totalCount, countryCode, provider) {
  const providerName = provider === "apple" ? (t("provider_apple") || "Apple TV") : "Netflix";
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

  app.innerHTML = `
    <div class="page-heading streaming-heading" data-active-provider="${currentStreamingProvider}">
      <div class="streaming-ambient-glow" aria-hidden="true"></div>
      <p class="eyebrow">${t("streaming_tag")}</p>
      <h1>${t("streaming_title")}</h1>
      <p class="hero-copy">${esc(t("streaming_sub"))}</p>

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
            <span class="provider-desc">${esc(t("provider_netflix_sub"))}</span>
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
            <span class="provider-desc">${esc(t("provider_apple_sub"))}</span>
          </div>
          <span class="provider-accent-rail" aria-hidden="true"></span>
        </button>

        <!-- Max (HBO) -->
        <div class="streaming-provider streaming-provider--max is-disabled" title="${t("provider_coming_soon")}">
          <span class="provider-icon provider-icon--max" aria-hidden="true">
            <svg viewBox="0 0 52 18" width="34" height="13" fill="#ffffff" aria-hidden="true">
              <path d="M1.5 1h3.6l4.9 7.4L14.9 1h3.6v16h-3.6V7.8l-4.9 7.4h-.2L4.9 7.8V17H1.5V1z"/>
              <path d="M20.2 17L25.4 1h4.2l5.2 16h-3.7l-1-3.4h-5.9l-1 3.4h-3zm5.7-6.2h4l-2-6.5-2 6.5z"/>
              <circle cx="27.5" cy="11.2" r="1.3" fill="#002be7"/>
              <circle cx="27.5" cy="11.2" r="0.6" fill="#ffffff"/>
              <path d="M36.5 1h3.8l3.1 5.3L46.5 1h3.8l-5 8 5.2 8h-3.9l-3.3-5.5-3.3 5.5h-3.9l5.2-8-4.7-8z"/>
            </svg>
          </span>
          <div class="provider-meta">
            <div class="provider-name-row">
              <strong>Max (HBO)</strong>
              <span class="provider-status-badge provider-status-badge--max">${t("provider_coming_soon")}</span>
            </div>
            <span class="provider-desc">Warner & HBO Originals</span>
          </div>
          <span class="provider-accent-rail" aria-hidden="true"></span>
        </div>

        <!-- Prime Video -->
        <div class="streaming-provider streaming-provider--prime is-disabled" title="${t("provider_coming_soon")}">
          <span class="provider-icon provider-icon--prime" aria-hidden="true">
            <svg viewBox="0 0 54 22" width="34" height="15" aria-hidden="true">
              <path fill="#ffffff" d="M3 4.2h2.5v1.8c.6-1.3 1.9-2 3.3-2 2.5 0 4.1 1.8 4.1 4.6 0 2.8-1.7 4.6-4.1 4.6-1.4 0-2.7-.7-3.3-2v5.4H3V4.2zm2.5 4.4c0 1.6 1 2.6 2.3 2.6 1.3 0 2.4-1 2.4-2.6s-1-2.6-2.4-2.6c-1.3 0-2.3 1-2.3 2.6zM14.2 4.2h2.5v1.9c.5-1.3 1.7-2.1 3-2.1h.8v2.7h-1.1c-1.6 0-2.7 1-2.7 2.8v3.7h-2.5V4.2zM22 4.2h2.5v9h-2.5v-9zm0-4h2.5v2.5H22V.2zM26 4.2h2.5v1.6c.5-1.1 1.6-1.8 2.8-1.8 1.3 0 2.2.6 2.6 1.8.6-1.1 1.8-1.8 3-1.8 1.9 0 3.3 1.4 3.3 3.6v5.6h-2.5V7.7c0-1.2-.6-1.9-1.6-1.9s-1.8.7-1.8 1.9v5.5h-2.5V7.7c0-1.2-.6-1.9-1.6-1.9s-1.8.7-1.8 1.9v5.5H26V4.2zM41.8 9h6.2c-.2-2.8-1.7-5-4.4-5-2.8 0-4.6 2-4.6 4.6 0 2.7 1.8 4.7 4.7 4.7 1.8 0 3.3-.8 4-2.1l-1.8-1.1c-.5.7-1.3 1.1-2.2 1.1-1.3 0-2.2-.7-2.3-2.3zm-.1-1.8c.2-1.1 1-1.8 2.1-1.8 1 0 1.8.7 2 1.8h-4.1z"/>
              <path fill="#00a8e1" d="M3.8 16.2c7 3.6 20.8 4 29.8-1.2l-1-.9c2.3.2 4.4.4 6-.2-.8 1.3-1.9 2.8-2.6 4.3l-1-.9c-8.6 4.8-22 4.4-28.5-1l-2.7-.1z"/>
            </svg>
          </span>
          <div class="provider-meta">
            <div class="provider-name-row">
              <strong>Prime Video</strong>
              <span class="provider-status-badge provider-status-badge--prime">${t("provider_coming_soon")}</span>
            </div>
            <span class="provider-desc">Amazon Originals & MGM</span>
          </div>
          <span class="provider-accent-rail" aria-hidden="true"></span>
        </div>

        <!-- Kinopoisk -->
        <div class="streaming-provider streaming-provider--kp is-disabled" title="${t("provider_coming_soon")}">
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
              <strong>Кинопоиск</strong>
              <span class="provider-status-badge provider-status-badge--kp">${t("provider_coming_soon")}</span>
            </div>
            <span class="provider-desc">Плюс Мульти & Эксклюзивы</span>
          </div>
          <span class="provider-accent-rail" aria-hidden="true"></span>
        </div>
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
  const isApple = item.provider === "apple" || currentStreamingProvider === "apple";
  const providerChip = isApple
    ? `<span class="apple-chip"><svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor" style="vertical-align:-1px;margin-right:3px;"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.4c.64-.78 1.08-1.86.96-2.95-1 .04-2.12.67-2.78 1.45-.58.67-1.1 1.77-.96 2.83 1.12.09 2.15-.56 2.78-1.33z"/></svg>Apple TV</span>`
    : `<span class="netflix-chip">NETFLIX</span>`;

  return `<div class="movie-tile streaming-tile" data-media-type="${esc(item.media_type || "movie")}" data-provider="${isApple ? "apple" : "netflix"}">
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

  const flatrate = data.flatrate || [];
  const free = data.free || [];
  const rent = data.rent || [];
  const buy = data.buy || [];

  const renderList = (items) =>
    items
      .map(
        (p) =>
          `<div class="watch-provider-item" title="${esc(p.name)}">
            <img class="watch-provider-logo" src="https://image.tmdb.org/t/p/w92${esc(p.logo_path)}" alt="${esc(p.name)}" loading="lazy">
            <span class="watch-provider-name">${esc(p.name)}</span>
          </div>`,
      )
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
  if (!flatrate.length && (rent.length || buy.length)) {
    const combined = [...rent];
    buy.forEach((b) => {
      if (!combined.some((item) => item.id === b.id)) combined.push(b);
    });
    groupsHtml += `<div class="watch-provider-group">
      <span class="watch-group-label">${t("provider_rent_buy")}</span>
      <div class="watch-provider-list">${renderList(combined.slice(0, 6))}</div>
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

    const edChoice =
      typeof isEditorsChoice === "function" && isEditorsChoice(m.id);
    const edMarkup = edChoice
      ? `<a href="#editors-choice" class="detail-editors-choice" aria-label="${t("editors_choice")}" title="${t("editors_choice")}">
          <span class="editors-choice-icon" aria-hidden="true">★</span>
          <span class="editors-choice-title">${t("editors_choice")}</span>
        </a>`
      : "";

    const watchMarkup = renderWatchProviders(data.watch_providers);

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

    bindWatchProviderEvents(data.watch_providers);

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
  if (kind === "streaming" || kind === "netflix" || kind === "apple" || kind === "appletv") {
    const prov = (kind === "apple" || kind === "appletv") ? "apple" : (rawId === "apple" ? "apple" : (rawId === "netflix" ? "netflix" : null));
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
