import React, { useState } from 'react';
import { JalaliDate } from '../types';
import { mLen, dow, toFa, today, MN, DN } from '../utils/jalali';
import { X, Check } from 'lucide-react';

interface Props {
  initialDate?: JalaliDate | null;
  onSelect: (date: JalaliDate) => void;
  onClose: () => void;
  title?: string;
}

export const PersianDatePicker: React.FC<Props> = ({
  initialDate,
  onSelect,
  onClose,
  title = 'انتخاب تاریخ شمسی',
}) => {
  const currentToday = today();
  const [selected, setSelected] = useState<JalaliDate>(initialDate || currentToday);
  const [year, setYear] = useState<number>(selected.jy);
  const [month, setMonth] = useState<number>(selected.jm);

  const monthLength = mLen(year, month);
  const firstDayDow = dow({ jy: year, jm: month, jd: 1 });

  const years: number[] = [];
  for (let y = 1320; y <= 1450; y++) {
    years.push(y);
  }

  const daysGrid: (number | null)[] = [];
  for (let i = 0; i < firstDayDow; i++) {
    daysGrid.push(null);
  }
  for (let d = 1; d <= monthLength; d++) {
    daysGrid.push(d);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Year and Month dropdowns */}
        <div className="grid grid-cols-2 gap-3 my-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">ماه</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {MN.map((mName, idx) => (
                <option key={idx} value={idx + 1}>
                  {mName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">سال</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {toFa(y)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Week Days Headers */}
        <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-400 dark:text-slate-500 mb-2">
          {DN.map((dayName, idx) => (
            <div key={idx} className="py-1">
              {dayName.slice(0, 1)}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {daysGrid.map((dayNum, idx) => {
            if (dayNum === null) {
              return <div key={`empty-${idx}`} className="h-9" />;
            }
            const isSelected = selected.jy === year && selected.jm === month && selected.jd === dayNum;
            const isToday = currentToday.jy === year && currentToday.jm === month && currentToday.jd === dayNum;

            return (
              <button
                key={dayNum}
                type="button"
                onClick={() => setSelected({ jy: year, jm: month, jd: dayNum })}
                className={`h-9 w-full rounded-xl text-sm font-bold flex items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 scale-105'
                    : isToday
                    ? 'border-2 border-blue-500 text-blue-600 dark:text-blue-400 font-extrabold'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                }`}
              >
                {toFa(dayNum)}
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-6 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              onSelect(selected);
              onClose();
            }}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95 transition-transform"
          >
            <Check size={18} />
            <span>تأیید تاریخ ({toFa(`${selected.jy}/${selected.jm}/${selected.jd}`)})</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95"
          >
            انصراف
          </button>
        </div>
      </div>
    </div>
  );
};
