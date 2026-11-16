import json, re

import os
HERE = os.path.dirname(os.path.abspath(__file__))
RED = os.path.dirname(HERE) + '/'
eps = json.load(open(RED + 'episodes.json'))
p_inner = open(HERE + '/p_inner.html').read()
t_inner = open(HERE + '/t_inner.html').read()
gamecss = open(RED + '_game.css').read()
gamejs = open(RED + '_game_full.js').read()


# ---------- flat vector panels, drawn in the show's own hand (no photographs) ----------
SVG_WAYS = """<svg viewBox="0 0 460 560" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Three flat cards: an episode to listen to, a game to play and a written guide">
  <rect width="460" height="560" fill="#f3e7d8"/>
  <circle cx="392" cy="74" r="96" fill="#e75d4e" opacity=".16"/>
  <g>
    <rect x="40" y="86" width="380" height="128" rx="18" fill="#241812"/>
    <circle cx="104" cy="150" r="30" fill="#e75d4e"/>
    <path d="M96 136l24 14-24 14z" fill="#fff6e9"/>
    <rect x="152" y="128" width="196" height="13" rx="6.5" fill="#fff6e9"/>
    <rect x="152" y="152" width="136" height="10" rx="5" fill="#fff6e9" opacity=".55"/>
    <rect x="152" y="172" width="112" height="10" rx="5" fill="#fff6e9" opacity=".35"/>
  </g>
  <g>
    <rect x="40" y="238" width="380" height="128" rx="18" fill="#fff6e9"/>
    <rect x="74" y="274" width="56" height="56" rx="14" fill="#e75d4e"/>
    <rect x="92" y="292" width="20" height="20" rx="6" fill="#fff6e9"/>
    <rect x="152" y="280" width="176" height="13" rx="6.5" fill="#241812"/>
    <rect x="152" y="304" width="120" height="10" rx="5" fill="#241812" opacity=".45"/>
  </g>
  <g>
    <rect x="40" y="390" width="380" height="128" rx="18" fill="#fff6e9"/>
    <path d="M78 418h52a8 8 0 0 1 8 8v56a8 8 0 0 1-8 8H78a8 8 0 0 1-8-8v-56a8 8 0 0 1 8-8z" fill="none" stroke="#241812" stroke-width="4"/>
    <path d="M88 436h24M88 452h24M88 468h14" stroke="#e75d4e" stroke-width="4" stroke-linecap="round"/>
    <rect x="152" y="432" width="196" height="13" rx="6.5" fill="#241812"/>
    <rect x="152" y="456" width="148" height="10" rx="5" fill="#241812" opacity=".45"/>
  </g>
</svg>"""

SVG_STEPS = """<svg viewBox="0 0 460 560" preserveAspectRatio="xMidYMid slice" role="img" aria-label="One loop of four steps: put your earphones on, listen, read the guide, say one line">
  <rect width="460" height="560" fill="#241812"/>
  <circle cx="70" cy="500" r="110" fill="#e75d4e" opacity=".18"/>
  <g fill="none" stroke="#e75d4e" stroke-width="4" stroke-linecap="round" stroke-dasharray="2 14">
    <circle cx="230" cy="280" r="150" stroke-opacity=".5"/>
  </g>
  <g font-family="Georgia, serif" font-size="26" fill="#fff6e9" text-anchor="middle">
    <circle cx="230" cy="130" r="30" fill="#e75d4e"/><text x="230" y="140" fill="#241812">1</text>
    <circle cx="380" cy="280" r="30" fill="#e75d4e"/><text x="380" y="290" fill="#241812">2</text>
    <circle cx="230" cy="430" r="30" fill="#e75d4e"/><text x="230" y="440" fill="#241812">3</text>
    <circle cx="80" cy="280" r="30" fill="#e75d4e"/><text x="80" y="290" fill="#241812">4</text>
  </g>
  <g stroke="#fff6e9" stroke-width="4" stroke-linecap="round" fill="none" opacity=".9">
    <path d="M212 118c-6 0-12-3-16-8"/><path d="M186 96c-4-8-10-14-18-18"/>
    <path d="M40 300h-24M28 288v24" stroke="#e75d4e"/>
  </g>
  <circle cx="230" cy="280" r="62" fill="#241812" stroke="#fff6e9" stroke-width="4"/>
  <path d="M206 262a20 20 0 0 1 34 10v14a10 10 0 0 1-20 0" fill="none" stroke="#fff6e9" stroke-width="5" stroke-linecap="round"/>
  <rect x="222" y="296" width="16" height="18" rx="8" fill="#e75d4e"/>
</svg>"""

