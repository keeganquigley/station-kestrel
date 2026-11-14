// Chapter two: everything that can be read or looked at in the Subterranean Station.
// As above ground, figures come from the puzzle modules so a clue cannot disagree with its answer.
import { CAPACITY, CHARGE, FEED, solve } from '../puzzles/pump.js';
import { SCHEDULE_LINES, WIRING } from '../puzzles/junction.js';
import { challengeLabel } from '../puzzles/reply.js';
import { SHEET, sheetLabel } from '../puzzles/cipher.js';

const WORD = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

export const BELOW_DOCS = {
  rota: {
    title: 'Galley rota',
    kind: 'typed',
    html: `
      <p class="head">SUBTERRANEAN STATION &mdash; GALLEY ROTA</p>
      <table class="sched">
        <tr><td>Week 1</td><td>Lund</td><td>Okafor</td><td>Voss</td><td>Harlan</td></tr>
        <tr><td>Week 2</td><td>Lund</td><td>Okafor</td><td>Voss</td><td>Harlan</td></tr>
        <tr><td>Week 3</td><td>Lund</td><td><span class="ink">listening</span></td><td>Voss</td><td>Harlan</td></tr>
        <tr><td>Week 4</td><td>Lund</td><td><span class="ink">listening</span></td><td><span class="ink">listening</span></td><td>whoever</td></tr>
        <tr><td>Week 5</td><td><span class="ink">listening</span></td><td><span class="ink">listening</span></td><td><span class="ink">listening</span></td><td>whoever</td></tr>
        <tr><td>Week 6</td><td><span class="ink">listening</span></td><td><span class="ink">listening</span></td><td><span class="ink">listening</span></td><td><span class="ink">listening</span></td></tr>
      </table>
      <p class="small">Breakfast, dinner, supper, washing-up.</p>
      <p class="ink">We eat when it stops for breath. It doesn't, much. &mdash; L.</p>`,
  },
  ledger: {
    title: 'Stores ledger',
    kind: 'hand',
    html: `
      <p class="head typed">STORES &mdash; DRAWN FOR FOUR</p>
      <p><b>Day 38.</b> Tea, 1 lb. Tinned milk, 6. Biscuit, 2 tins. Paraffin, 1 gal.</p>
      <p><b>Day 40.</b> Tea, 1 lb. Nobody wants the biscuit.</p>
      <p><b>Day 42.</b> Tea.</p>
      <p><b>Day 43.</b> Four mugs, taken down the tunnel. Not returned.</p>
      <p class="faint">(Nothing is drawn after that.)</p>`,
  },
  schedule: {
    title: "Voss's cable schedule",
    kind: 'typed',
    html: `
      <p class="head">SIGNAL LINE K &mdash; CABLE SCHEDULE</p>
      <p>Five cores land at Junction K on the lower level. In case this sheet is lost, each core that matters carries a brass tag where it runs along the tunnel wall, stamped with its terminal.</p>
      <table class="sched">
        ${SCHEDULE_LINES.map((c) => `<tr><td>${c.toUpperCase()}</td><td>. . . . . . . .</td><td>T${WIRING[c]}</td></tr>`).join('')}
      </table>
      <p class="faint">(The rest of the sheet has been torn away.)</p>
      <p class="right">I. Voss</p>`,
  },
  'nb-lund': {
    title: "Lund's notebook",
    kind: 'hand',
    html: `
      <p><b>Sump pump.</b> The lower level floods whenever the pump loses its prime, and it loses its prime if anybody so much as looks at it.</p>
      <p>To prime her: the siphon wants <u>${WORD[CHARGE]} gallons</u> in the feed tank, dead on. The feed tank is the ${CAPACITY[FEED]}. More and it floods the pump body, less and it sucks air. Either way the charge goes down the drain and the header fills itself again.</p>
      <p>There is no measure on that wall but the tanks themselves: the ${CAPACITY[0]}, the ${CAPACITY[1]} and the ${CAPACITY[2]}. Each valve runs water toward whichever side of it you open.</p>
      <p>It can be done in ${WORD[solve().length]} turns. I have done it in the dark.</p>
      <p class="right">&mdash; P. Lund</p>`,
  },
  'nb-okafor': {
    title: "Okafor's notebook",
    kind: 'hand',
    html: `
      <p><b>Answering.</b> It asks at the far door now the way it asks on the air. It names a sheet and it waits.</p>
      <p>What it wants is its own date back: <u>the day, then the year</u>, the same two groups it has sent since Day 1.</p>
      <p>To answer you go the other way from reading. <u>Add</u> the key to the text, figure by figure, no carrying. Text 7, key 5, gives 2. The day goes on the first four wheels, the year on the last four. Then SEND.</p>
      <p>It will not take the groups off the air. Those were made on Sheet ${sheetLabel(SHEET)}, and it has never yet named the same sheet twice.</p>
      <p class="right">&mdash; N. Okafor</p>`,
  },
  'nb-voss': {
    title: "Voss's notebook",
    kind: 'hand',
    html: `
      <p>It isn't on the air.</p>
      <p>I pulled the aerial lead out of the set in the vault to prove a point to Harlan and it kept coming, clean as ever. Then I found the lead was warm. It doesn't go to the mast. It goes through the wall, and down.</p>
      <p>So did we. There was a door behind the racks none of us had been told about and a whole station under it, older than ours, with the kettle still on the range.</p>
      <p>The lead runs the length of the tunnel with five others. I have tagged the ones that matter. We are still following it.</p>
      <p class="right">&mdash; I. V.</p>`,
  },
  'nb-harlan': {
    title: "Harlan's notebook",
    kind: 'hand',
    html: `
      <p>Our instruction of 1 March 1991 was to remain and to listen. Nobody said for how long, and after the second winter nobody was asked.</p>
      <p>I want one thing understood by whoever reads this. We are not prisoners of it and we were never afraid of it. It has been courteous throughout.</p>
      <p>On Day 41 it stopped moving. On Day 43 it asked, in clear, for the far door. We talked it over at supper and nobody argued. Lund primed the pump, Voss made the line good, Okafor answered.</p>
      <p>We have taken the mugs. If you have come this far, you have been answering it all the way down yourself.</p>
      <p class="right">&mdash; A. Harlan</p>`,
  },
  challenge: {
    title: 'The door asks',
    kind: 'print',
    html: `<pre>= K7 =

SHEET ${challengeLabel()}

REPLY

= K7 =</pre>`,
  },
  comedown: {
    title: 'The door answers',
    kind: 'print',
    html: `<pre>= K7 =

RECEIVED

COME DOWN

= K7 =</pre>`,
  },
};

