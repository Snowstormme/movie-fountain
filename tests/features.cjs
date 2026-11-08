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
  assert.match(loadedMarkup, /Universal Acclaim/);
  assert.match(loadedMarkup, /4 sources/);

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
  assert.match(
    controlsHtml,
    /https:\/\/www\.youtube\.com\/watch\?v=qtRKdVHc-cE/,
  );

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