SVG_GUIDE = """<svg viewBox="0 0 560 380" preserveAspectRatio="xMidYMid slice" role="img" aria-label="A flat page of the study guide with its word list">
  <rect width="560" height="380" fill="#241812"/>
  <circle cx="470" cy="60" r="90" fill="#e75d4e" opacity=".2"/>
  <rect x="120" y="54" width="320" height="300" rx="16" fill="#fff6e9"/>
  <rect x="150" y="90" width="180" height="16" rx="8" fill="#241812"/>
  <rect x="150" y="120" width="260" height="10" rx="5" fill="#241812" opacity=".35"/>
  <rect x="150" y="140" width="228" height="10" rx="5" fill="#241812" opacity=".35"/>
  <rect x="150" y="160" width="248" height="10" rx="5" fill="#241812" opacity=".35"/>
  <rect x="150" y="192" width="120" height="12" rx="6" fill="#e75d4e"/>
  <rect x="150" y="216" width="240" height="10" rx="5" fill="#241812" opacity=".25"/>
  <rect x="150" y="236" width="200" height="10" rx="5" fill="#241812" opacity=".25"/>
  <rect x="150" y="256" width="220" height="10" rx="5" fill="#241812" opacity=".25"/>
  <rect x="150" y="290" width="86" height="30" rx="15" fill="#e75d4e"/>
  <rect x="248" y="290" width="86" height="30" rx="15" fill="none" stroke="#241812" stroke-width="3"/>
</svg>"""

# ---------- episodes ----------
featured = eps[:6]
cards = []
for e in featured:
    num = e['n'].replace('Episode ', 'Episode ')
    cards.append(
        '        <article class="card card--open span-4">\n'
        '          <p class="t-label">' + num + '</p>\n'
        '          <h3><a href="' + e['url'] + '">' + e['title'] + '</a></h3>\n'
        '          <p class="t-small muted">' + e['desc'] + ' &middot; free on YouTube</p>\n'
        '        </article>'
    )
EPISODES = '\n'.join(cards)
EPISODES_ROW1 = '\n'.join(cards[:3])
EPISODES_ROW2 = '\n'.join(cards[3:])

