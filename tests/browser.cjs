// What the three browser tests share: where the game is served, how Chromium is started, how to tell
// the test hook is there, and a few facts taken from the game's own modules, so that the tests follow
// the game when it changes instead of carrying copies of its numbers.
const { chromium } = require('playwright');

/** Where the test build is being served. */
const URL = process.env.KESTREL_URL || 'http://localhost:4173/';

/**
 * Chromium, drawing in software so that it works on a machine with no graphics card. Keep these flags.
 * KESTREL_CHROMIUM names a Chromium that is already installed, for a machine that cannot download
 * the one Playwright expects. Make it a headless shell: a full Chromium asks for a favicon.ico the game
 * does not have, and the walkthrough fails on that error.
 */
const launch = () =>
  chromium.launch({
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
    executablePath: process.env.KESTREL_CHROMIUM || undefined,
  });

/** Wait for window.kestrel, the hook the tests drive the game through. */
const hook = (page) =>
  page
    .waitForFunction(() => window.kestrel, null, { timeout: 30000 })
    .catch(() => {
      throw new Error('this page has no test hook. Build with "npm run build:test": the published build (npm run build) leaves the hook out');
    });

/**
 * Facts read from the game itself. Its modules are ES modules, so they are imported, not required.
 *   powered  the generator running with the bus live, so that every room is lit
 *   STN      the measurements of the station's outer walls
 */
async function facts() {
  const { chapterTwoState } = await import('../src/engine/state.js');
  const { STN } = await import('../src/world/layout.js');
  return { powered: chapterTwoState().gen, STN };
}

module.exports = { URL, launch, hook, facts };
