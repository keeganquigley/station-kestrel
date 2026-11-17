# Station Kestrel

**[Play it in your browser](https://keeganquigley.github.io/station-kestrel/).** Nothing to install.

A point-and-click mystery for the browser, in the manner of the mid-90s slideshow
adventures: fixed standing places you can look around from, nobody about, and machines that
have to be understood before they will work.

**Holland Island, 14 November 1996.** A listening post that closed on paper five
years ago has gone on drawing fuel, and has now missed three check-ins. You are
sent alone to find out why.

Three chapters, about 15 to 20 minutes each:

1. **The station.** The island, the plant shed and the listening post on top of
   it. Three interlocking puzzles and a vault.
2. **The Subterranean Station.** What is under the vault: a long tunnel, the
   crew's kitchen, break room and bunks, three more puzzles, and the door at the
   end of the works.
3. **Berth K7.** What is beyond the door: a sea cave fitted out as a submarine
   pen, one very old boat alongside, a dock office, a diving store and a
   darkroom. Three last puzzles, and the paperwork for a sailing.

The chapters run on from one another without a break. The title screen can
also start at chapter two or three, with the earlier ones counted as solved.

## Play

In the browser, nothing to install: <https://keeganquigley.github.io/station-kestrel/>

Or run it yourself:

```bash
npm install
```

```bash
npm run dev
```

Then open the address Vite prints. To make a static copy for any web host
(GitHub Pages included):

```bash
npm run build
```

The result is in `dist/` and runs from any folder.

**Controls.** There are two ways to look, and right-click or Space switches
between them.

- **Free look** (the default on a computer). The pointer is hidden and the mouse
  turns your head. A marker in the middle of the picture shows what a click
  would do: walk that way, or use the thing it is on. Esc brings the pointer
  back, as it does in any browser, until you switch again or reload.
- **Pointer.** Drag the picture to look around. Click in the direction you want
  to walk, and click things to use them. The left and right edges of the
  picture turn you a quarter turn.

The way you choose with right-click, Space or the Look button is remembered for
next time. If the browser lets go of the mouse because you went to another
window, free look is still chosen: click in the picture to carry on.

In both, W or the up arrow walks toward wherever you are looking, A and D (or
left and right) turn, and S or the down arrow steps back from a close-up.
Close-ups and papers always give you the pointer, for the fiddly controls.
Touch screens use the pointer way only. Progress saves itself in the browser.

## How it is made

Everything is generated in code. There are no image, model or sound files.

- **Pictures** are a real 3D scene (Three.js) seen from fixed standing places,
  drawn at 640x400 and scaled up with hard pixels, a reduced palette and an
  ordered dither.
- **Textures, labels, dials, papers, the wall chart and the photograph** are
  painted on canvases at start-up.
- **Sound** is synthesised with Web Audio: wind, sea, the diesel, the receiver,
  the hum of the tunnel, water against the quay.

```
src/
  main.js          input, movement, the game loop
  actions.js       what each clickable thing does
  puzzles/         the rules of each puzzle, as plain functions with no rendering
  data/            the node graph, every readable paper, the wall chart, the photograph
  engine/          renderer, picking, sound, save, on-screen interface
  world/           the island, the Subterranean Station and the pen, built area by area
tests/
  puzzles.test.js  chapter one: rules, clues and the node graph
  below.test.js    chapter two: the same for the pump, the junction box and the door
  pen.test.js      chapter three: the darkroom, the tally board, the telegraph and its papers
  save.test.js     a save is checked before it is resumed: corrupt, tampered and old saves
  walkthrough.cjs  plays all three chapters in a real browser
  seethrough.cjs   checks no wall lets the one behind it show, and that nothing underground has a gap
  tour.cjs         screenshots every view
```

The surface, the Subterranean Station and the pen are three separate groups in
one scene, all built when the page opens. Only the one you are standing in is
drawn and lit. The ways between them (the stairs, the rock passage) are fades:
the picture goes to black, the camera is cut to the other group, and the picture
comes back. Nothing is loaded.

The tunnel's constant hum is three synthesised layers (air, hum, whirr). Their
levels are the `TUNNEL_MIX` numbers at the top of `src/engine/audio.js`, and each
place scales them in its `amb` entry in `src/data/nodes.js`. The pen adds water
against the quay and the boat shifting at her chains: `PEN_MIX`, same file.

The letterhead on chapter three's last paper and the name on the boat are both
in `src/data/names.js` and nowhere else.

Clues are generated from the same constants the puzzles check against (the
schedule in the log, the pad, the bearing on the chart, the developing times,
the number in the photograph), so a clue cannot drift out of step with its
answer.

## Tests

```bash
npm test
```

That runs the unit tests: the rules of every puzzle, that each set of clues
allows exactly one answer, and that the three chapters join up on the map.

```bash
npm run lint
```

```bash
npm run format
```

ESLint checks the code and Prettier formats it. Both, with the build and the
unit tests, run on GitHub for every pull request and every push to `main`
(`.github/workflows/ci.yml`). Node 22 is expected; see `.nvmrc`.

Every push to `main` also rebuilds and republishes the game on GitHub Pages
(`.github/workflows/pages.yml`).

The browser tests use [Playwright](https://playwright.dev) (a dev dependency;
install its Chromium once with `npx playwright install --with-deps chromium`)
and need the test build being served:

```bash
npm run build:test && npm run preview
```

`build:test` is the ordinary build plus `window.kestrel`, the hook the tests
drive the game through. The published game (`npm run build`) leaves it out.

```bash
npm run walkthrough
```

```bash
npm run seethrough
```

`tests/walkthrough.cjs` contains the full solution, so do not read it if you
want to play first. Set `KESTREL_FROM3=1` to play only chapter three.

On pull requests to `main` both browser tests also run on GitHub, side by side
(`.github/workflows/browser-tests.yml`).

## Licence

[MIT](LICENSE). Station Kestrel is a work of fiction. Its people, companies and
vessels are invented.
