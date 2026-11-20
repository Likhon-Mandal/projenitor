import colors from 'tailwindcss/colors';
import plugin from 'tailwindcss/plugin';

/* ────────────────────────────────────────────────────────────────────────────
 * Traditional palette — বাড়ৈ বংশের ইতিবৃত্ত
 *
 * The app's components use Tailwind's stock colour names (orange, red, amber,
 * yellow, stone…) everywhere, so the theme is applied by re-defining those
 * scales rather than by editing every page:
 *
 *   orange → Bhagwa / saffron (গেরুয়া), deepening into temple-maroon
 *   red    → Sindoor & kumkum (সিঁদুর / কুমকুম)
 *   amber  → Genda / marigold (গাঁদা)
 *   yellow → Haldi & brass-gold (হলুদ / পিতল)
 *   stone  → Chandan / sandalwood neutrals (চন্দন)
 *
 * Every colour is emitted as a CSS variable so dark mode ("diya-lit night")
 * can swap them all at once:
 *   • light tints used as backgrounds/borders (50–300) become deep tints
 *   • dark shades used as text (400–900) become light, readable shades
 *   • rich mid/deep shades used for buttons, headers and badges stay as-is
 * ──────────────────────────────────────────────────────────────────────────── */

const SHADES = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

const traditional = {
  orange: { // Bhagwa / saffron
    50: '#fff6ec', 100: '#ffe8cc', 200: '#fdcd96', 300: '#f9ab5c', 400: '#f28a2c',
    500: '#e46c11', 600: '#c5540b', 700: '#a0400d', 800: '#7f3011', 900: '#632611', 950: '#371105',
  },
  red: { // Sindoor & kumkum
    50: '#fff2f0', 100: '#ffe0dc', 200: '#ffc3bc', 300: '#fb978c', 400: '#f0625a',
    500: '#de3a33', 600: '#c3231f', 700: '#a11a1a', 800: '#841819', 900: '#6c1819', 950: '#3c0808',
  },
  amber: { // Genda / marigold
    50: '#fff8eb', 100: '#fdebc6', 200: '#fbd488', 300: '#f7b94b', 400: '#f09d20',
    500: '#da810d', 600: '#b86408', 700: '#93490b', 800: '#773a10', 900: '#633111', 950: '#391804',
  },
  yellow: { // Haldi & brass-gold
    50: '#fffbea', 100: '#fff2c1', 200: '#ffe386', 300: '#ffcf48', 400: '#f8b81a',
    500: '#df9d0b', 600: '#bb7906', 700: '#955909', 800: '#7a470f', 900: '#673b11', 950: '#3b1f05',
  },
  blue: { // Peacock blue (মোরপাখা) — info & links, in harmony with the warm palette
    50: '#edfafa', 100: '#d2f2f3', 200: '#a9e4e8', 300: '#6fcdd6', 400: '#30adbb',
    500: '#17909f', 600: '#147385', 700: '#165d6d', 800: '#194d5a', 900: '#1a414c', 950: '#0a2a33',
  },
  stone: { // Chandan / sandalwood neutrals
    50: '#fbf7f0', 100: '#f4ecdf', 200: '#e8dcc8', 300: '#d4c3a8', 400: '#ae9b80',
    500: '#8a775e', 600: '#6e5c47', 700: '#574837', 800: '#3d3127', 900: '#2a211a', 950: '#17110c',
  },
};

// Surfaces
const LIGHT = { page: '#fbf5ea', surface: '#ffffff' };
const DARK = { page: '#120c08', surface: '#1e1510' };

