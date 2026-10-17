import React, { useState } from 'react';
import { Award, Users, CheckCircle2, Save } from 'lucide-react';
import { AppState, PeriodData } from '../types';

interface PeriodScreenProps {
  state: AppState;
  onUpdateState: (fn: (prev: AppState) => AppState) => void;
  onNavigate: (screen: string) => void;
}

export const PeriodScreen: React.FC<PeriodScreenProps> = ({ state, onUpdateState, onNavigate }) => {
  const [title, setTitle] = useState(state.period.title || 'دوره جاری');
  const [attendIds, setAttendIds] = useState<string[]>(state.period.attendIds || []);
  const [feeIds, setFeeIds] = useState<string[]>(state.period.feeIds || []);
  const [hwIds, setHwIds] = useState<string[]>(state.period.hwIds || []);
  const [note, setNote] = useState(state.period.note || '');

  const hamis = state.members.filter((m) => (m.roles || []).includes('support'));

  const togglePick = (id: string, list: string[], setter: (v: string[]) => void) => {
    if (list.includes(id)) {
      setter(list.filter((x) => x !== id));
    } else {
      setter([...list, id]);
    }
  };

  const handleSave = () => {
    const updatedPeriod: PeriodData = {
      title: title.trim() || 'دوره جاری',
      attendIds,
      feeIds,
      hwIds,
      note: note.trim(),
    };

    onUpdateState((prev) => {
      // Lightly sync roles
      const updatedMembers = prev.members.map((m) => {
        const roles = new Set(m.roles || []);
        if (attendIds.includes(m.id)) roles.add('attend');
        if (feeIds.includes(m.id)) roles.add('fee');
        if (hwIds.includes(m.id)) roles.add('hw');
        return { ...m, roles: Array.from(roles) };
      });

      return {
        ...prev,
        period: updatedPeriod,
        members: updatedMembers,
      };
    });

    alert('دوره و مسئولان جدید با موفقیت ذخیره شدند.');
    onNavigate('home');
  };

  return (
    <div className="space-y-4 pb-12 animate-fade-in" dir="rtl">
      <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white p-6 shadow-xl shadow-indigo-600/20">
        <h2 className="text-lg font-black mb-1">📋 تنظیم دوره و مسئولان کلاس</h2>
        <p className="text-xs opacity-90 leading-relaxed">
          با نظر درمانگر در هر دوره مسئولان پیگیری عوض می‌شوند. حامی‌ها همان اعضای قدیمی با نقش «حامی» در مشخصاتشان هستند.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
            عنوان دوره:
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثلاً دوره بهار ۱۴۰۵"
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Coordinators for Attendance */}
        <div>
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
            📞 مسئولان پیگیری حضور (می‌توانید چند نفر انتخاب کنید):
          </label>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            {state.members.map((m) => (
              <label
                key={m.id}
                className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={attendIds.includes(m.id)}
                  onChange={() => togglePick(m.id, attendIds, setAttendIds)}
                  className="rounded text-blue-600"
                />
                <span>{m.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Coordinators for Fees */}
        <div>
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
            💰 مسئولان پیگیری شهریه:
          </label>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            {state.members.map((m) => (
              <label
                key={m.id}
                className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={feeIds.includes(m.id)}
                  onChange={() => togglePick(m.id, feeIds, setFeeIds)}
                  className="rounded text-amber-500"
                />
                <span>{m.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Coordinator for Homework */}
        <div>
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
            📋 مسئول تکالیف:
          </label>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            {state.members.map((m) => (
              <label
                key={m.id}
                className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={hwIds.includes(m.id)}
                  onChange={() => togglePick(m.id, hwIds, setHwIds)}
                  className="rounded text-indigo-600"
                />
                <span>{m.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
            توضیحات و اهداف دوره:
          </label>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="اهداف ویژه این دوره کلاسی..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
          />
        </div>

        {/* Supporters summary */}
        {hamis.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs space-y-1">
            <span className="font-bold text-slate-800 dark:text-slate-200 block">
              🤝 حامی‌های شناخته‌شده در اعضا:
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              {hamis.map((m) => m.name).join('، ')}
            </span>
          </div>
        )}

        <button
          onClick={handleSave}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 active:scale-95 transition-all"
        >
          <Save size={16} />
          <span>💾 ذخیره دوره و انتصاب مسئولان</span>
        </button>
      </div>
    </div>
  );
};
