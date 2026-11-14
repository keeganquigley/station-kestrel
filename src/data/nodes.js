// Where you can stand, which way you can face, and where a step forward takes you.
import { P, FLOOR, SHED_FLOOR, EYE, DECK, MAST, UF, LF } from '../world/layout.js';
import { terrainH } from '../world/terrain.js';

const out = (x, z) => [x, terrainH(x, z) + EYE, z];
const inn = (x, z) => [x, FLOOR + EYE, z];
const up = (x, z) => [x, UF + EYE, z]; // upper tunnel and rooms
const low = (x, z) => [x, LF + EYE, z]; // lower stretch

/**
 * pos/fwd            a standing place: look around freely, click toward a link to walk it.
 *                    fwd is keyed by the compass facing you arrive with.
 * faces              the composed compass views (used by the screenshot tour)
 * cam/look/back      a close-up: one fixed view, bottom edge steps back
 * tilt               look up (+) or down (-) on a given facing
 * amb                how loud each background sound is here
 * live               something on screen moves, so keep redrawing
 * realm              'below' for the Subterranean Station; everything else is the surface
 *
 * A link is a node id, or { to, face, gate, fade }. gate names a check in actions.js;
 * fade crosses between the realms with a fade to black instead of a glide.
 */
// How loud each layer of the tunnel's sound is in each kind of place.
const TUNNEL_AMB = { air: 1, hum: 1, whirr: 1, drip: 0.25 };
const ROOM_AMB = { air: 0.6, hum: 0.75, whirr: 0.3 };
const LOW_AMB = { air: 1, hum: 1.1, whirr: 0.7, drip: 0.7 };

const below = (nodes) => Object.fromEntries(Object.entries(nodes).map(([id, n]) => [id, { ...n, realm: 'below' }]));

