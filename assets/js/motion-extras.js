/* Motion layer for twoenglishmugs.com
   Lenis (smooth scroll) + GSAP ScrollTrigger (scroll-driven reveals).
   Written so the page is complete without it: nothing is hidden unless this file runs,
   prefers-reduced-motion turns it all off, and a 3s watchdog clears any stuck state. */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  if (reduce || !window.gsap || !window.ScrollTrigger) return;

  var gsap = window.gsap;
  gsap.registerPlugin(window.ScrollTrigger);
  root.classList.add('anim-ready');

  /* Smooth scrolling: left to the browser. Lenis was tried here and hijacked the
     wheel without actually driving scrollTo on this page, so anchors only glided by
     half a screen. The kit's easing + scroll-behavior do the same job without the risk. */

  /* ---- reveals: one pattern for every section below the hero ---- */
  var enter = 'top 82%';

  function reveal(sel, vars) {
    var els = gsap.utils.toArray(sel);
    if (!els.length) return;
    gsap.from(els, Object.assign({
      y: 26, opacity: 0, duration: 0.75, ease: 'power2.out', stagger: 0.07,
      scrollTrigger: { trigger: els[0].closest('section') || els[0], start: enter, once: true }
    }, vars || {}));
  }

  reveal('.section-head h2');
  reveal('.section-head > p');
  reveal('.rows li', { y: 18, stagger: 0.06 });
  reveal('#episodes .card', { y: 30, stagger: 0.06 });
  reveal('.vecpanel', { y: 34, duration: 0.9 });
  reveal('.hostsrow > div', { y: 24 });
  reveal('.faq__item', { y: 14, stagger: 0.05 });
  reveal('.gl li', { y: 12, stagger: 0.025, duration: 0.5 });

  /* ---- the hero settles as you leave it ---- */
  gsap.to('.hero__media', {
    y: -40, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });
  /* the words drift down slowly as the hero leaves; no opacity fade, a dimmed hero
     mid-scroll reads as a rendering fault rather than a transition */
  gsap.to('.hero__text', {
    y: 18, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });

  /* ---- the bar gains weight once you are moving ---- */
  var nav = document.querySelector('header.nav');
  if (nav) {
    window.ScrollTrigger.create({
      start: 'top -60',
      onEnter: function () { nav.classList.add('is-scrolled'); },
      onLeaveBack: function () { nav.classList.remove('is-scrolled'); }
    });
  }

  /* ---- the practice band drifts in without touching the game itself ---- */
  reveal('#practice .phead, #practice .sub', { y: 18, stagger: 0.06 });
  reveal('#practice .tabs', { y: 20 });

  /* ---- watchdog: if anything is left invisible, put it back ---- */
  setTimeout(function () {
    document.querySelectorAll('[style*="opacity"]').forEach(function (el) {
      if (parseFloat(getComputedStyle(el).opacity) < 0.05) el.style.opacity = '';
    });
    window.ScrollTrigger.refresh();
  }, 3000);
})();
