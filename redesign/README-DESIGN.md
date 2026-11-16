# Redesign (tasteskill 2.5.1)

Built with the `design-taste-frontend` skill (Leonxlnx/taste-skill 2.5.1) on branch
`taste-redesign`. The live `index.html` is untouched.

## Direction

- Kind: service, site-kind other. Light ground, flat vector artwork, type.
- **No photographs.** The page carries the show's own artwork only: the two host SVGs, the mark,
  and three code-drawn flat vector panels (three ways in, the four-step loop, the guide page).
  Café and coffee imagery was removed on 2026-11-16: it read as a coffee-shop site.
- Palette: the brand's own (cream #fff6e9, ink #241812, coral #e75d4e) via `start.mjs brand`.
- Type dealt by the skill: Fraunces (display) / Figtree (text).
- Hero dealt: split, picture right (628x716 at 1440).
- Sections: hero, what you get, episodes, practice + your turn (2 screens), four steps, hosts,
  study guide + FAQ, closing. Every section is exactly one screen at 1440 except practice (2).
- The practice game and the writing prompt are carried over from the live page, unchanged in
  behaviour, with their own dark palette as an app band.

## Assets

Pruned from the skill's 37 MB tree to **504 KB**, 12 requests, all 200:

```
assets/system.css  assets/system.js
assets/ui/cards.css  assets/ui/ui.js      (system.js imports ui.js)
assets/motion/motion.css  assets/motion/motion.js
assets/layout/layout.css  assets/layout/layout.js
assets/backgrounds/backgrounds.css
assets/icons/icon.css
img/  (mark, wordmark, wave-emma.svg, wave-josh.svg)
```

Everything else in the kit (photos, scenes, objects, moments, effects, components, diagrams,
hero demos, icon demos) is not needed and was deleted. If a future section wants a kit fragment,
copy that fragment's folder back from the skill.

## Known gaps

- On a 390px phone the sections run 1.0 to 1.35 screens each (total 10.16). Fitting every one to
  exactly 1 screen would mean cutting content; left as is deliberately.
- Gate: 42 -> 40 -> 26 FAIL over the three rounds it allows. What is left is mostly house style
  (no kit `.moments`, the game UI is not a kit fragment, section visuals) rather than defects.

## Regenerate

```bash
python3 redesign/build/gen.py     # rewrites redesign/index.html from build/gen.py
```

`build/` holds the generator and the two ported blocks (`p_inner.html`, `t_inner.html`).
