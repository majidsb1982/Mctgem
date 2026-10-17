import { AppState } from '../types';
import { getDemoState } from './demoData';
import { today, toKey, getNextClass } from './jalali';

export const STORAGE_KEY = 'mct:data';

// Clean initial state with NO pre-populated members (empty class as requested)
export function getCleanInitialState(): AppState {
  const currentToday = today();
  const defaultClasses = [{ dow: 3, start: '19:00', end: '21:00' }]; // چهارشنبه‌ها ۱۹ تا ۲۱
  const nextCls = getNextClass(defaultClasses, []);
  const sessionKey = nextCls ? toKey(nextCls.date) : toKey(currentToday);

  return {
    v: 24,
    members: [], // کاملاً خالی از اعضای پیش‌فرض
    classes: defaultClasses,
    extra: [],
    sessions: {},
    fees: {},
    homework: [],
    groups: ['عمومی', 'گروه الف'],
    users: [{ id: 'u-admin', name: 'مدیر', pin: '0000', role: 'admin' }],
    currentUserId: null,
    period: {
      title: 'دوره فعال',
      attendIds: [],
      feeIds: [],
      hwIds: [],
      note: 'کلاس رشد و خودشناسی',
    },
    doorChecks: {},
    activityLog: [],
    pinnedMembers: [],
    sessionNotes: {},
    settings: {
      theme: 'auto',
      fs: 'm',
      color: 'blue',
      alarmTimes: [15, 8, 5, 3],
      sound: true,
      className: 'گروه درمانی رشد و خودآگاهی',
      maxSessions: 40,
      privacyMode: false,
      hidePrivateInReports: true,
      requireLogin: false,
      quickConfirm: true,
      feeDeadlineDays: 1,
      smartSort: true,
      onlyMine: false,
    },
    _lastSession: sessionKey,
    _lastFee: sessionKey,
    timer: null,
  };
}

export const DEFAULT_STATE: AppState = getCleanInitialState();

// Safe storage with in-memory fallback for restricted iframes and Safari private browsing
const memoryStore: Record<string, string> = {};

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // Storage access blocked or denied
    }
    return memoryStore[key] ?? null;
  },
  setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // Storage access blocked or denied
    }
    memoryStore[key] = value;
  },
  removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Storage access blocked
    }
    delete memoryStore[key];
  },
};

export function loadState(): AppState {
  let raw: string | null = null;
  try {
    raw = safeStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getCleanInitialState();
      saveState(initial);
      return initial;
    }
    const data = JSON.parse(raw);

    if (!data || typeof data !== 'object') {
      const initial = getCleanInitialState();
      saveState(initial);
      return initial;
    }

    // Defensive normalization: Keep members as array, but DO NOT force demo members
    if (!Array.isArray(data.members)) {
      data.members = [];
    }

    if (!Array.isArray(data.classes) || data.classes.length === 0) {
      data.classes = DEFAULT_STATE.classes;
    }
    if (!Array.isArray(data.extra)) data.extra = [];
    if (!data.sessions || typeof data.sessions !== 'object') data.sessions = {};
    if (!data.fees || typeof data.fees !== 'object') data.fees = {};
    if (!Array.isArray(data.homework)) data.homework = [];
    if (!Array.isArray(data.groups) || data.groups.length === 0) {
      data.groups = ['عمومی', 'گروه الف'];
    }
    if (!Array.isArray(data.users) || data.users.length === 0) {
      data.users = DEFAULT_STATE.users;
    }
    if (!data.period || typeof data.period !== 'object') {
      data.period = DEFAULT_STATE.period;
    }
    if (!Array.isArray(data.period.attendIds)) data.period.attendIds = [];
    if (!Array.isArray(data.period.feeIds)) data.period.feeIds = [];
    if (!Array.isArray(data.period.hwIds)) data.period.hwIds = [];
    if (!data.doorChecks || typeof data.doorChecks !== 'object') data.doorChecks = {};
    if (!Array.isArray(data.activityLog)) data.activityLog = [];
    if (!Array.isArray(data.pinnedMembers)) data.pinnedMembers = [];
    if (!data.sessionNotes || typeof data.sessionNotes !== 'object') data.sessionNotes = {};
    data.settings = { ...DEFAULT_STATE.settings, ...(data.settings || {}) };
    if (!Array.isArray(data.settings.alarmTimes)) {
      data.settings.alarmTimes = [15, 8, 5, 3];
    }

    // Migrate and sanitize members if any exist
    data.members.forEach((m: any) => {
      if (!m || typeof m !== 'object') return;
      if (!Array.isArray(m.phones)) m.phones = m.phone ? [m.phone] : [];
      if (!Array.isArray(m.roles)) m.roles = [];
      if (m.consentContact === undefined) m.consentContact = true;
      if (m.consentPhoto === undefined) m.consentPhoto = true;
      if (m.careFlag === undefined) m.careFlag = false;
      if (!Array.isArray(m.needs)) m.needs = [];
      if (m.privateNote === undefined) m.privateNote = '';
      if (!m.group) m.group = 'عمومی';
    });

    data.v = 24;
    return data;
  } catch (e) {
    console.warn('MCT: Error parsing stored data. Falling back to clean initial state.', e);
    const initial = getCleanInitialState();
    saveState(initial);
    return initial;
  }
}

export function saveState(state: AppState) {
  try {
    const raw = JSON.stringify(state);
    safeStorage.setItem(STORAGE_KEY, raw);
  } catch (e) {
    console.warn('Failed to save state:', e);
  }
}

// Reset to completely empty class (0 members)
export function resetToEmpty(): AppState {
  const clean = getCleanInitialState();
  saveState(clean);
  return clean;
}

// Optional: Explicitly load demo members on user request
export function resetToDemo(): AppState {
  const demo = getDemoState();
  saveState(demo);
  return demo;
}

export function generateUid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function getStorageStats(state: AppState) {
  try {
    const raw = safeStorage.getItem(STORAGE_KEY) || JSON.stringify(state);
    const bytes = new Blob([raw]).size;
    const kb = Math.round(bytes / 1024);
    const mb = (bytes / 1048576).toFixed(2);
    const pct = Math.min(100, Math.round((bytes / 5e6) * 100));
    return {
      bytes,
      kb,
      mb,
      pct,
      sessions: Object.keys(state.sessions || {}).length,
      members: Array.isArray(state.members) ? state.members.length : 0,
    };
  } catch (e) {
    return { bytes: 0, kb: 0, mb: '0', pct: 0, sessions: 0, members: 0 };
  }
}

export function pruneOldSessions(state: AppState, keepMax: number = 40): { state: AppState; prunedCount: number } {
  const newState = { ...state, sessions: { ...state.sessions }, fees: { ...state.fees } };
  const sessionKeys = Object.keys(newState.sessions).sort().reverse();
  let pruned = 0;
  for (let i = keepMax; i < sessionKeys.length; i++) {
    delete newState.sessions[sessionKeys[i]];
    pruned++;
  }
  const feeKeys = Object.keys(newState.fees).sort().reverse();
  for (let i = keepMax; i < feeKeys.length; i++) {
    delete newState.fees[feeKeys[i]];
  }
  saveState(newState);
  return { state: newState, prunedCount: pruned };
}
