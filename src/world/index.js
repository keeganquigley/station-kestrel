// Puts the whole world together: the island on the surface, the Subterranean Station below it,
// and the pen below that. Each is a separate group (a realm) and only the one you are standing
// in is drawn, lit and clickable.
import * as THREE from 'three';
import { buildMaterials } from './materials.js';
import { buildIsland } from './island.js';
import { buildShed } from './shed.js';
import { buildStation } from './station.js';
import { buildOps } from './ops.js';
import { buildOffice } from './office.js';
import { buildVault } from './vault.js';
import { buildDecor } from './decor.js';
import { buildTunnel } from './tunnel.js';
import { buildQuarters } from './quarters.js';
import { buildPen } from './pen.js';
import { buildDockRooms } from './dockrooms.js';
import { NODES, realmOf } from '../data/nodes.js';

export function buildWorld(scene) {
  buildMaterials();
  const group = (name) => {
    const g = new THREE.Group();
    g.name = name;
    scene.add(g);
    return g;
  };
  const surface = group('surface'),
    below = group('below'),
    penGroup = group('pen');

  const island = buildIsland(surface);
  const ops = buildOps(surface);
  const vault = buildVault(surface);
  const tunnel = buildTunnel(below);
  const pen = buildPen(penGroup);
  const parts = [island, buildShed(surface), buildStation(surface), ops, buildOffice(surface), vault, buildDecor(surface), tunnel, buildQuarters(below), pen, buildDockRooms(penGroup)];
  // the tunnel closes in within a few yards; the cavern is big, and should look it
  const realms = {
    surface: { group: surface, fog: island.fog },
    below: { group: below, fog: new THREE.FogExp2(0x030405, 0.045) },
    pen: { group: penGroup, fog: new THREE.FogExp2(0x040708, 0.021) },
  };

  // The parts with something that moves. A place says which of them to keep going with `live` in data/nodes.js.
  const movers = { ops, vault, tunnel, pen };
  for (const [id, n] of Object.entries(NODES))
    if (n.live && !movers[n.live]) throw new Error(`${id} is live for "${n.live}", which is not one of the parts that move: ${Object.keys(movers).join(', ')}`);

  return {
    /** Make every prop match the saved state, and show the realm you are in. */
    sync(state) {
      const here = realmOf(state.node);
      for (const [name, r] of Object.entries(realms)) r.group.visible = name === here;
      scene.fog = realms[here].fog;
      for (const p of parts) p.sync(state);
    },
    /** Advance anything that moves in the given place. True if the view needs redrawing. */
    tick(node) {
      const mover = movers[NODES[node].live];
      return mover ? mover.tick() : false;
    },
  };
}
