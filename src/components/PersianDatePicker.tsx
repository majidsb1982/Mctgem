import React, { useState } from 'react';
import { JalaliDate } from '../types';
import { mLen, dow, toFa, today, MN, DN } from '../utils/jalali';
import { X, Check, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from './ui';

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
  const safeInitial =
    initialDate &&
    typeof initialDate.jy === 'number' &&
    typeof initialDate.jm === 'number' &&
    typeof initialDate.jd === 'number'
      ? initialDate
      : currentToday;
  const [selected, setSelected] = useState<JalaliDate>(safeInitial);
  const [year, setYear] = useState<number>(safeInitial.jy);
  const [month, setMonth] = useState<number>(safeInitial.jm);

  const monthLength = mLen(year, month);
  const firstDayDow = dow({ jy: year, jm: month, jd: 1 });

  const years: number[] = [];
  for (let y = 1320; y <= 1450; y++) years.push(y);

  const daysGrid: (number | null)[] = [];
  for (let i = 0; i < firstDayDow; i++) daysGrid.push(null);
  for (let d = 1; d <= monthLength; d++) daysGrid.push(d);

  const shiftMonth = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    if (y < 1320 || y > 1450) return;
    setMonth(m);
    setYear(y);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px] animate-fade-in"
      dir="rtl"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-sm bg-surface rounded-card p-4 shadow-2xl border border-line">
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <h3 className="font-bold text-ink text-base">{title}</h3>
          <button
            onClick={onClose}
            aria-label="بستن"
            className="w-9 h-9 rounded-xl text-muted hover:bg-surface-2 hover:text-ink flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Month navigation */}
        <div className="flex items-center justify-between gap-2 my-3">
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            aria-label="ماه بعد"
            className="w-9 h-9 rounded-xl text-muted hover:bg-surface-2 hover:text-ink flex items-center justify-center"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex items-center gap-1.5">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              aria-label="ماه"
              className="h-9 bg-surface-2 border border-line rounded-lg px-2 text-xs font-bold text-ink"
            >
              {MN.map((mName, idx) => (
                <option key={idx} value={idx + 1}>
                  {mName}
                </option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              aria-label="سال"
              className="h-9 bg-surface-2 border border-line rounded-lg px-2 text-xs font-bold text-ink num"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {toFa(y)}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            aria-label="ماه قبل"
            className="w-9 h-9 rounded-xl text-muted hover:bg-surface-2 hover:text-ink flex items-center justify-center"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-muted mb-1.5">
          {DN.map((dayName, idx) => (
            <div key={idx} className="py-1">
              {dayName.slice(0, 1)}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {daysGrid.map((dayNum, idx) => {
            if (dayNum === null) return <div key={`empty-${idx}`} className="h-9" />;

            const isSelected =
              selected.jy === year && selected.jm === month && selected.jd === dayNum;
            const isToday =
              currentToday.jy === year && currentToday.jm === month && currentToday.jd === dayNum;

            return (
              <button
                key={dayNum}
                type="button"
                onClick={() => setSelected({ jy: year, jm: month, jd: dayNum })}
                aria-pressed={isSelected}
                className={`h-9 w-full rounded-lg text-xs font-bold flex items-center justify-center transition-colors num ${
                  isSelected
                    ? 'bg-accent text-accent-fg shadow-sm'
                    : isToday
                    ? 'border border-accent text-accent-ink'
                    : 'text-ink hover:bg-surface-2'
                }`}
              >
                {toFa(dayNum)}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 mt-5 pt-3 border-t border-line">
          <Button
            full
            icon={<Check size={16} />}
            onClick={() => {
              onSelect(selected);
              onClose();
            }}
          >
            <span className="num">
              تأیید {toFa(`${selected.jy}/${selected.jm}/${selected.jd}`)}
            </span>
          </Button>
          <Button variant="secondary" onClick={onClose}>
            انصراف
          </Button>
        </div>
      </div>
    </div>
  );
};
