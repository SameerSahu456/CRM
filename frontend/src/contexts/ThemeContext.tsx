import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  getThemeById, DEFAULT_THEME_ID,
  generateBrandScale, customColorsToString, stringToCustomColors,
  DEFAULT_CUSTOM_COLORS,
  type CustomThemeColors,
} from '@/config/themes';

/** Sidebar-specific CSS variables derived from the brand scale + light/dark mode */
function applySidebarVars(brandScale: Record<string, string>, mode: 'light' | 'dark') {
  const root = document.documentElement;
  if (mode === 'dark') {
    root.style.setProperty('--sidebar-bg', brandScale['950']);
    root.style.setProperty('--sidebar-bg-hover', brandScale['900']);
    root.style.setProperty('--sidebar-active-bg', brandScale['800']);
    root.style.setProperty('--sidebar-active-text', brandScale['100']);
    root.style.setProperty('--sidebar-text', brandScale['200']);
    root.style.setProperty('--sidebar-text-muted', brandScale['400']);
    root.style.setProperty('--sidebar-border', brandScale['900']);
    root.style.setProperty('--sidebar-accent', brandScale['400']);
  } else {
    root.style.setProperty('--sidebar-bg', brandScale['50']);
    root.style.setProperty('--sidebar-bg-hover', brandScale['100']);
    root.style.setProperty('--sidebar-active-bg', brandScale['600']);
    root.style.setProperty('--sidebar-active-text', '#ffffff');
    root.style.setProperty('--sidebar-text', brandScale['800']);
    root.style.setProperty('--sidebar-text-muted', brandScale['500']);
    root.style.setProperty('--sidebar-border', brandScale['200']);
    root.style.setProperty('--sidebar-accent', brandScale['600']);
  }
}

/** Apply sidebar vars from custom theme colors directly (Slack-style 8 inputs) */
function applySidebarVarsCustom(colors: CustomThemeColors) {
  const root = document.documentElement;
  root.style.setProperty('--sidebar-bg', colors.columnBg);
  root.style.setProperty('--sidebar-bg-hover', colors.menuBgHover);
  root.style.setProperty('--sidebar-active-bg', colors.activeItem);
  root.style.setProperty('--sidebar-active-text', colors.activeItemText);
  root.style.setProperty('--sidebar-text', colors.textColor);
  root.style.setProperty('--sidebar-text-muted', colors.hoverItem);
  root.style.setProperty('--sidebar-border', colors.hoverItem);
  root.style.setProperty('--sidebar-accent', colors.activePresence);
}

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  colorTheme: string;
  setColorTheme: (id: string) => void;
  customColors: CustomThemeColors;
  setCustomColors: (colors: CustomThemeColors) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function applyBrandScale(scale: Record<string, string>) {
  const root = document.documentElement;
  for (const [shade, value] of Object.entries(scale)) {
    root.style.setProperty(`--color-brand-${shade}`, value);
  }
}

function loadCustomColors(): CustomThemeColors {
  try {
    const raw = localStorage.getItem('comprint-custom-colors');
    if (raw) {
      const parsed = stringToCustomColors(raw);
      if (parsed) return parsed;
    }
  } catch { /* ignore */ }
  return DEFAULT_CUSTOM_COLORS;
}

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('comprint-theme') as Theme;
      if (saved) return saved;
    }
    return 'dark';
  });

  const [colorTheme, setColorThemeState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      let saved = localStorage.getItem('comprint-color-theme') || DEFAULT_THEME_ID;
      // Migrate legacy theme IDs
      const LEGACY_MAP: Record<string, string> = {
        indigo: 'mood-indigo', ocean: 'tritanopia', emerald: 'jade',
        sunset: 'clementine', rose: 'raspberry-beret', violet: 'pb-and-j',
        teal: 'mint-chip', slate: 'big-business', amber: 'sunrise',
      };
      if (LEGACY_MAP[saved]) {
        saved = LEGACY_MAP[saved];
        localStorage.setItem('comprint-color-theme', saved);
      }
      return saved;
    }
    return DEFAULT_THEME_ID;
  });

  const [customColors, setCustomColorsState] = useState<CustomThemeColors>(loadCustomColors);

  // Apply light/dark class
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('comprint-theme', theme);
  }, [theme]);

  // Apply color theme + sidebar variables
  useEffect(() => {
    if (colorTheme === 'custom') {
      const scale = generateBrandScale(customColors);
      applyBrandScale(scale);
      applySidebarVarsCustom(customColors);
    } else {
      const preset = getThemeById(colorTheme);
      if (preset) {
        applyBrandScale(preset.brandScale);
        applySidebarVars(preset.brandScale, theme);
      } else {
        const def = getThemeById(DEFAULT_THEME_ID);
        if (def) {
          applyBrandScale(def.brandScale);
          applySidebarVars(def.brandScale, theme);
        }
      }
    }
    localStorage.setItem('comprint-color-theme', colorTheme);
  }, [colorTheme, customColors, theme]);

  const toggleTheme = () => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const setColorTheme = (id: string) => {
    setColorThemeState(id);
  };

  const setCustomColors = useCallback((colors: CustomThemeColors) => {
    setCustomColorsState(colors);
    localStorage.setItem('comprint-custom-colors', customColorsToString(colors));
    // If currently on custom theme, the useEffect above will re-apply
    if (colorTheme !== 'custom') {
      setColorThemeState('custom');
    }
  }, [colorTheme]);

  return (
    <ThemeContext.Provider value={{
      theme, toggleTheme, setTheme,
      colorTheme, setColorTheme,
      customColors, setCustomColors,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