export const BELOW_LOOK = {
  plaque: 'SUBTERRANEAN STATION, completed 1958. Twenty years older than the station on top of it.',
  stairs: 'Forty steps, back up to the vault.',
  tagRed: `A brass tag crimped round the red cable, stamped T${WIRING.red}.`,
  tagYellow: `A brass tag crimped round the yellow cable, stamped T${WIRING.yellow}.`,
  cables: 'Five coloured cables, and above them one bare black lead. The lead is warm.',
  range: 'A paraffin range, cold. The kettle on it is full.',
  hooks: 'Four hooks for four mugs. No mugs.',
  table: 'Laid for four and never cleared. The tea in the pot has a skin on it.',
  darts: 'A game of 501 with everybody still in it. The chalk is on the floor where it was dropped.',
  records: 'The arm is lifted off the record. At some point they stopped wanting music.',
  armchairs: 'Two armchairs pulled round to face the door, not each other.',
  calendar: 'Days crossed off in blue pencil, twenty-six of them. Then they stopped counting on paper.',
  cards: 'Four hands dealt face down and nobody sitting to them. The chairs are upstairs, in the vault.',
  lockers: 'Four lockers. Everything folded, nothing taken.',
  water: 'Black water over the lower steps, quite still. Deeper than your boots, and the tunnel goes on under it.',
  enddoor: 'A blast door, stencilled END OF WORKS 1958. Past here nobody dug.',
  mugs: 'Four enamel mugs set down in a row at the threshold. One still has a spoon in it.',
  deep: 'The floor is rock now, and it goes down. The cables go down with it.',
};

export const BELOW_SAY = {
  hatch: 'Behind the racks, something heavy unlatches. One of them swings out from the wall.',
  belowEnter: 'Forty steps down. The air is warm, and somewhere along the tunnel something is humming.',
  lowEnter: 'The lower level, slick underfoot. The cables run on ahead of you.',
  pour: (n) => `${n === 1 ? 'A gallon runs' : WORD[n][0].toUpperCase() + WORD[n].slice(1) + ' gallons run'} across.`,
  pourNone: 'Nothing moves. That tank is empty, or the other is full.',
  primeLost: 'The pump gulps, chokes, and lets go. The charge is lost and the header fills again.',
  primeDone: 'The siphon takes. The pump settles to a steady thump, and out in the tunnel the water begins to fall.',
  primeAlready: 'The pump is running. Leave her be.',
  isolFault: 'The isolator kicks straight back out. Something is on the wrong terminal.',
  isolLive: 'The isolator holds. Far along the tunnel, a teleprinter starts up.',
  isolAlready: 'The line is live.',
  sendDead: 'Nothing. There is no line to send on.',
  sendWrong: 'The teleprinter rattles out a row of crosses, and waits again.',
  sendOpen: 'A pause. Then the teleprinter answers, and behind the door the bolts go back one by one.',
  doorPaperDead: 'A teleprinter set into the wall, dark. Its line is dead.',
  beyond1: 'Rock underfoot. The tunnel past the door was not dug by anybody.',
  beyond2: 'Far down it, in time with the hum, a light comes up and goes down again. As if it were breathing.',
};
