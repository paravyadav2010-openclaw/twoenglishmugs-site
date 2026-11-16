/* Motion layer for twoenglishmugs.com
   Reveals on IntersectionObserver, one transform-only parallax on the hero, nothing else.
   No library, no scroll hijack: if this file never runs the page is still complete,
   and prefers-reduced-motion turns every part of it off. */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  var TARGETS = [
    '.section-head h2', '.section-head > p', '.rows li', '#episodes .card',
    '.vecpanel', '.hostsrow > div', '.faq__item', '.gl li',
    '#practice .phead', '#practice .sub', '#practice .tabs'
  ];

  var els = [];
  TARGETS.forEach(function (sel) {
    Array.prototype.forEach.call(document.querySelectorAll(sel), function (el) {
      el.setAttribute('data-reveal', '');
      els.push(el);
    });
  });

  function showAll() {
    els.forEach(function (el) { el.classList.add('is-in'); });
    root.classList.remove('anim-ready');
  }

  if (reduce.matches || !('IntersectionObserver' in window)) {
    showAll();
  } else {
    root.classList.add('anim-ready');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    els.forEach(function (el) { io.observe(el); });

    /* nothing may stay hidden: after 2.5s anything in view is shown regardless */
    setTimeout(function () {
      els.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (!el.classList.contains('is-in') && r.top < window.innerHeight && r.bottom > 0) {
          el.classList.add('is-in');
        }
      });
    }, 2500);

    if (reduce.addEventListener) {
      reduce.addEventListener('change', function (ev) { if (ev.matches) showAll(); });
    }
  }

  /* the hero settles as it leaves: transform only, never opacity */
  var media = document.querySelector('.hero__media');
  if (media && !reduce.matches && window.innerWidth > 639) {
    var ticking = false;
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = Math.min(window.scrollY, window.innerHeight);
        media.style.transform = 'translate3d(0,' + (-y * 0.06).toFixed(2) + 'px,0)';
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* the bar gains weight once the page is moving */
  var nav = document.querySelector('header.nav');
  if (nav) {
    var navScroll = function () {
      nav.classList.toggle('is-scrolled', window.scrollY > 24);
    };
    window.addEventListener('scroll', navScroll, { passive: true });
    navScroll();
  }
})();
