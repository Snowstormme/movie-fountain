const app = document.querySelector('#app');
const image = path => path ? `https://image.tmdb.org/t/p/w500${path}` : '';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const year = date => date ? date.slice(0, 4) : 'Year unknown';

function card(movie) {
  const poster = movie.poster_path ? `<img src="${image(movie.poster_path)}" alt="Poster for ${esc(movie.title)}" loading="lazy">` : '<div class="no-poster">No poster</div>';
  return `<a class="movie-card" href="#movie/${movie.id}">${poster}<div class="card-copy"><h3>${esc(movie.title)}</h3><span>${year(movie.release_date)}</span><strong>★ ${(movie.vote_average || 0).toFixed(1)}</strong></div><div class="card-preview"><p>${esc(movie.overview || 'Open the details to learn more about this movie.')}</p><span>View details →</span></div></a>`;
}

function shelf(title, subtitle, movies) {
  if (!movies?.length) return '';
  return `<section class="shelf"><div class="shelf-heading"><div><h2>${title}</h2><p>${subtitle}</p></div><span>${movies.length} films</span></div><div class="movie-row">${movies.slice(0, 12).map(card).join('')}</div></section>`;
}

function fountain(data) {
  const movies = [...(data.trending || []), ...(data.popular || []), ...(data.now_playing || []), ...(data.top_rated || []), ...(data.upcoming || [])]
    .filter((movie, index, all) => all.findIndex(item => item.id === movie.id) === index);
  const columns = [0, 1, 2].map(column => movies.filter((_, index) => index % 3 === column));
  return `<section class="fountain-intro"><a class="back" href="#">← Back to home</a><p class="eyebrow">A different way to browse</p><h1>Let the next movie find you.</h1><p class="hero-copy">A living stream of movies from every shelf. Pick one, or keep watching the fountain flow.</p><div class="fountain-controls" role="group" aria-label="Fountain controls"><span>Flow</span><button class="fountain-control" type="button" data-speed="slow">Slow</button><button class="fountain-control is-active" type="button" data-speed="normal">Normal</button><button class="fountain-control" type="button" data-speed="fast">Fast</button><button class="fountain-control pause-control" type="button" data-action="pause" aria-pressed="false">Pause</button><button class="fountain-control shuffle-control" type="button" data-action="shuffle">↻ Surprise me</button></div></section><section class="fountain" id="fountain-stream" data-speed="normal" aria-label="Movie Fountain">${columns.map((column, columnIndex) => `<div class="fountain-column fountain-column-${columnIndex + 1}">${column.map((movie, index) => `<div class="fountain-item" style="--delay:${(index * 0.35) + columnIndex * 0.2}s">${card(movie)}</div>`).join('')}</div>`).join('')}</section>`;
}

function bindFountainControls() {
  const stream = document.querySelector('#fountain-stream');
  if (!stream) return;
  document.querySelectorAll('.fountain-control[data-speed]').forEach(button => button.addEventListener('click', () => {
    stream.dataset.speed = button.dataset.speed;
    document.querySelectorAll('.fountain-control[data-speed]').forEach(control => control.classList.toggle('is-active', control === button));
  }));
  const pause = document.querySelector('.pause-control');
  pause?.addEventListener('click', () => {
    const paused = stream.classList.toggle('is-paused');
    pause.textContent = paused ? 'Play' : 'Pause';
    pause.setAttribute('aria-pressed', String(paused));
  });
  document.querySelector('.shuffle-control')?.addEventListener('click', () => {
    const columns = [...stream.querySelectorAll('.fountain-column')];
    const cards = columns.flatMap(column => [...column.querySelectorAll('.fountain-item')].map(item => item.innerHTML));
    for (let index = cards.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [cards[index], cards[randomIndex]] = [cards[randomIndex], cards[index]];
    }
    columns.forEach(column => { column.innerHTML = ''; });
    cards.forEach((markup, index) => {
      const item = document.createElement('div');
      item.className = 'fountain-item';
      item.style.setProperty('--delay', `${(index % 14) * 0.18}s`);
      item.innerHTML = markup;
      columns[index % columns.length].append(item);
    });
  });
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
    app.innerHTML = `<section class="hero"><p class="eyebrow">Your next watch</p><h1>Find something worth watching.</h1><p class="hero-copy">Browse what is trending, playing now, highly rated, and coming soon.</p></section>${shelf('Trending now','What people are watching this week',data.trending)}${shelf('Popular this week','Crowd favorites worth your time',data.popular)}${shelf('Now playing','Fresh releases from cinemas',data.now_playing)}${shelf('Top rated','A reliable place to start',data.top_rated)}${shelf('Coming soon','Keep an eye on what is next',data.upcoming)}`;
  } catch (error) { app.innerHTML = `<div class="message error">${esc(error.message)}</div>`; }
}

