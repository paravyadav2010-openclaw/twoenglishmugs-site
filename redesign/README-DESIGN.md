# Redesign (tasteskill 2.5.1)

Built with the `design-taste-frontend` skill (Leonxlnx/taste-skill 2.5.1) on branch
`taste-redesign`. The live `index.html` is untouched.

- Kind: service, site-kind other. Light ground, real photographs, type, the show's own artwork.
- Palette: the brand's own (cream #fff6e9, ink #241812, coral #e75d4e) via `start.mjs brand`.
- Type dealt by the skill: Fraunces (display) / Figtree (text).
- Hero dealt: split, picture right (628x716 at 1440).
- Photographs: three library frames, CC0 / CC BY 2.0, credited in the footer.
- Sections: hero, what you get, episodes, practice + your turn, four steps, hosts, study guide + FAQ, closing.
- The practice game and the writing prompt are carried over from the live page, unchanged in behaviour,
  with their own dark palette as an app band.

Gate: 42 -> 40 -> 26 FAIL over the three rounds (rounds are capped at 3). What is left is listed in
`g3.txt`; most of it is house style (no kit `.moments`, no `data-enter` moment section, app UI that is
not a kit fragment) rather than defects.

Regenerate the page with the generator this file's session used, or edit `index.html` directly.
