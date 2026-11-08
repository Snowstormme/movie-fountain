const watchedKey = "movie-fountain.watched.v1";
const themeKey = "movie-fountain.theme.v1";
const langKey = "movie-fountain.lang.v1";

const translations = {
  en: {
    // Topbar
    nav_fountain: "Fountain",
    nav_account: "Account",
    search_placeholder: "Search movies, directors, actors…",
    search_btn: "Search",

    // Action buttons & badges
    save: "Save",
    saved: "Saved",
    remove: "Remove",
    to_watchlist: "to watchlist",
    from_watchlist: "from watchlist",
    saved_status_add: "Saved to watchlist.",
    saved_status_remove: "Removed from watchlist.",
    mark_watched: "Mark watched",
    watched: "✓ Watched",
    share: "Share",
    copied: "Copied!",
    copied_status: "Movie link copied.",
    status_watched_updated: "Watched status updated.",

    // Trailer
    watch_trailer: "▶ Watch trailer",
    close_trailer: "Close trailer",
    official_trailer: "Official Trailer",

    // Account Hero & Ranks
    personal_library: "Personal library",
    cinema_passport: "Cinema Passport",
    theme_btn: "Theme",
    theme_classic: "Classic",
    theme_liquid: "Liquid Glass",
    lang_btn: "Language",
    lang_name: "English",
    export_json: "Export",
    import_json: "+ Import",
    privacy: "Privacy",

    rank_enthusiast: "Film Enthusiast",
    rank_cinephile_1: "Level 1 Cinephile",
    rank_cinephile_2: "Level 2 Cinephile",
    rank_scholar: "Level 3 Film Scholar",
    rank_auteur: "Level 4 Auteur in the Making",
    rank_historian: "Level 5 Film Historian",

    // Account Stats
    stat_completion: "Completion",
    stat_completion_sub: "watched",
    stat_of: "of",
    stat_watchlist: "Watchlist",
    stat_waiting: "waiting to watch",
    stat_watched: "Watched",
    stat_none_yet: "None yet",
    stat_library_score: "Library Score",
    stat_avg_rating: "Average rating",

    // Account Tabs & Sort
    filter_watchlist: "Filter watchlist",
    tab_all: "All Movies",
    tab_to_watch: "To Watch",
    tab_watched: "Watched",
    sort_label: "Sort",
    sort_saved: "Recently saved",
    sort_rating: "Highest rated",
    sort_release: "Release date",
    sort_title: "Title A–Z",
    empty_watchlist: "Your watchlist is empty here.",
    empty_watchlist_sub:
      "Save movies from the Fountain and they will appear in this section.",
    explore_fountain: "Explore the Fountain",

    // Shelves & Pages
    shelf_trending_title: "Trending now",
    shelf_trending_sub: "Popular films this week",
    shelf_letterboxd_title: "Letterboxd Top 500",
    shelf_letterboxd_sub: "Curated classics and cinephile favorites",
    shelf_imdb_title: "IMDb Top 250",
    shelf_imdb_sub: "The highest-rated films of all time by IMDb voters",
    shelf_upcoming_title: "Coming soon",
    shelf_upcoming_sub: "Anticipated releases heading to theaters",

    chart_weekly: "Weekly chart",
    page_trending_title: "Trending now",
    page_trending_sub:
      "The {count} most watched and talked-about movies this week, ordered from #1 to #{count}.",
    curated_collection: "Curated collection",
    page_letterboxd_title: "Letterboxd Top 500",
    page_letterboxd_sub:
      "The {count} highest-rated narrative feature films on Letterboxd, ordered from #1 to #{count}.",
    page_imdb_title: "IMDb Top 250",
    page_imdb_sub:
      "The {count} highest-rated movies according to IMDb user ratings, ordered from #1 to #{count}.",
    release_calendar: "Release calendar",
    page_upcoming_title: "Coming soon",
    page_upcoming_sub:
      "{count} upcoming theatrical and digital releases worth keeping on your radar.",

    // Movie Detail
    movie_details: "Movie details",
    directed_by: "Directed by",
    runtime_unknown: "Runtime unknown",
    no_overview: "No overview available.",
    recommendations_title: "You may also like",
    recommendations_sub: "More movies to explore",
    more_from_prefix: "More from",
    more_from_generic: "More from this director",
    other_films_director: "Other films by this director",
    back_to_movie: "Back to movie",

    // Ratings & Consensus
    ratings_heading: "Ratings & Consensus",
    ratings_sub:
      "Weighted consensus score and direct links across movie databases",
    fountain_score_label: "Fountain Score",
    score_recommended: "Recommended",
    score_acclaim: "Universal Acclaim",
    score_highly_rated: "Highly Rated",
    score_favorable: "Generally Favorable",
    score_mixed: "Mixed Reviews",
    score_underwhelming: "Underwhelming",
    consensus_initial:
      "Initial consensus based on TMDB · Calculating full cross-platform consensus…",
    no_rating_yet: "No rating yet",
    loading_short: "Loading…",
    votes: "votes",

    // Person & Search
    role_director: "Director",
    role_actor: "Actor",
    born: "Born",
    films_directed: "directed",
    films_acting: "acting",
    directed_heading: "Directed",
    films_directed_by: "Films directed by",
    acting_heading: "Acting",
    acting_by: "Acting appearances by",
    director_filmography: "Director & Filmography",
    biography_filmography: "Biography & Filmography",
    no_biography: "No biography available.",

    search_heading: "Search results",
    results_for: "Results for",
    search_people_heading: "Directors & Actors",
    search_people_sub:
      "Open a person to view their biography and full filmography",
    search_movies_heading: "Movies",
    search_empty: "No movies, directors, or actors found.",
    results_count: "results",
    result_one: "result",

    // Fountain Settings & Controls
    settings: "Settings",
    playback: "Playback",
    speed_slow: "Slow",
    speed_normal: "Normal",
    speed_fast: "Fast",
    pause: "Pause",
    play: "Play",
    browse: "Browse",
    all_movies: "All movies",
    genre_letterboxd: "Letterboxd Top 500",
    genre_imdb: "IMDb Top 250",
    genre_action: "Action",
    genre_comedy: "Comedy",
    genre_drama: "Drama",
    genre_horror: "Horror",
    genre_scifi: "Sci-fi",
    genre_animation: "Animation",
    mood_exciting: "Exciting",
    mood_dark: "Dark",
    mood_feel_good: "Feel-good",
    mood_romantic: "Romantic",

    refine: "Refine",
    year_label: "Year",
    any_year: "Any year",
    length_label: "Length",
    any_length: "Any length",
    up_to_90: "Up to 90 min",
    up_to_120: "Up to 2 hours",
    up_to_180: "Up to 3 hours",
    hide_watched: "Hide watched",
    apply_filters: "Apply filters",
    reset_filters: "Reset",
    filter_error: "Could not update filters. Try again.",
    matching_movies: "matching movies",
  },
  ru: {
    // Topbar
    nav_fountain: "Фонтан",
    nav_account: "Аккаунт",
    search_placeholder: "Поиск фильмов, режиссёров, актёров…",
    search_btn: "Найти",

    // Action buttons & badges
    save: "В список",
    saved: "В списке",
    remove: "Удалить",
    to_watchlist: "в список",
    from_watchlist: "из списка",
    saved_status_add: "Добавлено в список.",
    saved_status_remove: "Удалено из списка.",
    mark_watched: "Отметить",
    watched: "✓ Просмотрено",
    share: "Поделиться",
    copied: "Скопировано!",
    copied_status: "Ссылка на фильм скопирована.",
    status_watched_updated: "Статус просмотра обновлён.",

    // Trailer
    watch_trailer: "▶ Смотреть трейлер",
    close_trailer: "Закрыть трейлер",
    official_trailer: "Официальный трейлер",

    // Account Hero & Ranks
    personal_library: "Личная фильмотека",
    cinema_passport: "Паспорт синефила",
    theme_btn: "Тема",
    theme_classic: "Классика",
    theme_liquid: "Жидкое стекло",
    lang_btn: "Язык",
    lang_name: "Русский",
    export_json: "Экспорт",
    import_json: "+ Импорт",
    privacy: "Приватность",

    rank_enthusiast: "Начинающий зритель",
    rank_cinephile_1: "Любитель кино (Ур. 1)",
    rank_cinephile_2: "Синефил (Ур. 2)",
    rank_scholar: "Знаток кино (Ур. 3)",
    rank_auteur: "Будущий автор (Ур. 4)",
    rank_historian: "Киноисторик (Ур. 5)",

    // Account Stats
    stat_completion: "Прогресс",
    stat_completion_sub: "просмотрено",
    stat_of: "из",
    stat_watchlist: "В списке",
    stat_waiting: "ждут просмотра",
    stat_watched: "Просмотрено",
    stat_none_yet: "Пока нет",
    stat_library_score: "Средний балл",
    stat_avg_rating: "Средняя оценка",

    // Account Tabs & Sort
    filter_watchlist: "Фильтр списка",
    tab_all: "Все фильмы",
    tab_to_watch: "Хочу посмотреть",
    tab_watched: "Просмотрено",
    sort_label: "Сортировка",
    sort_saved: "Недавно добавленные",
    sort_rating: "По рейтингу",
    sort_release: "По дате выхода",
    sort_title: "По названию (А–Я)",
    empty_watchlist: "В этом разделе пока пусто.",
    empty_watchlist_sub:
      "Сохраняйте понравившиеся фильмы из Фонтана или списков, и они появятся здесь.",
    explore_fountain: "Перейти к Фонтану",

    // Shelves & Pages
    shelf_trending_title: "В тренде сейчас",
    shelf_trending_sub: "Популярные фильмы этой недели",
    shelf_letterboxd_title: "Letterboxd Топ-500",
    shelf_letterboxd_sub: "Признанная классика и шедевры мирового кино",
    shelf_imdb_title: "IMDb Топ-250",
    shelf_imdb_sub: "Фильмы с наивысшими оценками зрителей IMDb всех времён",
    shelf_upcoming_title: "Скоро в кино",
    shelf_upcoming_sub: "Ожидаемые премьеры ближайших месяцев",

    chart_weekly: "Еженедельный чарт",
    page_trending_title: "В тренде сейчас",
    page_trending_sub:
      "{count} самых просматриваемых и обсуждаемых фильмов этой недели, с 1-го по {count}-е место.",
    curated_collection: "Кураторская подборка",
    page_letterboxd_title: "Letterboxd Топ-500",
    page_letterboxd_sub:
      "{count} художественных фильмов с наивысшими оценками на Letterboxd, с 1-го по {count}-е место.",
    page_imdb_title: "IMDb Топ-250",
    page_imdb_sub:
      "{count} фильмов с наивысшими оценками по версии пользователей IMDb, с 1-го по {count}-е место.",
    release_calendar: "Календарь премьер",
    page_upcoming_title: "Скоро в кино",
    page_upcoming_sub:
      "{count} ожидаемых премьер в кинотеатрах и на стримингах, за которыми стоит следить.",

    // Movie Detail
    movie_details: "О фильме",
    directed_by: "Режиссёр:",
    runtime_unknown: "Длительность неизвестна",
    no_overview: "Описание отсутствует.",
    recommendations_title: "Вам также может понравиться",
    recommendations_sub: "Похожие картины для просмотра",
    more_from_prefix: "Другие фильмы:",
    more_from_generic: "Другие фильмы режиссёра",
    other_films_director: "Работы того же режиссёра",
    back_to_movie: "Назад к фильму",

    // Ratings & Consensus
    ratings_heading: "Рейтинги и консенсус",
    ratings_sub: "Взвешенный консенсус и прямые ссылки на кинобазы",
    fountain_score_label: "Fountain Score",
    score_recommended: "Рекомендуется",
    score_acclaim: "Всеобщее признание",
    score_highly_rated: "Высокая оценка",
    score_favorable: "В основном положительные",
    score_mixed: "Смешанные отзывы",
    score_underwhelming: "Слабые отзывы",
    consensus_initial:
      "Предварительный консенсус на основе TMDB · Вычисление общего рейтинга…",
    no_rating_yet: "Нет оценок",
    loading_short: "Загрузка…",
    votes: "голосов",

    // Person & Search
    role_director: "Режиссёр",
    role_actor: "Актёр",
    born: "Родился",
    films_directed: "фильмов снято",
    films_acting: "ролей сыграно",
    directed_heading: "Режиссёрские работы",
    films_directed_by: "Фильмы режиссёра",
    acting_heading: "Актёрские работы",
    acting_by: "Фильмы с участием",
    director_filmography: "Режиссёр и фильмография",
    biography_filmography: "Биография и фильмография",
    no_biography: "Биография отсутствует.",

    search_heading: "Результаты поиска",
    results_for: "Результаты по запросу",
    search_people_heading: "Режиссёры и актёры",
    search_people_sub:
      "Откройте страницу персоны, чтобы посмотреть биографию и полную фильмографию",
    search_movies_heading: "Фильмы",
    search_empty: "Фильмы, режиссёры и актёры не найдены.",
    results_count: "найдено",
    result_one: "найден",

    // Fountain Settings & Controls
    settings: "Настройки",
    playback: "Скорость",
    speed_slow: "Медленно",
    speed_normal: "Стандарт",
    speed_fast: "Быстро",
    pause: "Пауза",
    play: "Старт",
    browse: "Категории",
    all_movies: "Все фильмы",
    genre_letterboxd: "Letterboxd Топ-500",
    genre_imdb: "IMDb Топ-250",
    genre_action: "Боевик",
    genre_comedy: "Комедия",
    genre_drama: "Драма",
    genre_horror: "Ужасы",
    genre_scifi: "Фантастика",
    genre_animation: "Анимация",
    mood_exciting: "Драйв",
    mood_dark: "Мрачное",
    mood_feel_good: "Для настроения",
    mood_romantic: "Романтика",

    refine: "Фильтры",
    year_label: "Год",
    any_year: "Любой год",
    length_label: "Длительность",
    any_length: "Любая",
    up_to_90: "До 90 мин",
    up_to_120: "До 2 часов",
    up_to_180: "До 3 часов",
    hide_watched: "Скрыть просмотренные",
    apply_filters: "Применить",
    reset_filters: "Сброс",
    filter_error: "Не удалось применить фильтры. Попробуйте снова.",
    matching_movies: "подходящих фильмов",
  },
};

