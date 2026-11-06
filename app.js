const app = document.querySelector('#app');
const image = path => path ? `https://image.tmdb.org/t/p/w500${path}` : '';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const year = date => date ? date.slice(0, 4) : 'Year unknown';
const genreIds = { action: 28, comedy: 35, drama: 18, horror: 27, scifi: 878, animation: 16 };
const moodFilters = { exciting: [28, 12, 53, 878], dark: [27, 80, 9648, 53], feelgood: [35, 10751, 16, 10402], romantic: [10749, 18, 35] };
const fountainMovieLimit = 42;
const movieCache = new Map();
const watchlistKey = 'movie-fountain.watchlist.v1';
function readWatchlist() {
  try {
    const value = JSON.parse(localStorage.getItem(watchlistKey) || '[]');
    return normalizeMovies(value);
  } catch { return []; }
}
let savedMovies = readWatchlist();
let accountFilter = 'all';
let accountSort = 'saved';
function saveButton(movie) {
  const saved = savedMovies.some(m => m.id === movie.id);
  return `<button class="save-movie" type="button" data-save="${movie.id}" aria-pressed="${saved}" aria-label="${saved ? 'Remove' : 'Save'} ${esc(movie.title)} ${saved ? 'from' : 'to'} watchlist">${saved ? 'Saved' : 'Save'}</button>`;
}
function account() {
  const watchedCount = savedMovies.filter(movie => watched.has(movie.id)).length;
  const average = savedMovies.length ? (savedMovies.reduce((sum, movie) => sum + (movie.vote_average || 0), 0) / savedMovies.length).toFixed(1) : '—';
  app.innerHTML = `<section class="account-page"><div class="page-heading"><p class="eyebrow">Personal library</p><h1>Account</h1><p>These preferences and saved movies are stored on this device. Sign-in and cross-device sync can be added later.</p></div><div class="account-stats" aria-label="Watchlist summary"><div><strong>${savedMovies.length}</strong><span>Saved</span></div><div><strong>${watchedCount}</strong><span>Watched</span></div><div><strong>${savedMovies.length - watchedCount}</strong><span>To watch</span></div><div><strong>${average}</strong><span>Avg. rating</span></div></div>${accountPreferencesMarkup()}${libraryTools()}<section class="account-section" aria-labelledby="watchlist-heading"><div class="account-section-heading"><div><p class="eyebrow">Saved movies</p><h2 id="watchlist-heading">Watchlist</h2></div><strong>${savedMovies.length} ${savedMovies.length === 1 ? 'movie' : 'movies'}</strong></div><div class="account-library-tools"><div class="account-filters" role="group" aria-label="Filter watchlist"><button type="button" data-account-filter="all" class="is-active">All</button><button type="button" data-account-filter="unwatched">Unwatched</button><button type="button" data-account-filter="watched">Watched</button></div><label class="account-sort">Sort<select data-account-sort><option value="saved">Recently saved</option><option value="rating">Highest rated</option><option value="release">Release date</option><option value="title">Title A–Z</option></select></label></div><div class="movie-grid" id="account-movie-grid">${accountMovieMarkup()}</div></section></section>`;
  app.querySelector?.(`[data-account-filter="${accountFilter}"]`)?.classList.add('is-active');
  const sortControl = app.querySelector?.('[data-account-sort]');
  if (sortControl) sortControl.value = accountSort;
}
function watchlist() { account(); }
function accountPreferencesMarkup() {
  const theme = typeof savedTheme === 'string' && savedTheme === 'liquid' ? 'Liquid Glass' : 'Classic';
  const nextTheme = theme === 'Classic' ? 'Liquid Glass' : 'Classic';
  return `<section class="account-preferences" aria-labelledby="account-preferences-heading"><div><p class="eyebrow">Preferences & privacy</p><h2 id="account-preferences-heading">Your settings</h2><p>Current appearance: <strong>${theme}</strong>. Your watchlist and watched status stay in this browser.</p></div><div class="account-preference-actions"><button type="button" data-open-style>Switch to ${nextTheme}</button><a href="/privacy.html">Privacy</a></div></section>`;
}
function accountMovieMarkup() {
  let movies = savedMovies.filter(movie => accountFilter === 'all' || (accountFilter === 'watched' ? watched.has(movie.id) : !watched.has(movie.id)));
  if (accountSort === 'rating') movies = [...movies].sort((a,b) => (b.vote_average || 0) - (a.vote_average || 0));
  if (accountSort === 'release') movies = [...movies].sort((a,b) => String(b.release_date || '').localeCompare(String(a.release_date || '')));
  if (accountSort === 'title') movies = [...movies].sort((a,b) => a.title.localeCompare(b.title));
  return movies.map(card).join('') || '<div class="account-empty"><strong>Your watchlist is empty here.</strong><span>Save movies from the Fountain and they will appear in this section.</span><a class="text-link" href="#fountain">Explore the Fountain</a></div>';
}
function refreshAccountMovies() {
  const grid = document.querySelector?.('#account-movie-grid');
  if (!grid) return;
  grid.innerHTML = accountMovieMarkup();
  document.querySelectorAll?.('[data-account-filter]').forEach(button => button.classList.toggle('is-active', button.dataset.accountFilter === accountFilter));
}
app.addEventListener('click', event => {
  const styleLink = event.target.closest('[data-open-style]');
  if (styleLink?.dataset?.openStyle !== undefined) { event.stopPropagation(); setTheme(savedTheme === 'liquid' ? 'classic' : 'liquid'); return; }
  const filter = event.target.closest('[data-account-filter]');
  if (filter?.dataset?.accountFilter) { accountFilter = filter.dataset.accountFilter; refreshAccountMovies(); return; }
  const button = event.target.closest('[data-save]');
  if (!button) return;
  const item = movieCache.get(button.dataset.save);
  if (!item) return;
  const exists = savedMovies.some(m => m.id === item.id);
  const next = exists ? savedMovies.filter(m => m.id !== item.id) : [...savedMovies, {id:item.id,title:item.title,poster_path:item.poster_path,release_date:item.release_date,vote_average:item.vote_average,overview:item.overview}];
  try { localStorage.setItem(watchlistKey, JSON.stringify(next)); }
  catch { document.querySelector('#save-status').textContent = 'Could not save. Browser storage is unavailable or full.'; return; }
  savedMovies = next;
  document.querySelector('#save-status').textContent = exists ? 'Removed from watchlist.' : 'Saved to watchlist.';
  if (location.hash === '#account' || location.hash === '#watchlist') account();
  else app.querySelectorAll(`[data-save="${item.id}"]`).forEach(control => { control.outerHTML = saveButton(item); });
});
app.addEventListener('change', event => { if (event.target.matches('[data-account-sort]')) { accountSort = event.target.value; refreshAccountMovies(); } });
app.addEventListener('watchedchange', () => { if (location.hash === '#account' || location.hash === '#watchlist') account(); });
document.addEventListener('themechange', () => { if (location.hash === '#account' || location.hash === '#watchlist') account(); });
window.addEventListener('storage', event => { if (event.key === watchlistKey || event.key === null) { savedMovies = readWatchlist(); if(location.hash === '#account' || location.hash === '#watchlist') account(); else app.querySelectorAll('[data-save]').forEach(control => { const item = movieCache.get(control.dataset.save); if(item) control.outerHTML = saveButton(item); }); } });
document.querySelector('.topbar-left').insertAdjacentHTML('beforeend', '<a class="fountain-nav" href="#account">Account</a>');
document.querySelector('footer').insertAdjacentHTML('beforeend', ' · <a href="/privacy.html">Privacy</a> · <a href="https://github.com/Snowstormme/movie-fountain">About & source</a>');
document.body.insertAdjacentHTML('beforeend', '<p id="save-status" class="visually-hidden" role="status"></p>');
document.addEventListener('visibilitychange', () => document.documentElement.classList.toggle('page-hidden', document.hidden));

