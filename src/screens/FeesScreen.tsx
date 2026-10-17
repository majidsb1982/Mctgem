import React, { useState } from 'react';
import {
  DollarSign,
  Phone,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Share2,
  Search,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AppState, Member, FeeStatus } from '../types';
import { fmt, fromKey, toFa } from '../utils/jalali';
import { getFeeReportText, copyToClipboard, shareText, getWhatsAppLink } from '../utils/reports';
import { playAlertTone } from '../utils/audio';

interface FeesScreenProps {
  state: AppState;
  onUpdateState: (fn: (prev: AppState) => AppState) => void;
  activeSessionKey: string;
  onSelectSession?: (key: string) => void;
  onNavigate?: (screen: string) => void;
}

export const FeesScreen: React.FC<FeesScreenProps> = ({
  state,
  onUpdateState,
  activeSessionKey,
  onSelectSession,
  onNavigate,
}) => {
  const [feeTab, setFeeTab] = useState<0 | 1 | 2>(0);
  const [search, setSearch] = useState('');
  const [reportModal, setReportModal] = useState<string | null>(null);

  const feeData = (state?.fees && state.fees[activeSessionKey]) || {};
  const safeMembers = Array.isArray(state?.members) ? state.members.filter(Boolean) : [];

  const paidMembers = safeMembers.filter((m) => !!feeData[m.id]?.paid);
  const unpaidMembers = safeMembers.filter((m) => !feeData[m.id]?.paid);

  const followUpNeeded = unpaidMembers.filter((m) => !feeData[m.id]?.fc);
  const followUpDone = safeMembers.filter((m) => !!feeData[m.id]?.paid || !!feeData[m.id]?.fc);

  const pct = safeMembers.length
    ? Math.round((paidMembers.length / safeMembers.length) * 100)
    : 0;

  const togglePaid = (memberId: string) => {
    onUpdateState((prev) => {
      const currentFees = prev.fees[activeSessionKey] || {};
      const cur = currentFees[memberId] || {};
      const newPaid = !cur.paid;

      const updated: Record<string, FeeStatus> = {
        ...currentFees,
        [memberId]: {
          ...cur,
          paid: newPaid,
          fc: newPaid ? ('paid' as const) : null,
          date: newPaid ? new Date().toISOString() : undefined,
        },
      };

      // Check if all members paid
      const allPaidNow = prev.members.every((m) => m.id === memberId ? newPaid : !!updated[m.id]?.paid);
      if (allPaidNow && prev.members.length > 0) {
        confetti({ particleCount: 100, spread: 70 });
        playAlertTone('success');
      } else {
        playAlertTone('beep');
      }

      return {
        ...prev,
        fees: {
          ...prev.fees,
          [activeSessionKey]: updated,
        },
      };
    });
  };

  const setFollowStatus = (memberId: string, status: 'promised' | 'noanswer' | 'paid') => {
    onUpdateState((prev) => {
      const currentFees = prev.fees[activeSessionKey] || {};
      const cur = currentFees[memberId] || {};
      const isPaid = status === 'paid';

      const updated = {
        ...currentFees,
        [memberId]: {
          ...cur,
          fc: status,
          paid: isPaid ? true : cur.paid,
          date: isPaid ? new Date().toISOString() : cur.date,
        },
      };

      if (isPaid) {
        const allPaid = prev.members.every((m) => m.id === memberId ? true : !!updated[m.id]?.paid);
        if (allPaid) {
          confetti({ particleCount: 100, spread: 70 });
          playAlertTone('success');
        } else {
          playAlertTone('beep');
        }
      } else {
        playAlertTone('beep');
      }

      return {
        ...prev,
        fees: {
          ...prev.fees,
          [activeSessionKey]: updated,
        },
      };
    });
  };

  const updateFeeNote = (memberId: string, noteVal: string) => {
    onUpdateState((prev) => {
      const currentFees = prev.fees[activeSessionKey] || {};
      const cur = currentFees[memberId] || {};
      return {
        ...prev,
        fees: {
          ...prev.fees,
          [activeSessionKey]: {
            ...currentFees,
            [memberId]: { ...cur, note: noteVal },
          },
        },
      };
    });
  };

  const restoreFee = (memberId: string) => {
    onUpdateState((prev) => {
      const currentFees = prev.fees[activeSessionKey] || {};
      const cur = currentFees[memberId] || {};
      return {
        ...prev,
        fees: {
          ...prev.fees,
          [activeSessionKey]: {
            ...currentFees,
            [memberId]: { ...cur, fc: null, paid: false },
          },
        },
      };
    });
  };

  const exportCSV = () => {
    const rows = [
      ['نام عضو', 'شماره تماس', 'وضعیت پرداخت', 'وضعیت پیگیری', 'یادداشت فیش'],
      ...state.members.map((m) => {
        const cur = feeData[m.id] || {};
        return [
          m.name,
          (m.phones || []).join(' - '),
          cur.paid ? 'پرداخت شده' : 'پرداخت نشده',
          cur.fc === 'promised' ? 'قول داد' : cur.fc === 'noanswer' ? 'بی‌پاسخ' : cur.paid ? 'پرداخت شد' : 'پیگیری نشده',
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
    link.setAttribute('download', `شهریه-${activeSessionKey}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const openReport = () => {
    const text = getFeeReportText(state, activeSessionKey);
    setReportModal(text);
  };

  const filterList = (arr: Member[]) =>
    search ? arr.filter((m) => m.name.includes(search)) : arr;

  return (
    <div className="space-y-4 pb-12 animate-fade-in" dir="rtl">
      {/* Deadline Notice Banner */}
      <div className="p-4 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-amber-950 dark:text-amber-200 text-xs leading-relaxed space-y-1">
        <div className="font-extrabold text-sm flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
          <AlertCircle size={16} />
          <span>مهلت واریز شهریه جلسه</span>
        </div>
        <p className="opacity-90">
          اعضا باید تا قبل از شروع جلسه واریز کنند و رسید را در واتساپ ارسال نمایند. در اینجا وضعیت را ثبت و برای حامی‌ها ارسال کنید.
        </p>
      </div>

      {/* Main Stats Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
              <DollarSign size={20} className="text-amber-500" />
              <span>شهریه جلسه ({fmt(fromKey(activeSessionKey))})</span>
            </h3>
            {onSelectSession && (
              <div className="mt-1.5">
                <select
                  value={activeSessionKey}
                  onChange={(e) => onSelectSession(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  {Array.from(new Set([activeSessionKey, ...Object.keys(state.sessions), ...Object.keys(state.fees)])).sort().reverse().map((k) => (
                    <option key={k} value={k}>
                      جلسه {fmt(fromKey(k))}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1 block">
              {unpaidMembers.length > 0
                ? `⏳ ${toFa(unpaidMembers.length)} نفر پرداخت‌نشده`
                : '✅ همه اعضا شهریه را پرداخت کرده‌اند'}
            </span>
          </div>

          <div className="text-left">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
              {toFa(pct)}٪
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-l from-amber-500 to-amber-400 rounded-full transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={openReport}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
          >
            <Share2 size={15} />
            <span>گزارش شهریه به حامی‌ها</span>
          </button>
          <button
            onClick={exportCSV}
            className="border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95"
          >
            <FileSpreadsheet size={15} />
            <span>اکسل</span>
          </button>
        </div>
      </div>

      {/* 3 Tabs: Payments, Follow-ups, Done */}
      <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl text-xs font-bold">
        <button
          onClick={() => setFeeTab(0)}
          className={`flex-1 py-2.5 rounded-xl transition-all ${
            feeTab === 0
              ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm font-extrabold'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          💰 پرداخت‌ها ({toFa(state.members.length)})
        </button>
        <button
          onClick={() => setFeeTab(1)}
          className={`flex-1 py-2.5 rounded-xl transition-all ${
            feeTab === 1
              ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm font-extrabold'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          📞 پیگیری ({toFa(followUpNeeded.length)})
        </button>
        <button
          onClick={() => setFeeTab(2)}
          className={`flex-1 py-2.5 rounded-xl transition-all ${
            feeTab === 2
              ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm font-extrabold'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          ✓ انجام‌شده ({toFa(followUpDone.length)})
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="جستجوی نام عضو..."
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pr-10 pl-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {/* Tab 0: Direct Payments list */}
      {feeTab === 0 && (
        <div className="space-y-2.5">
          {safeMembers.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
              <span className="text-3xl block mb-1">💰</span>
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                هنوز عضوی برای پیگیری شهریه تعریف نشده است
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                برای ثبت وضعیت پرداخت و شهریه‌ها، ابتدا از بخش اعضا افراد را ثبت کنید.
              </p>
              {onNavigate && (
                <button
                  onClick={() => onNavigate('members')}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs inline-flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                >
                  <span>➕ افزودن عضو جدید</span>
                </button>
              )}
            </div>
          ) : filterList(safeMembers).length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 text-center">
              <p className="font-bold text-sm text-slate-600 dark:text-slate-300">
                عضوی با این نام یافت نشد.
              </p>
            </div>
          ) : (
            filterList(safeMembers).map((member) => {
              const cur = feeData[member.id] || {};
              const isPaid = !!cur.paid;

            return (
              <div
                key={member.id}
                className={`p-4 rounded-3xl border transition-all shadow-sm ${
                  isPaid
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-700 dark:text-slate-200 text-sm">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">
                        {member.name}
                      </h4>
                      <span className="text-[11px] text-slate-400 font-semibold">
                        {(member.phones || [])[0] ? toFa((member.phones || [])[0]) : 'بدون شماره'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => togglePaid(member.id)}
                    className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95 flex items-center gap-1.5 shadow-sm ${
                      isPaid
                        ? 'bg-emerald-600 text-white shadow-emerald-600/30 font-black'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                    }`}
                  >
                    {isPaid ? (
                      <>
                        <CheckCircle2 size={14} />
                        <span>پرداخت شد ✅</span>
                      </>
                    ) : (
                      <span>پرداخت نشده ✕</span>
                    )}
                  </button>
                </div>

                {isPaid && (
                  <div className="mt-2.5 pt-2 border-t border-emerald-100 dark:border-emerald-900/40">
                    <input
                      type="text"
                      placeholder="یادداشت فیش (مثلاً عکس فیش در واتساپ)..."
                      value={cur.note || ''}
                      onChange={(e) => updateFeeNote(member.id, e.target.value)}
                      className="w-full bg-white dark:bg-slate-800/80 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            );
          }))}
        </div>
      )}

      {/* Tab 1: Follow-up needed */}
      {feeTab === 1 && (
        <div className="space-y-3">
          {filterList(followUpNeeded).length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 text-center">
              <span className="text-3xl block mb-2">🎉</span>
              <p className="font-bold text-sm text-slate-600 dark:text-slate-300">
                همه اعضا پیگیری شده‌اند یا پرداخت کرده‌اند!
              </p>
            </div>
          ) : (
            filterList(followUpNeeded).map((member) => {
              const cur = feeData[member.id] || {};
              return (
                <div
                  key={member.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                          {member.name}
                        </h4>
                        <span className="text-[10px] bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold px-1.5 py-0.2 rounded">
                          پرداخت نشده
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {(member.phones || []).slice(0, 2).map((phone, idx) => (
                        <React.Fragment key={idx}>
                          <a
                            href={`tel:${phone}`}
                            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center hover:bg-slate-200"
                          >
                            <Phone size={14} />
                          </a>
                          <a
                            href={getWhatsAppLink(
                              phone,
                              `سلام ${member.name} عزیز 🌸 یادآوری مهلت واریز شهریه جلسه ${fmt(fromKey(activeSessionKey))}. سپاسگزاریم.`
                            )}
                            target="_blank"
                            rel="noreferrer"
                            className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm"
                          >
                            <MessageCircle size={14} />
                          </a>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => setFollowStatus(member.id, 'promised')}
                      className={`py-2 rounded-xl text-xs font-bold transition-colors ${
                        cur.fc === 'promised'
                          ? 'bg-amber-500 text-white font-black'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      🗣 قول داد
                    </button>
                    <button
                      onClick={() => setFollowStatus(member.id, 'noanswer')}
                      className={`py-2 rounded-xl text-xs font-bold transition-colors ${
                        cur.fc === 'noanswer'
                          ? 'bg-rose-600 text-white font-black'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      📵 جواب نداد
                    </button>
                    <button
                      onClick={() => setFollowStatus(member.id, 'paid')}
                      className="py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      ✅ پرداخت کرد
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Done */}
      {feeTab === 2 && (
        <div className="space-y-2.5">
          {filterList(followUpDone).map((member) => {
            const cur = feeData[member.id] || {};
            const isPaid = !!cur.paid;
            const label = isPaid
              ? 'پرداخت شد ✅'
              : cur.fc === 'promised'
              ? '🗣 قول داده'
              : cur.fc === 'noanswer'
              ? '📵 بی‌پاسخ'
              : 'پیگیری شده';

            return (
              <div
                key={member.id}
                className="p-3.5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                      {member.name}
                    </h4>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        isPaid
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => restoreFee(member.id)}
                  title="بازگردانی"
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Report Modal */}
      {reportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" dir="rtl">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">
              📤 گزارش وضعیت شهریه جلسه
            </h3>
            <textarea
              readOnly
              value={reportModal}
              rows={10}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  copyToClipboard(reportModal);
                  alert('متن گزارش شهریه کپی شد.');
                }}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl text-xs shadow-md"
              >
                📋 کپی متن
              </button>
              <button
                onClick={() => shareText('گزارش شهریه', reportModal)}
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
