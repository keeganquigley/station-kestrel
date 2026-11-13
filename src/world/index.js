// Puts the whole island together.
import { buildMaterials } from './materials.js';
import { buildIsland } from './island.js';
import { buildShed } from './shed.js';
import { buildStation } from './station.js';
import { buildOps } from './ops.js';
import { buildOffice } from './office.js';
import { buildVault } from './vault.js';

export function buildWorld(scene) {
  buildMaterials();
  const ops = buildOps(scene);
  const vault = buildVault(scene);
  const parts = [buildIsland(scene), buildShed(scene), buildStation(scene), ops, buildOffice(scene), vault];
  return {
    /** Make every prop match the saved state. */
    sync(state) {
      for (const p of parts) p.sync(state);
    },
    /** Advance anything that moves in the given place. True if the view needs redrawing. */
    tick(node) {
      if (node === 'ops' || node === 'console') return ops.tick();
      if (node === 'vault') return vault.tick();
      return false;
    },
  };
}
