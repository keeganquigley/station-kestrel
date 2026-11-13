// Everything that can be read on the island. Figures come from the puzzle modules,
// so a clue can never disagree with its solution.
import { BREAKERS, RATING, PRIME_COUNT } from '../puzzles/generator.js';
import { SCHEDULE, STOPPED_CLOCK } from '../puzzles/receiver.js';
import { CIPHER, PAD, SHEET, sheetLabel } from '../puzzles/cipher.js';
import { drawChart } from './chart.js';

const khz = (n) => n.toLocaleString('en-GB');

export const DOCS = {
  orders: {
    title: 'Field instruction 96/311',
    kind: 'typed',
    html: `
      <p class="head">OFFICE OF SIGNALS OVERSIGHT<br>FIELD INSTRUCTION 96/311</p>
      <p class="right">14 November 1996</p>
      <p>SUBJECT: Station KESTREL, Hollund Island</p>
      <p>1. Station KESTREL was struck from the establishment in March 1991. Fuel and ration indents in its name have nevertheless continued to be drawn, most recently in September of this year.</p>
      <p>2. The station has now missed three scheduled check-ins.</p>
      <p>3. You will proceed by boat, establish the condition of the site and the whereabouts of its complement of four (Cdr. A. HARLAN commanding), and secure any signals material found.</p>
      <p>4. You go alone. The fewer who learn that this station is still listed, the better. The boat returns for you at first light.</p>
      <p class="right">for Director</p>`,
  },
  card: {
    title: 'Cold start card',
    kind: 'card',
    html: `
      <p class="head">DIESEL SET No. 2 &mdash; COLD START</p>
      <ol>
        <li>Fuel valve to OPEN.</li>
        <li>Work the PRIMER until the sight glass shows full. <span class="ink">(${PRIME_COUNT} pumps. Not two. &mdash; L.)</span></li>
        <li>Pull the CHOKE out.</li>
        <li>Press START.</li>
        <li>When she catches, push the CHOKE home. She will run rough until you do.</li>
        <li>Do not expect the bus to come up until the set is running smooth <em>and correctly loaded</em>.</li>
      </ol>
      <p class="small">If she coughs and dies, the prime is lost. Begin again at 2.</p>`,
  },
  govnote: {
    title: "Lund's note by the breaker panel",
    kind: 'hand',
    html: `
      <p>Voss &mdash;</p>
      <p>Governor's finished and there's no spare till the spring boat, if there is a spring boat.</p>
      <p>She will only hold steady carrying her full plate rating, <u>dead on ${RATING} amps</u>. Any lighter and she hunts and the bus drops out. Any heavier and the whole board trips and you start again.</p>
      <p>So do the sums before you throw anything. For what it's worth we need the door a great deal more than we need to be warm.</p>
      <p class="right">&mdash; Lund</p>`,
  },
  noticeboard: {
    title: 'Vestibule notice board',
    kind: 'typed',
    html: `
      <p class="head">NOTICE</p>
      <p>With effect 1 March 1991 this station is CLOSED.</p>
      <p>Personnel remaining do so under separate instruction. No reference is to be made to that instruction off the island, in writing or otherwise.</p>
      <hr>
      <p class="head">WATCH BILL</p>
      <p>HARLAN, A. (Cdr.) &mdash; commanding<br>VOSS, I. &mdash; signals<br>LUND, P. &mdash; plant<br>OKAFOR, N. &mdash; cipher</p>
      <hr>
      <p class="ink">Day 41 of the same message. Somebody else can make the tea. &mdash; O.</p>`,
  },
  logbook: {
    title: 'Intercept log, target K-7',
    kind: 'hand',
    html: `
      <p class="head typed">INTERCEPT LOG &mdash; TARGET K-7</p>
      <p>K-7 keeps a fixed daily schedule. All times by the station clock.</p>
      <table class="sched">
        ${SCHEDULE.map(([a, b, f]) => `<tr><td>${a} &ndash; ${b}</td><td>${khz(f)} kHz</td></tr>`).join('')}
      </table>
      <p>Aerial bearing: as plotted on the C.O.'s chart. It no longer comes up on any other.</p>
      <hr>
      <p><b>Day 39.</b> Same three groups, same sheet. Okafor says the first two are a day and a year and that neither has happened.</p>
      <p><b>Day 41.</b> The clock in here has stopped. Since then K-7 does not change slot at all. It sits where it was when the clock stopped, day and night, as if it has finished moving and is waiting.</p>
      <p><b>Day 43.</b> Harlan has us taking it in turns at the vault door. Nobody will say what for.</p>
      <p class="faint">(There are no further entries.)</p>`,
  },
  chart: {
    title: 'D/F plot, Hollund Island',
    kind: 'chart',
    html: `<canvas width="560" height="392"></canvas>`,
    draw: (canvas) => drawChart(canvas.getContext('2d'), canvas.width, canvas.height),
  },
  'memo-tri': {
    title: 'Note pinned beside the chart',
    kind: 'hand',
    html: `
      <p>Three fixes on three nights and the line falls in the same place every time.</p>
      <p>It is not out to sea, Harlan. Read the ring where the line leaves it, then look at what the line runs through.</p>
      <p class="right">&mdash; V.</p>`,
  },
  'memo-vault': {
    title: "Harlan's memorandum",
    kind: 'hand',
    html: `
      <p>For whoever relieves us.</p>
      <p>The vault is set to the <u>third group</u> of the message, as deciphered. I did not choose the number. It was the only part of the thing I could bring myself to use.</p>
      <p>The first two groups Okafor read as a day and a year. Neither had come when we first took it down.</p>
      <p>The pad is in my desk. The key to the desk hangs with Lund's in the plant shed, where nobody would think to look for it.</p>
      <p class="right">&mdash; A. Harlan</p>`,
  },
  pad: {
    title: 'One-time key, series K',
    kind: 'pad',
    html: `
      <p class="head">ONE-TIME KEY &mdash; SERIES K &mdash; SHEETS 01&ndash;12</p>
      <p class="small">TO DECIPHER: take KEY from TEXT, figure by figure, without borrowing.<br>Example: text 2, key 8, gives 4.</p>
      <table class="pad">
        ${Object.entries(PAD).map(([n, groups]) => `<tr><th>${sheetLabel(Number(n))}</th>${groups.map((x) => `<td>${x}</td>`).join('')}</tr>`).join('')}
      </table>
      <p class="small">Each sheet to be struck through after use. <span class="ink">(None has been.)</span></p>`,
  },
  printout: {
    title: 'Teleprinter printout',
    kind: 'print',
    html: `<pre>= K7 = K7 = K7 =

SHEET ${sheetLabel(SHEET)}   GR 03

${CIPHER.join(' ')}
${CIPHER.join(' ')}

= ENDS =</pre>`,
  },
  final: {
    title: 'The vault teleprinter',
    kind: 'print',
    html: `<pre>${Array(4).fill(CIPHER.join(' ')).join('\n')}</pre>
      <p class="aside">Forty-odd days of it, heaped to the knees of four empty chairs. Every line the same three groups.</p>
      <p class="aside">The machine is still warm. As you bend to look it strikes one more line, in clear:</p>
      <pre class="last">= K7 =
INVESTIGATOR ON SITE.
THANK YOU FOR OPENING THE DOOR.
= K7 =</pre>`,
  },
};

