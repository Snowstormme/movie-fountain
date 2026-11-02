const app = document.querySelector('#app');
const image = path => path ? `https://image.tmdb.org/t/p/w500${path}` : '';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const year = date => date ? date.slice(0, 4) : 'Year unknown';

function card(movie) {
  const poster = movie.poster_path ? `<img src="${image(movie.poster_path)}" alt="Poster for ${esc(movie.title)}" loading="lazy">` : '<div class="no-poster">No poster</div>';
  return `<a class="movie-card" href="#movie/${movie.id}">${poster}<div class="card-copy"><h3>${esc(movie.title)}</h3><span>${year(movie.release_date)}</span><strong>★ ${(movie.vote_average || 0).toFixed(1)}</strong></div></a>`;
}

function shelf(title, subtitle, movies) {
  if (!movies?.length) return '';
  return `<section class="shelf"><div class="shelf-heading"><div><h2>${title}</h2><p>${subtitle}</p></div><span>${movies.length} films</span></div><div class="movie-row">${movies.slice(0, 12).map(card).join('')}</div></section>`;
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

async function route() { const [kind,id] = location.hash.slice(1).split('/'); if(!kind) return home(); if(kind==='movie') return movie(id); if(kind==='cast') return cast(id); if(kind==='person') return person(id); return home(); }
document.querySelector('#search-form').addEventListener('submit', event => { event.preventDefault(); const q=new FormData(event.currentTarget).get('q').trim(); if(q){ location.hash=`search/${encodeURIComponent(q)}`; search(q); } });
window.addEventListener('hashchange', route); route();
