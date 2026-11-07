const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');

function setup() {
  const handlers = {};
  const data = {};
  const stub = {
    innerHTML: '',
    textContent: '',
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
    location: { hash: '#watchlist', origin: 'https://movie-fountain.pages.dev' },
    localStorage: {
      getItem: k => data[k] || null,
      setItem: (k, v) => {
        data[k] = v;
      },
    },
  };

  vm.createContext(ctx);
  for (const file of ['features.js', 'app.js']) {
    vm.runInContext(fs.readFileSync(path.join(ROOT_DIR, file), 'utf8'), ctx);
  }
  return {
    ctx,
    handlers,
    data,
    stub,
    run: code => vm.runInContext(code, ctx),
  };
}

test('import normalizes unsafe paths and ratings, deduplicates, rejects invalid IDs', () => {
  const { run } = setup();
  assert.equal(
    run(
      `normalizeMovies([{id:1,title:'A',poster_path:'" onerror="alert(1)',vote_average:99}])[0].poster_path`
    ),
    null
  );
  assert.equal(run(`normalizeMovies([{id:1,title:'A',vote_average:99}])[0].vote_average`), 10);
  assert.equal(run(`normalizeMovies([{id:1,title:'A'},{id:1,title:'B'}]).length`), 1);
  assert.throws(() => run(`normalizeMovies([{id:'bad',title:'A'}])`));
  assert.throws(() => run(`normalizeMovies(Array(2001).fill({id:1,title:'A'}))`));
});

test('watchlist save, reload and remove; rendered titles escaped', () => {
  const { run, handlers, data, stub } = setup();
  run(`card({id:123,title:'<script>test</script>',vote_average:8})`);
  const click = () => handlers.click({ target: { closest: () => ({ dataset: { save: '123' } }) } });
  click();
  assert.equal(JSON.parse(data['movie-fountain.watchlist.v1']).length, 1);
  run('savedMovies=readWatchlist();watchlist()');
  assert.match(stub.innerHTML, /&lt;script&gt;/);
  assert.match(stub.innerHTML, /aria-pressed="true"/);
  click();
  assert.equal(JSON.parse(data['movie-fountain.watchlist.v1']).length, 0);
});

test('corrupt storage fails safely; filters select genres', () => {
  const { run, data } = setup();
  data['movie-fountain.watchlist.v1'] = '{';
  assert.equal(run('readWatchlist().length'), 0);
  assert.equal(
    run(`filteredMovies([{id:1,genre_ids:[28]},{id:2,genre_ids:[35]}],'action')[0].id`),
    1
  );
  const homeMarkup = run(
    `homeShelves({
      trending: [{id: 1, title: 'Shared Movie', vote_average: 8}, {id: 6, title: 'Second Trending', vote_average: 7.5}],
      letterboxd_top: [{id: 14537, title: 'Harakiri', vote_average: 8.4}],
      popular: [{id: 2, title: 'Unique Popular', vote_average: 7}],
      now_playing: [{id: 3, title: 'In Cinemas', vote_average: 7}],
      top_rated: [{id: 1, title: 'Shared Movie', vote_average: 8}, {id: 4, title: 'Top Film', vote_average: 9}],
      upcoming: [{id: 5, title: 'Next Up', vote_average: 6}]
    })`
  );
  assert.doesNotMatch(homeMarkup, /Now playing/);
  assert.doesNotMatch(homeMarkup, /Popular this week/);
  assert.match(homeMarkup, /Letterboxd Top 500/);
  assert.match(homeMarkup, /<h3>Harakiri<\/h3>/);
  assert.equal((homeMarkup.match(/<h3>Shared Movie<\/h3>/g) || []).length, 1);
  assert.equal((homeMarkup.match(/data-watched=/g) || []).length, 5);
  assert.equal((homeMarkup.match(/data-share=/g) || []).length, 5);
  assert.equal((homeMarkup.match(/data-save=/g) || []).length, 5);
});

test('renderRatingsSection renders multi-source ratings, OMDb fallback, and escapes unsafe strings', () => {
  const { run } = setup();
  const loadingMarkup = run(
    `renderRatingsSection({id:550,title:'Fight Club',vote_average:8.4,vote_count:25000,imdb_id:'tt0137523'}, null)`
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
    )`
  );
  assert.match(loadedMarkup, /8\.8<small>\/10<\/small>/);
  assert.match(loadedMarkup, /4\.27<small>\/5<\/small>/);
  assert.match(loadedMarkup, /79<small>%<\/small>/);
  assert.match(loadedMarkup, /Audience 96%/);
  assert.match(loadedMarkup, /Updated 2026-11-01/);

  const omdbMarkup = run(
    `renderRatingsSection(
      {id:550,title:'Fight Club',vote_average:8.4,vote_count:100},
      {imdb_rating:'<script>8.8/10</script>',rotten_rating:'79%'}
    )`
  );
  assert.match(omdbMarkup, /&lt;script&gt;8\.8\/10&lt;\/script&gt;/);
  assert.match(omdbMarkup, /OMDb/);
});

test('ratings Pages Function validates scores, IDs, URLs, and OMDb fallback', async () => {
  const ratingsModule = await import(
    path.join(ROOT_DIR, 'functions/api/movie/[id]/ratings.js')
  );
  const { parseWhatsonRatings, parseOmdbRatings } = ratingsModule;

  // Rejects mismatched movie ID
  assert.deepEqual(parseWhatsonRatings({ id: 999, imdb: { users_rating: 8.5 } }, 550), {});

  // Validates score bounds and constructs safe URLs only from valid IDs
  const parsed = parseWhatsonRatings(
    {
      id: 550,
      imdb: { id: 'tt0137523', users_rating: 8.8 },
      letterboxd: { id: 'fight-club', users_rating: 4.27 },
      rotten_tomatoes: { id: 'fight_club', critics_rating: 79, users_rating: 96 },
      updated_at: '2026-11-05T12:00:00Z',
    },
    '550'
  );
  assert.equal(parsed.imdb, 8.8);
  assert.equal(parsed.letterboxd, 4.27);
  assert.equal(parsed.rotten, 79);
  assert.equal(parsed.rotten_audience, 96);
  assert.equal(parsed.imdb_url, 'https://www.imdb.com/title/tt0137523/');
  assert.equal(parsed.letterboxd_url, 'https://letterboxd.com/film/fight-club/');
  assert.equal(parsed.rotten_url, 'https://www.rottentomatoes.com/m/fight_club');
  assert.equal(parsed.updated_at, '2026-11-05');

  // Rejects out-of-range ratings and malformed IDs
  const unsafe = parseWhatsonRatings(
    {
      id: 550,
      imdb: { id: 'javascript:alert(1)', users_rating: 15 },
      letterboxd: { id: '../bad/path', users_rating: -1 },
      rotten_tomatoes: { id: 'bad/slash', critics_rating: 105 },
    },
    550
  );
  assert.equal(unsafe.imdb, undefined);
  assert.equal(unsafe.letterboxd, undefined);
  assert.equal(unsafe.rotten, undefined);
  assert.equal(unsafe.imdb_url, undefined);
  assert.equal(unsafe.letterboxd_url, undefined);
  assert.equal(unsafe.rotten_url, undefined);

  // Parses valid OMDb ratings and ignores invalid ones
  const omdb = parseOmdbRatings({
    Response: 'True',
    Ratings: [
      { Source: 'Internet Movie Database', Value: '8.8/10' },
      { Source: 'Rotten Tomatoes', Value: '79%' },
    ],
  });
  assert.deepEqual(omdb, { imdb_rating: '8.8/10', rotten_rating: '79%' });
});
