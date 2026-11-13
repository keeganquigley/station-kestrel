// Puzzle 3: the one-time pad. Pure logic, no rendering.

/** What K-7 is really saying: a day, a year, and the number the vault was set to. */
export const PLAIN = ['1411', '1996', '7302'];

/** The sheet named in the clear at the head of the broadcast. */
export const SHEET = 9;

/** Series K, sheets 01-12. Three four-figure key groups per sheet. */
export const PAD = {
  1: ['3907', '6612', '0458'],
  2: ['7741', '2085', '9336'],
  3: ['1526', '8870', '4193'],
  4: ['6058', '3347', '7721'],
  5: ['9214', '5503', '1689'],
  6: ['4470', '9926', '3015'],
  7: ['8163', '1794', '6240'],
  8: ['2695', '7058', '5872'],
  9: ['5829', '4417', '9360'],
  10: ['0382', '6239', '2704'],
  11: ['7936', '0161', '8547'],
  12: ['3401', '8672', '1935'],
};

const digitwise = (a, b, f) =>
  a
    .split('')
    .map((ch, i) => String((((f(Number(ch), Number(b[i])) % 10) + 10) % 10)))
    .join('');

/** Encipher: add key to text figure by figure, no carrying. */
export const add = (text, key) => digitwise(text, key, (x, y) => x + y);

/** Decipher: take key from text figure by figure, no borrowing. */
export const sub = (text, key) => digitwise(text, key, (x, y) => x - y);

/** The groups the teleprinter prints. */
export const CIPHER = PLAIN.map((p, i) => add(p, PAD[SHEET][i]));

export const decipher = (groups, sheet) => groups.map((g, i) => sub(g, PAD[sheet][i]));

export const COMBINATION = PLAIN[2];

export const sheetLabel = (n) => String(n).padStart(2, '0');
