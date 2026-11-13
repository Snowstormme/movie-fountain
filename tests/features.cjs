const { test } = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const path = require("node:path");

const ROOT_DIR = path.resolve(__dirname, "..");

function setup() {
  const handlers = {};
  const data = {};
  const stub = {
    innerHTML: "",
    textContent: "",
    addEventListener: (name, fn) => {
      handlers[name] = fn;
    },
    insertAdjacentHTML() {},
    querySelector: () => null,
    querySelectorAll: () => [],
  };
  const ctx = {
    Set,
    Map,
    JSON,
    Number,
    Event,
    AbortController,
    URLSearchParams,
    encodeURIComponent,
    decodeURIComponent,
    Math,
    Date,
    console,
    document: {
      querySelector: () => stub,
      querySelectorAll: () => [],
      body: stub,
      addEventListener() {},
      documentElement: {
        dataset: {},
        classList: { toggle() {} },
      },
    },
    window: { addEventListener() {} },
    location: {
      hash: "#watchlist",
      origin: "https://movie-fountain.pages.dev",
    },
    localStorage: {
      getItem: (k) => data[k] || null,
      setItem: (k, v) => {
        data[k] = v;
      },
      removeItem: (k) => {
        delete data[k];
      },
    },
  };

  vm.createContext(ctx);
  for (const file of ["features.js", "app.js"]) {
    vm.runInContext(fs.readFileSync(path.join(ROOT_DIR, file), "utf8"), ctx);
  }
  return {
    ctx,
    handlers,
    data,
    stub,
    run: (code) => vm.runInContext(code, ctx),
  };
}

test("import normalizes unsafe paths and ratings, deduplicates, rejects invalid IDs", () => {
  const { run } = setup();
  assert.equal(
    run(
      `normalizeMovies([{id:1,title:'A',poster_path:'" onerror="alert(1)',vote_average:99}])[0].poster_path`,
    ),
    null,
  );
  assert.equal(
    run(`normalizeMovies([{id:1,title:'A',vote_average:99}])[0].vote_average`),
    10,
  );
  assert.equal(
    run(`normalizeMovies([{id:1,title:'A'},{id:1,title:'B'}]).length`),
    1,
  );
  assert.throws(() => run(`normalizeMovies([{id:'bad',title:'A'}])`));
  assert.throws(() =>
    run(`normalizeMovies(Array(2001).fill({id:1,title:'A'}))`),
  );
});

test("watchlist save, reload and remove; rendered titles escaped", () => {
  const { run, handlers, data, stub } = setup();
  run(`card({id:123,title:'<script>test</script>',vote_average:8})`);
  const click = () =>
    handlers.click({
      target: { closest: () => ({ dataset: { save: "123" } }) },
    });
  click();
  assert.equal(JSON.parse(data["movie-fountain.watchlist.v1"]).length, 1);
  run("savedMovies=readWatchlist();watchlist()");
  assert.match(stub.innerHTML, /&lt;script&gt;/);
  assert.match(stub.innerHTML, /aria-pressed="true"/);
  click();
  assert.equal(JSON.parse(data["movie-fountain.watchlist.v1"]).length, 0);
});

test("corrupt storage fails safely; filters select genres", () => {
  const { run, data } = setup();
  data["movie-fountain.watchlist.v1"] = "{";
  assert.equal(run("readWatchlist().length"), 0);
  assert.equal(
    run(
      `filteredMovies([{id:1,genre_ids:[28]},{id:2,genre_ids:[35]}],'action')[0].id`,
    ),
    1,
  );
  assert.equal(
    run(
      `filteredMovies([{id:1,genre_ids:[28]}],'letterboxd',[{id:14537,title:'Harakiri'}])[0].id`,
    ),
    14537,
  );
  assert.equal(
    run(
      `filteredMovies([{id:1,genre_ids:[28]}],'imdb',[],[{id:278,title:'The Shawshank Redemption'}])[0].id`,
    ),
    278,
  );
  assert.match(
    run(`fountain({trending:[{id:1,title:'Movie 1',poster_path:'/abc.jpg'}]})`),
    /data-filter="letterboxd">Letterboxd Top 500<\/button>/,
  );
  assert.match(
    run(`fountain({trending:[{id:1,title:'Movie 1',poster_path:'/abc.jpg'}]})`),
    /data-filter="imdb">IMDb Top 250<\/button>/,
  );
  const fountainHtml = run(
    `fountainColumns([{id:1,title:'Movie 1',poster_path:'/abc.jpg'}])`,
  );
  assert.doesNotMatch(fountainHtml, /loading="lazy"/);
  assert.equal((fountainHtml.match(/class="movie-tile"/g) || []).length, 2);
  const homeMarkup = run(
    `homeShelves({
      trending: [{id: 1, title: 'Shared Movie', vote_average: 8}, {id: 6, title: 'Second Trending', vote_average: 7.5}],
      letterboxd_top: [{id: 14537, title: 'Harakiri', vote_average: 8.4}],
      imdb_top: [{id: 278, title: 'The Shawshank Redemption', vote_average: 9.3}],
      popular: [{id: 2, title: 'Unique Popular', vote_average: 7}],
      now_playing: [{id: 3, title: 'In Cinemas', vote_average: 7}],
      top_rated: [{id: 1, title: 'Shared Movie', vote_average: 8}, {id: 4, title: 'Top Film', vote_average: 9}],
      upcoming: [{id: 5, title: 'Next Up', vote_average: 6}]
    })`,
  );
  assert.doesNotMatch(homeMarkup, /Now playing/);
  assert.doesNotMatch(homeMarkup, /Popular this week/);
  assert.doesNotMatch(homeMarkup, /Top rated/);
  assert.doesNotMatch(homeMarkup, /→/);
  assert.match(homeMarkup, /href="#trending"/);
  assert.match(homeMarkup, /Letterboxd Top 500/);
  assert.match(homeMarkup, /href="#letterboxd"/);
  assert.match(homeMarkup, /IMDb Top 250/);
  assert.match(homeMarkup, /href="#imdb"/);
  assert.match(homeMarkup, /href="#upcoming"/);
  assert.match(homeMarkup, /<h3>Harakiri<\/h3>/);
  assert.match(homeMarkup, /<h3>The Shawshank Redemption<\/h3>/);
  assert.equal((homeMarkup.match(/<h3>Shared Movie<\/h3>/g) || []).length, 1);
  assert.equal((homeMarkup.match(/data-watched=/g) || []).length, 5);
  assert.equal((homeMarkup.match(/data-share=/g) || []).length, 5);
  assert.equal((homeMarkup.match(/data-save=/g) || []).length, 5);
  assert.match(homeMarkup, /rating-badge--letterboxd/);
  assert.match(homeMarkup, /rating-badge--imdb/);
  assert.match(homeMarkup, /rating-badge--fountain/);
});