let savedLang = "en";
try {
  savedLang = localStorage.getItem(langKey) === "ru" ? "ru" : "en";
} catch {}

function t(key) {
  return translations[savedLang]?.[key] || translations.en?.[key] || key;
}

function pluralFilms(count) {
  if (savedLang === "ru") {
    const n = Math.abs(count) % 100;
    const n1 = n % 10;
    if (n > 10 && n < 20) return `${count} фильмов`;
    if (n1 > 1 && n1 < 5) return `${count} фильма`;
    if (n1 === 1) return `${count} фильм`;
    return `${count} фильмов`;
  }
  return `${count} ${count === 1 ? "film" : "films"}`;
}

function applyLang(lang) {
  if (document.documentElement) {
    document.documentElement.lang = lang;
  }
  const fountainNav = document.querySelector?.(
    'a.fountain-nav[href="#fountain"]',
  );
  if (fountainNav) fountainNav.textContent = t("nav_fountain");
  const accountNav = document.querySelector?.(
    'a.fountain-nav[href="#account"]',
  );
  if (accountNav) accountNav.textContent = t("nav_account");
  const searchInput = document.querySelector?.("#search");
  if (searchInput) searchInput.placeholder = t("search_placeholder");
  const searchBtn = document.querySelector?.("#search-form button");
  if (searchBtn) searchBtn.textContent = t("search_btn");
}

