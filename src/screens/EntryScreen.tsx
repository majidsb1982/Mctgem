import React, { useEffect, useState } from 'react';
import {
  DoorOpen,
  CheckCircle2,
  Bell,
  Share2,
  Search,
  RotateCcw,
  UserPlus,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AppState, AttendanceStatus } from '../types';
import { getNextClass, toFa } from '../utils/jalali';
import { playAlertTone } from '../utils/audio';
import { getRoundReportText, copyToClipboard, shareText } from '../utils/reports';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  IconButton,
  Input,
  SegmentedTabs,
  Sheet,
  Toggle,
} from '../components/ui';

interface EntryScreenProps {
  state: AppState;
  onUpdateState: (fn: (prev: AppState) => AppState) => void;
  activeSessionKey: string;
  onNavigate: (screen: string) => void;
  onSelectSession?: (key: string) => void;
}

const STATUS_META = {
  present: { label: 'حاضر', active: 'bg-success text-white border-success', idle: 'text-success' },
  delay: { label: 'تأخیر', active: 'bg-warn text-white border-warn', idle: 'text-warn' },
  absent: { label: 'نیامد', active: 'bg-danger text-white border-danger', idle: 'text-danger' },
  problem: { label: 'مشکل', active: 'bg-accent text-accent-fg border-accent', idle: 'text-accent-ink' },
} as const;

