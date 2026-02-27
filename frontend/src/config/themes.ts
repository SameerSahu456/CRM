// ── Types ────────────────────────────────────────────────────

export type ThemeCategory = 'single' | 'accessible' | 'fun' | 'classic';

export const THEME_CATEGORIES: { id: ThemeCategory; label: string }[] = [
  { id: 'single', label: 'Single Colour' },
  { id: 'accessible', label: 'Vision Assistive' },
  { id: 'fun', label: 'Fun and New' },
  { id: 'classic', label: 'Updated Classics' },
];

export interface ThemePreset {
  id: string;
  name: string;
  category: ThemeCategory;
  description: string;
  /** Preview colors for the swatch UI: [sidebar-dark, sidebar-mid, accent, accent-light] */
  preview: [string, string, string, string];
  /** Full brand color scale overrides */
  brandScale: Record<string, string>;
}

/** Custom theme stored separately in localStorage */
export interface CustomThemeColors {
  columnBg: string;
  menuBgHover: string;
  activeItem: string;
  activeItemText: string;
  hoverItem: string;
  textColor: string;
  activePresence: string;
  mentionBadge: string;
}

export const CUSTOM_THEME_LABELS: { key: keyof CustomThemeColors; label: string }[] = [
  { key: 'columnBg', label: 'Column BG' },
  { key: 'menuBgHover', label: 'Menu BG Hover' },
  { key: 'activeItem', label: 'Active Item' },
  { key: 'activeItemText', label: 'Active Item Text' },
  { key: 'hoverItem', label: 'Hover Item' },
  { key: 'textColor', label: 'Text Color' },
  { key: 'activePresence', label: 'Active Presence' },
  { key: 'mentionBadge', label: 'Mention Badge' },
];

export const DEFAULT_CUSTOM_COLORS: CustomThemeColors = {
  columnBg: '#1e1b4b',
  menuBgHover: '#312e81',
  activeItem: '#4f46e5',
  activeItemText: '#e0e7ff',
  hoverItem: '#3730a3',
  textColor: '#a5b4fc',
  activePresence: '#34d399',
  mentionBadge: '#f43f5e',
};

// ── Color utilities ──────────────────────────────────────────

function hexToHsl(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return [0, 0, l];

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let hue = 0;
  if (max === r) hue = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) hue = ((b - r) / d + 2) / 6;
  else hue = ((r - g) / d + 4) / 6;

  return [hue * 360, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  const hue = ((h % 360) + 360) % 360;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + hue / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * Math.max(0, Math.min(1, color)))
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

/**
 * Generate a full 12-shade brand scale from `activeItem` (the primary brand-600).
 */
export function generateBrandScale(colors: CustomThemeColors): Record<string, string> {
  const [h, s, l] = hexToHsl(colors.activeItem);

  const shadeMap: [string, number, number][] = [
    ['25',  0.97, 0.35],
    ['50',  0.95, 0.45],
    ['100', 0.90, 0.55],
    ['200', 0.83, 0.65],
    ['300', 0.72, 0.75],
    ['400', 0.60, 0.85],
    ['500', 0.50, 0.95],
    ['600', l,    1.00],
    ['700', 0.35, 1.00],
    ['800', 0.27, 0.90],
    ['900', 0.20, 0.80],
    ['950', 0.12, 0.70],
  ];

  const scale: Record<string, string> = {};
  for (const [shade, targetL, sMult] of shadeMap) {
    scale[shade] = hslToHex(h, clamp(s * sMult, 0, 1), targetL);
  }
  return scale;
}

export function customColorsToString(colors: CustomThemeColors): string {
  return [
    colors.columnBg,
    colors.menuBgHover,
    colors.activeItem,
    colors.activeItemText,
    colors.hoverItem,
    colors.textColor,
    colors.activePresence,
    colors.mentionBadge,
  ].join(',');
}

export function stringToCustomColors(str: string): CustomThemeColors | null {
  const parts = str.split(',').map(s => s.trim());
  if (parts.length !== 8) return null;
  const hexRe = /^#[0-9a-fA-F]{6}$/;
  if (!parts.every(p => hexRe.test(p))) return null;
  return {
    columnBg: parts[0],
    menuBgHover: parts[1],
    activeItem: parts[2],
    activeItemText: parts[3],
    hoverItem: parts[4],
    textColor: parts[5],
    activePresence: parts[6],
    mentionBadge: parts[7],
  };
}

