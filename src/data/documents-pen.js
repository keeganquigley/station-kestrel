// Chapter three: everything that can be read or looked at in the pen.
// As before, figures come from the puzzle modules so a clue cannot disagree with its answer.
import { LETTERHEAD, VESSEL } from './names.js';
import { drawPhoto } from './photo.js';
import { TEMPERATURE, CHART, STOP_MINUTES, FIX_FACTOR } from '../puzzles/darkroom.js';
import { OWNER } from '../puzzles/tally.js';
import { HULL, SIGNED_BY } from '../puzzles/telegraph.js';
import { STOPPED_CLOCK } from '../puzzles/receiver.js';

const WORD = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const TIMES = { 1: 'once', 2: 'twice', 3: 'three times' };

/** "16:50" as a watch face would be read aloud: "ten to five". */
export function clockWords(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const hour = (n) => WORD[((n + 11) % 12) + 1];
  const step = { 5: 'five', 10: 'ten', 15: 'a quarter', 20: 'twenty', 25: 'twenty-five' };
  if (m === 0) return `${hour(h)} o'clock`;
  if (m === 30) return `half past ${hour(h)}`;
  return m < 30 ? `${step[m]} past ${hour(h)}` : `${step[60 - m]} to ${hour(h + 1)}`;
}

const INITIAL = { harlan: 'A. Harlan', voss: 'I. Voss', lund: 'P. Lund', rush: 'N. Rush' };
const SAILING = '14 November 1996';

/** The body of the release, which differs only in who is going. */
const release = ({ sailing, party, participant, signature, tally, aside }) => `
  <p class="letterhead">${LETTERHEAD}</p>
  <p class="head">PARTICIPANT'S RELEASE</p>
  <table class="form">
    <tr><td>Vessel</td><td>${VESSEL}</td><td>Hull No.</td><td>${HULL}</td></tr>
    <tr><td>Berth</td><td>K7</td><td>Party</td><td>${party}</td></tr>
    <tr><td>Sailing</td><td colspan="3">${sailing}</td></tr>
    ${participant ? `<tr><td>Participant</td><td colspan="3">${participant}</td></tr>` : ''}
  </table>
  <p>I sign for myself and for the party named above. We go of our own wish. We have been told that the vessel goes deeper than any chart we have been shown, that no day and no year of return is promised, and that the company is not to be held to account for what becomes of us.</p>
  <table class="form">
    <tr><td>Signed</td><td>${signature}</td><td>Tally</td><td>${tally}</td></tr>
    <tr><td>Witness</td><td colspan="3" class="blank">&nbsp;</td></tr>
  </table>
  <p class="aside">${aside}</p>`;

