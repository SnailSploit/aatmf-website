/* AATMF — shared behavior */
(function(){
  var io = null;
  function makeIO(){
    if(!('IntersectionObserver' in window)) return null;
    return new IntersectionObserver(function(ents){
      ents.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold:0.12, rootMargin:'0px 0px -6% 0px' });
  }
  function observe(els){
    if(!els || !els.length) return;
    if(!io){ els.forEach(function(e){ e.classList.add('in'); }); return; }
    els.forEach(function(e){ io.observe(e); });
  }
  window.__observeReveal = observe;

  function animateCount(el){
    var target = parseFloat(el.getAttribute('data-count'));
    var dur = 1150, start = null;
    function step(ts){
      if(!start) start = ts;
      var p = Math.min((ts-start)/dur, 1);
      var e = 1 - Math.pow(1-p, 3);
      el.textContent = Math.round(target*e).toLocaleString();
      if(p<1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  function initCounts(){
    var els = document.querySelectorAll('[data-count]');
    if(!('IntersectionObserver' in window)){ els.forEach(animateCount); return; }
    var c = new IntersectionObserver(function(ents){
      ents.forEach(function(en){ if(en.isIntersecting){ animateCount(en.target); c.unobserve(en.target); } });
    }, { threshold:0.6 });
    els.forEach(function(e){ c.observe(e); });
  }
  function initMenu(){
    var b = document.querySelector('.burger'), m = document.querySelector('.mobile');
    if(!b||!m) return;
    b.addEventListener('click', function(){
      var open = m.classList.toggle('open');
      b.setAttribute('aria-expanded', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    m.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', function(){
      m.classList.remove('open'); b.setAttribute('aria-expanded',false); document.body.style.overflow='';
    }); });
  }
  function initScrollbar(){
    var bar = document.createElement('div');
    bar.className = 'scrollbar';
    document.body.appendChild(bar);
    var ticking = false;
    function upd(){
      var se = document.scrollingElement || document.documentElement;
      var max = se.scrollHeight - se.clientHeight;
      var top = window.pageYOffset || se.scrollTop || 0;
      var p = max>0 ? top/max : 0;
      bar.style.width = (Math.max(0,Math.min(1,p))*100).toFixed(2) + '%';
      ticking = false;
    }
    window.addEventListener('scroll', function(){ if(!ticking){ requestAnimationFrame(upd); ticking=true; } }, {passive:true});
    upd();
  }
  function ready(fn){ document.readyState!=='loading' ? fn() : document.addEventListener('DOMContentLoaded', fn); }
  ready(function(){
    io = makeIO();
    observe(document.querySelectorAll('.rv'));
    initCounts();
    initMenu();
    initScrollbar();
    // failsafe — never let reveal content stay invisible
    setTimeout(function(){
      document.querySelectorAll('.rv:not(.in)').forEach(function(e){ e.classList.add('in'); });
    }, 2600);
  });
})();
