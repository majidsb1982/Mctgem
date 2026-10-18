import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronRight,
  Maximize,
  Minimize,
  Moon,
  MoreHorizontal,
  Settings,
  Sun,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { AppState } from '../types';
import { IconButton } from './ui';

interface HeaderProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  state: AppState;
  onUpdateState: (fn: (prev: AppState) => AppState) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

const SCREEN_META: Record<string, { title: string; subtitle: string }> = {
  home: { title: '', subtitle: 'دستیار گروه درمانی' },
  attend: { title: 'تماس‌های نوبت ۱', subtitle: 'پیگیری اعضا قبل از کلاس' },
  entry: { title: 'ثبت ورود — نوبت ۲', subtitle: 'لحظات پشت در کلاس' },
  fees: { title: 'شهریه جلسه', subtitle: 'واریزها و پیگیری بدهکاران' },
  members: { title: 'اعضا و حامیان', subtitle: 'مشخصات، نقش‌ها و تماس‌ها' },
  homework: { title: 'تکالیف کلاسی', subtitle: 'ثبت و آرشیو تمرین‌ها' },
  reports: { title: 'گزارش‌ها و ارتباطات', subtitle: 'خروجی برای حامیان و درمانگر' },
  period: { title: 'دوره و مسئولان', subtitle: 'انتصاب مسئولان این دوره' },
  settings: { title: 'تنظیمات', subtitle: 'ظاهر، برنامه کلاسی و پشتیبان' },
  more: { title: 'سایر بخش‌ها', subtitle: 'ابزارهای تکمیلی' },
};

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigate,
  state,
  onUpdateState,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const isDark =
    state?.settings?.theme === 'dark' ||
    (state?.settings?.theme === 'auto' &&
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      !!window.matchMedia('(prefers-color-scheme: dark)')?.matches);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const toggleTheme = () => {
    onUpdateState((prev) => ({
      ...prev,
      settings: { ...prev.settings, theme: isDark ? 'light' : 'dark' },
    }));
  };

  const toggleSound = () => {
    onUpdateState((prev) => ({
      ...prev,
      settings: { ...prev.settings, sound: !prev.settings.sound },
    }));
  };

  const meta = SCREEN_META[currentScreen] || SCREEN_META.home;
  const isHome = currentScreen === 'home';
  const title = isHome ? state.settings.className || 'My-Class-Track' : meta.title;

  return (
    <header className="sticky top-0 z-40 pt-safe bg-surface/85 backdrop-blur-lg border-b border-line">
      <div className="max-w-3xl mx-auto px-3 h-16 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {isHome ? (
            <div className="w-10 h-10 shrink-0 rounded-xl bg-accent text-accent-fg flex items-center justify-center font-extrabold text-lg shadow-sm shadow-accent/30">
              M
            </div>
          ) : (
            <IconButton
              aria-label="بازگشت به خانه"
              onClick={() => onNavigate('home')}
              className="-ms-1"
            >
              <ChevronRight size={22} />
            </IconButton>
          )}

          <div className="min-w-0">
            <h1 className="font-extrabold text-[15px] text-ink leading-6 truncate">{title}</h1>
            <p className="text-[11px] font-semibold text-accent-ink leading-4 truncate">
              {meta.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-0.5 shrink-0" ref={menuRef}>
          <IconButton
            aria-label={isDark ? 'روشن‌کردن تم' : 'تیره‌کردن تم'}
            onClick={toggleTheme}
            title={isDark ? 'تم روشن' : 'تم تیره'}
          >
            {isDark ? <Sun size={19} className="text-warn" /> : <Moon size={19} />}
          </IconButton>

          <div className="relative">
            <IconButton
              aria-label="ابزارهای بیشتر"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              active={menuOpen}
            >
              <MoreHorizontal size={20} />
            </IconButton>

            {menuOpen && (
              <div className="absolute end-0 top-12 w-52 rounded-card bg-surface border border-line shadow-xl p-1.5 animate-fade-in">
                <button
                  onClick={() => {
                    toggleSound();
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 h-11 rounded-field text-sm font-semibold text-ink hover:bg-surface-2 transition-colors"
                >
                  {state.settings.sound ? (
                    <Volume2 size={17} className="text-accent-ink" />
                  ) : (
                    <VolumeX size={17} className="text-muted" />
                  )}
                  <span className="flex-1 text-start">
                    {state.settings.sound ? 'صدا فعال است' : 'صدا خاموش است'}
                  </span>
                </button>

                <button
                  onClick={() => {
                    onToggleFullscreen();
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 h-11 rounded-field text-sm font-semibold text-ink hover:bg-surface-2 transition-colors"
                >
                  {isFullscreen ? <Minimize size={17} /> : <Maximize size={17} />}
                  <span className="flex-1 text-start">
                    {isFullscreen ? 'خروج از تمام‌صفحه' : 'تمام‌صفحه'}
                  </span>
                </button>

                <button
                  onClick={() => {
                    onNavigate('settings');
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 h-11 rounded-field text-sm font-semibold text-ink hover:bg-surface-2 transition-colors"
                >
                  <Settings size={17} />
                  <span className="flex-1 text-start">تنظیمات</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