export const PEN_DOCS = {
  'note-rush': {
    title: 'Page wedged in the gallery rail',
    kind: 'hand',
    html: `
      <p>For whoever follows us down.</p>
      <p>There is a harbour under the island and nobody ever told us. One boat in it. She was old before the station above was built.</p>
      <p>We were expected. The diving store stood open with four brass tallies laid out on the counter, like cloakroom tickets. Mine beats Voss's, and Voss knows it.</p>
      <p>I had it wrong upstairs. The message was never the date of something that would happen to the world. It was a sailing.</p>
      <p class="right">&mdash; N. Rush</p>`,
  },
  berthlog: {
    title: 'Berth log, K7',
    kind: 'hand',
    html: `
      <p class="head typed">BERTH LOG &mdash; K7</p>
      <p class="faint typed">(A small upright hand that is none of theirs.)</p>
      <table class="sched typed">
        <tr><td>1958</td><td>${VESSEL} alongside. Works above completed. Door shut.</td></tr>
        <tr><td>1971</td><td>Alongside.</td></tr>
        <tr><td>1986</td><td>Alongside. Listeners posted above.</td></tr>
        <tr><td>1991</td><td>Alongside. Listeners told to stay.</td></tr>
        <tr><td>&mdash;</td><td>Door opened from above. Party of four received. Tallies issued at the store. They are content to wait.</td></tr>
        <tr><td>14.11.96</td><td>${VESSEL} sails. Party of four. One form taken, signed for the party by ${INITIAL[SIGNED_BY].slice(3, 4)}. Paper filed by wire.</td></tr>
        <tr><td>15.11.96</td><td>${VESSEL} sails. Party of one.</td></tr>
      </table>
      <p>Written up the margin, in another hand:</p>
      <p>Tallies issued, one each. Mine is a higher number than Voss's, which I am told is not the point.</p>
      <p class="right">&mdash; A. H.</p>
      <p class="faint typed">(The ink of the last entry is as dry as the rest.)</p>`,
  },
  slip: {
    title: 'Records by wire',
    kind: 'typed',
    html: `
      <p class="head">RECORDS BY WIRE</p>
      <p>No papers are held at this berth. To call one:</p>
      <p>1. Set the vessel's HULL NUMBER. Three figures.<br>
         2. Set the TALLY of whoever signed the paper. Two figures.<br>
         3. Press CALL.</p>
      <p>Records answers NIL if nothing stands against that tally.</p>
      <p class="small">The hull number is painted on the boat, under her name. Every boat is photographed at her berth before she sails; see the routine card.</p>`,
  },
  routine: {
    title: 'Photographic routine',
    kind: 'card',
    html: `
      <p class="head">PHOTOGRAPHS FOR THE RECORD</p>
      <ol>
        <li>SAFELIGHT on and white light off before the film leaves the camera.</li>
        <li>DEVELOP by the chart in the dark room, for the temperature of the bath.</li>
        <li>STOP: ${WORD[STOP_MINUTES]} minute. Always.</li>
        <li>FIX: ${TIMES[FIX_FACTOR]} the developing time. Less and it will not keep. More and it bleaches.</li>
      </ol>
      <p class="small">A spoiled strip is no loss. Take another off the roll.</p>`,
  },
  devchart: {
    title: 'Developing times',
    kind: 'typed',
    html: `
      <p class="head">DEVELOPING TIMES</p>
      <table class="sched">
        <tr><td>Bath at</td><td>Develop for</td></tr>
        ${CHART.map(([t, m]) => `<tr><td>${t}&deg;</td><td>${m} min</td></tr>`).join('')}
      </table>
      <p class="small">Read the thermometer in the developer, not the one on the wall of the office.</p>`,
  },
  'note-voss': {
    title: 'Pencilled on the darkroom wall',
    kind: 'hand',
    html: `
      <p>The cable ends in her. I have had my hand on the gland where it goes through the hull and it is warm. She is what has been sending.</p>
      <p>Harlan's tally is an even number. Rush says that figures.</p>
      <p>I shall sign. Somebody has to, and I was the one who found it.</p>
      <p class="right">&mdash; I. V.</p>`,
  },
  'note-lund': {
    title: 'Chalked inside a locker door',
    kind: 'hand',
    html: `
      <p>Suits all perished. Rubber like biscuit. We shan't be wanting them, I am told.</p>
      <p>Voss drew a higher tally than me. First time for everything.</p>
      <p class="right">&mdash; L.</p>`,
  },
  casualty: {
    title: 'Casualty return',
    kind: 'typed',
    html: `
      <p class="head">CASUALTY RETURN</p>
      <table class="form">
        <tr><td>Berth</td><td>K7</td><td>Vessel</td><td>${VESSEL}</td></tr>
        <tr><td>Date</td><td>${SAILING}</td><td>Time</td><td>${STOPPED_CLOCK}</td></tr>
      </table>
      <table class="sched">
        <tr><td>HARLAN, A. (Cdr.)</td><td>DECEASED</td></tr>
        <tr><td>VOSS, I.</td><td>DECEASED</td></tr>
        <tr><td>LUND, P.</td><td>DECEASED</td></tr>
        <tr><td>RUSH, N.</td><td>DECEASED</td></tr>
      </table>
      <table class="form">
        <tr><td>Cause</td><td class="blank">&nbsp;</td></tr>
        <tr><td>Place</td><td class="blank">&nbsp;</td></tr>
        <tr><td>Certified by</td><td class="blank">&nbsp;</td></tr>
      </table>
      <p>Effects: four sets, bagged and tallied. Held at the diving store against collection.</p>
      <p class="aside">The form is typed throughout. Nothing on it has been filled in by hand, and three lines have not been filled in at all.</p>`,
  },
  photo: {
    title: 'Photograph from the quay camera',
    kind: 'photo',
    html: `<canvas width="560" height="392"></canvas>
      <p class="aside">The same boat, at the same berth, and not a mark on her. Under the name on her tower, sharp as the day it was painted: ${HULL}.</p>
      <p class="aside">Three of them are on the casing. The fourth stands apart by the tower with a paper in one hand. Nobody is behind the camera.</p>`,
    draw: (canvas) => drawPhoto(canvas.getContext('2d'), canvas.width, canvas.height),
  },
  waiver: {
    title: 'Paper drawn by the telegraph',
    kind: 'form',
    html: release({
      sailing: SAILING,
      party: 'four (4)',
      signature: `<span class="ink signature">${INITIAL[SIGNED_BY]}</span>`,
      tally: OWNER[SIGNED_BY],
      aside: 'Drawn a line at a time by the stylus, signature and all. It is the hand from the notebook on the upper bunk.',
    }),
  },
  second: {
    title: 'The second sheet',
    kind: 'form',
    html: release({
      sailing: '15 November 1996, first light',
      party: 'one (1)',
      participant: 'THE BEARER OF FIELD INSTRUCTION 96/311',
      signature: '<span class="blank">&nbsp;</span>',
      tally: 'to be issued',
      aside: 'The same form. The line for the signature has been left for you.',
    }),
  },
};