async function fountainPage() {
  app.innerHTML = '<div class="loading">Pouring the fountain…</div>';
  try { app.innerHTML = fountain(await api('/api/home')); bindFountainControls(); }
  catch (error) { app.innerHTML = `<div class="message error">${esc(error.message)}</div>`; }
}

async function search(query) {
  app.innerHTML = '<div class="loading">Searching…</div>';
  try { const data = await api(`/api/search?q=${encodeURIComponent(query)}`); app.innerHTML = `<div class="page-heading"><p class="eyebrow">Search results</p><h1>Movies for “${esc(query)}”</h1></div><div class="movie-grid">${(data.results || []).map(card).join('') || '<div class="message">No movies found.</div>'}</div>`; }
  catch (error) { app.innerHTML = `<div class="message error">${esc(error.message)}</div>`; }
}

async function movie(id) {
  app.innerHTML = '<div class="loading">Loading movie…</div>';
  try { const data = await api(`/api/movie/${id}`); const m=data.movie; const poster=m.poster_path?`<img class="detail-poster" src="${image(m.poster_path)}" alt="Poster for ${esc(m.title)}">`:''; app.innerHTML=`<a class="back" href="#">← Back to movies</a><article class="detail"><div>${poster}</div><div><p class="eyebrow">Movie details</p><h1>${esc(m.title)}</h1><p class="detail-meta">${year(m.release_date)} · ${m.runtime ? `${Math.floor(m.runtime/60)}h ${m.runtime%60}m` : 'Runtime unknown'} · ★ ${(m.vote_average||0).toFixed(1)}</p><p class="overview">${esc(m.overview || 'No overview available.')}</p><div class="chips">${(m.genres||[]).map(g=>`<span>${esc(g.name)}</span>`).join('')}</div><p class="detail-meta">Directed by ${data.director ? `<a href="#person/${data.director.id}">${esc(data.director.name)}</a>` : 'Unknown'}</p><a class="text-link" href="#cast/${m.id}">View full cast →</a></div></article>${shelf('Cast','People in this film',data.cast)}${shelf('You may also like','More movies to explore',data.recommendations)}`; }
  catch (error) { app.innerHTML = `<div class="message error">${esc(error.message)}</div>`; }
}

async function cast(id) { const data=await api(`/api/movie/${id}/cast`); app.innerHTML=`<a class="back" href="#movie/${id}">← Back to movie</a><div class="page-heading"><p class="eyebrow">Full cast</p><h1>${esc(data.movie.title)}</h1></div><div class="cast-grid">${data.cast.map(person=>`<a class="cast-card" href="#person/${person.id}">${person.profile_path?`<img src="${image(person.profile_path)}" alt="">`:'<div class="cast-photo">?</div>'}<span><strong>${esc(person.name)}</strong><small>${esc(person.character||'Cast')}</small></span></a>`).join('')}</div>`; }

async function person(id) { const data=await api(`/api/person/${id}`); app.innerHTML=`<a class="back" href="#">← Back to movies</a><article class="person"><div>${data.person.profile_path?`<img class="person-photo" src="${image(data.person.profile_path)}" alt="">`:''}</div><div><p class="eyebrow">Filmography</p><h1>${esc(data.person.name)}</h1><p class="detail-meta">${esc(data.person.place_of_birth||'')}</p><p class="overview">${esc(data.person.biography||'No biography available.')}</p></div></article>${shelf('Acting','Selected filmography',data.acting_movies)}${shelf('Directed','Directed films',data.directed_movies)}`; }

async function route() { const [kind,id] = location.hash.slice(1).split('/'); if(!kind) return home(); if(kind==='fountain') return fountainPage(); if(kind==='movie') return movie(id); if(kind==='cast') return cast(id); if(kind==='person') return person(id); return home(); }
document.querySelector('#search-form').addEventListener('submit', event => { event.preventDefault(); const q=new FormData(event.currentTarget).get('q').trim(); if(q){ location.hash=`search/${encodeURIComponent(q)}`; search(q); } });
window.addEventListener('hashchange', route); route();