function card(movie) {
  movieCache.set(String(movie.id), movie);
  const poster = movie.poster_path ? `<img src="${image(movie.poster_path)}" alt="Poster for ${esc(movie.title)}" loading="lazy" decoding="async">` : '<div class="no-poster">No poster</div>';
  return `<div class="movie-tile"><a class="movie-card" href="#movie/${movie.id}">${poster}<strong class="rating-badge">★ ${(movie.vote_average || 0).toFixed(1)}</strong><div class="card-copy"><h3>${esc(movie.title)}</h3><div class="card-meta"><span>${year(movie.release_date)}</span></div></div><div class="card-preview"><p>${esc(movie.overview || 'Open the details to learn more about this movie.')}</p><span>View details</span></div></a>${saveButton(movie)}${extraActions(movie)}</div>`;
}

function shelf(title, subtitle, movies) {
  if (!movies?.length) return '';
  return `<section class="shelf"><div class="shelf-heading"><div><h2>${title}</h2><p>${subtitle}</p></div></div><div class="movie-row">${movies.slice(0, 12).map(card).join('')}</div></section>`;
}

function fountainMovies(data) {
  return [...(data.trending || []), ...(data.popular || []), ...(data.now_playing || []), ...(data.top_rated || []), ...(data.upcoming || [])]
    .filter((movie, index, all) => all.findIndex(item => item.id === movie.id) === index);
}