export const PEN_LOOK = {
  berth: 'BERTH K7, in paint on the stone. The signal never had a call sign. It had an address.',
  cable: 'The cable from the tunnel, every core of it, across the quay and into her side through a gland. Whatever has been sending is aboard.',
  cameraEmpty: 'A camera on a tripod, aimed at the boat. The back hangs open and the spool is gone.',
  seagate: 'A sea gate, shut, both leaves grown over with weed. Nothing has gone through it in a very long time.',
  beacon: 'The berth light. It comes up and goes down in time with the hum. You watched it from the top of the passage.',
  boat: 'A small submarine, rust from stem to stern and bearded with weed. She has not moved in decades.',
  name: `${VESSEL}. The paint has gone, but not the shape of the letters.`,
  number: 'There was a number under the name. Three figures, eaten out by rust.',
  hatch: 'No gangway, and three yards of black water. The hatch wheel is a single lump of rust. Nobody has gone aboard that way in your lifetime.',
  viewport: 'A viewport the size of a dinner plate in a brass ring. Black behind it.',
  viewportLit: 'A lamp is burning behind the glass. It was not, before. You cannot see what it lights.',
  dockclock: `A wall clock, stopped at ${STOPPED_CLOCK}.`,
  cabinet: 'Four drawers of berth returns, one boat and one berth, back to 1958. Each sheet says ALONGSIDE.',
  divelockers: 'Four lockers stencilled with the tally numbers. Rubber suits on hangers inside. Nobody dressed for the water.',
  thermo: `The thermometer for the developer bath. It reads ${TEMPERATURE} degrees.`,
  bottles: 'Developer, stop bath, fixer, mixed and labelled. The dates on the labels have been left blank.',
  enlarger: 'An enlarger under a dust sheet. There is no dust on the sheet.',
  effects: 'Four canvas bags, tied and labelled: HARLAN, VOSS, LUND, RUSH. Spectacles, a pipe, a wedding ring, a stub of blue pencil. Everything a person has on them.',
  watches: `Four wristwatches, laid out in a row. All four have stopped at ${clockWords(STOPPED_CLOCK)}. So did the clock in the ops room.`,
};

export const PEN_SAY = {
  beyondDown: 'The passage goes on down. So does the cable.',
  penEnter: 'A cavern the size of a church, with black water down the middle of it. Somebody built a harbour under the island.',
  quayFirst: 'One boat, alongside. She has been here a very long time.',
  filmTake: 'You open the back of the camera under its cloth and wind the roll off. One frame has been exposed.',
  devNoFilm: 'Three trays of chemistry, and nothing to put through them.',
  devFogged: 'The white light is on. The strip goes black from end to end. There is plenty more on the roll.',
  devThin: 'Out of the developer too soon. A ghost of a picture, too thin to read.',
  devDense: 'Too long in the developer. The strip is black, and whatever was on it is gone.',
  devStreaked: 'The stop bath was wrong. The picture comes up, then streaks across itself.',
  devUnfixed: 'It looks right for a moment, then darkens as you watch. Not fixed for long enough.',
  devBleached: 'Left too long in the fixer, the picture has bleached away to nothing.',
  devGood: 'A picture comes up clean, and stays. You print it and peg the print on the line.',
  devAlready: 'The print is on the line. There is nothing more on the roll worth developing.',
  safeOn: 'White light off. The safelight comes up red.',
  safeOff: 'White light on.',
  barHeld: 'The bar shifts a quarter of an inch and stops. Some tally is against the wrong name.',
  barOpen: 'The bar draws clear. Across the room the cage door runs back on its track.',
  barAlready: 'The bar is drawn. The cage stands open.',
  cageShut: 'Through the mesh: four canvas bags on a shelf, each with a label. The door is held by a bar that runs back to the tally board.',
  callDead: 'Nothing. The line is dead.',
  callUnknown: 'The drum turns once and stops. Records does not know that number.',
  callNil: 'The stylus writes three letters and lifts. NIL. Nothing stands against that tally.',
  callDrawn: 'The drum begins to turn. Line by line, the stylus draws a page.',
  callAlready: 'The line is quiet now.',
  wireBlank: 'A clean sheet on the drum, waiting.',
  second: 'The drum turns again. A second sheet is coming through behind the first.',
  lampHint: 'Out on the quay, something has come on.',
  end1: 'There is a light behind the viewport. There was not, before.',
  end2: 'The boat comes back for you at first light. Both of them do.',
};

export const PEN_ITEMS = {
  film: { name: 'Roll of film', say: 'A roll of film from the camera on the quay. One frame exposed.' },
  photo: { name: 'Photograph', doc: 'photo' },
};