/* ── colour helpers ─────────────────────────────────────────────────────── */
const hexToRgb = (hex) => {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mix = (a, b, t) => { // t = weight of a
  const A = hexToRgb(a), B = hexToRgb(b);
  return A.map((v, i) => Math.round(v * t + B[i] * (1 - t)));
};
const triplet = (rgb) => (Array.isArray(rgb) ? rgb : hexToRgb(rgb)).join(' ');

/* ── build the full palette (traditional + the remaining stock hues) ────── */
const STOCK_HUES = ['lime', 'green', 'emerald', 'teal', 'violet', 'purple', 'fuchsia', 'pink', 'rose'];
const palette = { ...traditional };
for (const name of STOCK_HUES) palette[name] = colors[name];
// Neutral greys follow the warm sandalwood scale so the whole app feels of one piece
['gray', 'slate', 'zinc', 'neutral'].forEach((n) => { palette[n] = traditional.stone; });
['sky', 'cyan', 'indigo'].forEach((n) => { palette[n] = traditional.blue; });

/* ── light / dark values for each role ──────────────────────────────────── */
const lightVars = {};
const darkVars = {};
const bgColors = {};
const textColors = {};
const borderColors = {};
const fixedColors = {};

const v = (name) => `rgb(var(${name}) / <alpha-value>)`;
const DARK_TEXT = { 400: '300', 500: '300', 600: '300', 700: '200', 800: '200', 900: '100', 950: '50' };
const BG_MIX = { 50: 0.16, 100: 0.24, 200: 0.34, 300: 0.46 };
const BORDER_MIX = { 50: 0.22, 100: 0.3, 200: 0.4, 300: 0.52 };

for (const [name, scale] of Object.entries(palette)) {
  bgColors[name] = {}; textColors[name] = {}; borderColors[name] = {}; fixedColors[name] = {};
  for (const s of SHADES) {
    const base = scale[s];
    fixedColors[name][s] = base;
    const isStone = name === 'stone' || ['gray', 'slate', 'zinc', 'neutral'].includes(name);

    // backgrounds & gradient stops
    const bgVar = `--bg-${name}-${s}`;
    lightVars[bgVar] = triplet(base);
    darkVars[bgVar] = BG_MIX[s] !== undefined
      ? triplet(isStone
        ? mix(traditional.stone[s === '300' ? '700' : '800'], DARK.surface, BG_MIX[s] * 0.9)
        : mix(scale['800'], DARK.surface, BG_MIX[s]))
      : triplet(base);
    bgColors[name][s] = v(bgVar);

    // text, icons, placeholders
    const txVar = `--tx-${name}-${s}`;
    lightVars[txVar] = triplet(base);
    const toShade = DARK_TEXT[s];
    darkVars[txVar] = toShade && (isStone || s !== '950')
      ? triplet(isStone ? traditional.stone[toShade] : scale[toShade])
      : triplet(base);
    textColors[name][s] = v(txVar);

    // borders, dividers, rings
    const bdVar = `--bd-${name}-${s}`;
    lightVars[bdVar] = triplet(base);
    darkVars[bdVar] = BORDER_MIX[s] !== undefined
      ? triplet(mix(isStone ? traditional.stone['600'] : scale['600'], DARK.surface, BORDER_MIX[s]))
      : triplet(base);
    borderColors[name][s] = v(bdVar);
  }
}

// Surfaces: bg-white is "card surface", text-white stays white (it sits on rich colours)
lightVars['--surface'] = triplet(LIGHT.surface);
darkVars['--surface'] = triplet(DARK.surface);
lightVars['--page'] = triplet(LIGHT.page);
darkVars['--page'] = triplet(DARK.page);
lightVars['--bd-white'] = '255 255 255';
darkVars['--bd-white'] = triplet(mix(traditional.stone['500'], DARK.surface, 0.28));

const brand = {
  primary: { DEFAULT: traditional.orange['800'], foreground: '#ffffff' },   // Bhagwa-maroon
  secondary: { DEFAULT: traditional.red['700'], foreground: '#ffffff' },    // Kumkum
  accent: { DEFAULT: traditional.yellow['400'], foreground: '#2a211a' },    // Marigold gold
  footer: traditional.orange['950'],
};

const common = {
  inherit: 'inherit',
  current: 'currentColor',
  transparent: 'transparent',
  black: '#000000',
  ...brand,
};

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    // Fixed palette: shadows, ring offsets and anything not role-mapped below
    colors: { ...common, white: '#ffffff', background: LIGHT.page, ...fixedColors, stone: { DEFAULT: traditional.stone['900'], ...fixedColors.stone } },
    backgroundColor: { ...common, white: v('--surface'), background: v('--page'), page: v('--page'), surface: v('--surface'), ...bgColors },
    gradientColorStops: { ...common, white: v('--surface'), background: v('--page'), page: v('--page'), surface: v('--surface'), ...bgColors },
    textColor: {
      ...common,
      white: '#ffffff',
      ...textColors,
      stone: { DEFAULT: v('--tx-stone-900'), ...textColors.stone },
      // Brand text follows the theme (headings use text-primary by default)
      primary: { DEFAULT: v('--tx-orange-800'), foreground: '#ffffff' },
      secondary: { DEFAULT: v('--tx-red-700'), foreground: '#ffffff' },
    },
    placeholderColor: { ...common, white: '#ffffff', ...textColors },
    fill: { ...common, white: '#ffffff', ...textColors },
    stroke: { ...common, white: '#ffffff', ...textColors },
    borderColor: { ...common, white: v('--bd-white'), DEFAULT: v('--bd-stone-200'), ...borderColors },
    divideColor: { ...common, white: v('--bd-white'), DEFAULT: v('--bd-stone-200'), ...borderColors },
    ringColor: { ...common, white: v('--surface'), surface: v('--surface'), page: v('--page'), DEFAULT: v('--bd-orange-500'), ...borderColors },
    ringOffsetColor: { ...common, white: v('--surface'), surface: v('--surface'), page: v('--page'), ...fixedColors },
    outlineColor: { ...common, white: '#ffffff', ...borderColors },
    extend: {
      fontFamily: {
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
        sans: ['Inter', 'Roboto', '"Segoe UI"', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.5s ease-out',
        'screen-in': 'screenIn 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)',
        'sheet-up': 'sheetUp 0.32s cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        screenIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        sheetUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({
        ':root': { ...lightVars, colorScheme: 'light' },
        '.dark': { ...darkVars, colorScheme: 'dark' },
      });
    }),
  ],
};
