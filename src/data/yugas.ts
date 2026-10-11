// The four yugas. Facts are from CLAUDE.md ("use exactly"); subtitles, symbols and
// the short "about" lines come from reference/lotus-locker-3d.html.

export type PegShape = 'circle' | 'triangle' | 'square' | 'star';

export interface Yuga {
  id: 'satya' | 'treta' | 'dwapara' | 'kali';
  en: string;
  sub: string;
  metalName: string;
  /** coin / metal colour used in 3D and on the page */
  metal: string;
  hex: number;
  dark: string;
  bg: string;
  rough: number;
  legs: number;
  years: string;
  life: string;
  path: string;
  avatars: string[];
  symbol: string;
  about: string;
  /** LED colour from YUGA_RGB in the firmware */
  rgb: [number, number, number];
  /** PCF8574 input bit for this yuga's leaf socket */
  pcfBit: number;
  /** Leaf peg / socket shape. The pairing order is an assumption (see TBD list). */
  peg: PegShape;
}

export const YUGAS: Yuga[] = [
  {
    id: 'satya', en: 'Satya', sub: 'The Age of Truth', metalName: 'Gold',
    metal: '#E8B84A', hex: 0xe8b84a, dark: '#6E4E0E', bg: '#E9C874', rough: 0.28, legs: 4,
    years: '1,728,000 years', life: '100,000 years', path: 'Meditation',
    avatars: ['Matsya', 'Kurma', 'Varaha', 'Narasimha'], symbol: 'The rising sun',
    about: 'Everyone spoke the truth. There was no disease, fear or greed, and people lived in peace.',
    rgb: [255, 170, 0], pcfBit: 0, peg: 'circle',
  },
  {
    id: 'treta', en: 'Treta', sub: 'The Age of Yajna', metalName: 'Silver',
    metal: '#DDE2E8', hex: 0xdde2e8, dark: '#4E5560', bg: '#D2D8DE', rough: 0.3, legs: 3,
    years: '1,296,000 years', life: '10,000 years', path: 'Yajna (fire offerings)',
    avatars: ['Vamana', 'Parashurama', 'Shri Ram'], symbol: 'Bow and arrow',
    about: 'Goodness fell by one quarter. Shri Ram ruled Ayodhya with justice and defeated Ravana.',
    rgb: [190, 200, 220], pcfBit: 1, peg: 'triangle',
  },
  {
    id: 'dwapara', en: 'Dwapara', sub: 'The Age of Devotion', metalName: 'Copper',
    metal: '#D07A48', hex: 0xc87040, dark: '#5E2A10', bg: '#D99A6C', rough: 0.32, legs: 2,
    years: '864,000 years', life: '1,000 years', path: 'Temple worship',
    avatars: ['Shri Krishna', 'Balarama'], symbol: 'Flute and peacock feather',
    about: 'Good and bad were in balance. The Mahabharata war was fought and Krishna taught the Gita.',
    rgb: [230, 100, 40], pcfBit: 2, peg: 'square',
  },
  {
    id: 'kali', en: 'Kali', sub: 'The Age of Darkness', metalName: 'Iron',
    metal: '#8A8E96', hex: 0x6a6e76, dark: '#1E2024', bg: '#5A5E66', rough: 0.55, legs: 1,
    years: '432,000 years', life: '100 years', path: "Chanting God's name",
    avatars: ['Kalki (yet to come)'], symbol: 'The iron wheel',
    about: 'Our present age, said to have begun in 3102 BCE. Greed grows, but small good deeds count for a lot.',
    rgb: [80, 90, 110], pcfBit: 3, peg: 'star',
  },
];

export const rgbCss = (c: [number, number, number]) => `rgb(${c[0]},${c[1]},${c[2]})`;