function movieGenres(movie) { return movie.genre_ids || (movie.genres || []).map(genre => genre.id); }

function filteredMovies(movies, filter) {
  if (filter === 'all') return movies;
  const ids = genreIds[filter] ? [genreIds[filter]] : moodFilters[filter] || [];
  return movies.filter(movie => movieGenres(movie).some(id => ids.includes(id)));
}

function fountainColumns(movies) {
  if (!movies.length) return '<div class="fountain-empty">No movies found for this filter.</div>';
  const columns = [0, 1, 2, 3, 4].map(column => movies.filter((_, index) => index % 5 === column));
  const columnMarkup = columns.map((column, columnIndex) => {
    const items = column.map((movie, index) => `<div class="fountain-item" style="--delay:${(index * 0.35) + columnIndex * 0.2}s">${card(movie)}</div>`).join('');
    return `<div class="fountain-column fountain-column-${columnIndex + 1}"><div class="fountain-track"><div class="fountain-set">${items}</div><div class="fountain-set" aria-hidden="true">${items}</div></div></div>`;
  }).join('');
  return columnMarkup;
}

function syncFountainFlow(stream, reset = false) {
  const pixelsPerSecond = { slow: 40, normal: 60, fast: 100 }[stream?.dataset.speed] || 60;
  stream?.querySelectorAll('.fountain-track').forEach(track => {
    if (reset) {
      track.style.animation = 'none';
      track.offsetHeight;
      track.style.animation = '';
    }
    track.style.animationDuration = `${Math.max(1, track.scrollHeight / 2 / pixelsPerSecond)}s`;
  });
}

function fountain(data) {
  const movies = fountainMovies(data).slice(0, fountainMovieLimit);
  return `<section class="fountain" id="fountain-stream" data-speed="normal" data-filter="all" aria-label="Movie Fountain"><div class="fountain-toolbar"><button class="fountain-settings" type="button" aria-expanded="false" aria-controls="fountain-settings-panel">Settings</button></div><div class="fountain-settings-panel" id="fountain-settings-panel" hidden><div class="fountain-settings-head"><div><p class="fountain-settings-kicker">Make it yours</p><h2>Fountain settings</h2></div><span class="fountain-settings-hint">Tune the way movies arrive</span></div><section class="fountain-settings-group"><div class="fountain-settings-label"><span>Playback</span><small>Control the motion</small></div><div class="fountain-controls" role="group" aria-label="Fountain controls"><button class="fountain-control" type="button" data-speed="slow">Slow</button><button class="fountain-control is-active" type="button" data-speed="normal">Normal</button><button class="fountain-control" type="button" data-speed="fast">Fast</button><button class="fountain-control pause-control" type="button" data-action="pause" aria-pressed="false">Pause</button><button class="fountain-control shuffle-control" type="button" data-action="shuffle">Surprise me</button></div></section><section class="fountain-settings-group"><div class="fountain-settings-label"><span>Browse</span><small>Choose a mood or genre</small></div><div class="fountain-filters" role="group" aria-label="Filter the Fountain"><button class="fountain-filter is-active" type="button" data-filter="all">All movies</button><button class="fountain-filter" type="button" data-filter="action">Action</button><button class="fountain-filter" type="button" data-filter="comedy">Comedy</button><button class="fountain-filter" type="button" data-filter="drama">Drama</button><button class="fountain-filter" type="button" data-filter="horror">Horror</button><button class="fountain-filter" type="button" data-filter="scifi">Sci-fi</button><button class="fountain-filter" type="button" data-filter="animation">Animation</button><button class="fountain-filter" type="button" data-filter="exciting">Exciting</button><button class="fountain-filter" type="button" data-filter="dark">Dark</button><button class="fountain-filter" type="button" data-filter="feelgood">Feel-good</button><button class="fountain-filter" type="button" data-filter="romantic">Romantic</button></div></section></div><div id="fountain-grid" class="fountain-grid">${fountainColumns(movies)}</div></section>`;
}

