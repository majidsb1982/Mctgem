import React, { useEffect, useState } from 'react';
import {
  DoorOpen,
  CheckCircle2,
  Clock,
  Bell,
  Share2,
  Users,
  Search,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AppState, Member, AttendanceStatus } from '../types';
import { getNextClass, toFa } from '../utils/jalali';
import { playAlertTone } from '../utils/audio';
import { getRoundReportText, copyToClipboard, shareText } from '../utils/reports';

interface EntryScreenProps {
  state: AppState;
  onUpdateState: (fn: (prev: AppState) => AppState) => void;
  activeSessionKey: string;
  onNavigate: (screen: string) => void;
  onSelectSession?: (key: string) => void;
}

export const EntryScreen: React.FC<EntryScreenProps> = ({
  state,
  onUpdateState,
  activeSessionKey,
  onNavigate,
  onSelectSession,
}) => {
  const [countdownText, setCountdownText] = useState('--:--');
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [doneTab, setDoneTab] = useState(false);
  const [search, setSearch] = useState('');
  const [reportModal, setReportModal] = useState<string | null>(null);

  const nextClass = getNextClass(state.classes, state.extra);
  const sessionData = state.sessions[activeSessionKey] || {};
  const doorState = state.doorChecks[activeSessionKey] || {};

  // Real-time ticking timer
  useEffect(() => {
    if (!nextClass) return;
    const targetMs = nextClass.t.getTime();

    function tick() {
      const remainingMs = targetMs - Date.now();
      const sec = Math.floor(remainingMs / 1000);
      setSecondsRemaining(sec);

      if (remainingMs <= 0) {
        setCountdownText('🎬 شروع شد!');
        return;
      }

      const mm = Math.floor(remainingMs / 60000);
      const ss = Math.floor((remainingMs % 60000) / 1000);
      setCountdownText(`${toFa(mm)}:${toFa(String(ss).padStart(2, '0'))}`);

      // Check alarm times (15, 8, 5, 3 min)
      const alertMinutes = state.settings.alarmTimes || [15, 8, 5, 3];
      for (const m of alertMinutes) {
        if (sec <= m * 60 && sec > m * 60 - 2) {
          if (state.settings.sound) {
            playAlertTone('chime');
          }
        }
      }
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [nextClass, state.settings.alarmTimes, state.settings.sound]);

  const toggleDoorCheck = (min: number) => {
    onUpdateState((prev) => {
      const currentChecks = prev.doorChecks[activeSessionKey] || {};
      const updated = { ...currentChecks, [String(min)]: !currentChecks[String(min)] };
      return {
        ...prev,
        doorChecks: {
          ...prev.doorChecks,
          [activeSessionKey]: updated,
        },
      };
    });
    playAlertTone('beep');
  };

  const setStatusP2 = (
    memberId: string,
    status: 'present' | 'delay' | 'absent' | 'problem'
  ) => {
    onUpdateState((prev) => {
      const prevSession = prev.sessions[activeSessionKey] || {};
      const cur = prevSession[memberId] || {};
      const isToggleOff = cur.p2 === status;

      return {
        ...prev,
        sessions: {
          ...prev.sessions,
          [activeSessionKey]: {
            ...prevSession,
            [memberId]: {
              ...cur,
              p2: isToggleOff ? null : status,
              time2: isToggleOff ? undefined : cur.time2 || (status === 'delay' ? '19:40' : undefined),
            },
          },
        },
      };
    });
    playAlertTone('beep');
  };

  const markAllPresent = () => {
    onUpdateState((prev) => {
      const prevSession = prev.sessions[activeSessionKey] || {};
      const updated: Record<string, AttendanceStatus> = { ...prevSession };
      let changed = 0;

      prev.members.forEach((m) => {
        const cur = updated[m.id] || {};
        if (!cur.p2) {
          updated[m.id] = { ...cur, p2: 'present' };
          changed++;
        }
      });

      return {
        ...prev,
        sessions: {
          ...prev.sessions,
          [activeSessionKey]: updated,
        },
      };
    });

    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
    });
    playAlertTone('success');
  };

  const doorItems = [
    { min: 15, text: 'به درمانگر بگویید: ۱۵ دقیقه مانده' },
    { min: 8, text: 'به درمانگر بگویید: ۸ دقیقه مانده' },
    { min: 5, text: 'به درمانگر بگویید: ۵ دقیقه مانده' },
    { min: 3, text: '🚪 در کلاس را باز کنید' },
  ];

  const safeMembers = Array.isArray(state?.members) ? state.members.filter(Boolean) : [];
  const unentered = safeMembers.filter((m) => !sessionData[m.id]?.p2);
  const entered = safeMembers.filter((m) => !!sessionData[m.id]?.p2);

  const displayedMembers = (doneTab ? entered : unentered).filter((m) =>
    search ? (m.name || '').includes(search) : true
  );

  const openReport = () => {
    const text = getRoundReportText(state, activeSessionKey, 2, true);
    setReportModal(text);
  };

  return (
    <div className="space-y-4 pb-12 animate-fade-in" dir="rtl">
      {/* Timer Hero Card */}
      <div className="rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 text-white p-6 shadow-xl shadow-emerald-600/20 text-center relative overflow-hidden">
        <div className="flex items-center justify-between text-xs font-bold mb-3 opacity-90">
          <span className="flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
            <DoorOpen size={14} />
            <span>نوبت ۲ — پشت در کلاس</span>
          </span>
          <button
            onClick={openReport}
            className="flex items-center gap-1 bg-white text-emerald-900 px-3 py-1 rounded-full font-black text-xs hover:bg-slate-100 shadow-sm"
          >
            <Share2 size={13} />
            <span>گزارش نوبت ۲</span>
          </button>
        </div>

        {/* Big countdown clock */}
        <div className="my-2">
          <div className="text-[11px] font-semibold text-emerald-200 mb-1">
            زمان باقی‌مانده تا آغاز رسمی جلسه:
          </div>
          <div className="text-4xl sm:text-5xl font-black tracking-tight text-white font-mono drop-shadow-md">
            {countdownText}
          </div>
        </div>

        {/* Quick batch buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
          <button
            onClick={markAllPresent}
            className="bg-white text-emerald-800 font-extrabold px-4 py-2.5 rounded-2xl shadow-lg hover:bg-emerald-50 active:scale-95 transition-all text-xs flex items-center gap-1.5"
          >
            <CheckCircle2 size={16} />
            <span>✅ همه حاضر شدند</span>
          </button>
          <button
            onClick={() => setDoneTab(!doneTab)}
            className="bg-white/20 hover:bg-white/30 text-white font-bold px-4 py-2.5 rounded-2xl border border-white/20 text-xs backdrop-blur-sm active:scale-95 transition-all"
          >
            {doneTab ? 'نمایش ثبت‌نشده‌ها' : 'نمایش ثبت‌شده‌ها'}
          </button>
        </div>
      </div>

      {/* Door Reminders for Therapist */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Bell size={18} className="text-amber-500" />
            <span>یادآور پشت در (برای هماهنگی با درمانگر)</span>
          </h3>
          <span className="text-[11px] text-slate-400 font-bold">۴ مرحله</span>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          در ۴ نوبت زمان باقی‌مانده را به درمانگر اعلام کنید؛ در ۳ دقیقه در کلاس را باز کنید.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {doorItems.map((item) => {
            const isDone = !!doorState[String(item.min)];
            return (
              <div
                key={item.min}
                onClick={() => toggleDoorCheck(item.min)}
                className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all active:scale-98 ${
                  isDone
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs ${
                      isDone
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {toFa(item.min)}'
                  </span>
                  <span className="text-xs font-bold">{item.text}</span>
                </div>
                <div
                  className={`w-5 h-5 rounded-lg flex items-center justify-center ${
                    isDone ? 'bg-emerald-500 text-white' : 'border border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {isDone && <CheckCircle2 size={14} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl">
        <button
          onClick={() => setDoneTab(false)}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
            !doneTab
              ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <span>⏳ پشت در — ثبت‌نشده</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700">
            {toFa(unentered.length)}
          </span>
        </button>
        <button
          onClick={() => setDoneTab(true)}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
            doneTab
              ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <span>✓ ورود ثبت‌شده</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700">
            {toFa(entered.length)}
          </span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="جستجوی نام..."
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pr-10 pl-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Member Cards */}
      <div className="space-y-3">
        {safeMembers.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
            <span className="text-3xl block mb-1">🚪</span>
            <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
              هنوز عضوی برای ثبت ورود تعریف نشده است
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              برای ثبت ورود اعضا پشت در کلاس، ابتدا از بخش «اعضا» افراد را ثبت کنید.
            </p>
            <button
              onClick={() => onNavigate('members')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs inline-flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <span>➕ افزودن عضو جدید</span>
            </button>
          </div>
        ) : displayedMembers.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 text-center">
            <span className="text-3xl block mb-2">{doneTab ? '📭' : '🎉'}</span>
            <p className="font-bold text-sm text-slate-600 dark:text-slate-300">
              {doneTab ? 'هنوز ورودی ثبت نشده است' : 'همه اعضا حاضر شدند! کلاس آماده شروع است.'}
            </p>
          </div>
        ) : (
          displayedMembers.map((member) => {
            const cur = sessionData[member.id] || {};
            const r1Label =
              cur.p1 === 'present'
                ? 'حاضر'
                : cur.p1 === 'delay'
                ? `تأخیر (${toFa(cur.time || '19:30')})`
                : cur.p1 === 'absent'
                ? 'غایب'
                : cur.p1 === 'problem'
                ? 'مشکل'
                : 'بدون پاسخ';

            return (
              <div
                key={member.id}
                className={`bg-white dark:bg-slate-900 rounded-3xl p-4 border transition-all shadow-sm ${
                  cur.p2 === 'present'
                    ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/20'
                    : 'border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-2 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center font-black text-slate-700 dark:text-slate-200 text-base shadow-sm">
                      {member.name.trim().charAt(0) || '؟'}
                    </div>

                    <div>
                      <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">
                        {member.name}
                      </h4>
                      {/* Round 1 Context Indicator */}
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          تماس قبلی:
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            cur.p1 === 'present'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : cur.p1 === 'delay'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : cur.p1 === 'absent'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {r1Label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {doneTab && (
                    <button
                      onClick={() => setStatusP2(member.id, cur.p2 as any)}
                      title="بازگردانی"
                      className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <RotateCcw size={16} />
                    </button>
                  )}
                </div>

                {/* Status Selection Buttons */}
                <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setStatusP2(member.id, 'present')}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                      cur.p2 === 'present'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-black'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                    }`}
                  >
                    حاضر شد ✅
                  </button>
                  <button
                    onClick={() => setStatusP2(member.id, 'delay')}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                      cur.p2 === 'delay'
                        ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30 font-black'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                    }`}
                  >
                    تأخیر
                  </button>
                  <button
                    onClick={() => setStatusP2(member.id, 'absent')}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                      cur.p2 === 'absent'
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 font-black'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                    }`}
                  >
                    نیامد
                  </button>
                  <button
                    onClick={() => setStatusP2(member.id, 'problem')}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                      cur.p2 === 'problem'
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 font-black'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-950/30'
                    }`}
                  >
                    مشکل
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Report Modal */}
      {reportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" dir="rtl">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">
              📤 گزارش نوبت ۲ (پشت در کلاس)
            </h3>
            <textarea
              readOnly
              value={reportModal}
              rows={12}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  copyToClipboard(reportModal);
                  alert('متن گزارش با موفقیت در کلیپ‌بورد کپی شد.');
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md"
              >
                📋 کپی متن
              </button>
              <button
                onClick={() => shareText('گزارش نوبت ۲', reportModal)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md"
              >
                📤 ارسال
              </button>
              <button
                onClick={() => setReportModal(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold text-xs"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