HEAD = '''<!doctype html>
<html lang="en" data-type="service" data-radius="soft" data-buttons="solid" data-motion>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Two English Mugs: real English listening for B1 learners</title>
<meta name="description" content="Twenty-six episodes of real English talk for B1 learners, twenty minutes each, free on YouTube. Emma explains every hard word; Josh learns along with you.">
<meta name="site-kind" content="other">
<meta name="page-type" content="service">
<meta property="og:type" content="website">
<meta property="og:title" content="Two English Mugs: real English listening for B1 learners">
<meta property="og:description" content="Twenty-six episodes, twenty minutes each, free on YouTube. Every hard word explained as it lands.">
<meta property="og:image" content="https://twoenglishmugs.com/assets/og.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="img/mark.png" type="image/png">
<meta name="theme-color" content="#fff6e9">
<link rel="canonical" href="https://twoenglishmugs.com/">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,400..700,0..100,0..1&family=Figtree:wght@400..600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/system.css">
<link rel="stylesheet" href="assets/ui/cards.css">
<link rel="stylesheet" href="assets/motion/motion.css">
<link rel="stylesheet" href="assets/backgrounds/backgrounds.css">
<link rel="stylesheet" href="assets/layout/layout.css">
<link rel="stylesheet" href="assets/icons/icon.css">
<style>
:root {
  --p-bg: #fff6e9; --p-surface: #f3e7d8; --p-ink: #241812; --p-muted: #6f635a;
  --p-accent: #e75d4e; --p-accent-ink: #111111; --p-action: #241812; --p-action-ink: #fff6e9;
  --p-inv-bg: #241812; --p-inv-surface: #31251e; --p-inv-ink: #fff6e9; --p-inv-muted: #a4998f;
  --p-inv-accent: #e75d4e; --p-inv-accent-ink: #111111; --p-inv-action: #fff6e9; --p-inv-action-ink: #241812;
  --font-display: "Fraunces", Georgia, serif;
  --font-text: "Figtree", system-ui, sans-serif;
  --display-weight: 400;
  --display-tracking: -0.02em;
  --display-tracking-xl: -0.028em;
  --display-axes: 'SOFT' 30, 'WONK' 0;
}
/* the client's own artwork: the two hosts, dealt as one picture on the right of the hero */
.nav__logo img { width: 30px; height: 30px; display: block; }
.hero__media .duo { position: relative; display: flex; align-items: flex-end; justify-content: center;
  height: 100%; min-height: 300px; }
.hero__media .duo img { width: 50%; height: auto; max-height: 92%; object-fit: contain; display: block; }
@media (max-width: 1023px) { .hero__media .duo { min-height: 260px; margin-top: var(--s-6); } }
/* the practice game and the writing prompt, carried over: the same classes on the light palette */
/* the game's little inline icons were sized by the old page's CSS; give them their own box */
#practice .ptag svg { width: 20px; height: 20px; flex: 0 0 auto; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
/* the emoji in the game HUD do not render on this Mac: the words carry the meaning */
#practice .chip2 .flame, #practice #gGoalWrap > span:first-child, #practice #gSnd { display: none; }
#practice .snd { background: var(--card); color: var(--cream); border: 1px solid var(--line); }
#practice .tab { color: var(--cream); }
#practice .tab > span { color: inherit; }
#practice .turnblock { padding-top: var(--s-6); }
#practice #wc, #practice .turn .hint { color: var(--p-inv-muted); }
#practice .again { background: var(--card); color: var(--cream); border: 1px solid var(--line); border-radius: 999px; padding: 8px 14px; }
#practice .quiz .sub, #practice .pane .sub { color: #d9cec7; }
#practice .turn { padding: 0; background: none; border-radius: 0; }
#practice .turn h2, #practice .turn p, #practice .turn .hint { color: var(--p-inv-ink); }
#practice .turn textarea { background: var(--card); color: var(--cream); border-color: var(--line); }
#practice .turn .btn-main { background: var(--p-inv-action); color: var(--p-inv-action-ink); }
/* keyboard focus: one coral ring over everything, 3:1 or better on every ground */
:focus-visible { outline: 3px solid var(--p-accent); outline-offset: 3px; }
#practice .tab svg, #practice .snd svg, #practice .again svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
#practice .done svg, #practice .qitem svg { fill: none; stroke: currentColor; }
/* the game is an app and keeps its own dark palette: one dark band on a light page */
#practice {
  background: var(--p-inv-bg); color: var(--p-inv-ink);
  --night: #141111; --night-2: #1b1616; --card: #211b1b; --card-2: #271f1f;
  --coral: #e75d4e; --coral-soft: #f0806f; --cream: #fff6e9; --dim: #bdb2a9;
  --line: rgba(255,246,233,.13);
  --display: var(--font-display); --text: var(--font-text);
}
#practice h2, #practice .sub, #practice .playmeta { color: var(--p-inv-ink); }
#practice .sub { color: var(--p-inv-muted); }
/* the writing prompt, on the coral band */
#turn {
  --night: #fff6e9; --night-2: #f3e7d8; --card: #f7ecdd; --card-2: #f0e1cd;
  --coral: #e75d4e; --coral-soft: #c9432f; --cream: #241812; --dim: #6f635a;
  --line: rgba(36,24,18,.16);
  --display: var(--font-display); --text: var(--font-text);
}
/* the rows: the name with its line under it, the value on the right */
.rows .rows__name small { display: block; font-weight: 400; color: var(--p-muted); font-size: var(--t-small); margin-top: 2px; }
.rows__value { white-space: nowrap; }
/* the page carries no photographs: flat vector panels in the show's own hand */
.vecpanel { background: var(--p-surface); border-radius: var(--r-lg); overflow: hidden;
  height: min(560px, var(--ly-fit)); display: flex; align-items: center; justify-content: center; }
.vecpanel svg { width: 100%; height: 100%; display: block; }
@media (max-width: 1023px) { .vecpanel { height: auto; aspect-ratio: 4 / 5; margin-top: var(--s-6); } }
.hosts { display: grid; grid-template-columns: 1fr 1fr; gap: var(--s-6); }
.hosts figure { margin: 0; }
.hosts img { width: 100%; height: auto; display: block; }
.hosts figcaption { margin-top: var(--s-4); }
@media (max-width: 639px) { .hosts { grid-template-columns: 1fr; } }
</style>
<script>document.documentElement.classList.add('m-enter');setTimeout(()=>document.documentElement.classList.add('m-enter-done'),700)</script>
</head>
'''