function bindFountainControls(movies) {
  fountainAbort?.abort();
  const stream = document.querySelector('#fountain-stream');
  if (!stream) return;
  const settings = document.querySelector('.fountain-settings');
  const panel = document.querySelector('#fountain-settings-panel');
  settings?.addEventListener('click', () => {
    const open = panel.hidden;
    panel.hidden = !open;
    settings.setAttribute('aria-expanded', String(open));
  });
  document.querySelectorAll('.fountain-control[data-speed]').forEach(button => button.addEventListener('click', () => {
    stream.dataset.speed = button.dataset.speed;
    document.querySelectorAll('.fountain-control[data-speed]').forEach(control => control.classList.toggle('is-active', control === button));
    syncFountainFlow(stream, true);
  }));
  const pause = document.querySelector('.pause-control');
  pause?.addEventListener('click', () => {
    const paused = stream.classList.toggle('is-paused');
    pause.textContent = paused ? 'Play' : 'Pause';
    pause.setAttribute('aria-pressed', String(paused));
  });
  document.querySelector('.shuffle-control')?.addEventListener('click', () => {
    const columns = [...stream.querySelectorAll('.fountain-column')];
    const cards = columns.flatMap(column => [...column.querySelectorAll('.fountain-set:first-child .fountain-item')].map(item => item.innerHTML));
    for (let index = cards.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [cards[index], cards[randomIndex]] = [cards[randomIndex], cards[index]];
    }
    columns.forEach(column => { column.innerHTML = '<div class="fountain-track"><div class="fountain-set"></div><div class="fountain-set" aria-hidden="true"></div></div>'; });
    cards.forEach((markup, index) => {
      const item = document.createElement('div');
      item.className = 'fountain-item';
      item.style.setProperty('--delay', `${(index % 14) * 0.18}s`);
      item.innerHTML = markup;
      const sets = columns[index % columns.length].querySelectorAll('.fountain-set');
      sets.forEach(set => set.append(item.cloneNode(true)));
    });
    syncFountainFlow(stream, true);
  });
  document.querySelectorAll('.fountain-filter').forEach(button => button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    stream.dataset.filter = filter;
    const grid = document.querySelector('.fountain-grid') || stream;
    grid.innerHTML = fountainColumns(filteredMovies(movies, filter));
    document.querySelectorAll('.fountain-filter').forEach(control => control.classList.toggle('is-active', control === button));
    syncFountainFlow(stream, true);
  }));
  syncFountainFlow(stream, true);
}

