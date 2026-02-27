import React, { useState, useRef } from 'react';
import {
  User as UserIcon, Shield, Sun, Moon, Palette, Check,
  Copy, ClipboardPaste, ChevronDown, ChevronUp, Pipette,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  THEMES, THEME_CATEGORIES, CUSTOM_THEME_LABELS,
  customColorsToString, stringToCustomColors, customColorsToPreview,
  type CustomThemeColors,
} from '@/config/themes';
import { Card, Badge } from '@/components/ui';
import { cx } from '@/utils/cx';

const ThemeSwatch: React.FC<{ preview: [string, string, string, string]; size?: 'sm' | 'md' }> = ({ preview, size = 'md' }) => (
  <div className={cx(
    'relative rounded-lg overflow-hidden shadow-sm',
    size === 'md' ? 'w-full aspect-[4/3]' : 'w-10 h-7 flex-shrink-0'
  )}>
    <div className="absolute inset-y-0 left-0 w-[30%]" style={{ backgroundColor: preview[0] }} />
    <div className="absolute inset-y-0 left-[30%] right-0" style={{ backgroundColor: preview[3] }} />
    <div className="absolute top-[20%] left-[30%] right-[10%] h-[18%] rounded-r-sm" style={{ backgroundColor: preview[1] }} />
    <div className="absolute top-[48%] left-[30%] right-[25%] h-[12%] rounded-r-sm" style={{ backgroundColor: preview[2], opacity: 0.7 }} />
    <div className="absolute bottom-[15%] left-[38%] w-[10%] aspect-square rounded-full" style={{ backgroundColor: preview[1] }} />
  </div>
);

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { theme, setTheme, colorTheme, setColorTheme, customColors, setCustomColors } = useTheme();
  const [showCustom, setShowCustom] = useState(colorTheme === 'custom');
  const [pasteValue, setPasteValue] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [pasteError, setPasteError] = useState('');
  const pasteRef = useRef<HTMLInputElement>(null);

  const handleColorChange = (key: keyof CustomThemeColors, value: string) => {
    setCustomColors({ ...customColors, [key]: value });
  };

  const handleCopyString = () => {
    const str = customColorsToString(customColors);
    navigator.clipboard.writeText(str);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handlePasteString = () => {
    setPasteError('');
    const parsed = stringToCustomColors(pasteValue.trim());
    if (parsed) {
      setCustomColors(parsed);
      setPasteValue('');
    } else {
      setPasteError('Invalid format. Paste 8 comma-separated hex colors (e.g. #1e1b4b,#312e81,...)');
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setPasteValue(text);
      const parsed = stringToCustomColors(text.trim());
      if (parsed) {
        setCustomColors(parsed);
        setPasteValue('');
        setPasteError('');
      }
    } catch {
      pasteRef.current?.focus();
    }
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-6 animate-fade-in-up max-w-4xl">
      {/* Profile Info */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-brand-50 dark:bg-brand-900/20">
            <UserIcon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Profile Information
            </h3>
            <p className="text-xs text-gray-400 dark:text-zinc-500">
              Your account details
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400 dark:text-zinc-500">Name</p>
            <p className="text-sm font-medium mt-0.5 text-gray-900 dark:text-white">{user?.name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 dark:text-zinc-500">Email</p>
            <p className="text-sm font-medium mt-0.5 text-gray-900 dark:text-white">{user?.email}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 dark:text-zinc-500">Role</p>
            <Badge variant="brand" size="md" className="mt-0.5">
              <Shield className="w-3 h-3" />
              {user?.role}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-gray-400 dark:text-zinc-500">Department</p>
            <p className="text-sm font-medium mt-0.5 text-gray-900 dark:text-white">{user?.department || '-'}</p>
          </div>
        </div>
      </Card>

      {/* Appearance / Theme */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-brand-50 dark:bg-brand-900/20">
            <Palette className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Appearance</h3>
            <p className="text-xs text-gray-400 dark:text-zinc-500">Customize your theme and color scheme</p>
          </div>
        </div>

        {/* Light / Dark Toggle */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-3">Mode</p>
          <div className="inline-flex rounded-xl p-1 bg-gray-100 dark:bg-zinc-800/60">
            <button
              onClick={() => setTheme('light')}
              className={cx(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                theme === 'light'
                  ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300'
              )}
            >
              <Sun className="w-4 h-4" />
              Light
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={cx(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                theme === 'dark'
                  ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300'
              )}
            >
              <Moon className="w-4 h-4" />
              Dark
            </button>
          </div>
        </div>

        {/* Color Theme Categories */}
        <div className="mb-6 space-y-5">
          {THEME_CATEGORIES.map(cat => {
            const categoryThemes = THEMES.filter(t => t.category === cat.id);
            if (categoryThemes.length === 0) return null;
            return (
              <div key={cat.id}>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-3">{cat.label}</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                  {categoryThemes.map(t => {
                    const isActive = colorTheme === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => { setColorTheme(t.id); setShowCustom(false); }}
                        title={t.description}
                        className={cx(
                          'group relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all',
                          isActive
                            ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-900/10 shadow-sm'
                            : 'border-transparent bg-gray-50 dark:bg-zinc-800/40 hover:bg-gray-100 dark:hover:bg-zinc-800/60 hover:border-gray-200 dark:hover:border-zinc-700'
                        )}
                      >
                        <ThemeSwatch preview={t.preview} />
                        <span className={cx(
                          'text-xs font-medium truncate w-full text-center',
                          isActive ? 'text-brand-700 dark:text-brand-400' : 'text-gray-600 dark:text-zinc-400'
                        )}>
                          {t.name}
                        </span>
                        {isActive && (
                          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center shadow-sm">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Custom theme section */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-3">Custom</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
              <button
                onClick={() => {
                  setShowCustom(true);
                  if (colorTheme !== 'custom') setCustomColors(customColors);
                }}
                className={cx(
                  'group relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all',
                  colorTheme === 'custom'
                    ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-900/10 shadow-sm'
                    : 'border-transparent bg-gray-50 dark:bg-zinc-800/40 hover:bg-gray-100 dark:hover:bg-zinc-800/60 hover:border-gray-200 dark:hover:border-zinc-700'
                )}
              >
                <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden shadow-sm bg-gradient-to-br from-gray-200 to-gray-300 dark:from-zinc-700 dark:to-zinc-800 flex items-center justify-center">
                  {colorTheme === 'custom' ? (
                    <ThemeSwatch preview={customColorsToPreview(customColors)} />
                  ) : (
                    <Pipette className="w-5 h-5 text-gray-400 dark:text-zinc-500" />
                  )}
                </div>
                <span className={cx(
                  'text-xs font-medium',
                  colorTheme === 'custom' ? 'text-brand-700 dark:text-brand-400' : 'text-gray-600 dark:text-zinc-400'
                )}>
                  Your Colors
                </span>
                {colorTheme === 'custom' && (
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center shadow-sm">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Custom Theme Configuration (collapsible) */}
        <div className={cx(
          'border rounded-xl transition-all overflow-hidden',
          'border-gray-200 dark:border-zinc-700/50',
          showCustom ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 border-0'
        )}>
          <button
            onClick={() => setShowCustom(!showCustom)}
            className="w-full flex items-center justify-between p-4 text-left"
          >
            <div className="flex items-center gap-2">
              <Pipette className="w-4 h-4 text-brand-500" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Custom Theme</span>
              <span className="text-xs text-gray-400 dark:text-zinc-500">— customize each color</span>
            </div>
            {showCustom ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>

          {showCustom && (
            <div className="px-4 pb-4 space-y-4">
              {/* Live preview */}
              <div className="flex items-center gap-4">
                <div className="w-24">
                  <ThemeSwatch preview={customColorsToPreview(customColors)} />
                </div>
                <p className="text-xs text-gray-400 dark:text-zinc-500">
                  Live preview of your custom colors. Changes apply instantly.
                </p>
              </div>

              {/* Color inputs grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {CUSTOM_THEME_LABELS.map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-1.5">
                      {label}
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <input
                          type="color"
                          value={customColors[key]}
                          onChange={e => handleColorChange(key, e.target.value)}
                          className="w-8 h-8 rounded-lg cursor-pointer border-2 border-gray-200 dark:border-zinc-600 p-0 appearance-none"
                          style={{ backgroundColor: customColors[key] }}
                        />
                      </div>
                      <input
                        type="text"
                        value={customColors[key]}
                        onChange={e => {
                          const v = e.target.value;
                          if (/^#[0-9a-fA-F]{0,6}$/.test(v)) {
                            handleColorChange(key, v);
                          }
                        }}
                        onBlur={e => {
                          const v = e.target.value;
                          if (!/^#[0-9a-fA-F]{6}$/.test(v)) {
                            handleColorChange(key, customColors[key]);
                          }
                        }}
                        className="flex-1 min-w-0 text-xs font-mono px-2 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300"
                        maxLength={7}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Copy / Paste string */}
              <div className="border-t border-gray-200 dark:border-zinc-700/50 pt-4 space-y-3">
                <p className="text-xs text-gray-500 dark:text-zinc-400">
                  Share your custom theme or paste one from a colleague — 8 comma-separated hex colors.
                </p>

                {/* Copy current */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0 text-xs font-mono px-3 py-2 rounded-lg bg-gray-50 dark:bg-zinc-800/60 text-gray-600 dark:text-zinc-400 truncate border border-gray-200 dark:border-zinc-700">
                    {customColorsToString(customColors)}
                  </div>
                  <button
                    onClick={handleCopyString}
                    className={cx(
                      'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all',
                      copyFeedback
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                        : 'bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-600'
                    )}
                  >
                    {copyFeedback ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copyFeedback ? 'Copied!' : 'Copy'}
                  </button>
                </div>

                {/* Paste */}
                <div className="flex items-center gap-2">
                  <input
                    ref={pasteRef}
                    type="text"
                    value={pasteValue}
                    onChange={e => { setPasteValue(e.target.value); setPasteError(''); }}
                    placeholder="Paste theme colors here..."
                    className="flex-1 min-w-0 text-xs font-mono px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 placeholder:text-gray-300 dark:placeholder:text-zinc-600"
                    onKeyDown={e => { if (e.key === 'Enter') handlePasteString(); }}
                  />
                  <button
                    onClick={pasteValue ? handlePasteString : handlePasteFromClipboard}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-all"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5" />
                    {pasteValue ? 'Apply' : 'Paste'}
                  </button>
                </div>
                {pasteError && (
                  <p className="text-xs text-red-500 dark:text-red-400">{pasteError}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