export const EntryScreen: React.FC<EntryScreenProps> = ({
  state,
  onUpdateState,
  activeSessionKey,
  onNavigate,
}) => {
  const [countdownText, setCountdownText] = useState('--:--');
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [doneTab, setDoneTab] = useState(false);
  const [search, setSearch] = useState('');
  const [reportModal, setReportModal] = useState<string | null>(null);

  const nextClass = getNextClass(state.classes, state.extra);
  const sessionData = state.sessions[activeSessionKey] || {};
  const doorState = state.doorChecks[activeSessionKey] || {};

  useEffect(() => {
    if (!nextClass) return;
    const targetMs = nextClass.t.getTime();

    function tick() {
      const remainingMs = targetMs - Date.now();
      const sec = Math.floor(remainingMs / 1000);
      setSecondsRemaining(sec);

      if (remainingMs <= 0) {
        setCountdownText('شروع شد');
        return;
      }

      const mm = Math.floor((remainingMs % 3600000) / 60000);
      const ss = Math.floor((remainingMs % 60000) / 1000);
      const hh = Math.floor(remainingMs / 3600000);

      // Long waits read better as H:MM:SS, short ones as MM:SS.
      setCountdownText(
        hh > 0
          ? `${toFa(hh)}:${toFa(String(mm).padStart(2, '0'))}:${toFa(String(ss).padStart(2, '0'))}`
          : `${toFa(mm)}:${toFa(String(ss).padStart(2, '0'))}`
      );

      const alertMinutes = state.settings.alarmTimes || [15, 8, 5, 3];
      for (const m of alertMinutes) {
        if (sec <= m * 60 && sec > m * 60 - 2) {
          if (state.settings.sound) playAlertTone('chime');
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
        doorChecks: { ...prev.doorChecks, [activeSessionKey]: updated },
      };
    });
    playAlertTone('beep');
  };

  const setStatusP2 = (memberId: string, status: 'present' | 'delay' | 'absent' | 'problem') => {
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

      prev.members.forEach((m) => {
        const cur = updated[m.id] || {};
        if (!cur.p2) updated[m.id] = { ...cur, p2: 'present' };
      });

      return { ...prev, sessions: { ...prev.sessions, [activeSessionKey]: updated } };
    });

    confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    playAlertTone('success');
  };

  const doorItems = [
    { min: 15, text: 'به درمانگر بگویید: ۱۵ دقیقه مانده' },
    { min: 8, text: 'به درمانگر بگویید: ۸ دقیقه مانده' },
    { min: 5, text: 'به درمانگر بگویید: ۵ دقیقه مانده' },
    { min: 3, text: 'در کلاس را باز کنید' },
  ];

  const safeMembers = Array.isArray(state?.members) ? state.members.filter(Boolean) : [];
  const unentered = safeMembers.filter((m) => !sessionData[m.id]?.p2);
  const entered = safeMembers.filter((m) => !!sessionData[m.id]?.p2);

  const displayedMembers = (doneTab ? entered : unentered).filter((m) =>
    search ? (m.name || '').includes(search) : true
  );

  const openReport = () => setReportModal(getRoundReportText(state, activeSessionKey, 2, true));

  return (
    <div className="space-y-4 pb-12">
      {/* Countdown */}
      <Card padded={false} className="overflow-hidden">
        <div className="h-1 bg-accent" />
        <div className="p-5 text-center bg-gradient-to-b from-accent/[0.07] to-transparent">
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-accent-ink">
              <DoorOpen size={14} />
              نوبت ۲ — پشت در کلاس
            </span>
            <button
              onClick={openReport}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-muted hover:text-accent-ink transition-colors"
            >
              <Share2 size={13} />
              گزارش
            </button>
          </div>

          <p className="text-[11px] font-semibold text-muted mt-3">زمان باقی‌مانده تا آغاز جلسه</p>
          <div
            className={`text-5xl font-extrabold num leading-[1.15] my-1.5 ${
              secondsRemaining !== null && secondsRemaining <= 180 ? 'text-danger' : 'text-ink'
            }`}
          >
            {countdownText}
          </div>

          <div className="flex items-center justify-center gap-2 mt-4">
            <Button size="sm" icon={<CheckCircle2 size={15} />} onClick={markAllPresent}>
              همه حاضر شدند
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setDoneTab(!doneTab)}>
              {doneTab ? 'ثبت‌نشده‌ها' : 'ثبت‌شده‌ها'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Door checklist */}
      <Card>
        <CardHeader
          icon={<Bell size={17} />}
          title="یادآور پشت در"
          subtitle="در ۳ دقیقهٔ آخر در کلاس را باز کنید."
          action={<Badge tone="neutral">۴ مرحله</Badge>}
          className="mb-3"
        />

        <div className="space-y-2">
          {doorItems.map((item) => {
            const isDone = !!doorState[String(item.min)];
            return (
              <Toggle
                key={item.min}
                checked={isDone}
                onChange={() => toggleDoorCheck(item.min)}
                label={item.text}
                icon={<span className="text-[11px] font-extrabold num">{toFa(item.min)}'</span>}
              />
            );
          })}
        </div>
      </Card>

      <SegmentedTabs
        items={[
          { id: 'pending', label: 'ثبت‌نشده', count: unentered.length },
          { id: 'done', label: 'ثبت‌شده', count: entered.length },
        ]}
        value={doneTab ? 'done' : 'pending'}
        onChange={(v) => setDoneTab(v === 'done')}
      />

      <div className="relative">
        <Search
          size={17}
          className="absolute start-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
        />
        <Input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="جستجوی نام…"
          className="ps-10"
        />
      </div>

      <div className="space-y-3">
        {safeMembers.length === 0 ? (
          <EmptyState
            icon={<DoorOpen size={22} />}
            title="هنوز عضوی ثبت نشده است"
            description="برای ثبت ورود پشت در کلاس، ابتدا اعضای گروه را اضافه کنید."
            action={
              <Button size="sm" icon={<UserPlus size={15} />} onClick={() => onNavigate('members')}>
                افزودن عضو
              </Button>
            }
          />
        ) : displayedMembers.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 size={22} />}
            title={doneTab ? 'هنوز ورودی ثبت نشده' : 'همهٔ اعضا حاضر شدند'}
            description={doneTab ? 'وضعیت ورود هر عضو اینجا فهرست می‌شود.' : 'کلاس آمادهٔ شروع است.'}
          />
        ) : (
          displayedMembers.map((member) => {
            const cur = sessionData[member.id] || {};
            const r1Label =
              cur.p1 === 'present'
                ? 'حاضر'
                : cur.p1 === 'delay'
                ? `تأخیر ${toFa(cur.time || '19:30')}`
                : cur.p1 === 'absent'
                ? 'غایب'
                : cur.p1 === 'problem'
                ? 'مشکل'
                : 'بدون پاسخ';

            return (
              <Card key={member.id} className={`space-y-3 ${cur.p2 === 'present' ? 'border-success/25' : ''}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-surface-2 border border-line text-ink flex items-center justify-center font-bold text-sm">
                      {member.name.trim().charAt(0) || '؟'}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-ink truncate">{member.name}</h4>
                      <p className="text-[10px] text-muted mt-1">
                        تماس قبلی: <span className="font-bold text-ink/80">{r1Label}</span>
                      </p>
                    </div>
                  </div>

                  {doneTab && cur.p2 && (
                    <IconButton
                      aria-label="بازگردانی به ثبت‌نشده"
                      onClick={() => setStatusP2(member.id, cur.p2 as any)}
                    >
                      <RotateCcw size={16} />
                    </IconButton>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {(Object.keys(STATUS_META) as (keyof typeof STATUS_META)[]).map((key) => {
                    const active = cur.p2 === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setStatusP2(member.id, key)}
                        aria-pressed={active}
                        className={`min-h-10 rounded-field border text-[11px] font-bold transition-all active:scale-95 ${
                          active
                            ? STATUS_META[key].active
                            : `bg-surface-2 border-line ${STATUS_META[key].idle} hover:bg-line/50`
                        }`}
                      >
                        {STATUS_META[key].label}
                      </button>
                    );
                  })}
                </div>
              </Card>
            );
          })
        )}
      </div>

      <Sheet
        open={!!reportModal}
        onClose={() => setReportModal(null)}
        title="گزارش نوبت ۲"
        subtitle="آمادهٔ ارسال به حامیان"
        width="lg"
        footer={
          <div className="flex items-center gap-2">
            <Button
              full
              size="sm"
              icon={<Share2 size={15} />}
              onClick={() => {
                if (reportModal) {
                  copyToClipboard(reportModal);
                  alert('متن گزارش در کلیپ‌بورد کپی شد.');
                }
              }}
            >
              کپی متن
            </Button>
            <Button
              full
              size="sm"
              variant="secondary"
              onClick={() => reportModal && shareText('گزارش نوبت ۲', reportModal)}
            >
              ارسال
            </Button>
          </div>
        }
      >
        <textarea
          readOnly
          value={reportModal || ''}
          rows={14}
          className="w-full bg-surface-2 border border-line rounded-field p-3.5 text-xs text-ink leading-7 focus:outline-none"
        />
      </Sheet>
    </div>
  );
};