export const NODES = {
  jetty: { pos: [0, DECK + EYE, 38], faces: 'NESW', fwd: { N: 'path' }, tilt: { N: 0.02 }, amb: { wind: 0.7, sea: 1 } },
  path: { pos: out(0, 21), faces: 'NESW', fwd: { N: 'yard', S: 'jetty' }, tilt: { N: 0.06, S: -0.1 }, amb: { wind: 0.85, sea: 0.6 } },
  yard: { pos: out(0, 6), faces: 'NESW', fwd: { N: 'door', W: 'field', E: 'shedfront', S: 'path' }, tilt: { W: 0.1 }, amb: { wind: 1, sea: 0.3, gen: 0.22 } },
  field: { pos: out(-13, 9), faces: 'NESW', fwd: { W: 'mast', E: 'yard' }, tilt: { W: 0.3 }, amb: { wind: 1.15, sea: 0.3, gen: 0.08 } },
  mast: { cam: [MAST.x + 2.2, P + 1.27, MAST.z - 0.05], look: [MAST.x + 1.15, P + 1.2, MAST.z - 0.05], back: ['field', 'W'], amb: { wind: 1.2, sea: 0.3 } },
  shedfront: { pos: out(12.6, 6), faces: 'NESW', fwd: { E: 'shed', W: 'yard' }, amb: { wind: 0.9, sea: 0.3, gen: 0.5 } },
  shed: { pos: [18.1, SHED_FLOOR + EYE, 6], faces: 'NESW', fwd: { W: 'shedfront' }, tilt: { E: -0.22, S: -0.12, N: -0.08 }, amb: { wind: 0.3, gen: 1, room: 0.2 } },
  gen: { cam: [19.2, SHED_FLOOR + 1.1, 6], look: [20.36, SHED_FLOOR + 1.02, 6], back: ['shed', 'E'], amb: { wind: 0.25, gen: 1.1, room: 0.2 } },
  breakers: { cam: [18.6, SHED_FLOOR + 1.47, 4.85], look: [18.6, SHED_FLOOR + 1.43, 3.6], back: ['shed', 'N'], amb: { wind: 0.25, gen: 1, room: 0.2 } },
  door: { pos: out(0, -6.2), faces: 'NESW', fwd: { N: { to: 'vestibule', gate: 'door' }, S: 'yard' }, amb: { wind: 0.9, sea: 0.2, gen: 0.15 } },
  vestibule: { pos: inn(0, -12.2), faces: 'NESW', fwd: { N: 'ops', S: 'door' }, tilt: { E: -0.16, W: -0.04 }, amb: { wind: 0.2, room: 0.7 } },
  ops: { pos: inn(0, -19.6), faces: 'NESW', fwd: { S: 'vestibule', W: 'office', E: 'corridor' }, tilt: { N: -0.1 }, amb: { room: 1, radio: 0.6 }, live: true },
  console: { cam: [0.24, FLOOR + 1.24, -22.08], look: [0.24, FLOOR + 1.1, -23.3], back: ['ops', 'N'], amb: { room: 1, radio: 1 }, live: true },
  office: { pos: inn(-7.3, -20), faces: 'NESW', fwd: { E: 'ops' }, tilt: { W: -0.2, N: -0.02 }, amb: { room: 0.8, radio: 0.2 } },
  corridor: { pos: inn(6.3, -20), faces: 'EW', fwd: { W: 'ops', E: { to: 'vault', gate: 'vault' } }, amb: { room: 0.9, radio: 0.15 } },
  vaultlock: { cam: [8.75, FLOOR + 1.36, -19.42], look: [10.2, FLOOR + 1.28, -19.42], back: ['corridor', 'E'], amb: { room: 0.9 } },
  vault: { pos: inn(11.5, -20), faces: 'NESW', fwd: { W: 'corridor', N: { to: 'stairfoot', gate: 'hatch', fade: true } }, tilt: { E: -0.27 }, amb: { room: 1.2, vault: 1 }, live: true },
  ...below({
    stairfoot: { pos: up(0, -2), faces: 'NESW', fwd: { N: 'tunnelA', S: { to: 'vault', fade: true } }, tilt: { S: 0.3, W: 0.4 }, amb: TUNNEL_AMB },
    tunnelA: { pos: up(0, -9), faces: 'NESW', fwd: { N: 'tunnelB', S: 'stairfoot', E: 'kitchen', W: 'mess' }, amb: TUNNEL_AMB },
    kitchen: { pos: up(3.4, -9.3), faces: 'NESW', fwd: { W: 'tunnelA' }, tilt: { S: -0.14, N: -0.1, E: -0.08 }, amb: ROOM_AMB },
    pump: { cam: [4.55, UF + 1.3, -9.2], look: [7.2, UF + 1.22, -9.2], back: ['kitchen', 'E'], amb: ROOM_AMB },
    mess: { pos: up(-3.4, -9.3), faces: 'NESW', fwd: { E: 'tunnelA' }, tilt: { S: -0.12, N: -0.1, W: -0.02 }, amb: ROOM_AMB },
    tunnelB: { pos: up(0, -19), faces: 'NESW', fwd: { N: 'brink', S: 'tunnelA', E: 'bunks' }, tilt: { W: 0.36 }, amb: TUNNEL_AMB },
    rack: { cam: [-0.5, UF + 1.86, -19], look: [-1.5, UF + 1.96, -19], back: ['tunnelB', 'W'], amb: TUNNEL_AMB },
    bunks: { pos: up(3.4, -19.3), faces: 'NESW', fwd: { W: 'tunnelB' }, tilt: { N: -0.1, S: -0.1, E: -0.06 }, amb: ROOM_AMB },
    brink: { pos: up(0, -25.6), faces: 'NESW', fwd: { S: 'tunnelB', N: { to: 'junction', gate: 'water' } }, tilt: { N: -0.2 }, amb: { ...TUNNEL_AMB, drip: 1, whirr: 0.6 } },
    junction: { pos: low(0, -33.5), faces: 'NESW', fwd: { S: 'brink', N: 'blastdoor' }, tilt: { S: 0.08 }, amb: LOW_AMB },
    jbox: { cam: [-0.28, LF + 1.42, -33.5], look: [-1.5, LF + 1.36, -33.5], back: ['junction', 'W'], amb: LOW_AMB },
    blastdoor: { pos: low(0, -41.0), faces: 'NESW', fwd: { S: 'junction', N: { to: 'beyond', gate: 'blast' } }, amb: LOW_AMB, live: true },
    sender: { cam: [0.2, LF + 1.42, -41.45], look: [1.5, LF + 1.36, -41.45], back: ['blastdoor', 'E'], amb: LOW_AMB },
    beyond: { pos: low(0, -45.6), faces: 'NS', fwd: { S: 'blastdoor' }, tilt: { N: -0.16, S: -0.3 }, amb: { ...LOW_AMB, deep: 1 }, live: true },
  }),
};

export const START = { node: 'jetty', facing: 'N' };

export const ORDER = ['N', 'E', 'S', 'W'];

export const realmOf = (id) => NODES[id].realm || 'surface';

export function turn(node, facing, dir) {
  const faces = ORDER.filter((f) => NODES[node].faces.includes(f));
  const i = faces.indexOf(facing);
  return faces[(i + dir + faces.length) % faces.length];
}
