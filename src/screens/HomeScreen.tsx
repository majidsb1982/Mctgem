import React, { useEffect, useState } from 'react';
import {
  Calendar,
  PhoneCall,
  DoorOpen,
  Wallet,
  Users,
  FileText,
  Cake,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  UserPlus,
  ClipboardList,
  ArrowLeft,
} from 'lucide-react';
import { AppState } from '../types';
import { getNextClass, fmt, toFa, DN, today } from '../utils/jalali';
import { Badge, Button, Card, CardHeader, EmptyState, ListRow } from '../components/ui';

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
        setTimeLeft({ text: 'کلاس در جریان است', inProgress: true });
      } else {
        setTimeLeft({ text: 'کلاس پایان یافته', inProgress: false });
      }
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 10000);
    return () => clearInterval(interval);
  }, [state.classes, state.extra]);

  const curSession = (state?.sessions && state.sessions[activeSessionKey]) || {};
  const curFees = (state?.fees && state.fees[activeSessionKey]) || {};

  const safeMembers = Array.isArray(state?.members) ? state.members.filter(Boolean) : [];
  const uncalledCount = safeMembers.filter((m) => !curSession[m.id]?.p1).length;
  const unenteredCount = safeMembers.filter((m) => !curSession[m.id]?.p2).length;
  const unpaidCount = safeMembers.filter((m) => !curFees[m.id]?.paid).length;
  const totalMembers = safeMembers.length;

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

  const quickLinks = [
    { id: 'attend', label: 'تماس‌ها', hint: 'نوبت ۱', icon: PhoneCall, tone: 'accent' as const },
    { id: 'entry', label: 'ثبت ورود', hint: 'نوبت ۲', icon: DoorOpen, tone: 'success' as const },
    { id: 'fees', label: 'شهریه', hint: 'واریز', icon: Wallet, tone: 'warn' as const },
    { id: 'reports', label: 'گزارش', hint: 'حامی', icon: Sparkles, tone: 'accent' as const },
    { id: 'members', label: 'اعضا', hint: `${toFa(totalMembers)} نفر`, icon: Users, tone: 'neutral' as const },
    { id: 'homework', label: 'تکالیف', hint: 'آرشیو', icon: FileText, tone: 'accent' as const },
  ];

  const toneClass: Record<string, string> = {
    accent: 'bg-accent/10 text-accent-ink',
    success: 'bg-success/10 text-success',
    warn: 'bg-warn/12 text-warn',
    neutral: 'bg-surface-2 text-muted',
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Empty class onboarding */}
      {totalMembers === 0 ? (
        <EmptyState
          icon={<Users size={22} />}
          title="کلاس آماده است — هنوز عضوی اضافه نشده"
          description="اعضای گروه را خودتان اضافه کنید، یا برای آشنایی با برنامه یک نمونهٔ آزمایشی بارگذاری کنید."
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button size="sm" icon={<UserPlus size={15} />} onClick={() => onNavigate('members')}>
                افزودن عضو
              </Button>
              {onResetDemo && (
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<RefreshCw size={15} />}
                  onClick={onResetDemo}
                >
                  نمونهٔ آزمایشی
                </Button>
              )}
            </div>
          }
        />
      ) : (
        <div className="flex items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2 min-w-0">
            <Badge tone="accent" dot>
              {toFa(totalMembers)} عضو فعال
            </Badge>
            <span className="text-[11px] text-muted truncate">{state.settings.className}</span>
          </div>
          {onResetToEmpty && (
            <button
              onClick={() => {
                if (
                  window.confirm(
                    'تمام اعضا و اطلاعات جلسات پاک شود؟ این کار قابل بازگشت نیست.'
                  )
                ) {
                  onResetToEmpty();
                }
              }}
              className="text-[11px] font-semibold text-muted hover:text-danger transition-colors shrink-0"
            >
              کلاس خالی
            </button>
          )}
        </div>
      )}

      {/* Next class hero */}
      <section className="rounded-card bg-surface border border-line overflow-hidden shadow-sm shadow-black/[0.03]">
        <div className="h-1 bg-accent" />
        <div className="p-5 bg-gradient-to-bl from-accent/[0.07] via-transparent to-transparent">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-accent-ink bg-accent/10 px-2.5 py-1 rounded-full">
              <Calendar size={13} />
              جلسهٔ بعدی
            </span>
            {nextClass?.c.extra ? (
              <Badge tone="warn">جلسهٔ جبرانی</Badge>
            ) : (
              <span className="text-[10px] font-semibold text-muted">جلسهٔ منظم هفتگی</span>
            )}
          </div>

          {nextClass ? (
            <>
              <h2 className="text-xl sm:text-2xl font-extrabold text-ink leading-8">
                {DN[nextClass.c.dow]} {fmt(nextClass.date)}
              </h2>
              <p className="text-xs font-semibold text-muted mt-1 num">
                ساعت {toFa(nextClass.c.start)} تا {toFa(nextClass.c.end)}
              </p>

              <div className="mt-4 rounded-field bg-surface/80 border border-line px-4 py-3">
                <span className="block text-[10px] font-bold text-muted mb-1">
                  زمان باقی‌مانده تا شروع
                </span>
                <span
                  className={`block text-xl sm:text-2xl font-extrabold num leading-8 ${
                    timeLeft.inProgress ? 'text-success' : 'text-accent-ink'
                  }`}
                >
                  {timeLeft.text}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 mt-4">
                <Button
                  icon={<DoorOpen size={16} />}
                  onClick={() => onNavigate('entry')}
                  className="w-full"
                >
                  ثبت ورود
                </Button>
                <Button
                  variant="secondary"
                  icon={<PhoneCall size={16} />}
                  onClick={() => onNavigate('attend')}
                  className="w-full"
                >
                  تماس‌ها
                </Button>
              </div>
            </>
          ) : (
            <div className="py-4">
              <p className="font-bold text-sm text-ink">برنامهٔ کلاسی ثبت نشده است</p>
              <p className="text-xs text-muted mt-1 mb-3">
                برای شروع، روز و ساعت کلاس را در تنظیمات مشخص کنید.
              </p>
              <Button size="sm" onClick={() => onNavigate('settings')}>
                افزودن کلاس
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Today's actions */}
      <Card>
        <CardHeader
          icon={<CheckCircle2 size={17} />}
          title="اقدامات جلسهٔ جاری"
          action={<span className="text-[11px] font-semibold text-muted num">{fmt(today())}</span>}
          className="mb-2"
        />

        <div className="divide-y divide-line/70">
          <ListRow
            icon={<PhoneCall size={18} />}
            title="تماس‌های نوبت ۱"
            description={
              uncalledCount > 0 ? (
                <span className="text-warn font-bold">{toFa(uncalledCount)} نفر ثبت‌نشده</span>
              ) : (
                <span className="text-success font-bold">همهٔ تماس‌ها انجام شد</span>
              )
            }
            onClick={() => onNavigate('attend')}
          />
          <ListRow
            icon={<DoorOpen size={18} />}
            title="ثبت ورود نوبت ۲"
            description={
              unenteredCount > 0 ? (
                <span className="text-muted">{toFa(unenteredCount)} نفر باقی‌مانده</span>
              ) : (
                <span className="text-success font-bold">ورود همه ثبت شد</span>
              )
            }
            tone="success"
            onClick={() => onNavigate('entry')}
          />
          <ListRow
            icon={<Wallet size={18} />}
            title="واریز شهریه"
            description={
              unpaidCount > 0 ? (
                <span className="text-danger font-bold">{toFa(unpaidCount)} نفر پرداخت‌نشده</span>
              ) : (
                <span className="text-success font-bold">شهریه کامل واریز شده</span>
              )
            }
            tone="warn"
            onClick={() => onNavigate('fees')}
          />
          {upcomingBirthdays.length > 0 && (
            <ListRow
              icon={<Cake size={18} />}
              title="تولد در راه است"
              description={upcomingBirthdays
                .map((b) => `${b.name} (${b.isToday ? 'امروز' : 'فردا'})`)
                .join('، ')}
              tone="danger"
              onClick={() => onNavigate('members')}
            />
          )}
        </div>
      </Card>

      {/* Quick access */}
      <div>
        <h3 className="text-xs font-bold text-muted px-1 mb-2">دسترسی سریع</h3>
        <div className="grid grid-cols-3 gap-2">
          {quickLinks.map((q) => {
            const Icon = q.icon;
            return (
              <button
                key={q.id}
                onClick={() => onNavigate(q.id)}
                className="rounded-card bg-surface border border-line p-3 text-start transition-all hover:border-accent/40 active:scale-[0.98]"
              >
                <span
                  className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 ${toneClass[q.tone]}`}
                >
                  <Icon size={17} />
                </span>
                <span className="block text-xs font-bold text-ink leading-5">{q.label}</span>
                <span className="block text-[10px] text-muted leading-4">{q.hint}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Period summary */}
      <Card>
        <CardHeader
          icon={<ClipboardList size={17} />}
          title={state.period.title || 'دورهٔ جاری'}
          action={
            <button
              onClick={() => onNavigate('period')}
              className="text-[11px] font-bold text-accent-ink hover:underline inline-flex items-center gap-1"
            >
              تنظیم
              <ArrowLeft size={13} />
            </button>
          }
          className="mb-3"
        />

        <div className="rounded-field bg-accent/[0.06] border border-accent/15 px-3 py-2.5 text-[11px] text-ink/80 leading-6 mb-3">
          حامی‌ها اعضای قدیمی هستند که اکنون پشتیبان مسئولان جدید و رابط با درمانگرند.
        </div>

        <dl className="space-y-2 text-xs">
          {[
            { label: 'مسئولان حضور', ids: state.period.attendIds },
            { label: 'مسئولان شهریه', ids: state.period.feeIds },
            { label: 'مسئول تکالیف', ids: state.period.hwIds },
          ].map((row) => {
            const names = (Array.isArray(row.ids) ? row.ids : [])
              .map((id) => safeMembers.find((m) => m.id === id)?.name)
              .filter(Boolean)
              .join('، ');
            return (
              <div key={row.label} className="flex gap-2 leading-6">
                <dt className="font-bold text-ink shrink-0">{row.label}:</dt>
                <dd className={`min-w-0 ${names ? 'text-ink/80' : 'text-muted'}`}>
                  {names || 'تعیین نشده'}
                </dd>
              </div>
            );
          })}
        </dl>
      </Card>
    </div>
  );
};
