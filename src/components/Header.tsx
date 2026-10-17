import React from 'react';
import { ChevronRight, Home, Maximize, Minimize, Moon, Sun, Volume2, VolumeX } from 'lucide-react';
import { AppState } from '../types';

interface HeaderProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  state: AppState;
  onUpdateState: (fn: (prev: AppState) => AppState) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigate,
  state,
  onUpdateState,
  isFullscreen,
  onToggleFullscreen,
}) => {
  let isDark = false;
  try {
    isDark =
      state?.settings?.theme === 'dark' ||
      (state?.settings?.theme === 'auto' &&
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        !!window.matchMedia('(prefers-color-scheme: dark)')?.matches);
  } catch {
    isDark = false;
  }

  const toggleTheme = () => {
    onUpdateState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        theme: isDark ? 'light' : 'dark',
      },
    }));
  };

  const toggleSound = () => {
    onUpdateState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        sound: !prev.settings.sound,
      },
    }));
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-3xl mx-auto px-4 h-15 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          {currentScreen !== 'home' ? (
            <button
              onClick={() => onNavigate('home')}
              className="p-2 -mr-1 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="بازگشت به خانه"
            >
              <ChevronRight size={22} />
            </button>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-black text-lg shadow-md shadow-blue-500/20">
              M
            </div>
          )}

          <div>
            <h1 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white leading-none">
              {state.settings.className || 'My-Class-Track'}
            </h1>
            <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
              دستیار گروه درمانی
            </span>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          <button
            onClick={toggleSound}
            className={`p-2 rounded-xl transition-colors ${
              state.settings.sound
                ? 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30'
                : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={state.settings.sound ? 'صدا فعال است' : 'صدا غیرفعال است'}
            aria-label="تنظیم صدا"
          >
            {state.settings.sound ? <Volume2 size={19} /> : <VolumeX size={19} />}
          </button>

          <button
            onClick={onToggleFullscreen}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="تمام صفحه"
            aria-label="تمام صفحه"
          >
            {isFullscreen ? <Minimize size={19} /> : <Maximize size={19} />}
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isDark ? 'تم روشن' : 'تم تیره'}
            aria-label="تغییر تم"
          >
            {isDark ? <Sun size={19} className="text-amber-400" /> : <Moon size={19} />}
          </button>

          {currentScreen !== 'home' && (
            <button
              onClick={() => onNavigate('home')}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="صفحه اصلی"
              aria-label="صفحه اصلی"
            >
              <Home size={19} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
