// Colour themes. Every screen reads colours from the selected theme.

export type ThemeId = 'ember' | 'amoled' | 'ocean' | 'lavender' | 'forest' | 'paper' | 'sakura';

export interface Palette {
  name: string;
  dark: boolean;
  bg: string;
  card: string;
  cardHigh: string;
  text: string;
  muted: string;
  focus: string; // main accent + focus phase
  break: string; // break phase
  gold: string;
  danger: string;
  onAccent: string; // text on top of accent buttons
}

export const PALETTES: Record<ThemeId, Palette> = {
  ember: {
    name: 'Ember',
    dark: true,
    bg: '#0F1115',
    card: '#1A1D24',
    cardHigh: '#262A34',
    text: '#F2F3F5',
    muted: '#9AA0AA',
    focus: '#FF6B4A',
    break: '#4AC6A8',
    gold: '#F5C451',
    danger: '#E5484D',
    onAccent: '#FFFFFF',
  },
  amoled: {
    name: 'AMOLED',
    dark: true,
    bg: '#000000',
    card: '#101010',
    cardHigh: '#1E1E1E',
    text: '#FFFFFF',
    muted: '#8A8A8A',
    focus: '#FF8A3D',
    break: '#3DDC97',
    gold: '#FFD166',
    danger: '#FF5C5C',
    onAccent: '#000000',
  },
  ocean: {
    name: 'Ocean',
    dark: true,
    bg: '#071A21',
    card: '#0E2A33',
    cardHigh: '#163A45',
    text: '#E8F6F8',
    muted: '#8FB3BA',
    focus: '#22D3EE',
    break: '#FBBF24',
    gold: '#FBBF24',
    danger: '#F87171',
    onAccent: '#04222A',
  },
  lavender: {
    name: 'Lavender',
    dark: true,
    bg: '#14111C',
    card: '#1F1A2B',
    cardHigh: '#2B2440',
    text: '#F1EDFA',
    muted: '#A59DBA',
    focus: '#A78BFA',
    break: '#F472B6',
    gold: '#FCD34D',
    danger: '#F87171',
    onAccent: '#140F24',
  },
  forest: {
    name: 'Forest',
    dark: true,
    bg: '#0E1611',
    card: '#16231B',
    cardHigh: '#203328',
    text: '#EAF3EC',
    muted: '#93A89A',
    focus: '#7BC67E',
    break: '#E9B872',
    gold: '#E9B872',
    danger: '#EF6B6B',
    onAccent: '#0E1611',
  },
  paper: {
    name: 'Paper',
    dark: false,
    bg: '#F6F3EE',
    card: '#FFFFFF',
    cardHigh: '#ECE7DF',
    text: '#1C1B19',
    muted: '#6B6760',
    focus: '#E8590C',
    break: '#2F9E77',
    gold: '#C98A00',
    danger: '#D9363E',
    onAccent: '#FFFFFF',
  },
  sakura: {
    name: 'Sakura',
    dark: false,
    bg: '#FFF5F7',
    card: '#FFFFFF',
    cardHigh: '#FBE3E8',
    text: '#2A1B20',
    muted: '#7C6870',
    focus: '#E5487A',
    break: '#3A9D8F',
    gold: '#C98A00',
    danger: '#D9363E',
    onAccent: '#FFFFFF',
  },
};

export const THEME_IDS = Object.keys(PALETTES) as ThemeId[];

export type ClockStyle = 'flip' | 'ring' | 'digital' | 'minimal';

export const CLOCK_STYLES: { id: ClockStyle; name: string }[] = [
  { id: 'flip', name: 'Flip' },
  { id: 'ring', name: 'Ring' },
  { id: 'digital', name: 'Digital' },
  { id: 'minimal', name: 'Minimal' },
];

export const RADIUS = { card: 20, pill: 999 };

// Fixed colours for subject tags (readable on both dark and light themes).
const TAG_COLORS: Record<string, string> = {
  DSA: '#FF8A65',
  OS: '#64B5F6',
  DBMS: '#81C784',
  CN: '#BA68C8',
  Dev: '#4DD0E1',
  Revision: '#FFD54F',
  Other: '#B0BEC5',
};
export function tagColor(tag: string): string {
  return TAG_COLORS[tag] ?? '#B0BEC5';
}
