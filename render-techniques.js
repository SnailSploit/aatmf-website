/* render-techniques.js — interactive browser over all 240 techniques */
(function(){
  if(!window.AATMF) return;
  var ALL = window.AATMF.techniques.slice();
  var TACTICS = window.AATMF.tactics;
  var tacById = {}; TACTICS.forEach(function(t){ tacById[t.id]=t; });
  var SEV = ['CRITICAL','HIGH','MEDIUM','LOW','INFO'];

  var state = { q:'', tactic:'all', sev:'all', sort:'risk' };

  // read ?tactic=
  var params = new URLSearchParams(location.search);
  if(params.get('tactic') && tacById[params.get('tactic')]) state.tactic = params.get('tactic');

  var els = {
    search: document.getElementById('q'),
    tactic: document.getElementById('f-tactic'),
    sort:   document.getElementById('f-sort'),
    sevs:   document.getElementById('f-sev'),
    count:  document.getElementById('res-count'),
    list:   document.getElementById('res-list'),
    empty:  document.getElementById('res-empty'),
    clear:  document.getElementById('f-clear')
  };

  // populate tactic select
  els.tactic.innerHTML = '<option value="all">All tactics (15)</option>' +
    TACTICS.map(function(t){ return '<option value="'+t.id+'">'+t.id+' · '+t.name+'</option>'; }).join('');
  els.tactic.value = state.tactic;

  // severity chips
  els.sevs.innerHTML = ['all'].concat(SEV).map(function(s){
    return '<button class="chip'+(s==='all'?' is-on':'')+'" data-sev="'+s+'">'+(s==='all'?'All':s.charAt(0)+s.slice(1).toLowerCase())+'</button>';
  }).join('');

  function rank(r){ return SEV.indexOf(r); }
  function apply(){
    var q = state.q.trim().toLowerCase();
    var out = ALL.filter(function(t){
      if(state.tactic!=='all' && t.tid!==state.tactic) return false;
      if(state.sev!=='all' && t.rating!==state.sev) return false;
      if(q){
        var hay = (t.id+' '+t.title+' '+t.tactic+' '+t.owasp+' '+t.atlas).toLowerCase();
        if(hay.indexOf(q)===-1) return false;
      }
      return true;
    });
    if(state.sort==='risk') out.sort(function(a,b){ return b.score-a.score; });
    else if(state.sort==='risk-asc') out.sort(function(a,b){ return a.score-b.score; });
    else if(state.sort==='id') out.sort(function(a,b){ return a.id<b.id?-1:1; });
    else if(state.sort==='proc') out.sort(function(a,b){ return b.procedures-a.procedures; });
    render(out);
  }

  function render(rows){
    els.count.textContent = rows.length;
    els.empty.style.display = rows.length? 'none':'block';
    els.list.innerHTML = rows.map(function(t){
      var maps = [];
      if(t.owasp) maps.push(t.owasp);
      if(t.atlas) maps.push(t.atlas);
      return '<a class="res" href="/technique/'+t.id+'" data-id="'+t.id+'">'+
        '<span class="res__id">'+t.id+'</span>'+
        '<span class="res__main">'+
          '<span class="res__title">'+t.title+'</span>'+
          '<span class="res__tac">'+t.tid+' · '+t.tactic+'</span>'+
        '</span>'+
        '<span class="res__maps">'+ maps.map(function(m){return '<span class="mtag">'+m+'</span>';}).join('') +'</span>'+
        '<span class="res__proc"><b>'+t.procedures+'</b> proc</span>'+
        '<span class="res__risk">'+
          '<span class="res__score">'+t.score+'</span>'+
          '<span class="rpill" data-r="'+t.rating+'">'+t.rating+'</span>'+
        '</span>'+
      '</a>';
    }).join('');
  }

  // ---- detail drawer ----
  var drawer = document.getElementById('drawer');
  var dBody = document.getElementById('drawer-body');
  var scrim = document.getElementById('scrim');
  function openDetail(id){
    var t = ALL.find(function(x){ return x.id===id; });
    if(!t) return;
    var tac = tacById[t.tid];
    var D = (window.AATMF_DETAIL && window.AATMF_DETAIL[id]) || {};
    var maps = [];
    if(t.owasp) maps.push(['OWASP LLM', t.owasp]);
    if(t.atlas) maps.push(['MITRE ATLAS', t.atlas]);

    var html =
      '<div class="dt__top"><span class="dt__id">'+t.id+'</span><span class="rpill" data-r="'+t.rating+'">'+t.rating+'</span></div>'+
      '<h2 class="dt__title">'+t.title+'</h2>'+
      '<a class="dt__tac" href="techniques.html?tactic='+t.tid+'">'+t.tid+' · '+t.tactic+' &rarr;</a>'+
      '<div class="dt__grid">'+
        '<div class="dt__cell"><span class="dt__k">Risk score</span><span class="dt__v mono">'+t.score+'</span></div>'+
        '<div class="dt__cell"><span class="dt__k">Rating</span><span class="dt__v">'+t.rating.charAt(0)+t.rating.slice(1).toLowerCase()+'</span></div>'+
        '<div class="dt__cell"><span class="dt__k">Procedures</span><span class="dt__v mono">'+t.procedures+'</span></div>'+
        '<div class="dt__cell"><span class="dt__k">Severity</span><span class="sev sev--lg" data-r="'+t.rating+'" style="margin-top:2px"><i></i><i></i><i></i><i></i><i></i></span></div>'+
      '</div>';

    if(D.m){
      html += '<div class="dt__sec"><span class="dt__k">Mechanism</span><p class="dt__body-text">'+D.m+'</p></div>';
    }
    if(D.d && D.d.length){
      html += '<div class="dt__sec"><span class="dt__k">Detection</span><ul class="dt__list">'+
        D.d.map(function(x){ return '<li>'+x+'</li>'; }).join('') + '</ul></div>';
    }
    if(D.g && D.g.length){
      html += '<div class="dt__sec"><span class="dt__k">Mitigation</span><div class="dt__mitig">'+
        D.g.map(function(m){ return '<div class="mitig"><span class="mitig__c">'+m.c+'</span><span class="mitig__e" data-e="'+m.e.toUpperCase()+'">'+m.e+'</span></div>'; }).join('') +
      '</div></div>';
    }
    if(D.c){
      html += '<div class="dt__sec"><span class="dt__k">Chaining</span><p class="dt__body-text dt__body-text--dim">'+D.c+'</p></div>';
    }
    if(maps.length){
      html += '<div class="dt__sec"><span class="dt__k">Framework mapping</span>'+
        maps.map(function(m){ return '<div class="dt__map"><span class="dt__map-f">'+m[0]+'</span><span class="mtag">'+m[1]+'</span></div>'; }).join('') +
      '</div>';
    }
    if(!D.m && !(D.d&&D.d.length)){
      html += '<p class="dt__note">Full procedure-level detail for <b>'+t.id+'</b> is published in the AATMF v3 dataset.</p>';
    }
    html += '<a class="dt__browse" href="/technique/'+t.id+'">Open the full page for '+t.id+' &rarr;</a>';

    dBody.innerHTML = html;
    drawer.classList.add('open'); scrim.classList.add('open');
    document.body.style.overflow='hidden';
    drawer.setAttribute('aria-hidden','false');
    drawer.scrollTop = 0;
  }
  function closeDetail(){
    drawer.classList.remove('open'); scrim.classList.remove('open');
    document.body.style.overflow=''; drawer.setAttribute('aria-hidden','true');
  }

  // ---- events ----
  els.search.addEventListener('input', function(e){ state.q=e.target.value; apply(); });
  els.tactic.addEventListener('change', function(e){ state.tactic=e.target.value; syncURL(); apply(); });
  els.sort.addEventListener('change', function(e){ state.sort=e.target.value; apply(); });
  els.sevs.addEventListener('click', function(e){
    var b = e.target.closest('.chip'); if(!b) return;
    state.sev = b.getAttribute('data-sev');
    els.sevs.querySelectorAll('.chip').forEach(function(c){ c.classList.toggle('is-on', c===b); });
    apply();
  });
  els.list.addEventListener('click', function(e){
    var r = e.target.closest('.res'); if(!r) return;
    if(e.metaKey||e.ctrlKey||e.shiftKey||e.button!==0) return; // allow open-in-new-tab
    e.preventDefault();
    openDetail(r.getAttribute('data-id'));
  });
  els.clear.addEventListener('click', function(){
    state = { q:'', tactic:'all', sev:'all', sort:'risk' };
    els.search.value=''; els.tactic.value='all'; els.sort.value='risk';
    els.sevs.querySelectorAll('.chip').forEach(function(c){ c.classList.toggle('is-on', c.getAttribute('data-sev')==='all'); });
    syncURL(); apply();
  });
  scrim.addEventListener('click', closeDetail);
  document.getElementById('drawer-close').addEventListener('click', closeDetail);
  document.addEventListener('keydown', function(e){ if(e.key==='Escape') closeDetail(); });

  function syncURL(){
    var u = new URL(location);
    if(state.tactic==='all') u.searchParams.delete('tactic'); else u.searchParams.set('tactic', state.tactic);
    history.replaceState(null,'',u);
  }

  apply();
})();
