// Puzzle 1: the diesel set and its breaker panel. Pure logic, no rendering.

export const RATING = 40;
export const PRIME_COUNT = 3;

export const BREAKERS = [
  { id: 'lighting', label: 'LIGHTING', amps: 7 },
  { id: 'heating', label: 'HEATING', amps: 19 },
  { id: 'ops', label: 'OPS ROOM', amps: 13 },
  { id: 'door', label: 'DOOR', amps: 9 },
  { id: 'vault', label: 'VAULT', amps: 11 },
  { id: 'deice', label: 'DE-ICE', amps: 6 },
];

export function initial() {
  const breakers = {};
  for (const b of BREAKERS) breakers[b.id] = false;
  return { valve: false, primes: 0, choke: false, running: false, breakers };
}

export function load(s) {
  return BREAKERS.reduce((sum, b) => sum + (s.breakers[b.id] ? b.amps : 0), 0);
}

/** 'off' | 'rough' (choke still out) | 'hunting' (under-loaded) | 'live' */
export function status(s) {
  if (!s.running) return 'off';
  if (s.choke) return 'rough';
  return load(s) === RATING ? 'live' : 'hunting';
}

export const busLive = (s) => status(s) === 'live';
export const powered = (s, id) => busLive(s) && !!s.breakers[id];

function allOff() {
  const breakers = {};
  for (const b of BREAKERS) breakers[b.id] = false;
  return breakers;
}

/**
 * Apply one player action. Returns the new state and a list of event names
 * ('valve', 'prime', 'choke', 'start', 'cough', 'stall', 'switch', 'trip', 'live', 'drop', 'already').
 */
export function act(prev, action) {
  const s = { ...prev, breakers: { ...prev.breakers } };
  const events = [];
  const wasLive = busLive(prev);

  if (action === 'valve') {
    s.valve = !s.valve;
    events.push('valve');
    if (!s.valve && s.running) {
      s.running = false;
      events.push('stall');
    }
  } else if (action === 'prime') {
    s.primes = Math.min(s.primes + 1, PRIME_COUNT + 2);
    events.push('prime');
  } else if (action === 'choke') {
    s.choke = !s.choke;
    events.push('choke');
  } else if (action === 'starter') {
    if (s.running) {
      events.push('already');
    } else if (s.valve && s.primes >= PRIME_COUNT && s.choke) {
      s.running = true;
      s.primes = 0;
      events.push('start');
    } else {
      s.primes = 0;
      events.push('cough');
    }
  } else if (action.startsWith('breaker:')) {
    const id = action.slice(8);
    if (!(id in s.breakers)) throw new Error('unknown breaker ' + id);
    s.breakers[id] = !s.breakers[id];
    events.push('switch');
  } else {
    throw new Error('unknown action ' + action);
  }

  if (s.running && load(s) > RATING) {
    s.breakers = allOff();
    events.push('trip');
  }
  const isLive = busLive(s);
  if (isLive && !wasLive) events.push('live');
  if (!isLive && wasLive) events.push('drop');
  return { state: s, events };
}

/** Every breaker combination that carries exactly the rated load. */
export function solutions() {
  const out = [];
  for (let mask = 0; mask < 1 << BREAKERS.length; mask++) {
    const on = BREAKERS.filter((_, i) => mask & (1 << i));
    if (on.reduce((a, b) => a + b.amps, 0) === RATING) out.push(on.map((b) => b.id));
  }
  return out;
}
