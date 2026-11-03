const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function setup(){
  const handlers={},data={};
  const stub={innerHTML:'',textContent:'',addEventListener:(n,f)=>handlers[n]=f,insertAdjacentHTML(){},querySelectorAll:()=>[]};
  const ctx={Set,Map,JSON,Number,Event,AbortController,console,document:{querySelector:()=>stub,body:stub,addEventListener(){},documentElement:{classList:{toggle(){}}}},window:{addEventListener(){}},location:{hash:'#watchlist'},localStorage:{getItem:k=>data[k]||null,setItem:(k,v)=>data[k]=v}};
  vm.createContext(ctx);for(const f of ['features.js','app.js'])vm.runInContext(fs.readFileSync(f,'utf8'),ctx);
  return {ctx,handlers,data,stub,run:code=>vm.runInContext(code,ctx)};
}
test('import normalizes unsafe paths and ratings, deduplicates, rejects invalid IDs',()=>{
  const {run}=setup();
  assert.equal(run(`normalizeMovies([{id:1,title:'A',poster_path:'" onerror="alert(1)',vote_average:99}])[0].poster_path`),null);
  assert.equal(run(`normalizeMovies([{id:1,title:'A',vote_average:99}])[0].vote_average`),10);
  assert.equal(run(`normalizeMovies([{id:1,title:'A'},{id:1,title:'B'}]).length`),1);
  assert.throws(()=>run(`normalizeMovies([{id:'bad',title:'A'}])`));
  assert.throws(()=>run(`normalizeMovies(Array(2001).fill({id:1,title:'A'}))`));
});
test('watchlist save, reload and remove; rendered titles escaped',()=>{
  const {run,handlers,data,stub}=setup();run(`card({id:123,title:'<script>test</script>',vote_average:8})`);
  const click=()=>handlers.click({target:{closest:()=>({dataset:{save:'123'}})}});
  click();assert.equal(JSON.parse(data['movie-fountain.watchlist.v1']).length,1);
  run('savedMovies=readWatchlist();watchlist()');assert.match(stub.innerHTML,/&lt;script&gt;/);assert.match(stub.innerHTML,/aria-pressed="true"/);
  click();assert.equal(JSON.parse(data['movie-fountain.watchlist.v1']).length,0);
});
test('corrupt storage fails safely; filters select genres',()=>{
  const {run,data}=setup();data['movie-fountain.watchlist.v1']='{';assert.equal(run('readWatchlist().length'),0);
  assert.equal(run(`filteredMovies([{id:1,genre_ids:[28]},{id:2,genre_ids:[35]}],'action')[0].id`),1);
});
