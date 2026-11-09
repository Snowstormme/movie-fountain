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

    // Editor's Choice
    editors_choice: "Editor's Choice",
    editors_choice_tag: "Personal Recommendation",

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
    sort_default: "Default order",
    sort_rating_desc: "Highest rated",
    sort_rating_asc: "Lowest rated",
    sort_year_desc: "Release date (newest)",
    sort_year_asc: "Release date (oldest)",
    sort_title_asc: "Title (A–Z)",
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

    // Avatar
    avatar_change: "Change photo",
    avatar_choose: "Choose profile picture",
    avatar_upload: "Upload photo",
    avatar_presets: "Or choose a cinephile icon",
    avatar_remove: "Reset to default",
    avatar_close: "Close",
    avatar_updated: "Profile picture updated",
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

    // Editor's Choice
    editors_choice: "Выбор редакции",
    editors_choice_tag: "Личная рекомендация",

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
    sort_default: "По умолчанию",
    sort_rating_desc: "По рейтингу (высший)",
    sort_rating_asc: "По рейтингу (низший)",
    sort_year_desc: "Сначала новые",
    sort_year_asc: "Сначала классика",
    sort_title_asc: "По названию (А–Я)",
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

    // Avatar
    avatar_change: "Сменить фото",
    avatar_choose: "Выбор фотографии профиля",
    avatar_upload: "Загрузить своё фото",
    avatar_presets: "Или выберите кино-значок",
    avatar_remove: "Сбросить фото",
    avatar_close: "Закрыть",
    avatar_updated: "Фотография профиля обновлена",
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
  if (accountNav) {
    const label = accountNav.querySelector?.(".account-nav-label");
    if (label) {
      label.textContent = t("nav_account");
    } else {
      accountNav.textContent = t("nav_account");
    }
  }
  const searchInput = document.querySelector?.("#search");
  if (searchInput) searchInput.placeholder = t("search_placeholder");
  const searchBtn = document.querySelector?.("#search-form button");
  if (searchBtn) searchBtn.textContent = t("search_btn");
}

const avatarKey = "movie-fountain.avatar.v1";
let savedAvatar = "";
try {
  savedAvatar = localStorage.getItem(avatarKey) || "";
} catch {}

function getAvatar() {
  return savedAvatar;
}

function setAvatar(val) {
  savedAvatar = typeof val === "string" ? val.trim() : "";
  try {
    if (savedAvatar) {
      localStorage.setItem(avatarKey, savedAvatar);
    } else {
      localStorage.removeItem(avatarKey);
    }
  } catch {}
  updateAvatarsInUI();
}

const AVATAR_PRESETS = [
  "🎬",
  "🍿",
  "📽️",
  "🕶️",
  "🚀",
  "🦁",
  "🎭",
  "🎞️",
  "⛲",
  "⭐",
  "🏆",
  "🍸",
];

function renderAvatarContent(avatar = getAvatar()) {
  if (!avatar) {
    return '<span class="avatar-initial">M</span>';
  }
  if (
    avatar.startsWith("data:image/") ||
    avatar.startsWith("https://") ||
    avatar.startsWith("/")
  ) {
    return `<img src="${esc(avatar)}" alt="Avatar" class="avatar-img" />`;
  }
  return `<span class="avatar-emoji">${esc(avatar)}</span>`;
}

function renderAvatarHtml(extraClass = "", isButton = false) {
  const content = renderAvatarContent();
  if (isButton) {
    return `<button type="button" class="account-avatar account-avatar--btn ${extraClass}" id="change-avatar-btn" aria-label="${t("avatar_change")}" title="${t("avatar_change")}">
      ${content}
      <span class="account-avatar-badge" aria-hidden="true">📷</span>
    </button>`;
  }
  return `<span class="topbar-avatar ${extraClass}" aria-hidden="true">${content}</span>`;
}

function updateAvatarsInUI() {
  document.querySelectorAll?.(".topbar-avatar")?.forEach((el) => {
    el.innerHTML = renderAvatarContent();
  });
  const accountBtn = document.querySelector?.("#change-avatar-btn");
  if (accountBtn) {
    accountBtn.innerHTML = `${renderAvatarContent()}<span class="account-avatar-badge" aria-hidden="true">📷</span>`;
  }
}

