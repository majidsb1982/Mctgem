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

  // Apply dark/light theme to document root
  useEffect(() => {
    try {
      const isDark =
        state.settings.theme === 'dark' ||
        (state.settings.theme === 'auto' &&
          typeof window !== 'undefined' &&
          typeof window.matchMedia === 'function' &&
          window.matchMedia('(prefers-color-scheme: dark)').matches);

      if (typeof document !== 'undefined') {
        if (isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    } catch {
      // Ignore theme switch errors in restricted environments
    }
  }, [state.settings.theme]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-500 selection:text-white transition-colors duration-200">
      <Header
        currentScreen={currentScreen}
        onNavigate={setCurrentScreen}
        state={state}
        onUpdateState={updateState}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
      />

      <main className="max-w-3xl mx-auto px-4 pt-4 pb-24">
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