function setLang(lang) {
  savedLang = lang === "ru" ? "ru" : "en";
  try {
    localStorage.setItem(langKey, savedLang);
  } catch {}
  applyLang(savedLang);
  document.dispatchEvent?.(new Event("langchange"));
}

applyLang(savedLang);

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
      ${isWatched ? t("watched") : t("mark_watched")}
    </button>
    <button type="button" data-share="${m.id}">${t("share")}</button>
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
    ${t("year_label")}
    <select name="year">
      <option value="">${t("any_year")}</option>
      ${yearOptions}
    </select>
  </label>
  <label>
    ${t("length_label")}
    <select name="runtime">
      <option value="">${t("any_length")}</option>
      <option value="90">${t("up_to_90")}</option>
      <option value="120">${t("up_to_120")}</option>
      <option value="180">${t("up_to_180")}</option>
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
  } else if (genre === "imdb") {
    q.set("source", "imdb");
  }
  const ids = genreIds[genre] ? [genreIds[genre]] : moodFilters[genre] || [];
  if (ids.length) {
    q.set("genres", ids.join("|"));
  }
  return (await api("/api/discover?" + q)).results || [];
}

let fountainAbort;

function enhanceFountain(movies, letterboxdMovies = [], imdbMovies = []) {
  const panel = document.querySelector("#fountain-settings-panel");
  const stream = document.querySelector("#fountain-stream");
  const grid = document.querySelector("#fountain-grid");
  if (!panel || !stream || !grid) return;

  panel.insertAdjacentHTML(
    "beforeend",
    `<section class="fountain-settings-group fountain-settings-group--refine">
      <div class="fountain-settings-label"><span>${t("refine")}</span></div>
      <form class="discovery-form fountain-advanced-filters" id="advanced-filters">
        ${filterFields()}
        <label><input name="hide" type="checkbox" checked> ${t("hide_watched")}</label>
        <button>${t("apply_filters")}</button>
        <button type="button" id="reset-filters">${t("reset_filters")}</button>
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
      status.textContent = t("loading_short");
      const result =
        form.elements.year.value || form.elements.runtime.value
          ? await discoverMovies(form, genre)
          : filteredMovies(movies, genre, letterboxdMovies, imdbMovies);
      if (token !== sequence) return;
      current = result;
      render();
      const visibleCount = (
        form.elements.hide.checked
          ? current.filter((m) => !watched.has(m.id))
          : current
      ).length;
      status.textContent = `${visibleCount} ${t("matching_movies")}`;
    } catch {
      if (token === sequence) {
        status.textContent = t("filter_error");
      }
    }
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    update();
  });

  document.querySelector("#reset-filters").addEventListener("click", () => {
    form.reset();
    document.querySelector('.fountain-filter[data-filter="all"]')?.click();
  });

  document
    .querySelectorAll(".fountain-filter")
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
      b.textContent = watched.has(id) ? t("watched") : t("mark_watched");
      b.setAttribute("aria-pressed", String(watched.has(id)));
    });
    app.dispatchEvent(new Event("watchedchange"));
    announce(t("status_watched_updated"));
  }

  const share = event.target.closest("[data-share]");
  if (share) {
    const url = `${location.origin}/#movie/${Number(share.dataset.share)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Movie Fountain", url });
      } else {
        await navigator.clipboard.writeText(url);
        announce(t("copied_status"));
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