BODY = '''<body>

<header class="nav nav--centre">
  <div class="wrap nav__bar">
    <a class="skip-link" href="#top">Skip to content</a>
    <a class="nav__logo" href="#top"><img src="img/mark.png" alt="" width="30" height="30">Two English Mugs</a>
    <nav class="nav__links" aria-label="Main">
      <div class="nav__item"><a class="nav__link" href="#episodes">Episodes</a></div>
      <div class="nav__item"><a class="nav__link" href="#practice">Practice</a></div>
      <div class="nav__item"><a class="nav__link" href="#hosts">Hosts</a></div>
    </nav>
    <div class="nav__actions">
      <a class="btn btn--primary" href="https://www.youtube.com/@TwoEnglishMugs">Listen free</a>
    </div>
    <button class="nav__toggle" type="button" aria-expanded="false" aria-label="Menu">
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M2 5h14M2 13h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
    </button>
  </div>
</header>

<main id="top">

  <section class="hero hero--split" data-enter aria-labelledby="hero-h">
    <div class="wrap"><div class="hero-text grid hero__grid">
      <div class="hero__text span-5">
        <p class="hero__kicker"><span class="dot" aria-hidden="true"></span>26 episodes &middot; B1 &middot; twenty minutes</p>
        <h1 id="hero-h">Real English for B1 learners</h1>
        <p class="hero__lead">Twenty minutes, one story, two hosts. Josh is still learning, and Emma explains each hard word as it lands.</p>
        <div class="btn-row">
          <a class="btn btn--primary" href="https://www.youtube.com/@TwoEnglishMugs">Listen free</a>
          <a class="btn btn--secondary" href="#practice">Try the practice</a>
        </div>
      </div>
      <div class="hero__media span-6 start-7">
        <div class="duo">
          <img src="img/wave-emma.svg" alt="Emma, the host, waving hello" fetchpriority="high">
          <img src="img/wave-josh.svg" alt="Josh, the learner, waving hello" fetchpriority="high">
        </div>
        <div class="ly-float">
          <div class="ly-float__row"><span class="ly-live">Newest</span><span>21 min</span></div>
          <div class="ly-float__title">Episode 40: Negative Self-Talk</div>
        </div>
      </div>
    </div></div>
  </section>

  <section class="section" id="inside" aria-labelledby="inside-h">
    <div class="wrap grid grid--middle">
      <div class="span-6">
        <div class="section-head">
          <h2 id="inside-h">One episode, three ways in. <span class="muted">Twenty minutes of listening, then the words.</span></h2>
        </div>
        <ul class="rows">
          <li><span class="rows__name">Listen to the story<small>A whole episode, spoken at the speed people really speak.</small></span><span class="rows__value">20 min</span></li>
          <li><span class="rows__name">Play with the words<small>Four games on the vocabulary each episode uses.</small></span><span class="rows__value">4 games</span></li>
          <li><span class="rows__name">Read it in writing<small>The free study guide holds the full transcript and the word list.</small></span><span class="rows__value">Free PDF</span></li>
        </ul>
        <p style="margin-top:var(--s-6)"><a class="link" href="https://www.youtube.com/@TwoEnglishMugs">See every episode on YouTube</a></p>
      </div>
      <div class="span-6 start-7">
        <div class="vecpanel">''' + SVG_WAYS + '''</div>
      </div>
    </div>
  </section>

  <section class="section" id="episodes" aria-labelledby="episodes-h">
    <div class="wrap">
      <div class="group">
        <div class="section-head">
          <h2 id="episodes-h">Start with one of these episodes. <span class="muted">Six to start with.</span></h2>
        </div>
        <div class="grid">
''' + EPISODES_ROW1 + '''
        </div>
      </div>
      <div class="grid">
''' + EPISODES_ROW2 + '''
      </div>
      <p style="margin-top:var(--s-6)"><a class="link" href="https://www.youtube.com/@TwoEnglishMugs">All 26 episodes, on YouTube</a></p>
    </div>
  </section>

  <section class="section g2" id="practice" aria-labelledby="practice-h">
    <div class="wrap">
      <div class="group">
''' + p_inner + '''
      </div>
      <div class="turnblock" id="turn">
''' + t_inner + '''
      </div>
    </div>
  </section>

  <section class="section" id="steps" aria-labelledby="steps-h">
    <div class="wrap grid grid--middle">
      <div class="span-6">
        <div class="section-head">
          <h2 id="steps-h">Four steps, one episode. <span class="muted">No app, no account, no schedule.</span></h2>
        </div>
        <ul class="rows">
          <li><span class="rows__name">Put your earphones on<small>Cook, walk, fold the washing. Twenty minutes fits inside a normal evening.</small></span><span class="rows__value">Step 1</span></li>
          <li><span class="rows__name">Listen once without stopping<small>You will miss words. That is the point: keep going and the shape comes through.</small></span><span class="rows__value">Step 2</span></li>
          <li><span class="rows__name">Read the guide afterwards<small>The transcript shows the words you heard but could not catch.</small></span><span class="rows__value">Step 3</span></li>
          <li><span class="rows__name">Say one line out loud<small>One sentence from the show, in your own voice. That is the whole trick.</small></span><span class="rows__value">Step 4</span></li>
        </ul>
      </div>
      <div class="span-6 start-7">
        <div class="vecpanel">''' + SVG_STEPS + '''</div>
      </div>
    </div>
  </section>

  <section class="section" id="hosts" aria-labelledby="hosts-h">
    <div class="wrap">
      <div class="section-head">
        <h2 id="hosts-h">Emma teaches, Josh learns. <span class="muted">You sit beside Josh, and that is on purpose.</span></h2>
      </div>
      <ul class="rows" style="max-width:72ch">
        <li><span class="rows__name">Emma, the host<small>She explains every hard word as it lands and never makes you feel late.</small></span><span class="rows__value">Host</span></li>
        <li><span class="rows__name">Josh, the learner<small>He tries each line out loud, gets it wrong first, then gets it. That is the point.</small></span><span class="rows__value">Learner's seat</span></li>
      </ul>
      <div class="grid" style="margin-top:var(--s-6)">
        <div class="span-5"><img src="img/wave-emma.svg" alt="Emma, the host, waving hello" style="width:100%;height:auto;display:block"></div>
        <div class="span-5 start-8"><img src="img/wave-josh.svg" alt="Josh, the learner, waving hello" style="width:100%;height:auto;display:block"></div>
      </div>
    </div>
  </section>

  <section class="section" id="guide" aria-labelledby="guide-h">
    <div class="wrap grid grid--middle">
      <div class="span-6">
        <div class="section-head">
          <h2 id="guide-h">The words, in writing. <span class="muted">A free study guide for every episode.</span></h2>
          <p>Each guide holds the full transcript, the word list and one writing prompt. Send your email and the PDF arrives; nothing is sold to anyone.</p>
        </div>
        <div class="btn-row">
          <a class="btn btn--primary" href="https://dl.twoenglishmugs.com/">Get the study guide</a>
        </div>
        <div class="vecpanel" style="height:220px;margin-top:var(--s-7)">''' + SVG_GUIDE + '''</div>
      </div>
      <div class="span-6 start-7">
        <div class="faq">
          <div class="faq__item"><h3>Do I need to be exactly B1?</h3><p>No. If you can follow a slow conversation and lose a few words, you are in the right place. Emma explains the hard words as they come.</p></div>
          <div class="faq__item"><h3>How long is an episode?</h3><p>Between nineteen and thirty-one minutes. Most sit around twenty-two.</p></div>
          <div class="faq__item"><h3>Is it really free?</h3><p>Yes. Every episode is free on YouTube, and the study guide is free with an email.</p></div>
          <div class="faq__item"><h3>Where do I start?</h3><p>Anywhere. Episode 40 is the newest, and the nine listed above are the ones people open first.</p></div>
        </div>
      </div>
    </div>
  </section>

</main>

<footer class="footer closing" id="contact" aria-labelledby="close-h">
  <div class="wrap">
    <div class="closing__cta close--type">
      <div class="section-head">
        <h2 id="close-h">Listen free on YouTube</h2>
        <p>Twenty-six episodes, twenty minutes each, no app and no sign-up.</p>
      </div>
      <a class="btn btn--primary btn--xl btn--wide" href="https://www.youtube.com/@TwoEnglishMugs">Listen free<svg class="m-arrow" viewBox="0 0 12 12" aria-hidden="true"><path class="m-arrow__stem" d="M1 6h8"/><path class="m-arrow__head" d="M4.5 2.5 8 6l-3.5 3.5"/></svg></a>
    </div>
    <div class="closing__links">
      <div class="grid">
        <div class="span-6 stack-4">
          <a class="nav__logo" href="#top"><img src="img/mark.png" alt="" width="30" height="30">Two English Mugs</a>
          <p class="footer__lede">A listening podcast for people learning English. Two hosts, one story, twenty minutes.</p>
        </div>
        <div class="span-3 footer__col"><h4>The show</h4><ul><li><a href="#episodes">Episodes</a></li><li><a href="#hosts">Hosts</a></li><li><a href="#steps">How it works</a></li></ul></div>
        <div class="span-3 footer__col"><h4>Practice</h4><ul><li><a href="#practice">Games</a></li><li><a href="#guide">Study guide</a></li><li><a href="https://www.youtube.com/@TwoEnglishMugs">YouTube</a></li></ul></div>
      </div>
      <div class="footer__legal">
        <span>&copy; 2026 Two English Mugs &nbsp; <a href="privacy.html">Privacy</a> &nbsp; <a href="terms.html">Terms</a></span>

      </div>
    </div>
  </div>
</footer>

<script type="module" src="assets/system.js"></script>
<script type="module" src="assets/motion/motion.js"></script>
<script type="module" src="assets/layout/layout.js"></script>
<script>
''' + gamejs + '''
</script>
</body>
</html>
'''

STYLE = '<style>\n' + gamecss + '\n</style>\n'
html = HEAD + STYLE + BODY
open(RED + 'index.html', 'w').write(html)
print("wrote", len(html), "chars")
