import { create } from 'zustand';

export type Route = 'explore' | 'how' | 'circuit' | 'code' | 'yugas' | 'build';
export type Mode = 'electronic' | 'mechanical';
export type Theme = 'system' | 'light' | 'dark';

interface State {
  route: Route;
  mode: Mode;
  ready: boolean;
  selected: string | null;
  hovered: string | null;
  hoverXY: [number, number];
  /** parts + wires lit by hovering a connection in the detail panel */
  glow: { parts: string[]; wires: string[] } | null;
  cutaway: boolean;
  explode: number;
  hideWalls: boolean;
  wiringOnly: boolean;
  drawer: boolean;
  theme: Theme;
  step: number;
  playing: boolean;
  lcd: [string, string];
  leds: (string | null)[];
  set: (p: Partial<State>) => void;
  select: (id: string | null) => void;
}

const savedTheme = (() => { try { return (localStorage.getItem('yuga-theme') as Theme) || 'system'; } catch { return 'system'; } })();

export const useStore = create<State>((set) => ({
  route: 'explore',
  mode: 'electronic',
  ready: false,
  selected: null,
  hovered: null,
  hoverXY: [0, 0],
  glow: null,
  cutaway: true,
  explode: 0,
  hideWalls: false,
  wiringOnly: false,
  drawer: false,
  theme: savedTheme,
  step: 0,
  playing: false,
  lcd: ['Yuga Lotus Box', 'Code: '],
  leds: Array(8).fill(null),
  set: (p) => set(p),
  select: (id) => set({ selected: id, glow: null, hovered: null }),
}));

export const reducedMotion = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