test("renderRatingsSection renders multi-source ratings, OMDb fallback, and escapes unsafe strings", () => {
  const { run } = setup();
  const loadingMarkup = run(
    `renderRatingsSection({id:550,title:'Fight Club',vote_average:8.4,vote_count:25000,imdb_id:'tt0137523'}, null)`,
  );
  assert.match(loadingMarkup, /8\.4<small>\/10<\/small>/);
  assert.match(loadingMarkup, /Loading…/);
  assert.match(loadingMarkup, /https:\/\/www\.imdb\.com\/title\/tt0137523\//);

  const loadedMarkup = run(
    `renderRatingsSection(
      {id:550,title:'Fight Club',vote_average:8.4,vote_count:25000,imdb_id:'tt0137523'},
      {
        imdb: 8.8,
        letterboxd: 4.27,
        rotten: 79,
        rotten_audience: 96,
        imdb_url: 'https://www.imdb.com/title/tt0137523/',
        letterboxd_url: 'https://letterboxd.com/film/fight-club/',
        rotten_url: 'https://www.rottentomatoes.com/m/fight_club',
        updated_at: '2026-11-01'
      }
    )`,
  );
  assert.match(loadedMarkup, /8\.8<small>\/10<\/small>/);
  assert.match(loadedMarkup, /4\.27<small>\/5<\/small>/);
  assert.match(loadedMarkup, /79<small>%<\/small>/);
  assert.match(loadedMarkup, /Audience 96%/);
  assert.match(loadedMarkup, /Updated 2026-11-01/);
  assert.match(loadedMarkup, /Fountain Score/);
  assert.match(loadedMarkup, /86<\/span>/);
  assert.doesNotMatch(loadedMarkup, /fountain-score-tag/);
  assert.match(loadedMarkup, /4 sources/);

  const masterpieceMarkup = run(
    `renderRatingsSection(
      {id:278,title:'The Shawshank Redemption',vote_average:8.7,vote_count:30000},
      {imdb: 9.3, letterboxd: 4.53, rotten: 91, rotten_audience: 98}
    )`,
  );
  assert.match(masterpieceMarkup, /fountain-score-tag--masterpiece/);
  assert.match(masterpieceMarkup, /Masterpiece/);

  const omdbMarkup = run(
    `renderRatingsSection(
      {id:550,title:'Fight Club',vote_average:8.4,vote_count:100},
      {imdb_rating:'<script>8.8/10</script>',rotten_rating:'79%'}
    )`,
  );
  assert.match(omdbMarkup, /&lt;script&gt;8\.8\/10&lt;\/script&gt;/);
  assert.match(omdbMarkup, /OMDb/);
});

test("ratings Pages Function validates scores, IDs, URLs, and OMDb fallback", async () => {
  const ratingsModule = await import(
    path.join(ROOT_DIR, "functions/api/movie/[id]/ratings.js")
  );
  const { parseWhatsonRatings, parseOmdbRatings } = ratingsModule;

  // Rejects mismatched movie ID
  assert.deepEqual(
    parseWhatsonRatings({ id: 999, imdb: { users_rating: 8.5 } }, 550),
    {},
  );

  // Validates score bounds and constructs safe URLs only from valid IDs
  const parsed = parseWhatsonRatings(
    {
      id: 550,
      imdb: { id: "tt0137523", users_rating: 8.8 },
      letterboxd: { id: "fight-club", users_rating: 4.27 },
      rotten_tomatoes: {
        id: "fight_club",
        critics_rating: 79,
        users_rating: 96,
      },
      updated_at: "2026-11-05T12:00:00Z",
    },
    "550",
  );
  assert.equal(parsed.imdb, 8.8);
  assert.equal(parsed.letterboxd, 4.27);
  assert.equal(parsed.rotten, 79);
  assert.equal(parsed.rotten_audience, 96);
  assert.equal(parsed.imdb_url, "https://www.imdb.com/title/tt0137523/");
  assert.equal(
    parsed.letterboxd_url,
    "https://letterboxd.com/film/fight-club/",
  );
  assert.equal(
    parsed.rotten_url,
    "https://www.rottentomatoes.com/m/fight_club",
  );
  assert.equal(parsed.updated_at, "2026-11-05");

  // Rejects out-of-range ratings and malformed IDs
  const unsafe = parseWhatsonRatings(
    {
      id: 550,
      imdb: { id: "javascript:alert(1)", users_rating: 15 },
      letterboxd: { id: "../bad/path", users_rating: -1 },
      rotten_tomatoes: { id: "bad/slash", critics_rating: 105 },
    },
    550,
  );
  assert.equal(unsafe.imdb, undefined);
  assert.equal(unsafe.letterboxd, undefined);
  assert.equal(unsafe.rotten, undefined);
  assert.equal(unsafe.imdb_url, undefined);
  assert.equal(unsafe.letterboxd_url, undefined);
  assert.equal(unsafe.rotten_url, undefined);

  // Parses valid OMDb ratings and ignores invalid ones
  const omdb = parseOmdbRatings({
    Response: "True",
    Ratings: [
      { Source: "Internet Movie Database", Value: "8.8/10" },
      { Source: "Rotten Tomatoes", Value: "79%" },
    ],
  });
  assert.deepEqual(omdb, { imdb_rating: "8.8/10", rotten_rating: "79%" });
});

test("trailer selection and embed rendering validate YouTube keys and fallback cleanly", async () => {
  const { run } = setup();
  const movieModule = await import(
    path.join(ROOT_DIR, "functions/api/movie/[id].js")
  );
  const { pickTrailer } = movieModule;

  const trailer = pickTrailer({
    results: [
      { site: "YouTube", type: "Teaser", official: true, key: "teaser123" },
      {
        site: "YouTube",
        type: "Trailer",
        official: false,
        key: "unofficial1",
      },
      {
        site: "YouTube",
        type: "Trailer",
        official: true,
        key: "qtRKdVHc-cE",
        name: "Official Theatrical Trailer",
      },
      { site: "Vimeo", type: "Trailer", official: true, key: "99999999" },
    ],
  });
  assert.deepEqual(trailer, {
    key: "qtRKdVHc-cE",
    name: "Official Theatrical Trailer",
    type: "Trailer",
  });

  // Rejects malformed YouTube keys
  assert.equal(
    pickTrailer({
      results: [
        { site: "YouTube", type: "Trailer", key: 'bad"onload="alert(1)' },
      ],
    }),
    null,
  );

  const controlsHtml = run(
    `renderTrailerControls({id: 550, title: 'Fight Club', release_date: '1999-10-15'}, {key: 'qtRKdVHc-cE', name: 'Official Trailer'})`,
  );
  assert.match(controlsHtml, /data-trailer-key="qtRKdVHc-cE"/);
  assert.match(controlsHtml, /href="#cast\/550"/);
  assert.doesNotMatch(controlsHtml, />YouTube<\/a>/);

  const fallbackHtml = run(
    `renderTrailerControls({id: 550, title: 'Fight Club', release_date: '1999-10-15'}, null)`,
  );
  assert.match(
    fallbackHtml,
    /https:\/\/www\.youtube\.com\/results\?search_query=Fight%20Club%201999%20official%20trailer/,
  );

  const embedHtml = run(
    `renderTrailerEmbed('qtRKdVHc-cE', 'Official <Trailer>')`,
  );
  assert.match(
    embedHtml,
    /https:\/\/www\.youtube-nocookie\.com\/embed\/qtRKdVHc-cE\?autoplay=1&rel=0/,
  );
  assert.match(embedHtml, /Official &lt;Trailer&gt;/);
  assert.equal(run(`renderTrailerEmbed('bad"key')`), "");
});

test("i18n and language switching in Account and cards", () => {
  const { run, data, stub } = setup();

  // Defaults to English
  assert.equal(run("savedLang"), "en");
  assert.equal(run("t('cinema_passport')"), "Cinema Passport");
  assert.equal(run("t('shelf_imdb_title')"), "IMDb Top 250");
  assert.equal(run("t('genre_imdb')"), "IMDb Top 250");
  assert.equal(run("t('editors_choice')"), "Editor's Choice");
  assert.equal(run("isEditorsChoice(3782)"), true);
  assert.equal(run("isEditorsChoice(976893)"), true);
  assert.equal(run("isEditorsChoice(235)"), true);
  assert.equal(run("isEditorsChoice(30020)"), true);
  assert.equal(run("isEditorsChoice(334541)"), true);
  assert.equal(run("isEditorsChoice(398978)"), true);
  assert.equal(run("isEditorsChoice(278)"), true);
  assert.equal(run("isEditorsChoice(30017)"), true);
  assert.equal(run("isEditorsChoice(4951)"), true);
  assert.equal(run("isEditorsChoice(272)"), true);
  assert.equal(run("isEditorsChoice(62)"), true);
  assert.equal(run("isEditorsChoice(329865)"), true);
  assert.equal(run("isEditorsChoice(238)"), true);
  assert.equal(run("isEditorsChoice(1124)"), true);
  assert.equal(run("isEditorsChoice(345)"), true); // Eyes Wide Shut
  assert.equal(run("isEditorsChoice(83761)"), true); // Life, and Nothing More...
  assert.equal(run("isEditorsChoice(335984)"), true); // Blade Runner 2049
  assert.equal(run("isEditorsChoice(49964)"), true); // Where Is The Friend's House?
  assert.equal(run("isEditorsChoice(489)"), true); // Good Will Hunting
  assert.equal(run("isEditorsChoice(311)"), true); // Once Upon a Time in America
  assert.equal(run("isEditorsChoice(1607)"), true); // A Bronx Tale
  assert.equal(run("isEditorsChoice(47104)"), true); // Through the Olive Trees
  assert.equal(run("isEditorsChoice(497)"), true); // The Green Mile
  assert.equal(run("isEditorsChoice(1592)"), true); // Primal Fear
  assert.equal(run("isEditorsChoice(769)"), true); // GoodFellas
  assert.equal(run("isEditorsChoice(872585)"), true); // Oppenheimer
  assert.equal(run("isEditorsChoice(157336)"), true); // Interstellar
  assert.equal(run("isEditorsChoice(155)"), true); // The Dark Knight
  assert.equal(run("isEditorsChoice(43423)"), true); // The Wind Will Carry Us
  assert.equal(run("isEditorsChoice(141)"), true); // Donnie Darko
  assert.equal(run("isEditorsChoice(641)"), true); // Requiem for a Dream
  assert.equal(run("isEditorsChoice(9475)"), true); // Scent of a Woman
  assert.equal(run("isEditorsChoice(772)"), true); // Home Alone 2
  assert.equal(run("isEditorsChoice(5924)"), true); // Papillon
  assert.equal(run("isEditorsChoice(9999999)"), false);
  assert.equal(run("getEditorsChoiceData(3782)?.title"), "Ikiru");
  assert.equal(run("getEditorsChoiceData(976893)?.title"), "Perfect Days");
  assert.equal(run("getEditorsChoiceData(398978)?.title"), "The Irishman");
  assert.equal(run("getEditorsChoiceData(278)?.title"), "The Shawshank Redemption");
  assert.equal(run("getEditorsChoiceData(345)?.title"), "Eyes Wide Shut");
  assert.equal(run("getEditorsChoiceData(83761)?.title"), "Life, and Nothing More...");
  assert.equal(run("getEditorsChoiceMovies().length"), 34);
  assert.equal(run("t('page_editors_choice_title')"), "Editor's Choice");
  assert.equal(run("pluralFilms(1)"), "1 film");
  assert.equal(run("pluralFilms(5)"), "5 films");
  assert.equal(run("getCinephileRank(0)"), "Film Enthusiast");
  assert.equal(run("getCinephileRank(1)"), "Level 1 Cinephile");
  assert.equal(run("getCinephileRank(50)"), "Level 5 Film Historian");

  // Switch to Russian
  run("setLang('ru')");
  assert.equal(data["movie-fountain.lang.v1"], "ru");
  assert.equal(run("savedLang"), "ru");
  assert.equal(run("t('cinema_passport')"), "Паспорт синефила");
  assert.equal(run("t('shelf_imdb_title')"), "IMDb Топ-250");
  assert.equal(run("t('genre_imdb')"), "IMDb Топ-250");
  assert.equal(run("t('personal_library')"), "Личная фильмотека");
  assert.equal(run("t('editors_choice')"), "Выбор редакции");
  assert.equal(run("t('watch_trailer')"), "▶ Смотреть трейлер");
  assert.equal(run("t('close_trailer')"), "Закрыть трейлер");

  // Russian pluralization rules
  assert.equal(run("pluralFilms(1)"), "1 фильм");
  assert.equal(run("pluralFilms(2)"), "2 фильма");
  assert.equal(run("pluralFilms(5)"), "5 фильмов");
  assert.equal(run("pluralFilms(21)"), "21 фильм");

  // Russian Cinephile ranks
  assert.equal(run("getCinephileRank(0)"), "Начинающий зритель");
  assert.equal(run("getCinephileRank(1)"), "Любитель кино (Ур. 1)");
  assert.equal(run("getCinephileRank(5)"), "Синефил (Ур. 2)");
  assert.equal(run("getCinephileRank(50)"), "Киноисторик (Ур. 5)");

  // Account rendering in Russian
  run("account()");
  assert.match(stub.innerHTML, /Паспорт синефила/);
  assert.match(stub.innerHTML, /🌐 Русский/);
  assert.match(stub.innerHTML, /Личная фильмотека/);
  assert.match(stub.innerHTML, /Прогресс/);
  assert.match(stub.innerHTML, /Хочу посмотреть/);

  // Switch back to English
  run("setLang('en')");
  assert.equal(data["movie-fountain.lang.v1"], "en");
  assert.equal(run("savedLang"), "en");
  assert.equal(run("t('cinema_passport')"), "Cinema Passport");
  run("account()");
  assert.match(stub.innerHTML, /Cinema Passport/);
  assert.match(stub.innerHTML, /🌐 English/);
  assert.match(stub.innerHTML, /id="change-avatar-btn"/);
  assert.match(stub.innerHTML, /account-avatar-badge/);

  // Avatar functionality
  assert.equal(run("getAvatar()"), "");
  assert.match(run("renderAvatarHtml()"), /avatar-initial/);
  assert.match(run("renderAvatarHtml()"), /M/);

  run("setAvatar('🎬')");
  assert.equal(data["movie-fountain.avatar.v1"], "🎬");
  assert.equal(run("getAvatar()"), "🎬");
  assert.match(run("renderAvatarHtml()"), /avatar-emoji/);
  assert.match(run("renderAvatarHtml()"), /🎬/);

  run("setAvatar('data:image/jpeg;base64,sample123')");
  assert.equal(data["movie-fountain.avatar.v1"], "data:image/jpeg;base64,sample123");
  assert.match(run("renderAvatarHtml()"), /data:image\/jpeg;base64,sample123/);

  run("setAvatar('')");
  assert.equal(data["movie-fountain.avatar.v1"], undefined);
  assert.equal(run("getAvatar()"), "");
  assert.match(run("renderAvatarHtml()"), /avatar-initial/);
});

test("sortMovieList and list page rendering sort by rating, release date, and title", () => {
  const { run, stub } = setup();

  const testMovies = [
    { id: 1, title: "Zodiac", vote_average: 7.9, release_date: "2007-03-02" },
    { id: 2, title: "Amadeus", vote_average: 8.4, release_date: "1984-09-19" },
    { id: 3, title: "Parasite", vote_average: 8.5, release_date: "2019-05-30" },
    { id: 4, title: "Casablanca", vote_average: 8.2, release_date: "1942-11-26" },
  ];

  // Default order preserved
  assert.equal(
    run(`sortMovieList(${JSON.stringify(testMovies)}, 'default').map(m => m.id)`).join(","),
    "1,2,3,4",
  );

  // Highest rated
  assert.equal(
    run(`sortMovieList(${JSON.stringify(testMovies)}, 'rating_desc').map(m => m.id)`).join(","),
    "3,2,4,1",
  );

  // Lowest rated
  assert.equal(
    run(`sortMovieList(${JSON.stringify(testMovies)}, 'rating_asc').map(m => m.id)`).join(","),
    "1,4,2,3",
  );

  // Newest first
  assert.equal(
    run(`sortMovieList(${JSON.stringify(testMovies)}, 'year_desc').map(m => m.id)`).join(","),
    "3,1,2,4",
  );

  // Oldest first
  assert.equal(
    run(`sortMovieList(${JSON.stringify(testMovies)}, 'year_asc').map(m => m.id)`).join(","),
    "4,2,1,3",
  );

  // Title A-Z
  assert.equal(
    run(`sortMovieList(${JSON.stringify(testMovies)}, 'title_asc').map(m => m.id)`).join(","),
    "2,4,3,1", // Amadeus, Casablanca, Parasite, Zodiac
  );

  // Renders list page with sort toolbar and counter
  run(`renderMovieListPage({
    eyebrow: 'Curated collection',
    title: 'IMDb Top 250',
    subText: 'The 250 highest-rated movies',
    movies: ${JSON.stringify(testMovies)}
  })`);
  assert.match(stub.innerHTML, /IMDb Top 250/);
  assert.match(stub.innerHTML, /class="list-toolbar"/);
  assert.match(stub.innerHTML, /data-list-sort/);
  assert.match(stub.innerHTML, /4 films/);
  assert.match(stub.innerHTML, /id="list-movie-grid"/);

  // getMovieScore & renderRatingBadge
  assert.equal(run("getMovieScore({ vote_average: 8.4 })"), 84);
  assert.equal(run("getMovieScore({ fountain_score: 91, vote_average: 7.5 })"), 91);
  const badgeHtml = run("renderRatingBadge({ vote_average: 8.4 })");
  assert.match(badgeHtml, /rating-badge--fountain/);
  assert.match(badgeHtml, /⛲/);
  assert.match(badgeHtml, /84/);

  const imdbBadge = run("renderRatingBadge({ vote_average: 9.3, rating_source: 'imdb' })");
  assert.match(imdbBadge, /rating-badge--imdb/);
  assert.match(imdbBadge, /brand-logo-svg--imdb/);
  assert.match(imdbBadge, /9\.3/);
  assert.match(imdbBadge, /IMDb: 9\.3\/10/);

  const lbBadge = run("renderRatingBadge({ vote_average: 8.6, rating_source: 'letterboxd' })");
  assert.match(lbBadge, /rating-badge--letterboxd/);
  assert.match(lbBadge, /brand-logo-svg--letterboxd/);
  assert.match(lbBadge, /4\.3/);
  assert.match(lbBadge, /Letterboxd: 4\.3\/5/);
});

test("safeNumericId and route handlers prevent client-side XSS from URL hash and unescaped inputs", async () => {
  const { run, stub } = setup();

  // Valid numbers
  assert.equal(run("safeNumericId(550)"), 550);
  assert.equal(run("safeNumericId('550')"), 550);
  assert.equal(run("safeNumericId(' 12345 ')"), 12345);

  // Rejects XSS injection and invalid formats
  assert.equal(run("safeNumericId('550\" onerror=\"alert(1)\"')"), null);
  assert.equal(run("safeNumericId('<script>alert(1)</script>')"), null);
  assert.equal(run("safeNumericId('javascript:alert(1)')"), null);
  assert.equal(run("safeNumericId(-10)"), null);
  assert.equal(run("safeNumericId('abc')"), null);
  assert.equal(run("safeNumericId(null)"), null);
  assert.equal(run("safeNumericId(undefined)"), null);

  // cast handler with malicious ID safely rejects without injecting XSS into DOM
  await run("cast('123\" onmouseover=\"alert(1)\"')");
  assert.doesNotMatch(stub.innerHTML, /onmouseover/);
  assert.match(stub.innerHTML, /message error/);

  // movie handler with malicious ID safely rejects without injecting XSS into DOM
  await run("movie('999<script>alert(1)</script>')");
  assert.ok(!stub.innerHTML.includes("<script>"));
  assert.doesNotMatch(stub.innerHTML, /alert\(1\)/);
  assert.match(stub.innerHTML, /message error/);

  // person handler with malicious ID safely rejects without injecting XSS into DOM
  await run("person('100\" onclick=\"alert(1)\"')");
  assert.doesNotMatch(stub.innerHTML, /onclick/);
  assert.match(stub.innerHTML, /message error/);
});

test("watch providers extraction and rendering format streaming services and country switchers cleanly", async () => {
  const { run } = setup();
  const movieDetailsModule = await import(
    path.join(ROOT_DIR, "functions/api/movie/[id].js")
  );
  const { extractWatchProviders, enrichWatchProvidersWithCatalogs } = movieDetailsModule;

  // Extracts and sanitizes TMDB watch providers
  const sampleProviders = {
    results: {
      US: {
        link: "https://www.themoviedb.org/movie/550/watch?locale=US",
        flatrate: [
          {
            provider_id: 8,
            provider_name: "Netflix",
            logo_path: "/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg",
          },
        ],
        rent: [
          {
            provider_id: 2,
            provider_name: "Apple TV",
            logo_path: "/2E03q95U877fQoI9mY4i.jpg",
          },
        ],
      },
      RU: {
        link: "https://www.themoviedb.org/movie/550/watch?locale=RU",
        flatrate: [
          {
            provider_id: 117,
            provider_name: "Kinopoisk",
            logo_path: "/kinopoisk.jpg",
          },
          {
            provider_id: 113,
            provider_name: "Ivi",
            logo_path: "/ivi.jpg",
          },
        ],
      },
    },
  };

  const extracted = extractWatchProviders(sampleProviders);
  assert.equal(Boolean(extracted.US), true);
  assert.equal(extracted.US.flatrate[0].name, "Netflix");
  assert.equal(extracted.RU.flatrate[0].name, "Kinopoisk");
  assert.equal(extractWatchProviders(null), null);
  assert.equal(extractWatchProviders({}), null);

  // Renders watch provider section with country pills and service logos
  const htmlUS = run(
    `renderWatchProviders(${JSON.stringify(extracted)}, "US")`,
  );
  assert.match(htmlUS, /detail-watch-section/);
  assert.match(htmlUS, /Netflix/);
  assert.match(htmlUS, /data-watch-country="US"/);
  assert.match(htmlUS, /JustWatch/);

  const htmlRU = run(
    `renderWatchProviders(${JSON.stringify(extracted)}, "RU")`,
  );
  assert.match(htmlRU, /Kinopoisk/);
  assert.match(htmlRU, /Ivi/);
  assert.match(htmlRU, /data-watch-country="RU"/);
  assert.match(htmlUS, /href="#streaming\/netflix"/);
  assert.match(htmlRU, /href="#streaming\/kinopoisk"/);

  // All 6 streaming hub providers link back to #streaming/<provider>, non-hub providers stay non-links
  const hubShowcase = {
    US: {
      flatrate: [
        { id: 8, name: "Netflix", logo_path: "/netflix.jpg" },
        { id: 350, name: "Apple TV+", logo_path: "/apple.jpg" },
        { id: 1899, name: "Max", logo_path: "/max.jpg" },
        { id: 119, name: "Amazon Prime Video", logo_path: "/prime.jpg" },
        { id: 15, name: "Hulu", logo_path: "/hulu.jpg" },
        { id: 337, name: "Disney Plus", logo_path: "/disney.jpg" },
        { id: 531, name: "Paramount Plus", logo_path: "/paramount.jpg" },
        { id: 11, name: "MUBI", logo_path: "/mubi.jpg" },
        { id: 386, name: "Peacock Premium", logo_path: "/peacock.jpg" },
        { id: 283, name: "Crunchyroll", logo_path: "/crunchyroll.jpg" },
      ],
      buy: [
        { id: 3, name: "Google Play Movies", logo_path: "/google.jpg" },
      ],
    },
    RU: {
      flatrate: [
        { id: 115, name: "Okko", logo_path: "inline:okko" },
        { id: 117, name: "Kinopoisk", logo_path: "inline:kinopoisk" },
      ],
    },
  };
  const htmlAllHubsUS = run(`renderWatchProviders(${JSON.stringify(hubShowcase)}, "US")`);
  assert.match(htmlAllHubsUS, /href="#streaming\/netflix"/);
  assert.match(htmlAllHubsUS, /href="#streaming\/apple"/);
  assert.match(htmlAllHubsUS, /href="#streaming\/max"/);
  assert.match(htmlAllHubsUS, /href="#streaming\/prime"/);
  assert.match(htmlAllHubsUS, /href="#streaming\/hulu"/);
  assert.match(htmlAllHubsUS, /data-hub-provider="hulu"/);
  assert.match(htmlAllHubsUS, /href="#streaming\/disney"/);
  assert.match(htmlAllHubsUS, /data-hub-provider="disney"/);
  assert.match(htmlAllHubsUS, /href="#streaming\/paramount"/);
  assert.match(htmlAllHubsUS, /data-hub-provider="paramount"/);
  assert.match(htmlAllHubsUS, /href="#streaming\/mubi"/);
  assert.match(htmlAllHubsUS, /data-hub-provider="mubi"/);
  assert.match(htmlAllHubsUS, /href="#streaming\/peacock"/);
  assert.match(htmlAllHubsUS, /data-hub-provider="peacock"/);
  assert.match(htmlAllHubsUS, /watch-provider-logo--peacock/);
  assert.match(htmlAllHubsUS, />Peacock</);
  assert.match(htmlAllHubsUS, /href="#streaming\/googletv"/);
  assert.match(htmlAllHubsUS, /data-hub-provider="googletv"/);
  assert.match(htmlAllHubsUS, /watch-provider-logo--googletv/);
  assert.match(htmlAllHubsUS, />Google TV</);
  assert.doesNotMatch(htmlAllHubsUS, /href="#streaming\/[^"]*crunchyroll/i);

  const htmlHubRU = run(`renderWatchProviders(${JSON.stringify(hubShowcase)}, "RU")`);
  assert.match(htmlHubRU, /href="#streaming\/okko"/);
  assert.match(htmlHubRU, /watch-provider-logo--okko/);
  assert.match(htmlHubRU, /href="#streaming\/kinopoisk"/);
  assert.match(htmlHubRU, /watch-provider-logo--kp/);

  // Enriches Kinopoisk, Hulu, and Okko catalog items even when TMDB returns null
  const enrichedKp = enrichWatchProvidersWithCatalogs(null, 586353);
  assert.ok(enrichedKp?.RU?.flatrate?.some((p) => p.name === "Kinopoisk"));
  const renderedEnriched = run(`renderWatchProviders(${JSON.stringify(enrichedKp)}, "RU")`);
  assert.match(renderedEnriched, /href="#streaming\/kinopoisk"/);
  assert.match(renderedEnriched, /Kinopoisk/);

  const enrichedOkko = enrichWatchProvidersWithCatalogs(null, 250928);
  assert.ok(enrichedOkko?.RU?.flatrate?.some((p) => p.name === "Okko"));
  const renderedEnrichedOkko = run(`renderWatchProviders(${JSON.stringify(enrichedOkko)}, "RU")`);
  assert.match(renderedEnrichedOkko, /href="#streaming\/okko"/);
  assert.match(renderedEnrichedOkko, /watch-provider-logo--okko/);
  assert.match(renderedEnrichedOkko, /Okko/);

  const enrichedDisney = enrichWatchProvidersWithCatalogs(null, 82856);
  assert.ok(enrichedDisney?.US?.flatrate?.some((p) => p.name === "Disney+"));
  const renderedEnrichedDisney = run(`renderWatchProviders(${JSON.stringify(enrichedDisney)}, "US")`);
  assert.match(renderedEnrichedDisney, /href="#streaming\/disney"/);
  assert.match(renderedEnrichedDisney, /watch-provider-logo--disney/);
  assert.match(renderedEnrichedDisney, /Disney\+/);

  const enrichedHulu = enrichWatchProvidersWithCatalogs(null, 587792);
  assert.ok(enrichedHulu?.US?.flatrate?.some((p) => p.name === "Hulu"));
  const renderedEnrichedHulu = run(`renderWatchProviders(${JSON.stringify(enrichedHulu)}, "US")`);
  assert.match(renderedEnrichedHulu, /href="#streaming\/hulu"/);
  assert.match(renderedEnrichedHulu, /watch-provider-logo--hulu/);
  assert.match(renderedEnrichedHulu, /Hulu/);

  const enrichedParamount = enrichWatchProvidersWithCatalogs(null, 247718);
  assert.ok(enrichedParamount?.US?.flatrate?.some((p) => p.name === "Paramount+"));
  const noDupParamount = enrichWatchProvidersWithCatalogs(
    { US: { flatrate: [{ id: 2303, name: "Paramount+", logo_path: "/p.jpg" }] } },
    361743,
  );
  assert.equal(noDupParamount.US.flatrate.length, 1);
  const renderedEnrichedParamount = run(`renderWatchProviders(${JSON.stringify(enrichedParamount)}, "US")`);
  assert.match(renderedEnrichedParamount, /href="#streaming\/paramount"/);
  assert.match(renderedEnrichedParamount, /watch-provider-logo--paramount/);
  assert.match(renderedEnrichedParamount, /Paramount\+/);

  const enrichedGoogleTV = enrichWatchProvidersWithCatalogs(null, 693134);
  assert.ok(enrichedGoogleTV?.US?.buy?.some((p) => p.name === "Google TV"));
  const noDupGoogleTV = enrichWatchProvidersWithCatalogs(
    { US: { buy: [{ id: 3, name: "Google Play Movies", logo_path: "/gtv.jpg" }] } },
    872585,
  );
  assert.equal(noDupGoogleTV.US.buy.length, 1);
  const renderedEnrichedGoogleTV = run(`renderWatchProviders(${JSON.stringify(enrichedGoogleTV)}, "US")`);
  assert.match(renderedEnrichedGoogleTV, /href="#streaming\/googletv"/);
  assert.match(renderedEnrichedGoogleTV, /watch-provider-logo--googletv/);
  assert.match(renderedEnrichedGoogleTV, /Google TV/);

  const enrichedMubi = enrichWatchProvidersWithCatalogs(null, 933260);
  assert.ok(enrichedMubi?.US?.flatrate?.some((p) => p.name === "MUBI"));
  const noDupMubi = enrichWatchProvidersWithCatalogs(
    { US: { flatrate: [{ id: 201, name: "MUBI Amazon Channel", logo_path: "/mubi.jpg" }] } },
    965150,
  );
  assert.equal(noDupMubi.US.flatrate.length, 1);
  const renderedEnrichedMubi = run(`renderWatchProviders(${JSON.stringify(enrichedMubi)}, "US")`);
  assert.match(renderedEnrichedMubi, /href="#streaming\/mubi"/);
  assert.match(renderedEnrichedMubi, /watch-provider-logo--mubi/);
  assert.match(renderedEnrichedMubi, /MUBI/);

  const enrichedPeacock = enrichWatchProvidersWithCatalogs(null, 840430);
  assert.ok(enrichedPeacock?.US?.flatrate?.some((p) => p.name === "Peacock"));
  const noDupPeacock = enrichWatchProvidersWithCatalogs(
    { US: { flatrate: [{ id: 387, name: "Peacock Premium Plus", logo_path: "/peacock.jpg" }] } },
    872585,
  );
  assert.equal(noDupPeacock.US.flatrate.length, 1);
  const renderedEnrichedPeacock = run(`renderWatchProviders(${JSON.stringify(enrichedPeacock)}, "US")`);
  assert.match(renderedEnrichedPeacock, /href="#streaming\/peacock"/);
  assert.match(renderedEnrichedPeacock, /watch-provider-logo--peacock/);
  assert.match(renderedEnrichedPeacock, /Peacock/);

  // Deduplicates redundant ad tiers, kids editions, and channel variants
  const dupRaw = {
    results: {
      US: {
        flatrate: [
          { provider_id: 1796, provider_name: "Netflix Standard with Ads", logo_path: "/ads.jpg" },
          { provider_id: 8, provider_name: "Netflix", logo_path: "/nf.jpg" },
          { provider_id: 175, provider_name: "Netflix Kids", logo_path: "/nfkids.jpg" },
          { provider_id: 1825, provider_name: "HBO Max Amazon Channel", logo_path: "/hboc.jpg" },
          { provider_id: 1899, provider_name: "HBO Max", logo_path: "/hbo.jpg" },
          { provider_id: 2100, provider_name: "Amazon Prime Video with Ads", logo_path: "/pva.jpg" },
          { provider_id: 9, provider_name: "Amazon Prime Video", logo_path: "/pv.jpg" },
          { provider_id: 582, provider_name: "Paramount+ Amazon Channel", logo_path: "/pa.jpg" },
          { provider_id: 531, provider_name: "Paramount Plus", logo_path: "/pp.jpg" },
          { provider_id: 2616, provider_name: "Paramount Plus Essential", logo_path: "/pe.jpg" },
        ],
      },
    },
  };
  const dedupedExtracted = extractWatchProviders(dupRaw);
  assert.deepEqual(
    dedupedExtracted.US.flatrate.map((p) => p.name),
    ["Netflix", "HBO Max", "Amazon Prime Video", "Paramount+"],
  );
  const dupClientInput = {
    US: {
      flatrate: dupRaw.results.US.flatrate.map((p) => ({
        id: p.provider_id,
        name: p.provider_name,
        logo_path: p.logo_path,
      })),
    },
  };
  const renderedDeduped = run(`renderWatchProviders(${JSON.stringify(dupClientInput)}, "US")`);
  assert.doesNotMatch(renderedDeduped, /with Ads|Amazon Channel|Kids|Essential/);
  assert.match(renderedDeduped, /Netflix/);
  assert.match(renderedDeduped, /HBO Max/);
  assert.match(renderedDeduped, /Amazon Prime Video/);
  assert.match(renderedDeduped, /Paramount\+/);
});

