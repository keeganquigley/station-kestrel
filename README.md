# Station Kestrel

A point-and-click mystery for the browser, in the manner of the mid-90s slideshow
adventures: fixed standing places you can look around from, nobody about, and machines that
have to be understood before they will work.

**Holland Island, 14 November 1996.** A listening post that closed on paper five
years ago has gone on drawing fuel, and has now missed three check-ins. You are
sent alone to find out why.

Two chapters so far, about 15 to 20 minutes each:

1. **The station.** The island, the plant shed and the listening post on top of
   it. Three interlocking puzzles and a vault.
2. **The Subterranean Station.** What is under the vault: a long tunnel, the
   crew's kitchen, break room and bunks, three more puzzles, and the door at the
   end of the works.

## Play

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

**Controls.** Drag the picture to look around. Click in the direction you want
to walk and you glide to the next standing place. Click things to use them. The
left and right edges of the picture turn you a quarter turn, and in a close-up
the bottom edge steps back. Arrow keys also work. Progress saves itself in the
browser.

## How it is made

Everything is generated in code. There are no image, model or sound files.

- **Pictures** are a real 3D scene (Three.js) seen from fixed standing places,
  drawn at 640x400 and scaled up with hard pixels, a reduced palette and an
  ordered dither.
- **Textures, labels, dials, papers and the wall chart** are painted on canvases
  at start-up.
- **Sound** is synthesised with Web Audio: wind, sea, the diesel, the receiver.

```
src/
  main.js          input, movement, the game loop
  actions.js       what each clickable thing does
  puzzles/         the rules of each puzzle, as plain functions with no rendering
  data/            the node graph, every readable paper, the wall chart
  engine/          renderer, picking, sound, save, on-screen interface
  world/           the island and the Subterranean Station, built area by area
tests/
  puzzles.test.js  chapter one: rules, clues and the node graph
  below.test.js    chapter two: the same for the pump, the junction box and the door
  walkthrough.cjs  plays the whole demo in a real browser
  seethrough.cjs   checks no wall lets the one behind it show, at the angles that matter
  tour.cjs         screenshots every view
```

The surface and the Subterranean Station are two separate groups in one scene.
Only the one you are standing in is drawn, and the stairs between them are a fade.

The tunnel's constant hum is three synthesised layers (air, hum, whirr). Their
levels are the `TUNNEL_MIX` numbers at the top of `src/engine/audio.js`, and each
place scales them in its `amb` entry in `src/data/nodes.js`.

Clues are generated from the same constants the puzzles check against (the
schedule in the log, the pad, the bearing on the chart), so a clue cannot drift
out of step with its answer.

## Tests

```bash
npm test
```

The browser tests need [Playwright](https://playwright.dev) installed and the
built game being served:

```bash
npm run build && npm run preview
```

```bash
npm run walkthrough
```

```bash
npm run seethrough
```

`tests/walkthrough.cjs` contains the full solution, so do not read it if you
want to play first.
