// Where you can stand, which way you can face, and where a step forward takes you.
import { P, FLOOR, SHED_FLOOR, EYE, DECK, MAST } from '../world/layout.js';
import { terrainH } from '../world/terrain.js';

const out = (x, z) => [x, terrainH(x, z) + EYE, z];
const inn = (x, z) => [x, FLOOR + EYE, z];

/**
 * pos/fwd            a standing place: look around freely, click toward a link to walk it.
 *                    fwd is keyed by the compass facing you arrive with.
 * faces              the composed compass views (used by the screenshot tour)
 * cam/look/back      a close-up: one fixed view, bottom edge steps back
 * tilt               look up (+) or down (-) on a given facing
 * amb                how loud each background sound is here
 * live               something on screen moves, so keep redrawing
 */
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
  vault: { pos: inn(11.5, -20), faces: 'EW', fwd: { W: 'corridor' }, tilt: { E: -0.27 }, amb: { room: 1.2, vault: 1 }, live: true },
};

export const START = { node: 'jetty', facing: 'N' };

export const ORDER = ['N', 'E', 'S', 'W'];

export function turn(node, facing, dir) {
  const faces = ORDER.filter((f) => NODES[node].faces.includes(f));
  const i = faces.indexOf(facing);
  return faces[(i + dir + faces.length) % faces.length];
}