test("streaming hub endpoint and catalog serve Netflix movies and series with type filtering", async () => {
  const { run } = setup();
  const { onRequestGet } = await import("../functions/api/streaming.js");

  // 1. All Netflix items (movies + series)
  const reqAll = new Request("https://movie-fountain.pages.dev/api/streaming?provider=netflix");
  const resAll = await onRequestGet({ request: reqAll, env: {} });
  assert.equal(resAll.status, 200);
  const dataAll = await resAll.json();
  assert.equal(dataAll.provider, "netflix");
  assert.ok(dataAll.results.length >= 20);

  const hasMovies = dataAll.results.some((m) => m.media_type === "movie");
  const hasSeries = dataAll.results.some((m) => m.media_type === "tv");
  assert.ok(hasMovies, "Must include Netflix movies");
  assert.ok(hasSeries, "Must include Netflix TV series");

  // 2. Type filtering: movies only
  const reqMovies = new Request("https://movie-fountain.pages.dev/api/streaming?provider=netflix&type=movie");
  const resMovies = await onRequestGet({ request: reqMovies, env: {} });
  const dataMovies = await resMovies.json();
  assert.ok(dataMovies.results.every((m) => m.media_type === "movie"));

  // 3. Type filtering: TV series only
  const reqTv = new Request("https://movie-fountain.pages.dev/api/streaming?provider=netflix&type=tv");
  const resTv = await onRequestGet({ request: reqTv, env: {} });
  const dataTv = await resTv.json();
  assert.ok(dataTv.results.every((m) => m.media_type === "tv"));

  // 4. Unsupported provider returns 400
  const reqInvalid = new Request("https://movie-fountain.pages.dev/api/streaming?provider=unknown");
  const resInvalid = await onRequestGet({ request: reqInvalid, env: {} });
  assert.equal(resInvalid.status, 400);

  // 5. Country parameter and pagination
  const reqGB = new Request("https://movie-fountain.pages.dev/api/streaming?provider=netflix&country=gb");
  const resGB = await onRequestGet({ request: reqGB, env: {} });
  assert.equal(resGB.status, 200);
  const dataGB = await resGB.json();
  assert.equal(dataGB.country, "GB");
  assert.equal(dataGB.page, 1);
  assert.ok(dataGB.total_pages >= 1);
  assert.ok(dataGB.total_results > 0);

  // Invalid country defaults to US
  const reqBadCountry = new Request("https://movie-fountain.pages.dev/api/streaming?provider=netflix&country=INVALID123");
  const resBadCountry = await onRequestGet({ request: reqBadCountry, env: {} });
  const dataBadCountry = await resBadCountry.json();
  assert.equal(dataBadCountry.country, "US");

  // Page parameter
  const reqPage2 = new Request("https://movie-fountain.pages.dev/api/streaming?provider=netflix&page=2");
  const resPage2 = await onRequestGet({ request: reqPage2, env: {} });
  const dataPage2 = await resPage2.json();
  assert.equal(dataPage2.page, 2);
  assert.ok(dataPage2.results.length > 0);

  // 6. I18n strings present in EN and RU
  assert.equal(run("t('nav_streaming')"), "Streaming");
  assert.equal(run("t('country_label')"), "Catalog Region");
  assert.equal(run("t('load_more_titles')"), "Load More Titles");
  assert.equal(run("t('all_titles_loaded')"), "All available titles loaded");
  assert.equal(run("t('country_gb')"), "United Kingdom");

  // 7. Apple TV+ provider endpoint and catalog
  const reqApple = new Request("https://movie-fountain.pages.dev/api/streaming?provider=apple");
  const resApple = await onRequestGet({ request: reqApple, env: {} });
  assert.equal(resApple.status, 200);
  const dataApple = await resApple.json();
  assert.equal(dataApple.provider, "apple");
  assert.ok(dataApple.results.length >= 20);

  const appleMovies = dataApple.results.some((m) => m.media_type === "movie");
  const appleSeries = dataApple.results.some((m) => m.media_type === "tv");
  assert.ok(appleMovies, "Apple TV+ catalog must include movies (e.g. CODA, Killers of the Flower Moon)");
  assert.ok(appleSeries, "Apple TV+ catalog must include series (e.g. Ted Lasso, Severance)");

  const reqAppleMovies = new Request("https://movie-fountain.pages.dev/api/streaming?provider=apple&type=movie");
  const resAppleMovies = await onRequestGet({ request: reqAppleMovies, env: {} });
  const dataAppleMovies = await resAppleMovies.json();
  assert.ok(dataAppleMovies.results.every((m) => m.media_type === "movie"));

  const reqAppleTv = new Request("https://movie-fountain.pages.dev/api/streaming?provider=apple&type=tv");
  const resAppleTv = await onRequestGet({ request: reqAppleTv, env: {} });
  const dataAppleTv = await resAppleTv.json();
  assert.ok(dataAppleTv.results.every((m) => m.media_type === "tv"));

  // Check Apple TV i18n
  run("setLang('en')");
  assert.equal(run("t('provider_apple')"), "Apple TV");
  assert.equal(run("t('provider_apple_sub')"), "Award-winning originals, hit dramas & acclaimed films");
  run("setLang('ru')");
  assert.equal(run("t('provider_apple')"), "Apple TV");
  assert.equal(run("t('provider_apple_sub')"), "Оригинальные драмы, лауреаты Оскара и авторские сериалы");

  // 8. Max (HBO) provider endpoint, aliases, and catalog
  const reqMax = new Request("https://movie-fountain.pages.dev/api/streaming?provider=max");
  const resMax = await onRequestGet({ request: reqMax, env: {} });
  assert.equal(resMax.status, 200);
  const dataMax = await resMax.json();
  assert.equal(dataMax.provider, "max");
  assert.ok(dataMax.results.length >= 20);

  const maxMovies = dataMax.results.some((m) => m.media_type === "movie");
  const maxSeries = dataMax.results.some((m) => m.media_type === "tv");
  assert.ok(maxMovies, "Max catalog must include movies (e.g. Dune: Part Two, The Dark Knight)");
  assert.ok(maxSeries, "Max catalog must include series (e.g. The Sopranos, Succession, The Last of Us)");

  // Alias checks (hbo and hbomax)
  const reqHbo = new Request("https://movie-fountain.pages.dev/api/streaming?provider=hbo");
  const resHbo = await onRequestGet({ request: reqHbo, env: {} });
  assert.equal(resHbo.status, 200);
  const dataHbo = await resHbo.json();
  assert.equal(dataHbo.provider, "max");

  const reqHboMax = new Request("https://movie-fountain.pages.dev/api/streaming?provider=hbomax");
  const resHboMax = await onRequestGet({ request: reqHboMax, env: {} });
  assert.equal(resHboMax.status, 200);
  const dataHboMax = await resHboMax.json();
  assert.equal(dataHboMax.provider, "max");

  const reqMaxMovies = new Request("https://movie-fountain.pages.dev/api/streaming?provider=max&type=movie");
  const resMaxMovies = await onRequestGet({ request: reqMaxMovies, env: {} });
  const dataMaxMovies = await resMaxMovies.json();
  assert.ok(dataMaxMovies.results.every((m) => m.media_type === "movie"));

  const reqMaxTv = new Request("https://movie-fountain.pages.dev/api/streaming?provider=max&type=tv");
  const resMaxTv = await onRequestGet({ request: reqMaxTv, env: {} });
  const dataMaxTv = await resMaxTv.json();
  assert.ok(dataMaxTv.results.every((m) => m.media_type === "tv"));

  // Check HBO Max i18n
  run("setLang('en')");
  assert.equal(run("t('provider_max')"), "HBO Max");
  assert.equal(run("t('provider_max_sub')"), "HBO originals, Warner Bros. cinema & iconic TV");
  run("setLang('ru')");
  assert.equal(run("t('provider_max')"), "HBO Max");
  assert.equal(run("t('provider_max_sub')"), "Культовые сериалы HBO, премьеры Warner Bros. и классика");

  // 9. Prime Video provider endpoint, aliases, and catalog
  const reqPrime = new Request("https://movie-fountain.pages.dev/api/streaming?provider=prime");
  const resPrime = await onRequestGet({ request: reqPrime, env: {} });
  assert.equal(resPrime.status, 200);
  const dataPrime = await resPrime.json();
  assert.equal(dataPrime.provider, "prime");
  assert.ok(dataPrime.results.length >= 20);

  const primeMovies = dataPrime.results.some((m) => m.media_type === "movie");
  const primeSeries = dataPrime.results.some((m) => m.media_type === "tv");
  assert.ok(primeMovies, "Prime Video catalog must include movies (e.g. Sound of Metal, Air)");
  assert.ok(primeSeries, "Prime Video catalog must include series (e.g. The Boys, Fallout, Fleabag)");

  // Alias checks (amazon and primevideo)
  const reqAmazon = new Request("https://movie-fountain.pages.dev/api/streaming?provider=amazon");
  const resAmazon = await onRequestGet({ request: reqAmazon, env: {} });
  assert.equal(resAmazon.status, 200);
  const dataAmazon = await resAmazon.json();
  assert.equal(dataAmazon.provider, "prime");

  const reqPrimeVideo = new Request("https://movie-fountain.pages.dev/api/streaming?provider=primevideo");
  const resPrimeVideo = await onRequestGet({ request: reqPrimeVideo, env: {} });
  assert.equal(resPrimeVideo.status, 200);
  const dataPrimeVideo = await resPrimeVideo.json();
  assert.equal(dataPrimeVideo.provider, "prime");

  const reqPrimeMovies = new Request("https://movie-fountain.pages.dev/api/streaming?provider=prime&type=movie");
  const resPrimeMovies = await onRequestGet({ request: reqPrimeMovies, env: {} });
  const dataPrimeMovies = await resPrimeMovies.json();
  assert.ok(dataPrimeMovies.results.every((m) => m.media_type === "movie"));

  const reqPrimeTv = new Request("https://movie-fountain.pages.dev/api/streaming?provider=prime&type=tv");
  const resPrimeTv = await onRequestGet({ request: reqPrimeTv, env: {} });
  const dataPrimeTv = await resPrimeTv.json();
  assert.ok(dataPrimeTv.results.every((m) => m.media_type === "tv"));

  // Check Prime Video i18n
  run("setLang('en')");
  assert.equal(run("t('provider_prime')"), "Prime Video");
  assert.equal(run("t('provider_prime_sub')"), "Amazon Originals, blockbuster cinema & hit series");
  run("setLang('ru')");
  assert.equal(run("t('provider_prime')"), "Prime Video");
  assert.equal(run("t('provider_prime_sub')"), "Оригинальные шоу Amazon, блокбастеры и мировые хиты");

  // 10. Kinopoisk provider endpoint, aliases, and catalog
  const reqKp = new Request("https://movie-fountain.pages.dev/api/streaming?provider=kinopoisk");
  const resKp = await onRequestGet({ request: reqKp, env: {} });
  assert.equal(resKp.status, 200);
  const dataKp = await resKp.json();
  assert.equal(dataKp.provider, "kinopoisk");
  assert.ok(dataKp.results.length >= 20);

  const kpMovies = dataKp.results.some((m) => m.media_type === "movie");
  const kpSeries = dataKp.results.some((m) => m.media_type === "tv");
  assert.ok(kpMovies, "Kinopoisk catalog must include movies (e.g. Brother, Major Grom)");
  assert.ok(kpSeries, "Kinopoisk catalog must include series (e.g. Trigger, King & Jester)");

  // Alias checks (kp and kino)
  const reqKpAlias = new Request("https://movie-fountain.pages.dev/api/streaming?provider=kp");
  const resKpAlias = await onRequestGet({ request: reqKpAlias, env: {} });
  assert.equal(resKpAlias.status, 200);
  const dataKpAlias = await resKpAlias.json();
  assert.equal(dataKpAlias.provider, "kinopoisk");

  const reqKinoAlias = new Request("https://movie-fountain.pages.dev/api/streaming?provider=kino");
  const resKinoAlias = await onRequestGet({ request: reqKinoAlias, env: {} });
  assert.equal(resKinoAlias.status, 200);
  const dataKinoAlias = await resKinoAlias.json();
  assert.equal(dataKinoAlias.provider, "kinopoisk");

  const reqKpMovies = new Request("https://movie-fountain.pages.dev/api/streaming?provider=kinopoisk&type=movie");
  const resKpMovies = await onRequestGet({ request: reqKpMovies, env: {} });
  const dataKpMovies = await resKpMovies.json();
  assert.ok(dataKpMovies.results.every((m) => m.media_type === "movie"));

  const reqKpTv = new Request("https://movie-fountain.pages.dev/api/streaming?provider=kinopoisk&type=tv");
  const resKpTv = await onRequestGet({ request: reqKpTv, env: {} });
  const dataKpTv = await resKpTv.json();
  assert.ok(dataKpTv.results.every((m) => m.media_type === "tv"));

  // Check Kinopoisk i18n
  run("setLang('en')");
  assert.equal(run("t('provider_kinopoisk')"), "Kinopoisk");
  run("setLang('ru')");
  assert.equal(run("t('provider_kinopoisk')"), "Кинопоиск");

  // 11. Hulu provider endpoint, aliases, and catalog
  const reqHulu = new Request("https://movie-fountain.pages.dev/api/streaming?provider=hulu");
  const resHulu = await onRequestGet({ request: reqHulu, env: {} });
  assert.equal(resHulu.status, 200);
  const dataHulu = await resHulu.json();
  assert.equal(dataHulu.provider, "hulu");
  assert.ok(dataHulu.results.length >= 20);
  assert.ok(dataHulu.total_results >= 25);

  const huluMovies = dataHulu.results.some((m) => m.media_type === "movie");
  const huluSeries = dataHulu.results.some((m) => m.media_type === "tv");
  assert.ok(huluMovies, "Hulu catalog must include movies (e.g. Palm Springs, Prey, Poor Things)");
  assert.ok(huluSeries, "Hulu catalog must include series (e.g. The Bear, Shōgun)");

  // Alias checks (hulutv and hulu_tv)
  const reqHuluTv = new Request("https://movie-fountain.pages.dev/api/streaming?provider=hulutv");
  const resHuluTv = await onRequestGet({ request: reqHuluTv, env: {} });
  assert.equal(resHuluTv.status, 200);
  const dataHuluTv = await resHuluTv.json();
  assert.equal(dataHuluTv.provider, "hulu");

  const reqHuluUnderscore = new Request("https://movie-fountain.pages.dev/api/streaming?provider=hulu_tv");
  const resHuluUnderscore = await onRequestGet({ request: reqHuluUnderscore, env: {} });
  assert.equal(resHuluUnderscore.status, 200);
  const dataHuluUnderscore = await resHuluUnderscore.json();
  assert.equal(dataHuluUnderscore.provider, "hulu");

  const reqHuluMoviesOnly = new Request("https://movie-fountain.pages.dev/api/streaming?provider=hulu&type=movie");
  const resHuluMoviesOnly = await onRequestGet({ request: reqHuluMoviesOnly, env: {} });
  const dataHuluMoviesOnly = await resHuluMoviesOnly.json();
  assert.ok(dataHuluMoviesOnly.results.length > 0 && dataHuluMoviesOnly.results.every((m) => m.media_type === "movie"));

  const reqHuluSeriesOnly = new Request("https://movie-fountain.pages.dev/api/streaming?provider=hulu&type=tv");
  const resHuluSeriesOnly = await onRequestGet({ request: reqHuluSeriesOnly, env: {} });
  const dataHuluSeriesOnly = await resHuluSeriesOnly.json();
  assert.ok(dataHuluSeriesOnly.results.length > 0 && dataHuluSeriesOnly.results.every((m) => m.media_type === "tv"));

  // Check Hulu i18n
  run("setLang('en')");
  assert.equal(run("t('provider_hulu')"), "Hulu");
  assert.equal(run("t('provider_hulu_sub')"), "FX originals, indie hits & acclaimed TV");
  run("setLang('ru')");
  assert.equal(run("t('provider_hulu')"), "Hulu");
  assert.equal(run("t('provider_hulu_sub')"), "Оригиналы FX, культовые сериалы и инди-хиты");

  // 12. Okko provider endpoint, aliases, and catalog
  const reqOkko = new Request("https://movie-fountain.pages.dev/api/streaming?provider=okko");
  const resOkko = await onRequestGet({ request: reqOkko, env: {} });
  assert.equal(resOkko.status, 200);
  const dataOkko = await resOkko.json();
  assert.equal(dataOkko.provider, "okko");
  assert.ok(dataOkko.results.length >= 20);
  assert.ok(dataOkko.total_results >= 25);

  const okkoMovies = dataOkko.results.some((m) => m.media_type === "movie");
  const okkoSeries = dataOkko.results.some((m) => m.media_type === "tv");
  assert.ok(okkoMovies, "Okko catalog must include movies");
  assert.ok(okkoSeries, "Okko catalog must include series");

  // Alias checks (okkotv and okko_tv)
  const reqOkkoTv = new Request("https://movie-fountain.pages.dev/api/streaming?provider=okkotv");
  const resOkkoTv = await onRequestGet({ request: reqOkkoTv, env: {} });
  assert.equal(resOkkoTv.status, 200);
  const dataOkkoTv = await resOkkoTv.json();
  assert.equal(dataOkkoTv.provider, "okko");

  const reqOkkoUnderscore = new Request("https://movie-fountain.pages.dev/api/streaming?provider=okko_tv");
  const resOkkoUnderscore = await onRequestGet({ request: reqOkkoUnderscore, env: {} });
  assert.equal(resOkkoUnderscore.status, 200);
  const dataOkkoUnderscore = await resOkkoUnderscore.json();
  assert.equal(dataOkkoUnderscore.provider, "okko");

  const reqOkkoMoviesOnly = new Request("https://movie-fountain.pages.dev/api/streaming?provider=okko&type=movie");
  const resOkkoMoviesOnly = await onRequestGet({ request: reqOkkoMoviesOnly, env: {} });
  const dataOkkoMoviesOnly = await resOkkoMoviesOnly.json();
  assert.ok(dataOkkoMoviesOnly.results.length > 0 && dataOkkoMoviesOnly.results.every((m) => m.media_type === "movie"));

  const reqOkkoSeriesOnly = new Request("https://movie-fountain.pages.dev/api/streaming?provider=okko&type=tv");
  const resOkkoSeriesOnly = await onRequestGet({ request: reqOkkoSeriesOnly, env: {} });
  const dataOkkoSeriesOnly = await resOkkoSeriesOnly.json();
  assert.ok(dataOkkoSeriesOnly.results.length > 0 && dataOkkoSeriesOnly.results.every((m) => m.media_type === "tv"));

  // Check Okko i18n
  run("setLang('en')");
  assert.equal(run("t('provider_okko')"), "Okko");
  assert.equal(run("t('provider_okko_sub')"), "Russian originals, world cinema & exclusive series");
  run("setLang('ru')");
  assert.equal(run("t('provider_okko')"), "Okko");
  assert.equal(run("t('provider_okko_sub')"), "Оригинальные сериалы Okko и мировое кино");

  // 13. Disney+ provider endpoint, aliases, and catalog
  const reqDisney = new Request("https://movie-fountain.pages.dev/api/streaming?provider=disney");
  const resDisney = await onRequestGet({ request: reqDisney, env: {} });
  assert.equal(resDisney.status, 200);
  const dataDisney = await resDisney.json();
  assert.equal(dataDisney.provider, "disney");
  assert.ok(dataDisney.results.length >= 20);
  assert.ok(dataDisney.total_results >= 25);

  const disneyMovies = dataDisney.results.some((m) => m.media_type === "movie");
  const disneySeries = dataDisney.results.some((m) => m.media_type === "tv");
  assert.ok(disneyMovies, "Disney+ catalog must include movies");
  assert.ok(disneySeries, "Disney+ catalog must include series");

  // Alias checks (disneyplus and disney_plus)
  const reqDisneyPlus = new Request("https://movie-fountain.pages.dev/api/streaming?provider=disneyplus");
  const resDisneyPlus = await onRequestGet({ request: reqDisneyPlus, env: {} });
  assert.equal(resDisneyPlus.status, 200);
  const dataDisneyPlus = await resDisneyPlus.json();
  assert.equal(dataDisneyPlus.provider, "disney");

  const reqDisneyUnderscore = new Request("https://movie-fountain.pages.dev/api/streaming?provider=disney_plus");
  const resDisneyUnderscore = await onRequestGet({ request: reqDisneyUnderscore, env: {} });
  assert.equal(resDisneyUnderscore.status, 200);
  const dataDisneyUnderscore = await resDisneyUnderscore.json();
  assert.equal(dataDisneyUnderscore.provider, "disney");

  const reqDisneyMoviesOnly = new Request("https://movie-fountain.pages.dev/api/streaming?provider=disney&type=movie");
  const resDisneyMoviesOnly = await onRequestGet({ request: reqDisneyMoviesOnly, env: {} });
  const dataDisneyMoviesOnly = await resDisneyMoviesOnly.json();
  assert.ok(dataDisneyMoviesOnly.results.length > 0 && dataDisneyMoviesOnly.results.every((m) => m.media_type === "movie"));

  const reqDisneySeriesOnly = new Request("https://movie-fountain.pages.dev/api/streaming?provider=disney&type=tv");
  const resDisneySeriesOnly = await onRequestGet({ request: reqDisneySeriesOnly, env: {} });
  const dataDisneySeriesOnly = await resDisneySeriesOnly.json();
  assert.ok(dataDisneySeriesOnly.results.length > 0 && dataDisneySeriesOnly.results.every((m) => m.media_type === "tv"));

  // Check Disney+ i18n
  run("setLang('en')");
  assert.equal(run("t('provider_disney')"), "Disney+");
  assert.equal(run("t('provider_disney_sub')"), "Disney, Pixar, Marvel & Star Wars originals");
  run("setLang('ru')");
  assert.equal(run("t('provider_disney')"), "Disney+");
  assert.equal(run("t('provider_disney_sub')"), "Disney, Pixar, Marvel, Звёздные войны и оригиналы");

  // 14. Paramount+ provider endpoint, aliases, and catalog
  const reqParamount = new Request("https://movie-fountain.pages.dev/api/streaming?provider=paramount");
  const resParamount = await onRequestGet({ request: reqParamount, env: {} });
  assert.equal(resParamount.status, 200);
  const dataParamount = await resParamount.json();
  assert.equal(dataParamount.provider, "paramount");
  assert.ok(dataParamount.results.length >= 20);
  assert.ok(dataParamount.total_results >= 25);

  const paramountMovies = dataParamount.results.some((m) => m.media_type === "movie");
  const paramountSeries = dataParamount.results.some((m) => m.media_type === "tv");
  assert.ok(paramountMovies, "Paramount+ catalog must include movies");
  assert.ok(paramountSeries, "Paramount+ catalog must include series");

  const reqParamountPlus = new Request("https://movie-fountain.pages.dev/api/streaming?provider=paramountplus");
  const resParamountPlus = await onRequestGet({ request: reqParamountPlus, env: {} });
  assert.equal(resParamountPlus.status, 200);
  const dataParamountPlus = await resParamountPlus.json();
  assert.equal(dataParamountPlus.provider, "paramount");

  const reqParamountUnderscore = new Request("https://movie-fountain.pages.dev/api/streaming?provider=paramount_plus");
  const resParamountUnderscore = await onRequestGet({ request: reqParamountUnderscore, env: {} });
  assert.equal(resParamountUnderscore.status, 200);
  const dataParamountUnderscore = await resParamountUnderscore.json();
  assert.equal(dataParamountUnderscore.provider, "paramount");

  const reqParamountMoviesOnly = new Request("https://movie-fountain.pages.dev/api/streaming?provider=paramount&type=movie");
  const resParamountMoviesOnly = await onRequestGet({ request: reqParamountMoviesOnly, env: {} });
  const dataParamountMoviesOnly = await resParamountMoviesOnly.json();
  assert.ok(dataParamountMoviesOnly.results.length > 0 && dataParamountMoviesOnly.results.every((m) => m.media_type === "movie"));

  const reqParamountSeriesOnly = new Request("https://movie-fountain.pages.dev/api/streaming?provider=paramount&type=tv");
  const resParamountSeriesOnly = await onRequestGet({ request: reqParamountSeriesOnly, env: {} });
  const dataParamountSeriesOnly = await resParamountSeriesOnly.json();
  assert.ok(dataParamountSeriesOnly.results.length > 0 && dataParamountSeriesOnly.results.every((m) => m.media_type === "tv"));

  run("setLang('en')");
  assert.equal(run("t('provider_paramount')"), "Paramount+");
  assert.equal(run("t('provider_paramount_sub')"), "Paramount Pictures, Showtime, Star Trek & hit series");
  run("setLang('ru')");
  assert.equal(run("t('provider_paramount')"), "Paramount+");
  assert.equal(run("t('provider_paramount_sub')"), "Paramount Pictures, Showtime, Звёздный путь и хиты сериалов");

  // 15. Google TV provider endpoint, aliases, and catalog
  const reqGoogleTV = new Request("https://movie-fountain.pages.dev/api/streaming?provider=googletv");
  const resGoogleTV = await onRequestGet({ request: reqGoogleTV, env: {} });
  assert.equal(resGoogleTV.status, 200);
  const dataGoogleTV = await resGoogleTV.json();
  assert.equal(dataGoogleTV.provider, "googletv");
  assert.ok(dataGoogleTV.results.length >= 20);
  assert.ok(dataGoogleTV.total_results >= 25);

  const googleTvMovies = dataGoogleTV.results.some((m) => m.media_type === "movie");
  const googleTvSeries = dataGoogleTV.results.some((m) => m.media_type === "tv");
  assert.ok(googleTvMovies, "Google TV catalog must include movies");
  assert.ok(googleTvSeries, "Google TV catalog must include series");

  const reqGoogleAlias = new Request("https://movie-fountain.pages.dev/api/streaming?provider=google");
  const resGoogleAlias = await onRequestGet({ request: reqGoogleAlias, env: {} });
  assert.equal(resGoogleAlias.status, 200);
  const dataGoogleAlias = await resGoogleAlias.json();
  assert.equal(dataGoogleAlias.provider, "googletv");

  const reqGoogleUnderscore = new Request("https://movie-fountain.pages.dev/api/streaming?provider=google_tv");
  const resGoogleUnderscore = await onRequestGet({ request: reqGoogleUnderscore, env: {} });
  assert.equal(resGoogleUnderscore.status, 200);
  const dataGoogleUnderscore = await resGoogleUnderscore.json();
  assert.equal(dataGoogleUnderscore.provider, "googletv");

  const reqGoogleMoviesOnly = new Request("https://movie-fountain.pages.dev/api/streaming?provider=googletv&type=movie");
  const resGoogleMoviesOnly = await onRequestGet({ request: reqGoogleMoviesOnly, env: {} });
  const dataGoogleMoviesOnly = await resGoogleMoviesOnly.json();
  assert.ok(dataGoogleMoviesOnly.results.length > 0 && dataGoogleMoviesOnly.results.every((m) => m.media_type === "movie"));

  const reqGoogleSeriesOnly = new Request("https://movie-fountain.pages.dev/api/streaming?provider=googletv&type=tv");
  const resGoogleSeriesOnly = await onRequestGet({ request: reqGoogleSeriesOnly, env: {} });
  const dataGoogleSeriesOnly = await resGoogleSeriesOnly.json();
  assert.ok(dataGoogleSeriesOnly.results.length > 0 && dataGoogleSeriesOnly.results.every((m) => m.media_type === "tv"));

  run("setLang('en')");
  assert.equal(run("t('provider_googletv')"), "Google TV");
  assert.equal(run("t('provider_googletv_sub')"), "Digital blockbusters, studio releases & acclaimed series");
  run("setLang('ru')");
  assert.equal(run("t('provider_googletv')"), "Google TV");
  assert.equal(run("t('provider_googletv_sub')"), "Мировые блокбастеры, цифровые премьеры и сериалы");

  // 16. MUBI provider endpoint, aliases, and catalog
  const reqMubi = new Request("https://movie-fountain.pages.dev/api/streaming?provider=mubi");
  const resMubi = await onRequestGet({ request: reqMubi, env: {} });
  assert.equal(resMubi.status, 200);
  const dataMubi = await resMubi.json();
  assert.equal(dataMubi.provider, "mubi");
  assert.ok(dataMubi.results.length >= 20);
  assert.ok(dataMubi.total_results >= 25);

  const mubiMovies = dataMubi.results.some((m) => m.media_type === "movie");
  const mubiSeries = dataMubi.results.some((m) => m.media_type === "tv");
  assert.ok(mubiMovies, "MUBI catalog must include movies");
  assert.ok(mubiSeries, "MUBI catalog must include series");

  const reqMubiGo = new Request("https://movie-fountain.pages.dev/api/streaming?provider=mubigo");
  const resMubiGo = await onRequestGet({ request: reqMubiGo, env: {} });
  assert.equal(resMubiGo.status, 200);
  const dataMubiGo = await resMubiGo.json();
  assert.equal(dataMubiGo.provider, "mubi");

  const reqMubiTv = new Request("https://movie-fountain.pages.dev/api/streaming?provider=mubi_tv");
  const resMubiTv = await onRequestGet({ request: reqMubiTv, env: {} });
  assert.equal(resMubiTv.status, 200);
  const dataMubiTv = await resMubiTv.json();
  assert.equal(dataMubiTv.provider, "mubi");

  const reqMubiMoviesOnly = new Request("https://movie-fountain.pages.dev/api/streaming?provider=mubi&type=movie");
  const resMubiMoviesOnly = await onRequestGet({ request: reqMubiMoviesOnly, env: {} });
  const dataMubiMoviesOnly = await resMubiMoviesOnly.json();
  assert.ok(dataMubiMoviesOnly.results.length > 0 && dataMubiMoviesOnly.results.every((m) => m.media_type === "movie"));

  const reqMubiSeriesOnly = new Request("https://movie-fountain.pages.dev/api/streaming?provider=mubi&type=tv");
  const resMubiSeriesOnly = await onRequestGet({ request: reqMubiSeriesOnly, env: {} });
  const dataMubiSeriesOnly = await resMubiSeriesOnly.json();
  assert.ok(dataMubiSeriesOnly.results.length > 0 && dataMubiSeriesOnly.results.every((m) => m.media_type === "tv"));

  run("setLang('en')");
  assert.equal(run("t('provider_mubi')"), "MUBI");
  assert.equal(run("t('provider_mubi_sub')"), "Curated cinema, festival winners & auteur series");
  run("setLang('ru')");
  assert.equal(run("t('provider_mubi')"), "MUBI");
  assert.equal(run("t('provider_mubi_sub')"), "Авторское кино, призёры фестивалей и культовые сериалы");

  // 17. Peacock provider endpoint, aliases, and catalog
  const reqPeacock = new Request("https://movie-fountain.pages.dev/api/streaming?provider=peacock");
  const resPeacock = await onRequestGet({ request: reqPeacock, env: {} });
  assert.equal(resPeacock.status, 200);
  const dataPeacock = await resPeacock.json();
  assert.equal(dataPeacock.provider, "peacock");
  assert.ok(dataPeacock.results.length >= 20);
  assert.ok(dataPeacock.total_results >= 25);

  const peacockMovies = dataPeacock.results.some((m) => m.media_type === "movie");
  const peacockSeries = dataPeacock.results.some((m) => m.media_type === "tv");
  assert.ok(peacockMovies, "Peacock catalog must include movies");
  assert.ok(peacockSeries, "Peacock catalog must include series");

  const reqPeacockTvAlias = new Request("https://movie-fountain.pages.dev/api/streaming?provider=peacocktv");
  const resPeacockTvAlias = await onRequestGet({ request: reqPeacockTvAlias, env: {} });
  assert.equal(resPeacockTvAlias.status, 200);
  const dataPeacockTvAlias = await resPeacockTvAlias.json();
  assert.equal(dataPeacockTvAlias.provider, "peacock");

  const reqPeacockPrem = new Request("https://movie-fountain.pages.dev/api/streaming?provider=peacock_premium");
  const resPeacockPrem = await onRequestGet({ request: reqPeacockPrem, env: {} });
  assert.equal(resPeacockPrem.status, 200);
  const dataPeacockPrem = await resPeacockPrem.json();
  assert.equal(dataPeacockPrem.provider, "peacock");

  const reqPeacockMoviesOnly = new Request("https://movie-fountain.pages.dev/api/streaming?provider=peacock&type=movie");
  const resPeacockMoviesOnly = await onRequestGet({ request: reqPeacockMoviesOnly, env: {} });
  const dataPeacockMoviesOnly = await resPeacockMoviesOnly.json();
  assert.ok(dataPeacockMoviesOnly.results.length > 0 && dataPeacockMoviesOnly.results.every((m) => m.media_type === "movie"));

  const reqPeacockSeriesOnly = new Request("https://movie-fountain.pages.dev/api/streaming?provider=peacock&type=tv");
  const resPeacockSeriesOnly = await onRequestGet({ request: reqPeacockSeriesOnly, env: {} });
  const dataPeacockSeriesOnly = await resPeacockSeriesOnly.json();
  assert.ok(dataPeacockSeriesOnly.results.length > 0 && dataPeacockSeriesOnly.results.every((m) => m.media_type === "tv"));

  run("setLang('en')");
  assert.equal(run("t('provider_peacock')"), "Peacock");
  assert.equal(run("t('provider_peacock_sub')"), "NBCUniversal originals, hit comedies, sports & blockbuster cinema");
  run("setLang('ru')");
  assert.equal(run("t('provider_peacock')"), "Peacock");
  assert.equal(run("t('provider_peacock_sub')"), "Оригиналы NBCUniversal, культовые комедии и блокбастеры");
});
