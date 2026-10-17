export interface JalaliDate {
  jy: number;
  jm: number;
  jd: number;
}

export interface Member {
  id: string;
  name: string;
  phones: string[];
  birth?: JalaliDate | null;
  roles: string[]; // 'attend' | 'fee' | 'hw' | 'support'
  note?: string;
  privateNote?: string;
  needs?: string[];
  careFlag?: boolean;
  supporterId?: string | null;
  consentContact?: boolean;
  consentPhoto?: boolean;
  photo?: string | null;
  voice?: string | null;
  group?: string;
  streak?: number;
}

export interface ClassSchedule {
  dow: number; // 0=Sat, 1=Sun, 2=Mon, 3=Tue, 4=Wed, 5=Thu, 6=Fri
  start: string; // "19:00"
  end: string;   // "21:00"
}

export interface ExtraSession {
  key: string; // "1405-01-20"
  start: string;
  end: string;
}

export interface AttendanceStatus {
  p1?: 'present' | 'delay' | 'absent' | 'problem' | null;
  p2?: 'present' | 'delay' | 'absent' | 'problem' | null;
  time?: string;
  time2?: string;
  note?: string;
  note2?: string;
  a1?: string | null; // audio url/data
  a2?: string | null;
  by?: string;
}

export interface FeeStatus {
  paid?: boolean;
  fc?: 'promised' | 'noanswer' | 'paid' | null;
  date?: string;
  note?: string;
}

export interface HomeworkItem {
  id: string;
  key: string; // session date key
  text: string;
  audio?: string | null;
}

export interface PeriodData {
  title: string;
  attendIds: string[];
  feeIds: string[];
  hwIds: string[];
  note: string;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto' | null;
  fs: 's' | 'm' | 'l';
  color: 'blue' | 'teal' | 'purple' | 'warm';
  alarmTimes: number[];
  sound: boolean;
  className: string;
  maxSessions: number;
  privacyMode: boolean;
  hidePrivateInReports: boolean;
  requireLogin: boolean;
  quickConfirm: boolean;
  feeDeadlineDays: number;
  lastBackupAt?: string | null;
  autoTheme?: boolean;
  a11y?: boolean;
  focusMode?: boolean;
  oled?: boolean;
  smartSort?: boolean;
  onlyMine?: boolean;
}

export interface AppUser {
  id: string;
  name: string;
  pin: string;
  role: 'admin' | 'support' | 'follow' | 'view';
}

export interface AppState {
  v: number;
  members: Member[];
  classes: ClassSchedule[];
  extra: ExtraSession[];
  sessions: Record<string, Record<string, AttendanceStatus>>;
  fees: Record<string, Record<string, FeeStatus>>;
  homework: HomeworkItem[];
  groups: string[];
  users: AppUser[];
  currentUserId: string | null;
  period: PeriodData;
  doorChecks: Record<string, Record<string, boolean>>;
  activityLog: { text: string; time: number }[];
  pinnedMembers?: string[];
  sessionNotes: Record<string, string>;
  settings: AppSettings;
  _lastSession?: string;
  _lastFee?: string;
  timer?: { target: number; fired: number[] } | null;
}
