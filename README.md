# Station Kestrel

A point-and-click mystery for the browser, in the manner of the mid-90s slideshow
adventures: fixed views, dissolves between them, nobody about, and machines that
have to be understood before they will work.

**Hollund Island, 14 November 1996.** A listening post that closed on paper five
years ago has gone on drawing fuel, and has now missed three check-ins. You are
sent alone to find out why.

This is a one-level demo: one island, three interlocking puzzles and a finale,
about 15 to 20 minutes.

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

**Controls.** Click ahead to walk, click the left and right edges of the picture
to turn, click things to use them. In a close-up, click the bottom edge to step
back. Arrow keys also work. Progress saves itself in the browser.

## How it is made

Everything is generated in code. There are no image, model or sound files.

- **Pictures** are a real 3D scene (Three.js) shown as stills from fixed cameras,
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
  world/           the island, built area by area
tests/
  puzzles.test.js  rules, clues and the node graph
  walkthrough.cjs  plays the whole demo in a real browser
  tour.cjs         screenshots every view
```

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

`tests/walkthrough.cjs` contains the full solution, so do not read it if you
want to play first.
