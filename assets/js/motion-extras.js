/* Motion layer for twoenglishmugs.com
   1. Reveals on IntersectionObserver.
   2. Parallax: every visual layer carries its own depth factor and is moved on scroll.

   Rules this file keeps:
   - no library, no scroll hijack, page height never changes
   - the page is complete if it never runs: the hidden state lives behind html.anim-ready
   - prefers-reduced-motion turns all of it off
   - parallax writes translate3d only, on a rAF tick, and only when a value actually moves */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var phone = window.matchMedia('(max-width: 639px)');

  /* ---------------- reveals ---------------- */
  var TARGETS = [
    '.section-head h2', '.section-head > p', '.rows li', '#episodes .card',
    '.hostsrow > div', '.faq__item', '.gl li',
    '#practice .phead', '#practice .sub', '#practice .tabs'
  ];

  var els = [];
  TARGETS.forEach(function (sel) {
    Array.prototype.forEach.call(document.querySelectorAll(sel), function (el) {
      if (el.closest('.hero')) return;   /* hero layers are parallaxed, not faded in */
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

  /* ---------------- parallax ----------------
     factor = pixels travelled per pixel scrolled, relative to the page.
     Positive leaks up slower than the page (reads as further away),
     negative travels the other way (reads as in front). limit clamps it so a
     layer can never escape its own section. */
  var LAYERS = [
    ['.hero__blob',            -0.22, 130, 1],
    ['.hero__ring',            -0.14,  90, 1],
    ['.hero__media',            0.16,  70, 1],
    ['.hero__media .duo',       0.26,  55, 1],
    ['.hero__media .ly-float', -0.18,  65, 1],
    ['.hero__text',             0.05,  30, 1],
    ['.vecpanel',               0.15,  60, 0]
  ];

  var layers = [];
  LAYERS.forEach(function (spec) {
    Array.prototype.forEach.call(document.querySelectorAll(spec[0]), function (el) {
      el.setAttribute('data-par', '');
      /* fromTop: measured from the top of the page, so it is exactly 0 at rest under the
         hero. Otherwise measured from the scroll where the layer sits mid-viewport, so the
         layer is at its natural place when you look straight at it. */
      layers.push({ el: el, factor: spec[1], limit: spec[2], fromTop: !!spec[3], top: 0, h: 0, last: null });
    });
  });

  function measure() {
    var y = window.pageYOffset;
    layers.forEach(function (o) {
      var prev = o.el.style.transform;
      o.el.style.transform = 'none';
      var r = o.el.getBoundingClientRect();
      o.top = r.top + y;
      o.h = r.height;
      o.el.style.transform = prev;
      o.last = null;
    });
  }

  var scale = 1;

  function tick() {
    for (var i = 0; i < layers.length; i++) {
      var o = layers[i];
      var anchor = o.fromTop ? 0 : (o.top - window.innerHeight / 2);
      var d = window.pageYOffset - anchor;
      var ty = d * o.factor * scale;
      if (ty > o.limit) ty = o.limit;
      if (ty < -o.limit) ty = -o.limit;
      ty = Math.round(ty * 10) / 10;
      if (ty === o.last) continue;
      o.last = ty;
      o.el.style.transform = 'translate3d(0,' + ty + 'px,0)';
    }
  }

  if (layers.length && !reduce.matches) {
    scale = phone.matches ? 0.6 : 1;
    measure();
    var queued = false;
    window.addEventListener('scroll', function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { tick(); queued = false; });
    }, { passive: true });
    window.addEventListener('resize', function () {
      scale = phone.matches ? 0.6 : 1;
      measure();
      tick();
    });
    window.addEventListener('load', function () { measure(); tick(); });
    tick();

    if (reduce.addEventListener) {
      reduce.addEventListener('change', function (ev) {
        if (!ev.matches) return;
        layers.forEach(function (o) { o.el.style.transform = ''; });
      });
    }
  }

  /* ---------------- the bar ---------------- */
  var nav = document.querySelector('header.nav');
  if (nav) {
    var navScroll = function () { nav.classList.toggle('is-scrolled', window.pageYOffset > 24); };
    window.addEventListener('scroll', navScroll, { passive: true });
    navScroll();
  }
})();
