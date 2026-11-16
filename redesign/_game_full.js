
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* scroll progress + sticky header */
  var prog = document.getElementById('prog'), hd = document.getElementById('hd');
  function onScroll() {
    if (!prog || !hd) return;
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    prog.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
    hd.classList.toggle('stuck', h.scrollTop > 8);
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* rotating hero word */
  var words = ['one cup', 'one chat', 'one habit', 'one story'];
  var rot = document.getElementById('rot'), wi = 0;
  if (!reduce && rot) {
    setInterval(function () {
      wi = (wi + 1) % words.length;
      rot.style.opacity = 0;
      setTimeout(function () { rot.textContent = words[wi]; rot.style.opacity = 1; }, 220);
    }, 3200);
    rot.style.transition = 'opacity .22s ease';
  }

  /* reveal on scroll, with a safety net */
  var els = document.querySelectorAll('.reveal');
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    els.forEach(function (el) { io.observe(el); });
  } else { els.forEach(function (el) { el.classList.add('in'); }); }
  setTimeout(function () { els.forEach(function (el) { el.classList.add('in'); }); }, 1400);

  /* mouse-reactive dot grid — draws only when the pointer moves, never a free-running loop */
  var cv = document.getElementById('dots');
  if (cv && !reduce) {
    var ctx = cv.getContext('2d'), dpr = Math.min(devicePixelRatio || 1, 2);
    var pts = [], W = 0, H = 0, mx = -999, my = -999, queued = false;
    function build() {
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      pts = [];
      for (var x = 30; x < W; x += 30) for (var y = 30; y < H; y += 30) pts.push({ x: x, y: y });
      render();
    }
    function render() {
      queued = false;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i], d = Math.hypot(p.x - mx, p.y - my);
        var near = d < 130;
        ctx.beginPath();
        ctx.arc(p.x, p.y, near ? 1.3 + (1 - d / 130) * 2.1 : 1.3, 0, 6.2832);
        ctx.fillStyle = near ? 'rgba(231,93,78,' + (0.34 + (1 - d / 130) * 0.5).toFixed(3) + ')'
                             : 'rgba(231,93,78,.22)';
        ctx.fill();
      }
    }
    function request() { if (!queued) { queued = true; requestAnimationFrame(render); } }
    var host = cv.parentElement;
    host.addEventListener('pointermove', function (e) {
      var b = cv.getBoundingClientRect();
      mx = e.clientX - b.left; my = e.clientY - b.top; request();
    });
    host.addEventListener('pointerleave', function () { mx = my = -999; request(); });
    var rt; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(build, 150); });
    build();
  }

  /* episode filter + done tracking */
  var KEY = 'tem-done';
  var done = {};
  try { done = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { done = {}; }
  var btns = document.querySelectorAll('.done'), countEl = document.getElementById('epcount');
  function paint() {
    if (!countEl) return;
    var n = 0;
    btns.forEach(function (b) {
      var on = !!done[b.dataset.ep];
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (on) n++;
    });
    countEl.innerHTML = '<b>' + n + '</b> of ' + btns.length + ' done';
  }
  btns.forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.preventDefault();
      done[b.dataset.ep] = !done[b.dataset.ep];
      try { localStorage.setItem(KEY, JSON.stringify(done)); } catch (err) {}
      paint();
    });
  });
  paint();

  document.querySelectorAll('.f').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.f').forEach(function (o) { o.classList.remove('on'); });
      btn.classList.add('on');
      var f = btn.dataset.f;
      document.querySelectorAll('.ep').forEach(function (card) {
        var tags = (card.dataset.tags || '').split(' ');
        card.classList.toggle('hide', f !== 'all' && tags.indexOf(f) === -1);
      });
    });
  });

  /* word match — walks the whole deck in sets of three */
  var wbox = document.getElementById('words'), mbox = document.getElementById('means');
  var msg = document.getElementById('qmsg'), sel = null, left = 0;
  function shuffle(a) { return a.map(function (v) { return [Math.random(), v]; }).sort(function (x, y) { return x[0] - y[0]; }).map(function (v) { return v[1]; }); }

  /* ---------- play ledger ----------
     One record in localStorage, shared by every word game, so a player keeps
     moving forward instead of meeting the same words again:
       - words are dealt unseen-first and never repeat until the whole bank is used
       - when the bank runs out, a new round starts on a fresh shuffle
       - a new round never opens with the exact set that closed the last one
     Sets are combinations, so rounds keep producing new pairings even after
     every word has been met once. */
  var LEDGER = 'tem-play-v1';
  var ledger = {};
  try { ledger = JSON.parse(localStorage.getItem(LEDGER) || '{}'); } catch (e) { ledger = {}; }
  function lane(name) {
    name = name || 'words';
    if (!ledger[name] || !ledger[name].seen) ledger[name] = { seen: [], round: 1, last: [] };
    return ledger[name];
  }
  function saveLedger() { try { localStorage.setItem(LEDGER, JSON.stringify(ledger)); } catch (e) {} }
  function sigOf(a) { return a.map(function (v) { return v.w; }).sort().join('|'); }
  function scatter(q, words, minIdx) {
    /* move these words to random positions past the opening deal, so they are
       neither dealt first (an instant repeat) nor always last (which would
       make the closing set of every pass identical) */
    words.forEach(function (w) {
      var at = -1, i;
      for (i = 0; i < q.length; i++) if (q[i].w === w) { at = i; break; }
      if (at < 0) return;
      var j = minIdx + Math.floor(Math.random() * Math.max(1, q.length - minIdx));
      if (j >= q.length) j = q.length - 1;
      var t = q[at]; q[at] = q[j]; q[j] = t;
    });
    return q;
  }
  function fillDeck(L, n) {
    L.queue = scatter(shuffle(VOCAB.slice()), L.last || [], n);
    L.seen = [];
    L.fills = (L.fills || 0) + 1;
    if (L.fills > 1) L.round++;                  /* first fill keeps round 1 */
  }
  function dealWords(n) {
    var L = lane('words');
    if (!L.sets) L.sets = [];
    L.played = L.played || 0;

    /* A continuous shuffled queue, not a round that resets: every word is dealt
       once per pass, and a set may straddle two passes, so a set is never
       forced by whatever happens to be left over at the end. */
    if (!L.queue || !L.queue.length) fillDeck(L, n);

    var out = [];
    while (out.length < n) {
      if (!L.queue.length) {
        fillDeck(L, n);
        /* never let a fresh pass hand back a word this set already holds */
        L.queue = scatter(L.queue, out.map(function (v) { return v.w; }), n);
      }
      out.push(L.queue.shift());
    }

    /* 42 words -> 11,480 combinations for a set of three. Swap the tail for a
       word still waiting in the queue if this exact set has been served. */
    for (var guard = 0; guard < 8 && L.sets.indexOf(sigOf(out)) >= 0; guard++) {
      var at = -1, i;
      for (i = 0; i < L.queue.length; i++) {
        if (out.indexOf(L.queue[i]) === -1 && (L.last || []).indexOf(L.queue[i].w) === -1) { at = i; break; }
      }
      if (at < 0) {
        fillDeck(L, n);                          /* pass exhausted: open the next one */
        L.queue = scatter(L.queue, out.map(function (v) { return v.w; }), n);
        for (i = 0; i < L.queue.length; i++) {
          if (out.indexOf(L.queue[i]) === -1 && (L.last || []).indexOf(L.queue[i].w) === -1) { at = i; break; }
        }
      }
      if (at < 0) break;                         /* nothing new left to offer */
      var cand = L.queue.splice(at, 1)[0];
      L.queue.push(out[out.length - 1]);         /* dropped word goes to the back */
      out[out.length - 1] = cand;
    }

    out.forEach(function (v) { if (L.seen.indexOf(v.w) < 0) L.seen.push(v.w); });
    L.last = out.map(function (v) { return v.w; });
    if (n > 1) {                                 /* a single word is not a "set" */
      L.played++;
      L.sets.push(sigOf(out));
      while (L.sets.length > 60) L.sets.shift();
    }
    saveLedger();
    return out;
  }
  var matchSet = 0;
  function pairOf(v) { return { w: v.w, m: v.m }; }

  function renderMatch() {
    var set = dealWords(3).map(pairOf);
    matchSet++;
    wbox.innerHTML = ''; mbox.innerHTML = ''; sel = null;
    left = set.length;
    msg.className = 'qmsg'; msg.textContent = 'Set ' + matchSet + ' — pick a word, then its meaning.';

    shuffle(set.slice()).forEach(function (p) {
      var b = document.createElement('button');
      b.className = 'qitem'; b.type = 'button'; b.dataset.k = p.w; b.textContent = p.w;
      b.addEventListener('click', function () {
        if (b.classList.contains('ok')) return;
        document.querySelectorAll('#words .qitem').forEach(function (o) { o.classList.remove('sel'); });
        b.classList.add('sel'); sel = b;
        msg.className = 'qmsg'; msg.textContent = 'Now pick the meaning of “' + p.w + '”.';
      });
      wbox.appendChild(b);
    });

    shuffle(set.slice()).forEach(function (p) {
      var b = document.createElement('button');
      b.className = 'qitem'; b.type = 'button'; b.dataset.k = p.w;
      b.innerHTML = '<span>' + p.m + '</span>';
      b.addEventListener('click', function () {
        if (b.classList.contains('ok')) return;
        if (!sel) { msg.className = 'qmsg warn'; msg.textContent = 'Pick a word on the left first.'; return; }
        if (sel.dataset.k === b.dataset.k) {
          b.classList.add('ok'); sel.classList.remove('sel'); sel.classList.add('ok'); sel = null;
          left--;
          if (left === 0) {
            msg.className = 'qmsg good'; msg.textContent = 'Set done. Say each one out loud once — next three coming up.';
            if (window.TEM_AN) TEM_AN.send('match_set_done', 'match');
            setTimeout(renderMatch, 1400);
          } else {
            msg.className = 'qmsg good'; msg.textContent = 'Right. ' + left + ' to go.';
          }
        } else {
          b.classList.add('bad');
          setTimeout(function () { b.classList.remove('bad'); }, 400);
          msg.className = 'qmsg warn'; msg.textContent = 'Not that one. Try the other meaning.';
        }
      });
      mbox.appendChild(b);
    });
  }


  /* host wave clips: play when visible, pause off-screen, respect reduced motion */
  (function () {
    var vids = [].slice.call(document.querySelectorAll('video.hostvid'));
    if (!vids.length) return;
    vids.forEach(function (v) { v.muted = true; v.setAttribute('muted', ''); });
    if (reduce) { vids.forEach(function (v) { v.pause(); }); return; }
    var kick = function (v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); };
    if ('IntersectionObserver' in window) {
      var vio = new IntersectionObserver(function (es) {
        es.forEach(function (e) { e.isIntersecting ? kick(e.target) : e.target.pause(); });
      }, { threshold: 0.15 });
      vids.forEach(function (v) { vio.observe(v); });
    }
    vids.forEach(kick);
    document.addEventListener('visibilitychange', function () {
      vids.forEach(function (v) { document.hidden ? v.pause() : kick(v); });
    });
  })();

  /* ---------- flashcards ---------- */
  var VOCAB = [
    { w:'impulse buy', m:'Buying something suddenly, with no plan.', e:'Those sunglasses at the petrol station were a total impulse buy.' },
    { w:'splurge', m:'To spend a lot of money on something nice you don\'t really need.', e:'We splurged on a really nice hotel for our anniversary.' },
    { w:'treat yourself', m:'To do something nice for yourself as a little reward.', e:'I finished my exams, so I treated myself to a really long nap.' },
    { w:'in the long run', m:'Over a long time — years, not days.', e:'Learning new words feels slow, but in the long run, it really helps.' },
    { w:'save for a rainy day', m:'To keep money for problems later.', e:'My dad always kept some cash in a kitchen drawer — he was saving for a rainy day.' },
    { w:'automatic', m:'Doing something without thinking about it.', e:'Making coffee in the morning is automatic for me. My eyes are still closed.' },
    { w:'routine', m:'The normal order you do things every day.', e:'My morning routine is waking up, stretching, and complaining about the weather.' },
    { w:'progress', m:'Moving forward and getting better.', e:'I made real progress today. I finally understood an English movie without subtitles.' },
    { w:'minimum', m:'The smallest amount possible.', e:'I always do the minimum amount of cleaning before my guests arrive.' },
    { w:'expectation', m:'A strong belief that something will happen.', e:'I have a strong expectation that it will rain right after I wash my car.' },
    { w:'habit', m:'Something you do often and easily.', e:'I have a terrible habit of eating salty snacks at midnight.' },
    { w:'Little by little', m:'Slowly, in small amounts, over time — but with hope.', e:'' },
    { w:'Habit stacking', m:'Attaching a new habit to an old one so your routine does half the work.', e:'' },
    { w:'Never miss twice', m:'One mistake is an accident; two mistakes is a pattern. Get back on track immediately.', e:'' },
    { w:'Confident', m:'Feeling sure of yourself because you have proof — not because the fear went away.', e:'' },
    { w:'Fearless', m:'Having no fear at all. Impossible for most people, and not the goal of this episode.', e:'' },
    { w:'Hesitate', m:'To pause or stop just because you are nervous, even when your foot is already moving forward.', e:'' },
    { w:'Doubt', m:'The little voice inside asking.', e:'' },
    { w:'Courage', m:'Doing the thing even though it is very difficult. Courage needs fear to exist at all.', e:'' },
    { w:'Overcome', m:'Dealing with a scary problem successfully, even if the nervousness is still in your body.', e:'' },
    { w:'Bias', m:'An unfair preference for or against an idea or person.', e:'' },
    { w:'Illusion', m:'A false idea, impression, or belief that seems real.', e:'' },
    { w:'Control', m:'The power to direct, influence, or manage outcomes.', e:'' },
    { w:'Reaction', m:'What you say or do in response to an event or stimulus.', e:'' },
    { w:'Compound', m:'To build upon itself and grow larger over time.', e:'' },
    { w:'Prioritize', m:'To decide what is most important and tackle it first.', e:'' },
    { w:'Priceless', m:'Having a value beyond money.', e:'' },
    { w:'Neglect', m:'To fail to give proper care or attention.', e:'' },
    { w:'Make the most of', m:'To use a situation as well as you can.', e:'' },
    { w:'Waste time', m:'Spending hours on things that offer no value.', e:'' },
    { w:'Deadline', m:'The final agreed-upon time for completing a task.', e:'' },
    /* --- added from the published episode PDFs (full transcriptions, Ep22-29) --- */
    { w:'translate', m:'To change a word from your home language into English.', e:'I asked my smart friend to translate the menu because I really wanted the chicken.' },
    { w:'overwhelmed', m:'Feeling like things are just too much to handle.', e:'When my boss gives me 5 heavy jobs at once, I feel completely overwhelmed.' },
    { w:'unsolicited', m:'Advice you did not ask for.', e:'My aunt gave me unsolicited advice about my shoes today.' },
    { w:'validation', m:'Needing someone else to say you are good, you matter.', e:'I posted a selfie just to get some quick validation from pals.' },
    { w:'stagnation', m:'Feeling stuck in one place, like dirty water that does not flow.', e:'I felt deep stagnation at my desk, so I made a change.' },
    { w:'misfire', m:'When something does not work the way it is supposed to.', e:'My brain misfires when I try to speak too fast.' },
    { w:'overload', m:'When there is just too much of something for a system to handle.', e:'Try to remember too many grammar rules at once and you get total overload.' },
    { w:'hinge', m:'The small metal piece that joins two heavy doors so they can swing.', e:'' },
    { w:'shelf', m:'A flat wooden board where you store books or items on a wall.', e:'My mental shelf is full of English words, but some are just too high to reach right now.' },
    { w:'voice', m:'The loud sound you make when you speak, or the silent sound inside your mind.', e:'My inner voice is getting very good at English now.' },
    { w:'echo', m:'When you copy a sound right after you hear it spoken.', e:'I try to echo the actors in my favourite shows to learn their fast rhythm.' }
  ];
  renderMatch();                            /* deck now exists */

  var KNOW = 'tem-known';
  var known = {};
  try { known = JSON.parse(localStorage.getItem(KNOW) || '{}'); } catch (e) { known = {}; }
  var flash = document.getElementById('flash'), fw = document.getElementById('fw'),
      fm = document.getElementById('fm'), fe = document.getElementById('fe'),
      knowCount = document.getElementById('knowcount');
  /* unseen words first, so a returning player is not shown the same card twice */
  var deck = (function () {
    var seen = lane('words').seen;
    var fresh = VOCAB.filter(function (v) { return seen.indexOf(v.w) < 0; });
    var old = VOCAB.filter(function (v) { return seen.indexOf(v.w) >= 0; });
    return shuffle(fresh).concat(shuffle(old));
  })(), di = 0;
  function nextCard() {
    var n = deck.length, seen = 0, v = null;
    while (seen++ < n) {
      di = (di + 1) % n;
      if (!known[deck[di].w]) { v = deck[di]; break; }
    }
    if (!v) { di = (di + 1) % n; v = deck[di]; }     /* everything known: just keep cycling */
    fw.textContent = v.w; fm.textContent = v.m; fe.textContent = v.e;
    flash.classList.remove('open');
    flash.setAttribute('data-w', v.w);
  }
  function paintKnown() {
    var n = Object.keys(known).filter(function (k) { return known[k]; }).length;
    knowCount.textContent = n + ' of ' + VOCAB.length + ' known';
  }
  flash.addEventListener('click', function () { flash.classList.toggle('open'); });
  flash.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flash.classList.toggle('open'); }
  });
  document.getElementById('known').addEventListener('click', function () {
    known[flash.getAttribute('data-w')] = true;
    if (window.TEM_AN) TEM_AN.send('card_known', 'cards');
    try { localStorage.setItem(KNOW, JSON.stringify(known)); } catch (err) {}
    paintKnown(); nextCard();
  });
  document.getElementById('notyet').addEventListener('click', function () { nextCard(); });
  fw.textContent = deck[0].w; fm.textContent = deck[0].m; fe.textContent = deck[0].e;
  flash.setAttribute('data-w', deck[0].w); paintKnown();


  /* ---------- games menu ---------- */
  (function () {
    var tabs = [].slice.call(document.querySelectorAll('.tab'));
    var panes = [].slice.call(document.querySelectorAll('.pane'));
    function show(name) {
      tabs.forEach(function (t) {
        var on = t.getAttribute('data-pane') === name;
        t.classList.toggle('is-on', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      panes.forEach(function (p) { p.classList.toggle('is-on', p.id === 'pane-' + name); });
      try { history.replaceState(null, '', '#' + (name === 'match' ? 'practice' : name)); } catch (e) {}
      if (window.TEM_AN) TEM_AN.send('game_open', name);
    }
    tabs.forEach(function (t) {
      t.addEventListener('click', function () { show(t.getAttribute('data-pane')); });
    });
    var h = (location.hash || '').replace('#', '');
    if (h === 'listen' || h === 'order' || h === 'cards') show(h);

    /* Start over: wipe the ledger so the next play begins at word one again */
    var rst = document.getElementById('playreset');
    if (rst) rst.addEventListener('click', function () {
      ledger = {}; saveLedger();
      matchSet = 0; curLine = ''; picked = [];
      renderMatch(); newListen(); renderOrder();
      rst.blur();
    });
  })();

  /* ---------- listen and pick ---------- */
  var lTarget = null, lBag = [], lChoices = document.getElementById('lchoices'),
      lMsg = document.getElementById('lmsg'), canSpeak = 'speechSynthesis' in window;
  var voices = [];
  function loadVoices() {
    if (!canSpeak) return;
    var all = speechSynthesis.getVoices() || [];
    voices = all.filter(function (v) { return /^en/i.test(v.lang); });
  }
  if (canSpeak) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
  function speak(text) {
    if (!canSpeak) {
      lMsg.className = 'qmsg warn';
      lMsg.textContent = 'This browser cannot play sound — the word is on screen, so say it and pick by reading.';
      return;
    }
    try { speechSynthesis.cancel(); speechSynthesis.resume(); } catch (e) {}
    var u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-GB';
    var pick = voices.filter(function (v) { return /en-GB/.test(v.lang); })[0] || voices[0];
    if (pick) { u.voice = pick; u.lang = pick.lang; }
    u.rate = document.getElementById('slow').checked ? 0.6 : 0.95;
    u.onerror = function () {
      lMsg.className = 'qmsg warn';
      lMsg.textContent = 'The voice did not play — the word is above, so read it aloud and pick.';
    };
    speechSynthesis.speak(u);
  }
  function newListen() {
    lTarget = dealWords(1)[0];
    if (!lTarget) return;
    var others = VOCAB.filter(function (v) { return v.w !== lTarget.w; });
    others = others.sort(function () { return Math.random() - 0.5; }).slice(0, 2);
    var opts = [lTarget].concat(others).sort(function () { return Math.random() - 0.5; });
    lChoices.innerHTML = '';
    opts.forEach(function (v) {
      var b = document.createElement('button');
      b.className = 'lchoice'; b.type = 'button'; b.textContent = v.m;
      b.addEventListener('click', function () {
        if (b.classList.contains('ok')) return;
        if (v.w === lTarget.w) {
          b.classList.add('ok');
          lMsg.className = 'qmsg good'; lMsg.textContent = 'Yes — that is “' + lTarget.w + '”.';
          speak(lTarget.w);
          setTimeout(newListen, 2200);
        } else {
          b.classList.add('bad');
          lMsg.className = 'qmsg warn'; lMsg.textContent = 'Not that one. Play it again.';
        }
      });
      lChoices.appendChild(b);
    });
    lMsg.className = 'qmsg'; lMsg.textContent = 'Say it out loud, then pick the meaning.';
    lWord.textContent = lTarget.w;
  }
  var lWord = document.getElementById('lword');
  document.getElementById('speak').addEventListener('click', function () { speak(lTarget ? lTarget.w : VOCAB[0].w); });
  newListen();

  /* ---------- sentence order ---------- */
  var LINES = [
    'Those sunglasses at the petrol station were a total impulse buy',
    'We splurged on a really nice hotel for our anniversary',
    'I finished my exams, so I treated myself to a really long nap',
    'Learning new words feels slow, but in the long run, it really helps',
    'My dad always kept some cash in a kitchen drawer — he was saving for a rainy day',
    'Making coffee in the morning is automatic for me. My eyes are still closed',
    'My morning routine is waking up, stretching, and complaining about the weather',
    'I made real progress today. I finally understood an English movie without subtitles',
    'I always do the minimum amount of cleaning before my guests arrive',
    'I have a strong expectation that it will rain right after I wash my car',
    'I have a terrible habit of eating salty snacks at midnight',
    'Making coffee in the morning is automatic for me',
    'My morning routine is waking up and stretching',
    'I made real progress today',
    'I always do the minimum amount of cleaning',
    'I have a terrible habit of eating salty snacks'
  ];
  var orderBag = [], curLine = '', picked = [], bank = document.getElementById('bank'),
      lineEl = document.getElementById('line'), oMsg = document.getElementById('omsg');
  function nextLine() {
    /* same ledger idea as the words: every sentence once, then a fresh round,
       and never the same sentence twice in a row across the seam */
    var L = lane('order');
    var pool = LINES.filter(function (l) { return L.seen.indexOf(l) < 0 && l !== L.last; });
    if (!pool.length) {
      L.seen = []; L.round++;
      pool = LINES.filter(function (l) { return l !== L.last; });
    }
    curLine = pool[Math.floor(Math.random() * pool.length)] || LINES[0];
    if (L.seen.indexOf(curLine) < 0) L.seen.push(curLine);
    L.last = curLine;
    saveLedger();
    return curLine;
  }
  function renderOrder() {
    if (!curLine) nextLine();
    lineEl.innerHTML = ''; bank.innerHTML = '';
    picked.forEach(function (w, i) {
      var b = document.createElement('button');
      b.className = 'wchip'; b.type = 'button'; b.textContent = w.split('#')[0];
      b.addEventListener('click', function () { picked.splice(i, 1); renderOrder(); });
      lineEl.appendChild(b);
    });
    var pool = curLine.split(' ').map(function (w, i) { return w + '#' + i; });
    for (var k = pool.length - 1; k > 0; k--) { var j = Math.floor(Math.random() * (k + 1)); var t = pool[k]; pool[k] = pool[j]; pool[j] = t; }
    pool.forEach(function (key) {
      if (picked.indexOf(key) !== -1) return;
      var b = document.createElement('button');
      b.className = 'wchip'; b.type = 'button'; b.textContent = key.split('#')[0];
      b.addEventListener('click', function () { picked.push(key); renderOrder(); });
      bank.appendChild(b);
    });
  }
  function plain(a) { return a.map(function (x) { return x.split('#')[0]; }).join(' '); }
  document.getElementById('check').addEventListener('click', function () {
    if (!picked.length) { oMsg.className = 'qmsg warn'; oMsg.textContent = 'Tap some words first.'; return; }
    if (plain(picked) === curLine) { oMsg.className = 'qmsg good'; oMsg.textContent = 'That is the line.'; }
    else { oMsg.className = 'qmsg warn'; oMsg.textContent = 'Have another go — tap a word in your line to send it back.'; }
  });
  document.getElementById('nextline').addEventListener('click', function () {
    nextLine(); picked = []; oMsg.textContent = ''; renderOrder();
  });
  renderOrder();

  /* your turn: word count + copy (the section may not be on the page) */
  var ans = document.getElementById('ans'), wc = document.getElementById('wc');
  var toast = document.getElementById('toast');
  if (!ans || !wc || !document.getElementById('copy')) { return; }
  function countWords(s) { var t = s.trim(); return t ? t.split(/\s+/).length : 0; }
  ans.addEventListener('input', function () { wc.textContent = countWords(ans.value) + ' words'; });
  document.getElementById('copy').addEventListener('click', function () {
    var v = ans.value.trim();
    if (!v) { toast.textContent = 'Write your line first.'; toast.className = 'show'; setTimeout(function () { toast.className = ''; }, 1800); return; }
    var done2 = function () { toast.textContent = 'Copied — paste it on the video.'; toast.className = 'show'; setTimeout(function () { toast.className = ''; }, 2200); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(v).then(done2, function () { ans.select(); document.execCommand('copy'); done2(); });
    } else { ans.select(); document.execCommand('copy'); done2(); }
  });
})();