async function api(path) {
  const response = await fetch(path, { headers: { accept: 'application/json' } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Could not load movies');
  return data;
}

async function home() {
  app.innerHTML = '<div class="loading">Loading movies…</div>';
  try {
    const data = await api('/api/home');
    app.innerHTML = `${shelf('Trending now','What people are watching this week',data.trending)}${shelf('Popular this week','Crowd favorites worth your time',data.popular)}${shelf('Now playing','Fresh releases from cinemas',data.now_playing)}${shelf('Top rated','A reliable place to start',data.top_rated)}${shelf('Coming soon','Keep an eye on what is next',data.upcoming)}`;
  } catch (error) { app.innerHTML = `<div class="message error">${esc(error.message)}</div>`; }
}

async function fountainPage() {
  app.innerHTML = '<div class="loading">Pouring the fountain…</div>';
  try { const data = await api('/api/home'); if(location.hash!=='#fountain')return; app.innerHTML = fountain(data); bindFountainControls(fountainMovies(data)); enhanceFountain(fountainMovies(data)); }
  catch (error) { app.innerHTML = `<div class="message error">${esc(error.message)}</div>`; }
}

async function search(query) {
  app.innerHTML = '<div class="loading">Searching…</div>';
  try { const data = await api(`/api/search?q=${encodeURIComponent(query)}`); app.innerHTML = `<div class="page-heading"><p class="eyebrow">Search results</p><h1>Movies for “${esc(query)}”</h1></div><div class="movie-grid">${(data.results || []).map(card).join('') || '<div class="message">No movies found.</div>'}</div>`; }
  catch (error) { app.innerHTML = `<div class="message error">${esc(error.message)}</div>`; }
}

async function movie(id) {
  app.innerHTML = '<div class="loading">Loading movie…</div>';
  try { const data = await api(`/api/movie/${id}`); const m=data.movie; const poster=m.poster_path?`<img class="detail-poster" src="${image(m.poster_path)}" alt="Poster for ${esc(m.title)}">`:''; app.innerHTML=`<a class="back" href="#">Back to movies</a><article class="detail"><div>${poster}</div><div><p class="eyebrow">Movie details</p><h1>${esc(m.title)}</h1><p class="detail-meta">${year(m.release_date)} · ${m.runtime ? `${Math.floor(m.runtime/60)}h ${m.runtime%60}m` : 'Runtime unknown'} · ★ ${(m.vote_average||0).toFixed(1)}</p><p class="overview">${esc(m.overview || 'No overview available.')}</p><div class="chips">${(m.genres||[]).map(g=>`<span>${esc(g.name)}</span>`).join('')}</div><p class="detail-meta">Directed by ${data.director ? `<a href="#person/${data.director.id}">${esc(data.director.name)}</a>` : 'Unknown'}</p><a class="text-link" href="#cast/${m.id}">View full cast</a></div></article>${shelf('Cast','People in this film',data.cast)}${shelf('You may also like','More movies to explore',data.recommendations)}`; }
  catch (error) { app.innerHTML = `<div class="message error">${esc(error.message)}</div>`; }
}

async function cast(id) { const data=await api(`/api/movie/${id}/cast`); app.innerHTML=`<a class="back" href="#movie/${id}">Back to movie</a><div class="page-heading"><p class="eyebrow">Full cast</p><h1>${esc(data.movie.title)}</h1></div><div class="cast-grid">${data.cast.map(person=>`<a class="cast-card" href="#person/${person.id}">${person.profile_path?`<img src="${image(person.profile_path)}" alt="">`:'<div class="cast-photo">?</div>'}<span><strong>${esc(person.name)}</strong><small>${esc(person.character||'Cast')}</small></span></a>`).join('')}</div>`; }

async function person(id) { const data=await api(`/api/person/${id}`); app.innerHTML=`<a class="back" href="#">Back to movies</a><article class="person"><div>${data.person.profile_path?`<img class="person-photo" src="${image(data.person.profile_path)}" alt="">`:''}</div><div><p class="eyebrow">Filmography</p><h1>${esc(data.person.name)}</h1><p class="detail-meta">${esc(data.person.place_of_birth||'')}</p><p class="overview">${esc(data.person.biography||'No biography available.')}</p></div></article>${shelf('Acting','Selected filmography',data.acting_movies)}${shelf('Directed','Directed films',data.directed_movies)}`; }

async function route() { fountainAbort?.abort(); const [kind,id] = location.hash.slice(1).split('/'); if(!kind) return home(); if(kind==='account' || kind==='watchlist') return account(); if(kind==='search') return search(decodeURIComponent(id || '')); if(kind==='fountain') return fountainPage(); if(kind==='movie') return movie(id); if(kind==='cast') return cast(id); if(kind==='person') return person(id); return home(); }
document.querySelector('#search-form').addEventListener('submit', event => { event.preventDefault(); const q=new FormData(event.currentTarget).get('q').trim(); if(q){ location.hash=`search/${encodeURIComponent(q)}`; search(q); } });
window.addEventListener('hashchange', route); route();
