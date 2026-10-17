import React, { useState } from 'react';
import {
  Phone,
  MessageCircle,
  Clock,
  Mic,
  RotateCcw,
  Search,
  CheckCircle2,
  Share2,
  FileSpreadsheet,
  DoorOpen,
  Volume2
} from 'lucide-react';
import { AppState, Member, AttendanceStatus } from '../types';
import { fmt, fromKey, toFa, toKey, today } from '../utils/jalali';
import { getRoundReportText, copyToClipboard, shareText, getWhatsAppLink } from '../utils/reports';
import { VoiceRecorder, playAlertTone } from '../utils/audio';

interface AttendScreenProps {
  state: AppState;
  onUpdateState: (fn: (prev: AppState) => AppState) => void;
  onNavigate: (screen: string) => void;
  activeSessionKey: string;
  onSelectSession: (key: string) => void;
}

export const AttendScreen: React.FC<AttendScreenProps> = ({
  state,
  onUpdateState,
  onNavigate,
  activeSessionKey,
  onSelectSession,
}) => {
  const [doneTab, setDoneTab] = useState(false);
  const [search, setSearch] = useState('');
  const [reportModal, setReportModal] = useState<string | null>(null);
  const [recordingForId, setRecordingForId] = useState<string | null>(null);
  const [recorderInstance, setRecorderInstance] = useState<VoiceRecorder | null>(null);

  const sessionData = (state?.sessions && state.sessions[activeSessionKey]) || {};

  // All session keys available (past + current)
  const sessionKeys = Array.from(
    new Set([activeSessionKey, ...Object.keys(state?.sessions || {})])
  ).sort().reverse();

  const safeMembers = Array.isArray(state?.members) ? state.members.filter(Boolean) : [];

  // Filter members
  const uncalled = safeMembers.filter((m) => !sessionData[m.id]?.p1);
  const called = safeMembers.filter((m) => !!sessionData[m.id]?.p1);

  const displayedMembers = (doneTab ? called : uncalled).filter((m) =>
    search ? (m.name || '').includes(search) : true
  );

  const pct = safeMembers.length
    ? Math.round((called.length / safeMembers.length) * 100)
    : 0;

  const setStatus = (
    memberId: string,
    status: 'present' | 'delay' | 'absent' | 'problem'
  ) => {
    onUpdateState((prev) => {
      const prevSession = prev.sessions[activeSessionKey] || {};
      const currentMemberStatus = prevSession[memberId] || {};
      const isToggleOff = currentMemberStatus.p1 === status;

      const newMemberStatus: AttendanceStatus = isToggleOff
        ? { ...currentMemberStatus, p1: null }
        : {
            ...currentMemberStatus,
            p1: status,
            time: currentMemberStatus.time || (status === 'delay' ? '19:30' : undefined),
          };

      return {
        ...prev,
        sessions: {
          ...prev.sessions,
          [activeSessionKey]: {
            ...prevSession,
            [memberId]: newMemberStatus,
          },
        },
      };
    });
    playAlertTone('beep');
  };

  const updateTime = (memberId: string, timeVal: string) => {
    onUpdateState((prev) => {
      const prevSession = prev.sessions[activeSessionKey] || {};
      const cur = prevSession[memberId] || {};
      return {
        ...prev,
        sessions: {
          ...prev.sessions,
          [activeSessionKey]: {
            ...prevSession,
            [memberId]: { ...cur, time: timeVal },
          },
        },
      };
    });
  };

  const updateNote = (memberId: string, noteVal: string) => {
    onUpdateState((prev) => {
      const prevSession = prev.sessions[activeSessionKey] || {};
      const cur = prevSession[memberId] || {};
      return {
        ...prev,
        sessions: {
          ...prev.sessions,
          [activeSessionKey]: {
            ...prevSession,
            [memberId]: { ...cur, note: noteVal },
          },
        },
      };
    });
  };

  const restoreMember = (memberId: string) => {
    onUpdateState((prev) => {
      const prevSession = prev.sessions[activeSessionKey] || {};
      const cur = prevSession[memberId] || {};
      return {
        ...prev,
        sessions: {
          ...prev.sessions,
          [activeSessionKey]: {
            ...prevSession,
            [memberId]: { ...cur, p1: null },
          },
        },
      };
    });
  };

  const startVoiceRecord = async (memberId: string) => {
    const rec = new VoiceRecorder();
    const ok = await rec.start();
    if (ok) {
      setRecorderInstance(rec);
      setRecordingForId(memberId);
    } else {
      alert('دسترسی به میکروفون داده نشد یا پشتیبانی نمی‌شود.');
    }
  };

  const stopVoiceRecord = async (memberId: string) => {
    if (recorderInstance) {
      const audioData = await recorderInstance.stop();
      if (audioData) {
        onUpdateState((prev) => {
          const prevSession = prev.sessions[activeSessionKey] || {};
          const cur = prevSession[memberId] || {};
          return {
            ...prev,
            sessions: {
              ...prev.sessions,
              [activeSessionKey]: {
                ...prevSession,
                [memberId]: { ...cur, a1: audioData },
              },
            },
          };
        });
      }
      setRecorderInstance(null);
      setRecordingForId(null);
    }
  };

  const exportCSV = () => {
    const rows = [
      ['نام عضو', 'شماره تماس', 'وضعیت نوبت ۱', 'ساعت تأخیر', 'یادداشت'],
      ...state.members.map((m) => {
        const cur = sessionData[m.id] || {};
        const stLabel =
          cur.p1 === 'present'
            ? 'حاضر'
            : cur.p1 === 'delay'
            ? 'تأخیر'
            : cur.p1 === 'absent'
            ? 'غایب'
            : cur.p1 === 'problem'
            ? 'مشکل'
            : 'ثبت‌نشده';
        return [
          m.name,
          (m.phones || []).join(' - '),
          stLabel,
          cur.time || '',
          cur.note || '',
        ];
      }),
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      rows.map((e) => e.map((x) => `"${x.replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `حضور-نوبت1-${activeSessionKey}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const openReport = () => {
    const text = getRoundReportText(state, activeSessionKey, 1, true);
    setReportModal(text);
  };

  return (
    <div className="space-y-4 pb-12 animate-fade-in" dir="rtl">
      {/* Banner */}
      <div className="p-4 rounded-3xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 text-blue-950 dark:text-blue-200 text-xs leading-relaxed space-y-1">
        <div className="font-extrabold text-sm flex items-center gap-1.5">
          <span>📞</span>
          <span>نوبت ۱ — تماس‌های قبلی با اعضا</span>
        </div>
        <p className="opacity-90">
          چند ساعت یا یک روز قبل از کلاس با اعضا تماس بگیرید. پس از تکمیل، گزارش را برای حامی‌ها ارسال کنید.
        </p>
      </div>

      {/* Main Card with Session Selector & Progress */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        {/* Session Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400">انتخاب تاریخ جلسه:</label>
          <select
            value={activeSessionKey}
            onChange={(e) => onSelectSession(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-2xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {sessionKeys.map((k) => (
              <option key={k} value={k}>
                جلسه {fmt(fromKey(k))}
              </option>
            ))}
          </select>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-600 dark:text-slate-400">
              ثبت‌شده: <b className="text-blue-600 dark:text-blue-400">{toFa(called.length)}</b> از {toFa(state.members.length)}
            </span>
            <span className="text-blue-600 dark:text-blue-400 font-extrabold">{toFa(pct)}٪</span>
          </div>
          <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-l from-blue-600 to-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Sub-actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 overflow-x-auto pb-1">
          <button
            onClick={() => onNavigate('entry')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 whitespace-nowrap active:scale-95 transition-all shadow-sm"
          >
            <DoorOpen size={15} />
            <span>نوبت ۲ (پشت در)</span>
          </button>
          <button
            onClick={openReport}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 whitespace-nowrap active:scale-95 transition-all shadow-sm"
          >
            <Share2 size={15} />
            <span>گزارش به حامی</span>
          </button>
          <button
            onClick={exportCSV}
            className="border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 whitespace-nowrap hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95"
          >
            <FileSpreadsheet size={15} />
            <span>خروجی اکسل</span>
          </button>
        </div>
      </div>

      {/* Tabs: Uncalled vs Called */}
      <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl">
        <button
          onClick={() => setDoneTab(false)}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
            !doneTab
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <span>⏳ ثبت‌نشده</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700">
            {toFa(uncalled.length)}
          </span>
        </button>
        <button
          onClick={() => setDoneTab(true)}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
            doneTab
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <span>✓ ثبت‌شده</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700">
            {toFa(called.length)}
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
          placeholder="جستجوی نام در لیست..."
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pr-10 pl-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Members List */}
      <div className="space-y-3">
        {safeMembers.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
            <span className="text-3xl block mb-1">📞</span>
            <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
              هنوز عضوی برای ثبت حضور در این کلاس تعریف نشده است
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              برای هماهنگی تلفنی و ثبت حضور نوبت ۱، ابتدا از بخش اعضا افراد را ثبت کنید.
            </p>
            <button
              onClick={() => onNavigate('members')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs inline-flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <span>➕ افزودن عضو جدید</span>
            </button>
          </div>
        ) : displayedMembers.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 text-center">
            <span className="text-3xl block mb-2">{doneTab ? '📭' : '🎉'}</span>
            <p className="font-bold text-sm text-slate-600 dark:text-slate-300">
              {doneTab ? 'هنوز تماسی ثبت نشده است' : 'همه تماس‌های این جلسه ثبت شده‌اند!'}
            </p>
          </div>
        ) : (
          displayedMembers.map((member) => {
            const cur = sessionData[member.id] || {};
            const isRecording = recordingForId === member.id;

            return (
              <div
                key={member.id}
                className={`bg-white dark:bg-slate-900 rounded-3xl p-4 border transition-all shadow-sm ${
                  cur.p1 ? 'border-blue-200 dark:border-blue-900/60 bg-blue-50/20' : 'border-slate-200/80 dark:border-slate-800'
                }`}
              >
                {/* Member Header & Call Buttons */}
                <div className="flex items-center justify-between gap-2 pb-3">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center font-black text-slate-700 dark:text-slate-200 text-base shadow-sm">
                      {member.name.trim().charAt(0) || '؟'}
                    </div>

                    <div>
                      <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">
                        {member.name}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {member.careFlag && (
                          <span className="px-1.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-[10px] font-bold">
                            حمایتی
                          </span>
                        )}
                        {member.needs && member.needs.length > 0 && (
                          <span className="px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 text-[10px] font-bold">
                            نیاز ویژه
                          </span>
                        )}
                        {cur.p1 && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              cur.p1 === 'present'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : cur.p1 === 'delay'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                : cur.p1 === 'absent'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                            }`}
                          >
                            {cur.p1 === 'present'
                              ? 'حاضر'
                              : cur.p1 === 'delay'
                              ? `تأخیر (${toFa(cur.time || '19:30')})`
                              : cur.p1 === 'absent'
                              ? 'غایب'
                              : 'مشکل'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Multi-phone call & WhatsApp links */}
                  <div className="flex items-center gap-1.5">
                    {(member.phones || []).slice(0, 2).map((phone, pIdx) => (
                      <React.Fragment key={pIdx}>
                        <a
                          href={`tel:${phone}`}
                          title={`تماس با شماره ${toFa(pIdx + 1)}`}
                          className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center hover:bg-emerald-100 active:scale-95 transition-transform"
                        >
                          <Phone size={15} />
                        </a>
                        <a
                          href={getWhatsAppLink(phone)}
                          target="_blank"
                          rel="noreferrer"
                          title={`واتساپ شماره ${toFa(pIdx + 1)}`}
                          className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 active:scale-95 transition-transform shadow-sm"
                        >
                          <MessageCircle size={15} />
                        </a>
                      </React.Fragment>
                    ))}
                    {doneTab && (
                      <button
                        onClick={() => restoreMember(member.id)}
                        title="بازگردانی به ثبت‌نشده"
                        className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95"
                      >
                        <RotateCcw size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Status Selection Buttons */}
                <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setStatus(member.id, 'present')}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                      cur.p1 === 'present'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-black'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                    }`}
                  >
                    حاضر
                  </button>
                  <button
                    onClick={() => setStatus(member.id, 'delay')}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                      cur.p1 === 'delay'
                        ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30 font-black'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                    }`}
                  >
                    تأخیر
                  </button>
                  <button
                    onClick={() => setStatus(member.id, 'absent')}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                      cur.p1 === 'absent'
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 font-black'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                    }`}
                  >
                    غایب
                  </button>
                  <button
                    onClick={() => setStatus(member.id, 'problem')}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                      cur.p1 === 'problem'
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 font-black'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-950/30'
                    }`}
                  >
                    مشکل
                  </button>
                </div>

                {/* Delay Time Input (when delay selected) */}
                {cur.p1 === 'delay' && (
                  <div className="flex items-center gap-2 mt-2.5 p-2 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200/60 dark:border-amber-800/50">
                    <Clock size={16} className="text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-bold text-amber-800 dark:text-amber-300">ساعت تقریبی ورود:</span>
                    <input
                      type="time"
                      value={cur.time || '19:30'}
                      onChange={(e) => updateTime(member.id, e.target.value)}
                      className="bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none"
                    />
                  </div>
                )}

                {/* Additional Note & Voice Recorder */}
                {cur.p1 && cur.p1 !== 'present' && (
                  <div className="mt-2.5 space-y-2">
                    <input
                      type="text"
                      placeholder="یادداشت توضیح پیگیری (اختیاری)..."
                      value={cur.note || ''}
                      onChange={(e) => updateNote(member.id, e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          isRecording ? stopVoiceRecord(member.id) : startVoiceRecord(member.id)
                        }
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                          isRecording
                            ? 'bg-rose-500 text-white animate-pulse'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        <Mic size={14} />
                        <span>{isRecording ? 'توقف ضبط' : '🎙 ضبط یادداشت صوتی'}</span>
                      </button>

                      {cur.a1 && (
                        <audio controls src={cur.a1} className="h-7 max-w-45" />
                      )}
                    </div>
                  </div>
                )}
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
              📤 گزارش نوبت ۱ (تماس‌های قبلی)
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
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md"
              >
                📋 کپی متن
              </button>
              <button
                onClick={() => shareText('گزارش نوبت ۱', reportModal)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md"
              >
                📤 اشتراک‌گذاری
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
