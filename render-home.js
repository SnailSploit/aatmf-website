/* render-home.js — domain-grouped tactic index (editorial) */
(function(){
  if(!window.AATMF) return;
  var T = window.AATMF.tactics;
  var groups = [
    { key:'core',     num:'01', name:'Core attack tactics' },
    { key:'advanced', num:'02', name:'Advanced tactics' },
    { key:'infra',    num:'03', name:'Infrastructure & human' }
  ];
  var host = document.getElementById('domains');
  if(!host) return;
  host.innerHTML = groups.map(function(g){
    var rows = T.filter(function(t){ return t.domain===g.key; });
    var span = rows[0].id + '–' + rows[rows.length-1].id;
    var items = rows.map(function(t){
      return '<a class="tac" href="techniques.html?tactic='+t.id+'">'+
        '<span class="tac__id">'+t.id+'</span>'+
        '<span class="tac__body">'+
          '<span class="tac__name">'+t.name+'</span>'+
          '<span class="tac__obj">'+t.objective+'</span>'+
        '</span>'+
        '<span class="tac__cnt">'+t.count+'</span>'+
      '</a>';
    }).join('');
    return '<div class="domain rv" data-d="'+(groups.indexOf(g))+'">'+
      '<div class="domain__head">'+
        '<span class="domain__num">'+g.num+'</span>'+
        '<span class="domain__name">'+g.name+'</span>'+
        '<span class="domain__meta">'+span+'</span>'+
      '</div>'+ items +
    '</div>';
  }).join('');
  // re-observe freshly injected reveal elements
  if(window.__observeReveal) window.__observeReveal(host.querySelectorAll('.rv'));
})();