export function customColorsToPreview(c: CustomThemeColors): [string, string, string, string] {
  return [c.columnBg, c.activeItem, c.textColor, c.activeItemText];
}

// ── Predefined themes ────────────────────────────────────────

export const THEMES: ThemePreset[] = [
  // ════════════════════════════════════════════════════════════
  // SINGLE COLOUR
  // ════════════════════════════════════════════════════════════
  {
    id: 'aubergine',
    name: 'Aubergine',
    category: 'single',
    description: 'Deep eggplant purple',
    preview: ['#3b0764', '#9333ea', '#c084fc', '#f3e8ff'],
    brandScale: {
      '25': '#faf5ff', '50': '#faf5ff', '100': '#f3e8ff', '200': '#e9d5ff',
      '300': '#d8b4fe', '400': '#c084fc', '500': '#a855f7', '600': '#9333ea',
      '700': '#7e22ce', '800': '#6b21a8', '900': '#581c87', '950': '#3b0764',
    },
  },
  {
    id: 'clementine',
    name: 'Clementine',
    category: 'single',
    description: 'Warm citrus orange',
    preview: ['#431407', '#ea580c', '#fb923c', '#ffedd5'],
    brandScale: {
      '25': '#fff8f1', '50': '#fff7ed', '100': '#ffedd5', '200': '#fed7aa',
      '300': '#fdba74', '400': '#fb923c', '500': '#f97316', '600': '#ea580c',
      '700': '#c2410c', '800': '#9a3412', '900': '#7c2d12', '950': '#431407',
    },
  },
  {
    id: 'banana',
    name: 'Banana',
    category: 'single',
    description: 'Bright sunny yellow',
    preview: ['#422006', '#ca8a04', '#facc15', '#fef9c3'],
    brandScale: {
      '25': '#fefce8', '50': '#fefce8', '100': '#fef9c3', '200': '#fef08a',
      '300': '#fde047', '400': '#facc15', '500': '#eab308', '600': '#ca8a04',
      '700': '#a16207', '800': '#854d0e', '900': '#713f12', '950': '#422006',
    },
  },
  {
    id: 'jade',
    name: 'Jade',
    category: 'single',
    description: 'Fresh emerald green',
    preview: ['#022c22', '#059669', '#34d399', '#d1fae5'],
    brandScale: {
      '25': '#f0fdf9', '50': '#ecfdf5', '100': '#d1fae5', '200': '#a7f3d0',
      '300': '#6ee7b7', '400': '#34d399', '500': '#10b981', '600': '#059669',
      '700': '#047857', '800': '#065f46', '900': '#064e3b', '950': '#022c22',
    },
  },
  {
    id: 'lagoon',
    name: 'Lagoon',
    category: 'single',
    description: 'Tropical cyan blue',
    preview: ['#083344', '#0891b2', '#22d3ee', '#cffafe'],
    brandScale: {
      '25': '#ecfeff', '50': '#ecfeff', '100': '#cffafe', '200': '#a5f3fc',
      '300': '#67e8f9', '400': '#22d3ee', '500': '#06b6d4', '600': '#0891b2',
      '700': '#0e7490', '800': '#155e75', '900': '#164e63', '950': '#083344',
    },
  },
  {
    id: 'barbra',
    name: 'Barbra',
    category: 'single',
    description: 'Bold hot pink',
    preview: ['#500724', '#db2777', '#f472b6', '#fce7f3'],
    brandScale: {
      '25': '#fdf2f8', '50': '#fdf2f8', '100': '#fce7f3', '200': '#fbcfe8',
      '300': '#f9a8d4', '400': '#f472b6', '500': '#ec4899', '600': '#db2777',
      '700': '#be185d', '800': '#9d174d', '900': '#831843', '950': '#500724',
    },
  },
  {
    id: 'gray',
    name: 'Gray',
    category: 'single',
    description: 'Clean neutral tones',
    preview: ['#09090b', '#52525b', '#a1a1aa', '#f4f4f5'],
    brandScale: {
      '25': '#fafafa', '50': '#fafafa', '100': '#f4f4f5', '200': '#e4e4e7',
      '300': '#d4d4d8', '400': '#a1a1aa', '500': '#71717a', '600': '#52525b',
      '700': '#3f3f46', '800': '#27272a', '900': '#18181b', '950': '#09090b',
    },
  },
  {
    id: 'mood-indigo',
    name: 'Mood Indigo',
    category: 'single',
    description: 'Classic deep indigo',
    preview: ['#1e1b4b', '#4f46e5', '#818cf8', '#e0e7ff'],
    brandScale: {
      '25': '#f5f3ff', '50': '#eef2ff', '100': '#e0e7ff', '200': '#c7d2fe',
      '300': '#a5b4fc', '400': '#818cf8', '500': '#6366f1', '600': '#4f46e5',
      '700': '#4338ca', '800': '#3730a3', '900': '#312e81', '950': '#1e1b4b',
    },
  },

  // ════════════════════════════════════════════════════════════
  // VISION ASSISTIVE
  // ════════════════════════════════════════════════════════════
  {
    id: 'tritanopia',
    name: 'Tritanopia',
    category: 'accessible',
    description: 'Blue-yellow safe palette',
    preview: ['#172554', '#2563eb', '#60a5fa', '#dbeafe'],
    brandScale: {
      '25': '#f0f7ff', '50': '#eff6ff', '100': '#dbeafe', '200': '#bfdbfe',
      '300': '#93c5fd', '400': '#60a5fa', '500': '#3b82f6', '600': '#2563eb',
      '700': '#1d4ed8', '800': '#1e40af', '900': '#1e3a8a', '950': '#172554',
    },
  },
  {
    id: 'protanopia-deuteranopia',
    name: 'Protanopia & Deuteranopia',
    category: 'accessible',
    description: 'Red-green safe palette',
    preview: ['#082f49', '#0284c7', '#38bdf8', '#e0f2fe'],
    brandScale: {
      '25': '#f0f9ff', '50': '#f0f9ff', '100': '#e0f2fe', '200': '#bae6fd',
      '300': '#7dd3fc', '400': '#38bdf8', '500': '#0ea5e9', '600': '#0284c7',
      '700': '#0369a1', '800': '#075985', '900': '#0c4a6e', '950': '#082f49',
    },
  },

  // ════════════════════════════════════════════════════════════
  // FUN AND NEW
  // ════════════════════════════════════════════════════════════
  {
    id: 'raspberry-beret',
    name: 'Raspberry Beret',
    category: 'fun',
    description: 'Rich berry tones',
    preview: ['#4c0519', '#e11d48', '#fb7185', '#ffe4e6'],
    brandScale: {
      '25': '#fff5f6', '50': '#fff1f2', '100': '#ffe4e6', '200': '#fecdd3',
      '300': '#fda4af', '400': '#fb7185', '500': '#f43f5e', '600': '#e11d48',
      '700': '#be123c', '800': '#9f1239', '900': '#881337', '950': '#4c0519',
    },
  },
  {
    id: 'big-business',
    name: 'Big Business',
    category: 'fun',
    description: 'Corporate power slate',
    preview: ['#020617', '#475569', '#94a3b8', '#f1f5f9'],
    brandScale: {
      '25': '#f8fafc', '50': '#f8fafc', '100': '#f1f5f9', '200': '#e2e8f0',
      '300': '#cbd5e1', '400': '#94a3b8', '500': '#64748b', '600': '#475569',
      '700': '#334155', '800': '#1e293b', '900': '#0f172a', '950': '#020617',
    },
  },
  {
    id: 'pog',
    name: 'POG',
    category: 'fun',
    description: 'Vibrant retro fuchsia',
    preview: ['#4a044e', '#c026d3', '#e879f9', '#fae8ff'],
    brandScale: {
      '25': '#fdf4ff', '50': '#fdf4ff', '100': '#fae8ff', '200': '#f5d0fe',
      '300': '#f0abfc', '400': '#e879f9', '500': '#d946ef', '600': '#c026d3',
      '700': '#a21caf', '800': '#86198f', '900': '#701a75', '950': '#4a044e',
    },
  },
  {
    id: 'mint-chip',
    name: 'Mint Chip',
    category: 'fun',
    description: 'Cool mint green',
    preview: ['#042f2e', '#0d9488', '#2dd4bf', '#ccfbf1'],
    brandScale: {
      '25': '#f0fdfa', '50': '#f0fdfa', '100': '#ccfbf1', '200': '#99f6e4',
      '300': '#5eead4', '400': '#2dd4bf', '500': '#14b8a6', '600': '#0d9488',
      '700': '#0f766e', '800': '#115e59', '900': '#134e4a', '950': '#042f2e',
    },
  },
  {
    id: 'pb-and-j',
    name: 'PB&J',
    category: 'fun',
    description: 'Grape jam violet',
    preview: ['#2e1065', '#7c3aed', '#a78bfa', '#ede9fe'],
    brandScale: {
      '25': '#faf5ff', '50': '#f5f3ff', '100': '#ede9fe', '200': '#ddd6fe',
      '300': '#c4b5fd', '400': '#a78bfa', '500': '#8b5cf6', '600': '#7c3aed',
      '700': '#6d28d9', '800': '#5b21b6', '900': '#4c1d95', '950': '#2e1065',
    },
  },
  {
    id: 'chill-vibes',
    name: 'Chill Vibes',
    category: 'fun',
    description: 'Relaxed muted blue',
    preview: ['#162032', '#486a91', '#7ea8ca', '#dfe9f2'],
    brandScale: {
      '25': '#f5f8fb', '50': '#edf2f7', '100': '#dfe9f2', '200': '#c0d2e3',
      '300': '#9bb7d0', '400': '#7ea8ca', '500': '#5e88ad', '600': '#486a91',
      '700': '#3a5676', '800': '#30465e', '900': '#293a4e', '950': '#162032',
    },
  },
  {
    id: 'forest-floor',
    name: 'Forest Floor',
    category: 'fun',
    description: 'Deep earthy greens',
    preview: ['#0f1f0e', '#3a6b2c', '#6aad55', '#ddf0d4'],
    brandScale: {
      '25': '#f4f9f1', '50': '#ecf5e7', '100': '#ddf0d4', '200': '#bbe0ac',
      '300': '#93cb7c', '400': '#6aad55', '500': '#4f923c', '600': '#3a6b2c',
      '700': '#305624', '800': '#29451f', '900': '#22391b', '950': '#0f1f0e',
    },
  },
  {
    id: 'slackr',
    name: 'Slackr',
    category: 'fun',
    description: 'Classic plum purple',
    preview: ['#2e0b34', '#852997', '#c46dd4', '#f2dcf6'],
    brandScale: {
      '25': '#fcf5fd', '50': '#f9eefb', '100': '#f2dcf6', '200': '#e4b8eb',
      '300': '#d48edc', '400': '#c46dd4', '500': '#a840b8', '600': '#852997',
      '700': '#6e2180', '800': '#5b1c69', '900': '#4a1856', '950': '#2e0b34',
    },
  },
  {
    id: 'sea-glass',
    name: 'Sea Glass',
    category: 'fun',
    description: 'Pale washed seafoam',
    preview: ['#0f2b2a', '#32827c', '#62b8b1', '#d2efec'],
    brandScale: {
      '25': '#f2fafa', '50': '#e6f6f5', '100': '#d2efec', '200': '#a8dfd9',
      '300': '#7bccc4', '400': '#62b8b1', '500': '#3e9f97', '600': '#32827c',
      '700': '#2a6a65', '800': '#245553', '900': '#204745', '950': '#0f2b2a',
    },
  },
  {
    id: 'lemon-lime',
    name: 'Lemon Lime',
    category: 'fun',
    description: 'Zesty yellow-green',
    preview: ['#1a2e05', '#65a30d', '#a3e635', '#ecfccb'],
    brandScale: {
      '25': '#f7fee7', '50': '#f7fee7', '100': '#ecfccb', '200': '#d9f99d',
      '300': '#bef264', '400': '#a3e635', '500': '#84cc16', '600': '#65a30d',
      '700': '#4d7c0f', '800': '#3f6212', '900': '#365314', '950': '#1a2e05',
    },
  },
  {
    id: 'falling-leaves',
    name: 'Falling Leaves',
    category: 'fun',
    description: 'Warm autumn red',
    preview: ['#450a0a', '#dc2626', '#f87171', '#fee2e2'],
    brandScale: {
      '25': '#fef7f7', '50': '#fef2f2', '100': '#fee2e2', '200': '#fecaca',
      '300': '#fca5a5', '400': '#f87171', '500': '#ef4444', '600': '#dc2626',
      '700': '#b91c1c', '800': '#991b1b', '900': '#7f1d1d', '950': '#450a0a',
    },
  },
  {
    id: 'sunrise',
    name: 'Sunrise',
    category: 'fun',
    description: 'Golden morning warmth',
    preview: ['#451a03', '#d97706', '#fbbf24', '#fef3c7'],
    brandScale: {
      '25': '#fffbeb', '50': '#fffbeb', '100': '#fef3c7', '200': '#fde68a',
      '300': '#fcd34d', '400': '#fbbf24', '500': '#f59e0b', '600': '#d97706',
      '700': '#b45309', '800': '#92400e', '900': '#78350f', '950': '#451a03',
    },
  },

  // ════════════════════════════════════════════════════════════
  // UPDATED CLASSICS
  // ════════════════════════════════════════════════════════════
  {
    id: 'choco-mint',
    name: 'Choco Mint',
    category: 'classic',
    description: 'Chocolate meets mint',
    preview: ['#062a1c', '#118256', '#3ec98e', '#c9f0dd'],
    brandScale: {
      '25': '#f2fbf6', '50': '#e6f8ef', '100': '#c9f0dd', '200': '#97e3bf',
      '300': '#5fd09d', '400': '#3ec98e', '500': '#1aab70', '600': '#118256',
      '700': '#0f6a47', '800': '#0e553a', '900': '#0c4630', '950': '#062a1c',
    },
  },
  {
    id: 'cmyk',
    name: 'CMYK',
    category: 'classic',
    description: 'Bright print cyan',
    preview: ['#003244', '#008fba', '#47daff', '#c0f2ff'],
    brandScale: {
      '25': '#edfcff', '50': '#e0f9ff', '100': '#c0f2ff', '200': '#85e8ff',
      '300': '#47daff', '400': '#14c8f6', '500': '#00b0dd', '600': '#008fba',
      '700': '#007396', '800': '#005f7d', '900': '#004e67', '950': '#003244',
    },
  },
  {
    id: 'haberdashery',
    name: 'Haberdashery',
    category: 'classic',
    description: 'Old-world golden warmth',
    preview: ['#38210c', '#ae7813', '#d9ab2e', '#f5ecc8'],
    brandScale: {
      '25': '#fdfbf4', '50': '#fbf7e8', '100': '#f5ecc8', '200': '#edd98e',
      '300': '#e3c254', '400': '#d9ab2e', '500': '#c99318', '600': '#ae7813',
      '700': '#8d5d13', '800': '#744a16', '900': '#603d17', '950': '#38210c',
    },
  },
  {
    id: 'hoth',
    name: 'Hoth',
    category: 'classic',
    description: 'Icy cold blue-white',
    preview: ['#212c37', '#517698', '#82a5c3', '#e1eaf1'],
    brandScale: {
      '25': '#f8fafb', '50': '#f1f5f8', '100': '#e1eaf1', '200': '#c8d8e6',
      '300': '#a6c0d6', '400': '#82a5c3', '500': '#668dae', '600': '#517698',
      '700': '#43617d', '800': '#3a5167', '900': '#334455', '950': '#212c37',
    },
  },
  {
    id: 'ochin',
    name: 'Ochin',
    category: 'classic',
    description: 'Deep steel ocean blue',
    preview: ['#19212d', '#3d5a7e', '#6b94b8', '#d3dfea'],
    brandScale: {
      '25': '#f4f7fa', '50': '#e9eff5', '100': '#d3dfea', '200': '#afc3d8',
      '300': '#85a3c2', '400': '#6b94b8', '500': '#4d7296', '600': '#3d5a7e',
      '700': '#344a67', '800': '#2d3d54', '900': '#273447', '950': '#19212d',
    },
  },
  {
    id: 'sweet-treat',
    name: 'Sweet Treat',
    category: 'classic',
    description: 'Candy coral warmth',
    preview: ['#490f09', '#e63518', '#ff7052', '#ffe2db'],
    brandScale: {
      '25': '#fff7f5', '50': '#fff2ee', '100': '#ffe2db', '200': '#ffc2b4',
      '300': '#ff9a83', '400': '#ff7052', '500': '#f94f2f', '600': '#e63518',
      '700': '#c22912', '800': '#a02514', '900': '#842517', '950': '#490f09',
    },
  },
];

export const DEFAULT_THEME_ID = 'mood-indigo';

export const getThemeById = (id: string): ThemePreset | undefined =>
  THEMES.find(t => t.id === id);
