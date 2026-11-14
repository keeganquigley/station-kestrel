// Puts the whole world together: the island on the surface, and the Subterranean Station below.
// The two are separate groups and only the one you are standing in is drawn, lit and clickable.
import * as THREE from 'three';
import { buildMaterials } from './materials.js';
import { buildIsland } from './island.js';
import { buildShed } from './shed.js';
import { buildStation } from './station.js';
import { buildOps } from './ops.js';
import { buildOffice } from './office.js';
import { buildVault } from './vault.js';
import { buildTunnel } from './tunnel.js';
import { buildQuarters } from './quarters.js';
import { realmOf } from '../data/nodes.js';

export function buildWorld(scene) {
  buildMaterials();
  const surface = new THREE.Group(), below = new THREE.Group();
  surface.name = 'surface';
  below.name = 'below';
  scene.add(surface, below);

  const island = buildIsland(surface);
  const ops = buildOps(surface);
  const vault = buildVault(surface);
  const tunnel = buildTunnel(below);
  const parts = [island, buildShed(surface), buildStation(surface), ops, buildOffice(surface), vault, tunnel, buildQuarters(below)];
  const darkness = new THREE.FogExp2(0x030405, 0.045);

  return {
    /** Make every prop match the saved state, and show the realm you are in. */
    sync(state) {
      const up = realmOf(state.node) === 'surface';
      surface.visible = up;
      below.visible = !up;
      scene.fog = up ? island.fog : darkness;
      for (const p of parts) p.sync(state);
    },
    /** Advance anything that moves in the given place. True if the view needs redrawing. */
    tick(node) {
      if (node === 'ops' || node === 'console') return ops.tick();
      if (node === 'vault') return vault.tick();
      if (node === 'blastdoor' || node === 'beyond') return tunnel.tick();
      return false;
    },
  };
}
