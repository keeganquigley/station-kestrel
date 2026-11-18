// The two ways to look. 'cursor' is the pointer you can see: click things, drag the picture round.
// 'free' hides the pointer (browsers call this pointer lock) so that the mouse turns your head, and
// a marker in the middle of the picture shows what a click would do. Free look only applies while
// standing: in a close-up, or with a paper open, the pointer comes back by itself.
//
// The browser is passed in rather than reached for, so that the rules here can be tested without one.

const LOOK_KEY = 'station-kestrel-look';
/** Degrees turned per pixel of mouse travel. */
export const SENSITIVITY = 0.11;
/** Pixels in one report; anything more is a glitch, not a hand. */
export const MAX_TRAVEL = 200;
/** How long, in ms, after the mouse is taken before its reports are believed. */
export const SETTLE_MS = 150;
/** How long, in ms, to let the window's focus change before deciding why the mouse was let go. */
export const FOCUS_MS = 60;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/**
 * canvas     the element that takes the mouse
 * doc        the document (pointer lock, focus, events)
 * storage    where the chosen way is remembered, or anything that throws when there is no storage
 * canLock    whether this device can do free look at all
 * standing   true while free look may hold the mouse: playing, nothing on top, not in a close-up
 * steady     true while a turn of the head would be taken: playing, nothing on top, the camera still
 * onTurn     called with degrees to turn right and to tip down, for one report of the mouse
 * onMode     called with the way of looking whenever it is chosen
 * onChange   called whenever what the marker should show may have changed
 * onHeld     called with true or false when the mouse is taken or let go
 */
export function createLook({ canvas, doc, storage, canLock, standing, steady, onTurn, onMode = () => {}, onChange = () => {}, onHeld = () => {}, now = () => performance.now() }) {
  const stored = () => {
    try {
      return storage.getItem(LOOK_KEY);
    } catch {
      return null;
    }
  };
  let mode = canLock && stored() !== 'cursor' ? 'free' : 'cursor';
  let releasing = false; // we are letting go of the mouse ourselves, as opposed to the player pressing Esc
  let lockedAt = 0,
    lockSeen = false; // has the mouse reported in since it was last taken?

  const locked = () => doc.pointerLockElement === canvas;
  const wanted = () => mode === 'free' && canLock && standing();

  /** Take or let go of the mouse so that it matches the mode and the place. Safe to call at any time. */
  function sync() {
    if (wanted() && !locked()) {
      // browsers only allow this straight after a click or a key press; anywhere else it is refused, harmlessly
      try {
        const asked = canvas.requestPointerLock();
        if (asked && asked.catch) asked.catch(() => {});
      } catch {
        // refused: the next click or key press will ask again
      }
    } else if (!wanted() && locked()) {
      releasing = true;
      doc.exitPointerLock();
    }
    onChange();
  }

  /** Choose a way of looking. Only a deliberate choice is remembered for the next visit. */
  function set(next, remember = true) {
    mode = next === 'free' && canLock ? 'free' : 'cursor';
    if (remember) {
      try {
        storage.setItem(LOOK_KEY, mode);
      } catch {
        // no storage: the choice lasts for this visit
      }
    }
    onMode(mode, canLock);
    sync();
  }

  function toggle() {
    if (!canLock) return;
    if (doc.activeElement && doc.activeElement !== doc.body) doc.activeElement.blur();
    set(mode === 'free' ? 'cursor' : 'free');
  }

  doc.addEventListener('pointerlockchange', () => {
    if (locked() && !wanted()) {
      // granted a moment too late: a paper has been picked up, or a close-up entered, since we asked
      releasing = true;
      return doc.exitPointerLock();
    }
    // Losing the mouse without our asking: if the player pressed Esc they want the pointer back, for now.
    // The browser also lets go when another window or tab comes to the front, and that is not a request
    // for anything, so then the mode stays as it is and the next click in the picture takes the mouse again.
    // The window's focus tells the two apart, once it has had a moment to change.
    if (!locked() && !releasing && mode === 'free' && wanted()) {
      setTimeout(() => {
        if (doc.hasFocus() && !locked() && mode === 'free' && wanted()) set('cursor', false);
      }, FOCUS_MS);
    }
    releasing = false;
    onChange();
    onHeld(locked());
    if (!locked()) lockSeen = false;
  });

  doc.addEventListener('mousemove', (e) => {
    if (!locked() || !steady()) return;
    // the first report after the mouse is taken can be a wild one (the jump from wherever the pointer was),
    // so let it settle, and never believe more than a hand could do between two reports
    if (!lockSeen) {
      lockSeen = true;
      lockedAt = now();
      return;
    }
    if (now() - lockedAt < SETTLE_MS) return;
    const dx = clamp(e.movementX, -MAX_TRAVEL, MAX_TRAVEL),
      dy = clamp(e.movementY, -MAX_TRAVEL, MAX_TRAVEL);
    onTurn(dx * SENSITIVITY, dy * SENSITIVITY);
    onChange();
  });

  return {
    /** 'free' or 'cursor'. */
    get mode() {
      return mode;
    },
    canLock,
    /** Free look has the mouse. */
    locked,
    /** Free look is chosen and may hold the mouse here, whether or not it has it. */
    wanted,
    sync,
    set,
    toggle,
  };
}
