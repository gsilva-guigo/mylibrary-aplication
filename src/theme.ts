import { useColorScheme } from 'react-native';

/** Paleta do app: verde de biblioteca sobre papel frio, com versão escura. */
const light = {
  bg: '#f3f5f2',
  surface: '#ffffff',
  sunk: '#e7ebe6',
  line: '#d3dad3',
  text: '#18201c',
  muted: '#5b6862',
  accent: '#1d5c47',
  accentText: '#ffffff',
  accentSoft: '#dcebe3',
  good: '#24704f',
  warn: '#9a5b00',
  bad: '#a3302a',
};

const dark: typeof light = {
  bg: '#111613',
  surface: '#18201c',
  sunk: '#202a25',
  line: '#2f3b35',
  text: '#e4ebe6',
  muted: '#97a69e',
  accent: '#6cc39f',
  accentText: '#0c1a14',
  accentSoft: '#1d3a2e',
  good: '#6cc39f',
  warn: '#e5b25d',
  bad: '#ef8a83',
};

export type Theme = typeof light;

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}
