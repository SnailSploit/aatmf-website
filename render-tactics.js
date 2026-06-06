/* render-tactics.js — full 15-tactic breakdown by domain */
(function(){
  if(!window.AATMF) return;
  var T = window.AATMF.tactics;
  function band(s){
    if(s>=250) return 'CRITICAL'; if(s>=200) return 'HIGH';
    if(s>=150) return 'MEDIUM'; if(s>=100) return 'LOW'; return 'INFO';
  }
  var groups = [
    { key:'core', num:'01', name:'Core attack tactics',
      blurb:'Prompt-level manipulation, filter evasion, reasoning exploits and the interfaces, training data and outputs that surround the model.' },
    { key:'advanced', num:'02', name:'Advanced tactics',
      blurb:'Multi-modal, extraction, autonomous agents and retrieval poisoning — the surface that opens once models are wired into real systems.' },
    { key:'infra', num:'03', name:'Infrastructure & human',
      blurb:'The supply chain, the platform it runs on, and the human reviewers and workflows that approve what the model produces.' }
  ];
  var host = document.getElementById('tac-domains');
  if(!host) return;
  host.innerHTML = groups.map(function(g){
    var rows = T.filter(function(t){ return t.domain===g.key; });
    var span = rows[0].id + '–' + rows[rows.length-1].id;
    var items = rows.map(function(t){
      var b = band(t.avg);
      return '<a class="trow rv" href="techniques.html?tactic='+t.id+'">'+
        '<span class="trow__id">'+t.id+'</span>'+
        '<span class="trow__main">'+
          '<span class="trow__name">'+t.name+'</span>'+
          '<span class="trow__obj">'+t.objective+'</span>'+
        '</span>'+
        '<span class="trow__stat"><span class="trow__num">'+t.count+'</span><span class="trow__lab">techniques</span></span>'+
        '<span class="trow__stat"><span class="trow__num">'+t.avg+'</span><span class="trow__lab">avg risk</span></span>'+
        '<span class="trow__sev"><span class="sev" data-r="'+b+'"><i></i><i></i><i></i><i></i><i></i></span></span>'+
        '<span class="trow__arr">&rarr;</span>'+
      '</a>';
    }).join('');
    return '<section class="tdomain">'+
      '<header class="tdomain__head rv">'+
        '<div class="tdomain__top"><span class="tdomain__num">'+g.num+'</span>'+
          '<h2 class="h2">'+g.name+'</h2><span class="tdomain__span mono">'+span+'</span></div>'+
        '<p class="tdomain__blurb lede">'+g.blurb+'</p>'+
      '</header>'+
      '<div class="trows">'+items+'</div>'+
    '</section>';
  }).join('');
  // per-tactic threat intel line
  var TI = window.AATMF_TACTIC_INFO || {};
  host.querySelectorAll('.trow').forEach(function(row){
    var id = row.querySelector('.trow__id').textContent;
    var info = TI[id];
    if(info && info.threat){
      var note = document.createElement('div');
      note.className = 'trow__threat';
      note.innerHTML = '<span class="trow__threat-k">2025–26 signal</span><span class="trow__threat-v">'+info.threat+'</span>';
      row.insertAdjacentElement('afterend', note);
    }
  });
  if(window.__observeReveal) window.__observeReveal(host.querySelectorAll('.rv'));
})();
