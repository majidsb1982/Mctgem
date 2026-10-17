import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Clock,
  PhoneCall,
  DoorOpen,
  DollarSign,
  Users,
  FileText,
  Cake,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronLeft,
  RefreshCw
} from 'lucide-react';
import { AppState } from '../types';
import { getNextClass, fmt, toFa, DN, today } from '../utils/jalali';

interface HomeScreenProps {
  state: AppState;
  onNavigate: (screen: string) => void;
  activeSessionKey: string;
  onResetDemo?: () => void;
  onResetToEmpty?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  state,
  onNavigate,
  activeSessionKey,
  onResetDemo,
  onResetToEmpty,
}) => {
  const [timeLeft, setTimeLeft] = useState<{ text: string; inProgress: boolean }>({
    text: '',
    inProgress: false,
  });

  const nextClass = getNextClass(state.classes, state.extra);

  useEffect(() => {
    function updateCountdown() {
      if (!nextClass) {
        setTimeLeft({ text: 'کلاسی تنظیم نشده است', inProgress: false });
        return;
      }
      const now = Date.now();
      const diff = nextClass.t.getTime() - now;

      if (diff > 0) {
        const dd = Math.floor(diff / 864e5);
        const hh = Math.floor((diff % 864e5) / 36e5);
        const mm = Math.floor((diff % 36e5) / 6e4);
        let txt = '';
        if (dd > 0) txt += `${toFa(dd)} روز و `;
        txt += `${toFa(hh)} ساعت و ${toFa(mm)} دقیقه`;
        setTimeLeft({ text: txt, inProgress: false });
      } else if (diff > -2 * 36e5) {
        setTimeLeft({ text: '🎬 کلاس در جریان است', inProgress: true });
      } else {
        setTimeLeft({ text: 'کلاس پایان یافته', inProgress: false });
      }
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 10000);
    return () => clearInterval(interval);
  }, [state.classes, state.extra]);

  // Statistics
  const curSession = (state?.sessions && state.sessions[activeSessionKey]) || {};
  const curFees = (state?.fees && state.fees[activeSessionKey]) || {};

  const safeMembers = Array.isArray(state?.members) ? state.members.filter(Boolean) : [];
  const uncalledCount = safeMembers.filter((m) => !curSession[m.id]?.p1).length;
  const unenteredCount = safeMembers.filter((m) => !curSession[m.id]?.p2).length;
  const unpaidCount = safeMembers.filter((m) => !curFees[m.id]?.paid).length;
  const totalMembers = safeMembers.length;

  // Upcoming birthdays today or tomorrow
  const currentJDate = today();
  const upcomingBirthdays: { name: string; isToday: boolean }[] = [];
  safeMembers.forEach((m) => {
    if (m && m.birth && typeof m.birth.jm === 'number' && typeof m.birth.jd === 'number') {
      if (m.birth.jm === currentJDate.jm && m.birth.jd === currentJDate.jd) {
        upcomingBirthdays.push({ name: m.name, isToday: true });
      } else if (m.birth.jm === currentJDate.jm && m.birth.jd === currentJDate.jd + 1) {
        upcomingBirthdays.push({ name: m.name, isToday: false });
      }
    }
  });

  return (
    <div className="space-y-4 pb-6 animate-fade-in" dir="rtl">
      {/* Quick Demo Reload Banner or Empty Class Card */}
      {totalMembers === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-blue-200/90 dark:border-blue-900/60 shadow-sm text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto text-xl font-bold">
            👥
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 mb-1">
              کلاس آماده است — هنوز عضوی افزوده نشده
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              شما می‌توانید اعضای کلاس را به دلخواه اضافه کنید، یا در صورت تمایل نمونه آزمایشی را بارگذاری نمایید.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              onClick={() => onNavigate('members')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <span>➕ افزودن عضو جدید</span>
            </button>
            {onResetDemo && (
              <button
                onClick={onResetDemo}
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold py-2.5 px-3.5 rounded-xl text-xs flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <RefreshCw size={13} className="text-amber-500" />
                <span>بارگذاری نمونه آزمایشی</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between px-4 py-2 bg-blue-50/80 dark:bg-blue-950/40 rounded-2xl border border-blue-200/80 dark:border-blue-900/60 text-xs">
          <span className="text-blue-900 dark:text-blue-300 font-semibold">
            ✨ کلاس: <b>{state.settings.className}</b> ({toFa(totalMembers)} عضو)
          </span>
          {onResetToEmpty && (
            <button
              onClick={onResetToEmpty}
              className="text-slate-400 hover:text-rose-600 font-medium text-[11px] underline"
            >
              حذف تمام اعضا (کلاس خالی)
            </button>
          )}
        </div>
      )}

      {/* Hero: Next Class Countdown Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white p-6 shadow-xl shadow-blue-500/20">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2 opacity-90 text-xs font-bold">
            <span className="flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
              <Calendar size={14} />
              <span>جلسه بعدی کلاس</span>
            </span>
            {nextClass?.c.extra ? (
              <span className="bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full text-[10px] font-black">
                جلسه خاص / جبرانی
              </span>
            ) : (
              <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-[10px]">
                جلسه منظم هفتگی
              </span>
            )}
          </div>

          {nextClass ? (
            <>
              <h2 className="text-xl sm:text-2xl font-black mt-2">
                {DN[nextClass.c.dow]} {fmt(nextClass.date)}
              </h2>
              <p className="text-sm opacity-90 mt-0.5">
                ساعت {toFa(nextClass.c.start)} تا {toFa(nextClass.c.end)}
              </p>

              <div className="my-4 py-3 px-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
                <span className="text-[11px] block font-semibold opacity-80 mb-0.5">زمان باقی‌مانده تا شروع:</span>
                <span className="text-xl sm:text-2xl font-black tracking-tight text-amber-200">
                  {timeLeft.text}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  onClick={() => onNavigate('attend')}
                  className="bg-white/20 hover:bg-white/30 text-white font-bold py-2.5 px-3 rounded-xl border border-white/20 flex items-center justify-center gap-2 text-sm backdrop-blur-sm active:scale-95 transition-all shadow-sm"
                >
                  <PhoneCall size={16} />
                  <span>تماس‌ها (نوبت ۱)</span>
                </button>
                <button
                  onClick={() => onNavigate('entry')}
                  className="bg-white text-blue-700 font-extrabold py-2.5 px-3 rounded-xl shadow-md hover:bg-slate-50 flex items-center justify-center gap-2 text-sm active:scale-95 transition-all"
                >
                  <DoorOpen size={16} />
                  <span>ثبت ورود (نوبت ۲)</span>
                </button>
              </div>
            </>
          ) : (
            <div className="py-6 text-center">
              <p className="font-bold text-base opacity-95">برنامه کلاسی ثبت نشده است</p>
              <button
                onClick={() => onNavigate('settings')}
                className="mt-3 bg-white text-blue-700 px-4 py-2 rounded-xl text-xs font-bold"
              >
                افزودن کلاس در تنظیمات
              </button>
            </div>
          )}
        </div>

        {/* Decorative blur circle */}
        <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Quick Task Statuses */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
            <CheckCircle2 size={18} className="text-blue-600 dark:text-blue-400" />
            <span>اقدامات جلسه جاری</span>
          </h3>
          <span className="text-xs text-slate-400 font-semibold">
            امروز {fmt(today())}
          </span>
        </div>

        <div className="space-y-2">
          {/* Round 1 task */}
          <div
            onClick={() => onNavigate('attend')}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50/60 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <PhoneCall size={20} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">تماس‌های قبلی (نوبت ۱)</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {uncalledCount > 0 ? (
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">
                      {toFa(uncalledCount)} نفر ثبت‌نشده
                    </span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      همه تماس‌ها انجام شد ✅
                    </span>
                  )}
                </p>
              </div>
            </div>
            <ChevronLeft size={18} className="text-slate-400" />
          </div>

          {/* Round 2 task */}
          <div
            onClick={() => onNavigate('entry')}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50/60 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <DoorOpen size={20} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">ثبت ورود پشت در (نوبت ۲)</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {unenteredCount > 0 ? (
                    <span className="text-slate-600 dark:text-slate-300">
                      {toFa(unenteredCount)} نفر باقی‌مانده
                    </span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      ورود همه ثبت شد 🎉
                    </span>
                  )}
                </p>
              </div>
            </div>
            <ChevronLeft size={18} className="text-slate-400" />
          </div>

          {/* Fee task */}
          <div
            onClick={() => onNavigate('fees')}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50/60 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <DollarSign size={20} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">واریز شهریه</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {unpaidCount > 0 ? (
                    <span className="text-rose-500 font-semibold">
                      {toFa(unpaidCount)} نفر پرداخت‌نشده
                    </span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      شهریه کامل واریز شده ✅
                    </span>
                  )}
                </p>
              </div>
            </div>
            <ChevronLeft size={18} className="text-slate-400" />
          </div>

          {/* Birthday alert if any */}
          {upcomingBirthdays.length > 0 && (
            <div
              onClick={() => onNavigate('members')}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-pink-50 dark:bg-pink-950/30 border border-pink-200/60 dark:border-pink-800/50 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-200 dark:bg-pink-900 text-pink-600 dark:text-pink-300 flex items-center justify-center">
                  <Cake size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-pink-900 dark:text-pink-200 text-sm">تولد در راه است! 🎉</h4>
                  <p className="text-xs text-pink-700 dark:text-pink-300">
                    {upcomingBirthdays.map((b) => `${b.name} (${b.isToday ? 'امروز 🎂' : 'فردا'})`).join('، ')}
                  </p>
                </div>
              </div>
              <ChevronLeft size={18} className="text-pink-500" />
            </div>
          )}
        </div>
      </div>

      {/* Quick Access Hub Grid */}
      <div>
        <h3 className="font-extrabold text-xs text-slate-500 dark:text-slate-400 mb-2.5 px-1">
          دسترسی سریع به بخش‌ها
        </h3>
        <div className="grid grid-cols-3 gap-2.5">
          <button
            onClick={() => onNavigate('attend')}
            className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-right hover:border-blue-500 active:scale-95 transition-all shadow-sm"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
              <PhoneCall size={18} />
            </div>
            <div className="font-bold text-xs text-slate-800 dark:text-slate-200">حضور ۱</div>
            <div className="text-[10px] text-slate-400">تماس قبلی</div>
          </button>

          <button
            onClick={() => onNavigate('entry')}
            className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-right hover:border-emerald-500 active:scale-95 transition-all shadow-sm"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
              <DoorOpen size={18} />
            </div>
            <div className="font-bold text-xs text-slate-800 dark:text-slate-200">نوبت ۲</div>
            <div className="text-[10px] text-slate-400">پشت در کلاس</div>
          </button>

          <button
            onClick={() => onNavigate('fees')}
            className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-right hover:border-amber-500 active:scale-95 transition-all shadow-sm"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2">
              <DollarSign size={18} />
            </div>
            <div className="font-bold text-xs text-slate-800 dark:text-slate-200">شهریه</div>
            <div className="text-[10px] text-slate-400">واریز و پیگیری</div>
          </button>

          <button
            onClick={() => onNavigate('reports')}
            className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-right hover:border-purple-500 active:scale-95 transition-all shadow-sm"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2">
              <Sparkles size={18} />
            </div>
            <div className="font-bold text-xs text-slate-800 dark:text-slate-200">گزارش حامی</div>
            <div className="text-[10px] text-slate-400">پیام‌ها و خروجی</div>
          </button>

          <button
            onClick={() => onNavigate('members')}
            className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-right hover:border-blue-500 active:scale-95 transition-all shadow-sm"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center mb-2">
              <Users size={18} />
            </div>
            <div className="font-bold text-xs text-slate-800 dark:text-slate-200">اعضا</div>
            <div className="text-[10px] text-slate-400">{toFa(totalMembers)} نفر</div>
          </button>

          <button
            onClick={() => onNavigate('homework')}
            className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-right hover:border-indigo-500 active:scale-95 transition-all shadow-sm"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2">
              <FileText size={18} />
            </div>
            <div className="font-bold text-xs text-slate-800 dark:text-slate-200">تکالیف</div>
            <div className="text-[10px] text-slate-400">آرشیو و ثبت</div>
          </button>
        </div>
      </div>

      {/* Period & Coordinator Summary Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
            <span>📋</span>
            <span>{state.period.title || 'دوره جاری'}</span>
          </h3>
          <button
            onClick={() => onNavigate('period')}
            className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
          >
            تنظیم دوره
          </button>
        </div>

        <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-300 leading-relaxed mb-3">
          🤝 <b>حامی‌ها</b> اعضای قدیمی هستند که قبلاً مسئولیت داشته‌اند و اکنون پشتیبان مسئولان جدید و رابط با درمانگر می‌باشند.
        </div>

        <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
          <div>
            <b className="text-slate-800 dark:text-slate-200">مسئولان حضور: </b>
            {Array.isArray(state?.period?.attendIds) && state.period.attendIds.length > 0
              ? state.period.attendIds
                  .map((id) => safeMembers.find((m) => m.id === id)?.name)
                  .filter(Boolean)
                  .join('، ')
              : 'هنوز تعیین نشده'}
          </div>
          <div>
            <b className="text-slate-800 dark:text-slate-200">مسئولان شهریه: </b>
            {Array.isArray(state?.period?.feeIds) && state.period.feeIds.length > 0
              ? state.period.feeIds
                  .map((id) => safeMembers.find((m) => m.id === id)?.name)
                  .filter(Boolean)
                  .join('، ')
              : 'هنوز تعیین نشده'}
          </div>
          <div>
            <b className="text-slate-800 dark:text-slate-200">مسئول تکالیف: </b>
            {Array.isArray(state?.period?.hwIds) && state.period.hwIds.length > 0
              ? state.period.hwIds
                  .map((id) => safeMembers.find((m) => m.id === id)?.name)
                  .filter(Boolean)
                  .join('، ')
              : 'هنوز تعیین نشده'}
          </div>
        </div>
      </div>
    </div>
  );
};