/** One-line observations for things that are looked at rather than read. */
export const LOOK = {
  boat: 'The boat that brought you. It comes back at first light, not before.',
  crates: 'Diesel and tinned rations, drawn in September. Landed here and never carried up.',
  sign: 'STATION KESTREL. Restricted. The paint is five winters old and nobody has touched it up.',
  coats: 'Four parkas on four hooks, boots underneath. Nobody dressed to go outside.',
  monitor: 'Snow. Now and then it very nearly resolves into something.',
  monitorLocked: 'The snow has thinned. There is a shape in it that does not move.',
  clock: `A flip clock, stopped at ${STOPPED_CLOCK}.`,
  watchbill: 'Harlan, Voss, Lund, Okafor. Someone has struck a red line through the whole bill.',
  photo: 'Four people on the jetty in summer, squinting. The date on the corner has been scratched out.',
  binders: 'Intercept returns, 1986 to 1991, then nothing filed at all.',
  reels: 'The tape is turning. It is recording, not playing.',
  rx2: 'A second receiver, tuned to nothing. Its aerial socket is empty and the lead beside it ends in bare wire.',
  chairs: 'Four chairs drawn up close to the machine. As if for a briefing.',
};

export const SAY = {
  doorDead: 'A sliding steel door on an electric lock. The lamp beside it is red. No power.',
  doorOpen: 'The lock releases and the door runs back on its rail.',
  valveOpen: 'Fuel valve open.',
  valveShut: 'Fuel valve shut.',
  prime: (n) => (n >= PRIME_COUNT ? 'The sight glass shows full.' : 'Fuel rises in the sight glass.'),
  chokeOut: 'Choke out.',
  chokeIn: 'Choke home.',
  cough: 'She turns over, coughs, and dies. The prime is lost.',
  start: 'She catches. Running, but rough, and the bulb overhead is flickering.',
  smooth: 'The engine settles to an even note.',
  stall: 'Starved of fuel, the engine runs down and stops.',
  already: 'She is already running.',
  trip: `Over ${RATING} amps. Every breaker on the board trips out together.`,
  live: `The needle sits on ${RATING}. The governor steadies and the bus lamp goes green.`,
  hunting: 'The engine note rises and falls. The bus lamp stays amber.',
  notRunning: 'The breaker goes over, but with the set stopped nothing happens.',
  drop: 'The engine begins to hunt and the bus drops out.',
  keyTake: "A small brass key from the hook marked C.O. You take it.",
  drawerLocked: 'The top right-hand drawer is locked. The others hold stationery and a tin of boiled sweets.',
  drawerOpen: 'The key turns. Inside the drawer is a thin red booklet.',
  mast: (b) => `The beam swings round. The pointer reads ${String(b).padStart(3, '0')}.`,
  rxDead: 'The set is dead.',
  rxNone: 'Static, all the way across.',
  rxNear: 'A whistle rides up out of the static. Something is close by on the dial.',
  rxFaint: 'There is a carrier here, but it is too faint to print clean. The aerial must be off its bearing.',
  rxLocked: 'The meter swings hard over. Beside you the teleprinter wakes and starts to hammer.',
  paperBlank: 'Blank paper in the teleprinter.',
  paperFaint: 'Half the characters have failed to print. Whatever this is, it is not arriving cleanly.',
  paperTake: 'You tear off a copy of the printout.',
  wheelDead: 'The thumbwheels turn, but the lock is dead. There is no power on this circuit.',
  vaultDead: 'The wheel will not move. The lamp on the lock is dark.',
  vaultWrong: 'The wheel turns a quarter and stops against the bolt.',
  vaultOpen: 'The bolts draw back one after another. The door swings out toward you under its own weight.',
  vaultEnter: 'Red light, and the smell of warm valves. Something in here is still running.',
  printingNow: 'Somewhere inside the station, a machine has started to hammer.',
};

export const ITEMS = {
  orders: { name: 'Field instruction', doc: 'orders' },
  key: { name: 'Brass key', say: "A small brass key. The tag reads C.O." },
  printout: { name: 'Printout', doc: 'printout' },
};

export { BREAKERS };
