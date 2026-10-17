import React, { useState } from 'react';
import {
  Settings,
  Calendar,
  Clock,
  Palette,
  Volume2,
  Trash2,
  Download,
  Upload,
  Database,
  Plus,
  RefreshCw,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { AppState, ClassSchedule, ExtraSession, JalaliDate } from '../types';
import { DN, fmt, fromKey, toFa, toKey, today } from '../utils/jalali';
import { getStorageStats, pruneOldSessions, saveState } from '../utils/storage';
import { PersianDatePicker } from '../components/PersianDatePicker';

interface SettingsScreenProps {
  state: AppState;
  onUpdateState: (fn: (prev: AppState) => AppState) => void;
  onResetDemo: () => void;
  onResetToEmpty?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  state,
  onUpdateState,
  onResetDemo,
  onResetToEmpty,
}) => {
  const [newDow, setNewDow] = useState(3);
  const [newStart, setNewStart] = useState('19:00');
  const [newEnd, setNewEnd] = useState('21:00');

  const [extraDate, setExtraDate] = useState<JalaliDate | null>(null);
  const [showExtraPicker, setShowExtraPicker] = useState(false);
  const [extraStart, setExtraStart] = useState('19:00');
  const [extraEnd, setExtraEnd] = useState('21:00');

  const [newGroupName, setNewGroupName] = useState('');
  const stats = getStorageStats(state);

  const addWeeklyClass = () => {
    const newClass: ClassSchedule = {
      dow: newDow,
      start: newStart,
      end: newEnd,
    };
    onUpdateState((prev) => ({
      ...prev,
      classes: [...prev.classes, newClass],
    }));
  };

  const removeWeeklyClass = (idx: number) => {
    onUpdateState((prev) => ({
      ...prev,
      classes: prev.classes.filter((_, i) => i !== idx),
    }));
  };

  const addExtraSession = () => {
    if (!extraDate) {
      alert('لطفاً تاریخ جلسه خاص را انتخاب کنید.');
      return;
    }
    const key = toKey(extraDate);
    const newEx: ExtraSession = {
      key,
      start: extraStart,
      end: extraEnd,
    };
    onUpdateState((prev) => ({
      ...prev,
      extra: [...prev.extra.filter((x) => x.key !== key), newEx],
    }));
    setExtraDate(null);
  };

  const removeExtraSession = (idx: number) => {
    onUpdateState((prev) => ({
      ...prev,
      extra: prev.extra.filter((_, i) => i !== idx),
    }));
  };

  const addGroup = () => {
    const trimmed = newGroupName.trim();
    if (!trimmed) return;
    if (state.groups.includes(trimmed)) return;
    onUpdateState((prev) => ({
      ...prev,
      groups: [...prev.groups, trimmed],
    }));
    setNewGroupName('');
  };

  const removeGroup = (grp: string) => {
    if (grp === 'عمومی') return;
    onUpdateState((prev) => ({
      ...prev,
      groups: prev.groups.filter((g) => g !== grp),
    }));
  };

  const handlePrune = () => {
    const { state: updated, prunedCount } = pruneOldSessions(state, 40);
    onUpdateState(() => updated);
    alert(
      prunedCount > 0
        ? `🧹 ${toFa(prunedCount)} جلسه قدیمی با موفقیت پاکسازی شدند.`
        : 'جلسه‌ای برای پاکسازی وجود ندارد.'
    );
  };

  const handleBackup = () => {
    const jsonStr = JSON.stringify(state, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `پشتیبان-MCT-${fmt(today()).replace(/\//g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed && Array.isArray(parsed.members)) {
          saveState(parsed);
          onUpdateState(() => parsed);
          alert('✅ اطلاعات با موفقیت بازیابی شد.');
        } else {
          alert('فرمت فایل پشتیبان معتبر نیست.');
        }
      } catch (err) {
        alert('خطا در خواندن فایل پشتیبان.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-4 pb-12 animate-fade-in" dir="rtl">
      {/* Header card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
          <Settings size={20} className="text-blue-600" />
          <span>تنظیمات کلاس و برنامه</span>
        </h3>
        <div>
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
            نام کلاس / گروه درمانی:
          </label>
          <input
            type="text"
            value={state.settings.className}
            onChange={(e) =>
              onUpdateState((prev) => ({
                ...prev,
                settings: { ...prev.settings, className: e.target.value },
              }))
            }
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Demo Seed Quick Action */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 rounded-3xl p-4 border border-blue-200 dark:border-blue-800/80 flex items-center justify-between">
        <div>
          <h4 className="font-extrabold text-sm text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
            <Sparkles size={16} className="text-blue-600 dark:text-blue-400" />
            <span>بارگذاری داده‌های نمونه گروه درمانی</span>
          </h4>
          <p className="text-xs text-blue-800/80 dark:text-blue-300/80 mt-0.5">
            شامل ۱۰ عضو واقعی، برنامه کلاسی، فیش‌های واریزی، حضور و تکالیف
          </p>
        </div>
        <button
          onClick={onResetDemo}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
        >
          <RefreshCw size={14} />
          <span>بارگذاری نمونه</span>
        </button>
      </div>

      {/* Weekly Classes Schedule */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
          <Calendar size={18} className="text-blue-500" />
          <span>برنامه هفتگی کلاس‌ها</span>
        </h3>

        <div className="space-y-2">
          {state.classes.map((c, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>
                  {DN[c.dow]} — ساعت {toFa(c.start)} تا {toFa(c.end)}
                </span>
              </div>
              <button
                onClick={() => removeWeeklyClass(idx)}
                className="text-rose-500 hover:text-rose-700 text-xs font-bold p-1 rounded-lg"
              >
                حذف
              </button>
            </div>
          ))}
        </div>

        {/* Add weekly class row */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <span className="text-xs font-bold text-slate-500 block">افزودن کلاس هفتگی جدید:</span>
          <div className="grid grid-cols-3 gap-2">
            <select
              value={newDow}
              onChange={(e) => setNewDow(Number(e.target.value))}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-200"
            >
              {DN.map((d, i) => (
                <option key={i} value={i}>
                  {d}
                </option>
              ))}
            </select>
            <input
              type="time"
              value={newStart}
              onChange={(e) => setNewStart(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2 text-xs font-bold text-slate-800 dark:text-slate-200"
            />
            <input
              type="time"
              value={newEnd}
              onChange={(e) => setNewEnd(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2 text-xs font-bold text-slate-800 dark:text-slate-200"
            />
          </div>
          <button
            onClick={addWeeklyClass}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Plus size={15} />
            <span>افزودن به برنامه هفتگی</span>
          </button>
        </div>
      </div>

      {/* Special / Extra Sessions */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
          <Clock size={18} className="text-amber-500" />
          <span>جلسات خاص و جبرانی (با تاریخ مشخص)</span>
        </h3>

        <div className="space-y-2">
          {state.extra.length === 0 ? (
            <p className="text-xs text-slate-400">جلسه خاصی ثبت نشده است.</p>
          ) : (
            state.extra.map((ex, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40"
              >
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  📅 {fmt(fromKey(ex.key))} — ساعت {toFa(ex.start)} تا {toFa(ex.end)}
                </div>
                <button
                  onClick={() => removeExtraSession(idx)}
                  className="text-rose-500 hover:text-rose-700 text-xs font-bold p-1 rounded-lg"
                >
                  حذف
                </button>
              </div>
            ))
          )}
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <button
            type="button"
            onClick={() => setShowExtraPicker(true)}
            className="w-full text-right bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between"
          >
            <span>{extraDate ? `تاریخ: ${fmt(extraDate)}` : 'انتخاب تاریخ جلسه خاص...'}</span>
            <Calendar size={15} />
          </button>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="time"
              value={extraStart}
              onChange={(e) => setExtraStart(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2 text-xs font-bold text-slate-800 dark:text-slate-200"
            />
            <input
              type="time"
              value={extraEnd}
              onChange={(e) => setExtraEnd(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2 text-xs font-bold text-slate-800 dark:text-slate-200"
            />
          </div>
          <button
            onClick={addExtraSession}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Plus size={15} />
            <span>ثبت جلسه خاص</span>
          </button>
        </div>
      </div>

      {/* Groups Manager */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">
          👥 گروه‌بندی اعضا
        </h3>
        <div className="flex flex-wrap gap-2">
          {state.groups.map((grp) => (
            <span
              key={grp}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5"
            >
              <span>{grp}</span>
              {grp !== 'عمومی' && (
                <button
                  onClick={() => removeGroup(grp)}
                  className="text-slate-400 hover:text-rose-500"
                >
                  ✕
                </button>
              )}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 pt-2">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="نام گروه جدید..."
            className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
          />
          <button
            onClick={addGroup}
            className="bg-blue-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold"
          >
            افزودن
          </button>
        </div>
      </div>

      {/* Storage and Backup */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
          <Database size={18} className="text-indigo-500" />
          <span>پشتیبان‌گیری و حافظه</span>
        </h3>

        <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
          <div>
            حجم اطلاعات: <b>{toFa(stats.kb)} کیلوبایت</b> ({toFa(stats.pct)}٪ ظرفیت مرورگر)
          </div>
          <div>
            تعداد جلسات ذخیره‌شده: <b>{toFa(stats.sessions)}</b> جلسه
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            onClick={handleBackup}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Download size={15} />
            <span>دریافت فایل پشتیبان</span>
          </button>

          <label className="border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
            <Upload size={15} />
            <span>بازیابی از فایل</span>
            <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
          </label>
        </div>

        <button
          onClick={handlePrune}
          className="w-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold py-2 rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          🧹 پاکسازی جلسات قدیمی‌تر از ۴۰ جلسه
        </button>
      </div>

      {/* Class Data Management */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
          <Sparkles size={18} className="text-amber-500" />
          <span>مدیریت اطلاعات اعضا و نمونه‌ها</span>
        </h3>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          می‌توانید اعضای کلاس را به طور کامل حذف کرده و کلاس خالی داشته باشید، یا نمونه آزمایشی با اعضای فرضی را بارگذاری کنید.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {onResetToEmpty && (
            <button
              onClick={() => {
                if (window.confirm('آیا مطمئن هستید؟ تمام اعضا و اطلاعات جلسات پاک شده و کلاس خالی خواهد شد.')) {
                  onResetToEmpty();
                }
              }}
              className="bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/60 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <Trash2 size={15} />
              <span>شروع با کلاس خالی (حذف اعضا)</span>
            </button>
          )}

          <button
            onClick={() => {
              if (window.confirm('اعضای نمونه آزمایشی بارگذاری شوند؟')) {
                onResetDemo();
              }
            }}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
          >
            <RefreshCw size={15} />
            <span>بارگذاری نمونه آزمایشی</span>
          </button>
        </div>
      </div>

      {showExtraPicker && (
        <PersianDatePicker
          initialDate={extraDate || today()}
          onSelect={(d) => setExtraDate(d)}
          onClose={() => setShowExtraPicker(false)}
          title="انتخاب تاریخ جلسه خاص"
        />
      )}
    </div>
  );
};
