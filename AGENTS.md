# Working on Station Kestrel

For any coding agent, or person, picking this repository up cold.

Station Kestrel is a point-and-click mystery game for the browser, in three
chapters. It is plain JavaScript (ES modules) with Three.js, built with Vite.
Everything is generated in code: there are no image, model or sound files.
It is published to GitHub Pages on every push to `main`.

Read `README.md` first. It explains the layout of `src/` and the tests.

## How to work

- Node 22 (see `.nvmrc`). Install with `npm ci`.
- Never push to `main`. Work on a branch and open a pull request. `main` is
  protected and requires the check "Lint, build and unit tests" to pass.
- Before opening a pull request, run all of:
  - `npm run lint`
  - `npm run format:check` (fix with `npm run format`)
  - `npm run build`
  - `npm test`
- One concern per pull request. Say in the description what you changed, what
  you ran, and anything you could not verify.

## Rules that must not be broken

1. **Never weaken or delete a test to make it pass.** The unit tests prove each
   puzzle has exactly one answer and that every clue matches it. If a test
   fails, fix the code, or stop and ask.
2. **Do not change puzzle answers, clues, story text or names** unless asked.
   The writing lives in `src/data/`. The two invented names for chapter three
   are in `src/data/names.js` and nowhere else. Do not introduce the name of
   any real person or company.
3. **No asset files.** Do not add images, fonts, audio, models or a library
   that loads them. Textures and sounds are generated at start-up.
4. **Any change under `src/world/`, `src/main.js` or `src/engine/` needs the
   browser tests**, not just the unit tests (see below). A wall in the wrong
   place does not fail a unit test.
5. **`tests/walkthrough.cjs` contains the full solution to the game.** Do not
   quote it in pull request descriptions or comments.
6. Do not edit `LICENSE`, change the licence, or rewrite git history.
7. Do not reformat files by hand or change the Prettier or ESLint settings.

## Browser tests

They need Playwright with Chromium, and the built game being served:

```bash
npm run build && npm run preview
```

That serves the game on `http://localhost:4173`. Then, in another shell:

```bash
npm run walkthrough
```

```bash
npm run seethrough
```

The walkthrough plays all three chapters with real clicks and takes ten minutes
or more. It fails on any browser console error. `KESTREL_URL` overrides the
address, and `KESTREL_FROM3=1` plays only chapter three. `seethrough` checks the
scenery for gaps. Both launch Chromium with software rendering flags; keep those.

## Open jobs

Do these in order, one pull request each. Delete an item from this list in the
pull request that completes it.

### 1. Keep the debug hook out of the published build

`src/main.js` exposes `window.kestrel` for the tests. Gate it behind a
build-time flag (for example a `VITE_` environment variable), set that flag for
the build the browser tests use, and leave it unset in
`.github/workflows/pages.yml`.

## Ongoing

- **Dependabot pull requests.** Merge grouped minor and patch updates once CI
  is green. For a **major** version of Three.js, Vite or Vitest: run the
  browser tests, read the release notes, and leave it for the owner to merge.
  A new Three.js can change lighting and colour in ways no test catches, so a
  person needs to look at the game.
- **CodeQL alerts.** Fix genuine ones in a pull request. If you believe one is
  a false positive, say why and leave it for the owner to dismiss.
- **Workflow runner warnings** (deprecated actions, runner image changes): fix
  in a pull request.

## When to stop and ask

- A test fails and the only way you can see to pass it is to change the test.
- A change would alter what the player sees, reads or has to solve.
- You need a repository setting changed (Pages, branch rules, secrets).