function openAvatarModal() {
  closeAvatarModal();
  const current = getAvatar();
  const modalHtml = `<div class="avatar-modal-overlay" id="avatar-modal" role="dialog" aria-modal="true" aria-labelledby="avatar-modal-title">
    <div class="avatar-modal-card">
      <div class="avatar-modal-header">
        <h3 id="avatar-modal-title">${t("avatar_choose")}</h3>
        <button type="button" class="avatar-modal-close" id="avatar-modal-close" aria-label="${t("avatar_close")}">✕</button>
      </div>
      <div class="avatar-modal-body">
        <div class="avatar-current-preview">
          <div class="account-avatar account-avatar--preview" aria-hidden="true">
            ${renderAvatarContent(current)}
          </div>
        </div>
        <div class="avatar-upload-row">
          <label class="avatar-upload-btn">
            <span>📷 ${t("avatar_upload")}</span>
            <input type="file" id="avatar-file-input" accept="image/png,image/jpeg,image/webp,image/gif" style="display:none">
          </label>
          ${current ? `<button type="button" class="avatar-reset-btn" id="avatar-reset-btn">${t("avatar_remove")}</button>` : ""}
        </div>
        <p class="avatar-presets-title">${t("avatar_presets")}</p>
        <div class="avatar-presets-grid">
          ${AVATAR_PRESETS.map((p) => `<button type="button" class="avatar-preset-btn ${current === p ? "is-selected" : ""}" data-preset="${p}">${p}</button>`).join("")}
        </div>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML("beforeend", modalHtml);

  const modal = document.querySelector("#avatar-modal");
  const closeBtn = modal?.querySelector("#avatar-modal-close");
  const fileInput = modal?.querySelector("#avatar-file-input");
  const resetBtn = modal?.querySelector("#avatar-reset-btn");

  closeBtn?.addEventListener("click", closeAvatarModal);
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeAvatarModal();
  });

  document.addEventListener("keydown", handleModalEsc);

  resetBtn?.addEventListener("click", () => {
    setAvatar("");
    closeAvatarModal();
  });

  fileInput?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const size = 200;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d");
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          setAvatar(dataUrl);
          closeAvatarModal();
        } catch {
          setAvatar(loadEvt.target.result);
          closeAvatarModal();
        }
      };
      img.src = loadEvt.target.result;
    };
    reader.readAsDataURL(file);
  });

  modal?.querySelectorAll("[data-preset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      setAvatar(btn.dataset.preset);
      closeAvatarModal();
    });
  });
}

function handleModalEsc(e) {
  if (e.key === "Escape") closeAvatarModal();
}

function closeAvatarModal() {
  document.removeEventListener("keydown", handleModalEsc);
  document.querySelector("#avatar-modal")?.remove();
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest?.("#change-avatar-btn");
  if (btn) {
    e.preventDefault();
    openAvatarModal();
  }
});

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

function sortMovieList(movies, sortKey = "default") {
  if (!Array.isArray(movies)) return [];
  const list = [...movies];
  switch (sortKey) {
    case "rating_desc":
      return list.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
    case "rating_asc":
      return list.sort((a, b) => (a.vote_average || 0) - (b.vote_average || 0));
    case "year_desc":
      return list.sort((a, b) =>
        String(b.release_date || "").localeCompare(String(a.release_date || "")),
      );
    case "year_asc":
      return list.sort((a, b) => {
        const da = String(a.release_date || "9999");
        const db = String(b.release_date || "9999");
        return da.localeCompare(db);
      });
    case "title_asc":
      return list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    case "default":
    default:
      return list;
  }
}

const IMDB_LOGO_SVG = `<svg class="brand-logo-svg brand-logo-svg--imdb" viewBox="0 0 575 290" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect width="575" height="290" rx="40" fill="#f5c518"/><path d="M69.35 58.24h45.63v175.65H69.35zM201.2 139.15c-3.92-26.77-6.1-41.65-6.53-44.62-1.91-14.33-3.73-26.8-5.47-37.44-3.95 0-23.66 0-59.16 0v175.65h39.97V116.76l16.82 115.98h28.47l15.95-118.56.15 118.56h39.84V57.09h-59.61l-10.57 82.06zM346.71 93.63c.5 2.24.76 7.32.76 15.26v68.1c0 11.69-.76 18.85-2.27 21.49-1.52 2.64-5.56 3.95-12.11 3.95v-115.3c4.97 0 8.36.53 10.16 1.57 1.8 1.05 2.96 2.69 3.46 4.93zm20.61 137.32c5.43-1.19 9.99-3.29 13.69-6.28 3.69-3 6.28-7.15 7.76-12.46 1.49-5.3 2.37-15.83 2.37-31.58v-61.68c0-16.62-.65-27.76-1.66-33.42s-3.55-10.82-7.6-15.44c-4.06-4.62-9.98-7.94-17.76-9.96-7.79-2.02-20.49-3.04-42.58-3.04-2.27 0-13.61 0-34.04 0v175.65h55.28c12.74-.4 20.92-.99 24.54-1.79zM464.76 204.7c-.84 2.23-4.52 3.36-7.3 3.36-2.72 0-4.53-1.08-5.45-3.25-.92-2.16-1.37-7.09-1.37-14.81v-46.42c0-8 .4-12.99 1.21-14.98.8-1.97 2.56-2.97 5.28-2.97 2.78 0 6.51 1.13 7.47 3.4.95 2.27 1.43 7.12 1.43 14.55v45.01c-.29 9.25-.71 14.62-1.27 16.11zm-58.08 26.51h41.08c1.71-6.71 2.65-10.44 2.84-11.19 3.72 4.5 7.81 7.88 12.3 10.12 4.47 2.25 11.16 3.37 16.34 3.37 7.21 0 13.43-1.89 18.68-5.68 5.24-3.78 8.58-8.26 10-13.41 1.42-5.16 2.13-13 2.13-23.54v-49.28c0-10.6-.24-17.52-.71-20.77-.47-3.25-1.87-6.56-4.2-9.95-2.33-3.39-5.72-6.02-10.16-7.9-4.44-1.88-9.68-2.82-15.72-2.82-5.25 0-11.97 1.05-16.45 3.12-4.47 2.07-8.53 5.21-12.17 9.42V55.56h-43.96v175.65z" fill="#000"/></svg>`;

const LETTERBOXD_LOGO_SVG = `<svg class="brand-logo-svg brand-logo-svg--letterboxd" viewBox="0 0 52 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="10" cy="10" r="8" fill="#ff8000"/><circle cx="26" cy="10" r="8" fill="#00e054"/><circle cx="42" cy="10" r="8" fill="#40bcf4"/></svg>`;

function getMovieScore(movie) {
  if (!movie) return 0;
  if (typeof movie.fountain_score === "number") return movie.fountain_score;
  const avg = typeof movie.vote_average === "number" ? movie.vote_average : 0;
  return Math.round(avg * 10);
}

const editorsPicks = {
  3782: { title: "Ikiru" },
  976893: { title: "Perfect Days" },
  235: { title: "Stand by Me" },
  30020: { title: "Taste of Cherry" },
  334541: { title: "Manchester by the Sea" },
};

function isEditorsChoice(movieId) {
  return Boolean(editorsPicks[Number(movieId)]);
}

function getEditorsChoiceData(movieId) {
  return editorsPicks[Number(movieId)] || null;
}

const KNOWN_LETTERBOXD_SCORES = {
  3782: 4.51,
  976893: 4.32,
  235: 4.2,
  30020: 4.32,
  334541: 4.13,
  14537: 4.69,
  389: 4.63,
  598: 4.57,
  12493: 4.61,
  240: 4.59,
  25237: 4.62,
  346: 4.6,
  122: 4.56,
  278: 4.53,
  238: 4.57,
  155: 4.48,
  680: 4.46,
  550: 4.27,
  129: 4.52,
  496243: 4.56,
  157336: 4.41,
  27205: 4.25,
  769: 4.47,
  424: 4.51,
  603: 4.41,
  807: 4.35,
  274: 4.34,
  637: 4.38,
  857: 4.28,
  497: 4.39,
  289: 4.36,
  244786: 4.4,
  1124: 4.24,
  98: 4.18,
  1422: 4.31,
  348: 4.35,
  539: 4.4,
  11216: 4.48,
  68718: 4.22,
  872585: 4.23,
  693134: 4.43,
  1398: 4.43,
  843: 4.41,
  18148: 4.43,
};

function renderRatingBadge(movie) {
  if (!movie) return "";

  if (movie.rating_source === "imdb") {
    const val = Number(movie.vote_average || 0).toFixed(1);
    if (!Number(val)) return "";
    return `<strong class="rating-badge rating-badge--imdb" title="IMDb: ${val}/10">${IMDB_LOGO_SVG} ${val}</strong>`;
  }

  if (movie.rating_source === "letterboxd") {
    const knownLb = KNOWN_LETTERBOXD_SCORES[movie.id];
    const val = knownLb
      ? Number(knownLb).toFixed(1)
      : (Number(movie.vote_average || 0) / 2).toFixed(1);
    if (!Number(val)) return "";
    return `<strong class="rating-badge rating-badge--letterboxd" title="Letterboxd: ${val}/5">${LETTERBOXD_LOGO_SVG} ${val}</strong>`;
  }

  const score = getMovieScore(movie);
  if (!score) return "";
  return `<strong class="rating-badge rating-badge--fountain" title="${t("fountain_score_label")}: ${score}/100"><span class="rating-badge-icon" aria-hidden="true">⛲</span> ${score}</strong>`;
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
