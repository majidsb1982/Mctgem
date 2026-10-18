import React, { useState, useEffect } from 'react';
import { AppState } from './types';
import { loadState, saveState, resetToDemo, resetToEmpty } from './utils/storage';
import { getNextClass, toKey, today } from './utils/jalali';
import { Header } from './components/Header';
import { Nav } from './components/Nav';
import { HomeScreen } from './screens/HomeScreen';
import { AttendScreen } from './screens/AttendScreen';
import { EntryScreen } from './screens/EntryScreen';
import { FeesScreen } from './screens/FeesScreen';
import { MembersScreen } from './screens/MembersScreen';
import { HomeworkScreen } from './screens/HomeworkScreen';
import { ReportsScreen } from './screens/ReportsScreen';
import { PeriodScreen } from './screens/PeriodScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { MoreScreen } from './screens/MoreScreen';

const THEME_COLOR: Record<string, string> = {
  blue: '#2f5fe0',
  teal: '#0f9b8e',
  purple: '#7c3aed',
  warm: '#c96a2b',
};

export const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => loadState());
  const [currentScreen, setCurrentScreen] = useState<string>('home');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Compute active session key (current/next class date or today)
  const nextClass = getNextClass(state.classes, state.extra);
  const defaultSessionKey = nextClass ? toKey(nextClass.date) : toKey(today());
  const [activeSessionKey, setActiveSessionKey] = useState<string>(
    state._lastSession || defaultSessionKey
  );

  // Sync state to localStorage whenever it changes
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Apply theme, accent and font-size to <html>; keep the browser chrome in sync.
  useEffect(() => {
    const root = document.documentElement;
    const media =
      typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-color-scheme: dark)')
        : null;

    const apply = () => {
      const pref = state.settings.theme || 'auto';
      const isDark = pref === 'dark' || (pref !== 'light' && !!media?.matches);
      root.classList.toggle('dark', isDark);

      const accent = state.settings.color || 'blue';
      root.dataset.accent = accent;
      root.dataset.fs = state.settings.fs || 'm';

      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) {
        meta.setAttribute('content', isDark ? '#0d1219' : THEME_COLOR[accent] || THEME_COLOR.blue);
      }
    };

    apply();

    if (state.settings.theme === 'auto' && media) {
      media.addEventListener?.('change', apply);
      return () => media.removeEventListener?.('change', apply);
    }
  }, [state.settings.theme, state.settings.color, state.settings.fs]);

  // Each screen starts at the top.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [currentScreen]);

  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        if (typeof document.documentElement.requestFullscreen === 'function') {
          document.documentElement.requestFullscreen().catch(() => {});
          setIsFullscreen(true);
        }
      } else {
        if (typeof document.exitFullscreen === 'function') {
          document.exitFullscreen().catch(() => {});
        }
        setIsFullscreen(false);
      }
    } catch {
      // Mobile Safari doesn't support document.requestFullscreen
    }
  };

  const updateState = (fn: (prev: AppState) => AppState) => {
    setState((prev) => fn(prev));
  };

  const handleSelectSession = (key: string) => {
    setActiveSessionKey(key);
    updateState((prev) => ({ ...prev, _lastSession: key }));
  };

  const handleResetToDemo = () => {
    const demo = resetToDemo();
    setState(demo);
    setActiveSessionKey(demo._lastSession || defaultSessionKey);
  };

  const handleResetToEmpty = () => {
    const clean = resetToEmpty();
    setState(clean);
    setActiveSessionKey(clean._lastSession || defaultSessionKey);
  };

  return (
    <div className="min-h-dvh bg-bg text-ink font-sans transition-colors duration-200">
      <Header
        currentScreen={currentScreen}
        onNavigate={setCurrentScreen}
        state={state}
        onUpdateState={updateState}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
      />

      <main className="max-w-3xl mx-auto px-4 pt-4 pb-28">
        <div key={currentScreen}>
          {currentScreen === 'home' && (
            <HomeScreen
              state={state}
              onNavigate={setCurrentScreen}
              activeSessionKey={activeSessionKey}
              onResetDemo={handleResetToDemo}
              onResetToEmpty={handleResetToEmpty}
            />
          )}

          {currentScreen === 'attend' && (
            <AttendScreen
              state={state}
              onUpdateState={updateState}
              onNavigate={setCurrentScreen}
              activeSessionKey={activeSessionKey}
              onSelectSession={handleSelectSession}
            />
          )}

          {currentScreen === 'entry' && (
            <EntryScreen
              state={state}
              onUpdateState={updateState}
              activeSessionKey={activeSessionKey}
              onNavigate={setCurrentScreen}
              onSelectSession={handleSelectSession}
            />
          )}

          {currentScreen === 'fees' && (
            <FeesScreen
              state={state}
              onUpdateState={updateState}
              activeSessionKey={activeSessionKey}
              onNavigate={setCurrentScreen}
              onSelectSession={handleSelectSession}
            />
          )}

          {currentScreen === 'members' && (
            <MembersScreen
              state={state}
              onUpdateState={updateState}
              onResetDemo={handleResetToDemo}
              onResetToEmpty={handleResetToEmpty}
            />
          )}

          {currentScreen === 'homework' && (
            <HomeworkScreen
              state={state}
              onUpdateState={updateState}
              activeSessionKey={activeSessionKey}
            />
          )}

          {currentScreen === 'reports' && (
            <ReportsScreen
              state={state}
              activeSessionKey={activeSessionKey}
              onSelectSession={handleSelectSession}
            />
          )}

          {currentScreen === 'period' && (
            <PeriodScreen
              state={state}
              onUpdateState={updateState}
              onNavigate={setCurrentScreen}
            />
          )}

          {currentScreen === 'settings' && (
            <SettingsScreen
              state={state}
              onUpdateState={updateState}
              onResetDemo={handleResetToDemo}
              onResetToEmpty={handleResetToEmpty}
            />
          )}

          {currentScreen === 'more' && (
            <MoreScreen onNavigate={setCurrentScreen} state={state} />
          )}
        </div>
      </main>

      <Nav
        currentScreen={currentScreen}
        onNavigate={setCurrentScreen}
        state={state}
        activeSessionKey={activeSessionKey}
      />
    </div>
  );
};
