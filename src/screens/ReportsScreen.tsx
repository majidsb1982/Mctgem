import React, { useState } from 'react';
import {
  Share2,
  Copy,
  Check,
  PhoneCall,
  DoorOpen,
  DollarSign,
  HeartHandshake,
  Calendar,
  X
} from 'lucide-react';
import { AppState } from '../types';
import {
  getRoundReportText,
  getFeeReportText,
  getHumanHamiSummary,
  copyToClipboard,
  shareText
} from '../utils/reports';
import { fmt, fromKey } from '../utils/jalali';

interface ReportsScreenProps {
  state: AppState;
  activeSessionKey: string;
  onSelectSession?: (key: string) => void;
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({
  state,
  activeSessionKey,
  onSelectSession,
}) => {
  const [modalTitle, setModalTitle] = useState<string>('');
  const [modalText, setModalText] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const sessionKeys = Array.from(
    new Set([activeSessionKey, ...Object.keys(state?.sessions || {})])
  ).sort().reverse();

  const showReport = (title: string, text: string) => {
    setModalTitle(title);
    setModalText(text);
    setCopied(false);
  };

  const handleCopy = () => {
    if (modalText) {
      copyToClipboard(modalText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const tiles = [
    {
      title: 'گزارش نوبت ۱ (تماس‌های قبلی)',
      desc: 'فهرست حاضرین، تأخیرها، غایبین و موارد نیازمند هماهنگی قبل از کلاس',
      icon: PhoneCall,
      color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
      action: () =>
        showReport('گزارش نوبت ۱ (تماس‌های قبلی)', getRoundReportText(state, activeSessionKey, 1, true)),
    },
    {
      title: 'گزارش نوبت ۲ (پشت در کلاس)',
      desc: 'فهرست حضور نهایی، اعضایی که رسیده‌اند و وضعیت ورود به کلاس',
      icon: DoorOpen,
      color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
      action: () =>
        showReport('گزارش نوبت ۲ (پشت در کلاس)', getRoundReportText(state, activeSessionKey, 2, true)),
    },
    {
      title: 'گزارش وضعیت شهریه',
      desc: 'آمار واریزهای انجام‌شده، قول داده‌ها و موارد پیگیری نشده',
      icon: DollarSign,
      color: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
      action: () =>
        showReport('گزارش شهریه جلسه', getFeeReportText(state, activeSessionKey)),
    },
    {
      title: 'خلاصه انسانی و حمایتی',
      desc: 'گزارش با لحن گرم و همدلانه ویژه حامیان و درمانگر گروه',
      icon: HeartHandshake,
      color: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
      action: () =>
        showReport('خلاصه حمایتی برای حامی‌ها', getHumanHamiSummary(state, activeSessionKey)),
    },
  ];

  return (
    <div className="space-y-4 pb-12 animate-fade-in" dir="rtl">
      {/* Hero Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white p-6 shadow-xl shadow-purple-600/20">
        <h2 className="text-lg font-black mb-1">📡 کانال‌های گزارش و ارتباطات</h2>
        <p className="text-xs opacity-90 leading-relaxed">
          تمامی گزارش‌های کلاسی برای ارسال به حامی‌ها و درمانگر با حذف خودکار یادداشت‌های محرمانه جهت رعایت کامل حریم خصوصی اعضا.
        </p>

        {/* Session selector */}
        {onSelectSession && (
          <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-white/90 flex items-center gap-1.5">
              <Calendar size={14} />
              <span>جلسه گزارش:</span>
            </span>
            <select
              value={activeSessionKey}
              onChange={(e) => onSelectSession(e.target.value)}
              className="bg-white/20 text-white border border-white/30 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none"
            >
              {sessionKeys.map((k) => (
                <option key={k} value={k} className="text-slate-900 bg-white">
                  جلسه {fmt(fromKey(k))}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Grid of Report Generators */}
      <div className="space-y-2.5">
        {tiles.map((t, idx) => {
          const Icon = t.icon;
          return (
            <div
              key={idx}
              onClick={t.action}
              className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3 cursor-pointer hover:border-purple-400 active:scale-98 transition-all"
            >
              <div className="flex items-center gap-3.5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold ${t.color}`}>
                  <Icon size={22} />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                    {t.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    {t.desc}
                  </p>
                </div>
              </div>
              <Share2 size={16} className="text-slate-400" />
            </div>
          );
        })}
      </div>

      {/* Report Modal */}
      {modalText && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" dir="rtl">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">
                {modalTitle}
              </h3>
              <button
                onClick={() => setModalText(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <X size={18} />
              </button>
            </div>

            <textarea
              readOnly
              value={modalText}
              rows={12}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 text-xs font-mono text-slate-800 dark:text-slate-100 focus:outline-none leading-relaxed"
            />

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/20 active:scale-95 transition-all"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span>{copied ? 'کپی شد!' : 'کپی متن گزارش'}</span>
              </button>
              <button
                onClick={() => shareText(modalTitle, modalText)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
              >
                <Share2 size={16} />
                <span>اشتراک‌گذاری</span>
              </button>
              <button
                onClick={() => setModalText(null)}
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
