// Everything drawn in HTML around the 3D view: captions, inventory, papers, title and ending.
import { DOCS, ITEMS } from '../data/documents.js';

const $ = (id) => document.getElementById(id);

const ICONS = {
  orders: '<svg viewBox="0 0 32 32"><rect x="7" y="4" width="18" height="24" fill="#e6dfc8" stroke="#222"/><path d="M10 9h12M10 13h12M10 17h12M10 21h8" stroke="#333" stroke-width="1.5"/></svg>',
  key: '<svg viewBox="0 0 32 32"><circle cx="10" cy="16" r="5.5" fill="none" stroke="#c9a03c" stroke-width="3"/><path d="M15 16h13M23 16v5M27 16v4" stroke="#c9a03c" stroke-width="3" fill="none"/></svg>',
  printout: '<svg viewBox="0 0 32 32"><path d="M8 3h16v26l-3-2-3 2-3-2-3 2-4-2z" fill="#e9e3cf" stroke="#222"/><path d="M11 9h10M11 13h10M11 17h10" stroke="#3a3e52" stroke-width="1.5"/></svg>',
  film: '<svg viewBox="0 0 32 32"><rect x="9" y="7" width="14" height="20" rx="2" fill="#2b2b2b" stroke="#111"/><rect x="12" y="4" width="8" height="4" fill="#b9bcbc" stroke="#111"/><rect x="11" y="13" width="10" height="8" fill="#c8611f"/></svg>',
  photo:
    '<svg viewBox="0 0 32 32"><rect x="4" y="7" width="24" height="18" fill="#efe9d6" stroke="#222"/><rect x="7" y="10" width="18" height="12" fill="#2b2924"/><path d="M9 20h14v-3l-3-2H12l-3 2z" fill="#b8b3a2"/><rect x="14" y="12" width="5" height="4" fill="#d9d4c2"/></svg>',
};

export class UI {
  constructor(game) {
    this.game = game;
    this.onDocClose = null;
    this.captionTimer = null;
    $('doc').addEventListener('click', (e) => {
      if (e.target.id === 'doc' || e.target.id === 'doc-close') this.closeDoc();
    });
    $('btn-notes').addEventListener('click', () => this.notebook());
    $('btn-sound').addEventListener('click', () => game.toggleSound());
    this.fit();
    window.addEventListener('resize', () => this.fit());
  }

  /** Scale the 640x464 stage to fill the window, keeping its shape. */
  fit() {
    const s = Math.min(window.innerWidth / 640, window.innerHeight / 464);
    const stage = $('stage');
    stage.style.transform = `scale(${s})`;
    stage.style.left = `${(window.innerWidth - 640 * s) / 2}px`;
    stage.style.top = `${(window.innerHeight - 464 * s) / 2}px`;
  }

  say(text) {
    const el = $('caption');
    el.textContent = text || '';
    el.classList.remove('old');
    clearTimeout(this.captionTimer);
    if (text) this.captionTimer = setTimeout(() => el.classList.add('old'), 9000);
  }

  get docOpen() {
    return !$('doc').hidden;
  }

  showDoc(id, onClose) {
    const doc = DOCS[id];
    if (!doc) return;
    $('doc-paper').className = 'paper ' + doc.kind;
    $('doc-paper').innerHTML = doc.html;
    $('doc-paper').scrollTop = 0;
    if (doc.draw) doc.draw($('doc-paper').querySelector('canvas'));
    $('doc').dataset.doc = id;
    $('doc').hidden = false;
    this.onDocClose = onClose || null;
  }

  notebook() {
    if (this.docOpen && $('doc').dataset.doc === 'notebook') return this.closeDoc();
    const ids = this.game.state.docs;
    $('doc-paper').className = 'paper notebook';
    $('doc-paper').innerHTML =
      '<p class="head">NOTEBOOK</p><p class="small">Papers you have read. Select one to read it again.</p>' +
      '<ul>' +
      ids.map((id) => `<li><button data-open="${id}">${DOCS[id].title}</button></li>`).join('') +
      '</ul>';
    $('doc-paper')
      .querySelectorAll('button[data-open]')
      .forEach((b) =>
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          this.showDoc(b.dataset.open, () => this.notebook());
        }),
      );
    $('doc').dataset.doc = 'notebook';
    $('doc').hidden = false;
    this.onDocClose = null;
    this.game.sfx('paper');
  }

  closeDoc() {
    if (!this.docOpen) return;
    $('doc').hidden = true;
    $('doc').dataset.doc = '';
    const cb = this.onDocClose;
    this.onDocClose = null;
    if (cb) cb();
  }

  inventory(state) {
    const el = $('inv');
    el.innerHTML = '';
    for (const id of state.inv) {
      const b = document.createElement('button');
      b.className = 'slot';
      b.title = ITEMS[id].name;
      b.dataset.item = id;
      b.innerHTML = ICONS[id] || '';
      b.addEventListener('click', () => this.game.useItem(id));
      el.appendChild(b);
    }
  }

  sound(on) {
    $('btn-sound').textContent = on ? 'Sound: on' : 'Sound: off';
  }

  title(hasSave, onNew, onContinue, onChapterTwo, onChapterThree) {
    $('title').hidden = false;
    $('ending').hidden = true;
    $('btn-continue').hidden = !hasSave;
    $('btn-new').onclick = () => {
      $('title').hidden = true;
      onNew();
    };
    $('btn-continue').onclick = () => {
      $('title').hidden = true;
      onContinue();
    };
    $('btn-ch2').onclick = () => {
      $('title').hidden = true;
      onChapterTwo();
    };
    $('btn-ch3').onclick = () => {
      $('title').hidden = true;
      onChapterThree();
    };
  }

  ending(onAgain) {
    $('ending').hidden = false;
    $('btn-again').onclick = () => {
      $('ending').hidden = true;
      onAgain();
    };
  }

  get blocked() {
    return this.docOpen || !$('title').hidden || !$('ending').hidden;
  }
}
