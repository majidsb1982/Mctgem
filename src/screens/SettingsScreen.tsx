import React, { useState } from 'react';
import {
  Settings,
  Calendar,
  Clock,
  Palette,
  Trash2,
  Download,
  Upload,
  Database,
  Plus,
  RefreshCw,
  Sparkles,
  Users,
  Check,
} from 'lucide-react';
import { AppState, ClassSchedule, ExtraSession, JalaliDate } from '../types';
import { DN, fmt, fromKey, toFa, toKey, today } from '../utils/jalali';
import { getStorageStats, pruneOldSessions, saveState } from '../utils/storage';
import { PersianDatePicker } from '../components/PersianDatePicker';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Field,
  Input,
  Select,
  SegmentedTabs,
} from '../components/ui';

interface SettingsScreenProps {
  state: AppState;
  onUpdateState: (fn: (prev: AppState) => AppState) => void;
  onResetDemo: () => void;
  onResetToEmpty?: () => void;
}

const ACCENTS: { id: 'blue' | 'teal' | 'purple' | 'warm'; label: string; color: string }[] = [
  { id: 'blue', label: 'آبی', color: 'oklch(0.55 0.21 262)' },
  { id: 'teal', label: 'فیروزه‌ای', color: 'oklch(0.60 0.12 185)' },
  { id: 'purple', label: 'بنفش', color: 'oklch(0.55 0.22 300)' },
  { id: 'warm', label: 'گرم', color: 'oklch(0.63 0.16 48)' },
];

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

  const setSetting = <K extends keyof AppState['settings']>(
    key: K,
    value: AppState['settings'][K]
  ) => {
    onUpdateState((prev) => ({
      ...prev,
      settings: { ...prev.settings, [key]: value },
    }));
  };

  const addWeeklyClass = () => {
    const newClass: ClassSchedule = { dow: newDow, start: newStart, end: newEnd };
    onUpdateState((prev) => ({ ...prev, classes: [...prev.classes, newClass] }));
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
    const newEx: ExtraSession = { key, start: extraStart, end: extraEnd };
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
    onUpdateState((prev) => ({ ...prev, groups: [...prev.groups, trimmed] }));
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
        ? `${toFa(prunedCount)} جلسه قدیمی پاک‌سازی شد.`
        : 'جلسه‌ای برای پاک‌سازی وجود ندارد.'
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
          alert('اطلاعات با موفقیت بازیابی شد.');
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
    <div className="space-y-4 pb-12">
      {/* Appearance */}
      <Card>
        <CardHeader
          icon={<Palette size={17} />}
          title="ظاهر برنامه"
          subtitle="رنگ لهجه، حالت روشن/تیره و اندازهٔ متن"
          className="mb-4"
        />

        <div className="space-y-4">
          <div>
            <span className="block text-xs font-bold text-muted mb-2">رنگ لهجه</span>
            <div className="flex items-start gap-3">
              {ACCENTS.map((a) => {
                const active = (state.settings.color || 'blue') === a.id;
                return (
                  <div key={a.id} className="flex flex-col items-center gap-1.5">
                    <button
                      onClick={() => setSetting('color', a.id)}
                      aria-label={`رنگ ${a.label}`}
                      aria-pressed={active}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        active ? 'ring-2 ring-offset-2 ring-offset-surface' : 'opacity-85 hover:opacity-100'
                      }`}
                      style={{
                        backgroundColor: a.color,
                        boxShadow: active ? `0 6px 16px -6px ${a.color}` : undefined,
                        ['--tw-ring-color' as any]: a.color,
                      }}
                    >
                      {active && <Check size={17} className="text-white" strokeWidth={3} />}
                    </button>
                    <span
                      className={`text-[10px] font-semibold ${
                        active ? 'text-ink' : 'text-muted'
                      }`}
                    >
                      {a.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <span className="block text-xs font-bold text-muted mb-2">حالت نمایش</span>
            <SegmentedTabs
              items={[
                { id: 'light', label: 'روشن' },
                { id: 'dark', label: 'تیره' },
                { id: 'auto', label: 'خودکار' },
              ]}
              value={state.settings.theme || 'auto'}
              onChange={(v) => setSetting('theme', v as AppState['settings']['theme'])}
            />
          </div>

          <div>
            <span className="block text-xs font-bold text-muted mb-2">اندازهٔ متن</span>
            <SegmentedTabs
              items={[
                { id: 's', label: 'کوچک' },
                { id: 'm', label: 'متوسط' },
                { id: 'l', label: 'بزرگ' },
              ]}
              value={state.settings.fs || 'm'}
              onChange={(v) => setSetting('fs', v as AppState['settings']['fs'])}
            />
          </div>
        </div>
      </Card>

      {/* Class identity */}
      <Card>
        <CardHeader
          icon={<Settings size={17} />}
          title="مشخصات کلاس"
          subtitle="نامی که در بالای برنامه نمایش داده می‌شود"
          className="mb-4"
        />
        <Field label="نام کلاس / گروه درمانی">
          <Input
            type="text"
            value={state.settings.className}
            onChange={(e) => setSetting('className', e.target.value)}
            placeholder="مثلاً گروه درمانی رشد"
          />
        </Field>
      </Card>

      {/* Demo seed */}
      <Card className="border-accent/25 bg-accent/[0.04]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h4 className="font-bold text-sm text-ink flex items-center gap-1.5">
              <Sparkles size={15} className="text-accent-ink" />
              داده‌های نمونه
            </h4>
            <p className="text-[11px] text-muted mt-1 leading-5">
              ۱۰ عضو نمونه با برنامه کلاسی، شهریه، حضور و تکالیف برای آشنایی با برنامه.
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            icon={<RefreshCw size={14} />}
            onClick={onResetDemo}
            className="shrink-0"
          >
            بارگذاری
          </Button>
        </div>
      </Card>

      {/* Weekly schedule */}
      <Card>
        <CardHeader icon={<Calendar size={17} />} title="برنامهٔ هفتگی" className="mb-4" />

        <div className="space-y-2">
          {state.classes.map((c, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between gap-2 p-3 rounded-field bg-surface-2 border border-line"
            >
              <div className="flex items-center gap-2.5 text-xs font-bold text-ink">
                <span className="w-2 h-2 rounded-full bg-accent" />
                <span className="num">
                  {DN[c.dow]} — {toFa(c.start)} تا {toFa(c.end)}
                </span>
              </div>
              <button
                onClick={() => removeWeeklyClass(idx)}
                className="text-[11px] font-bold text-danger hover:underline px-1"
              >
                حذف
              </button>
            </div>
          ))}
        </div>

        <div className="pt-3 mt-3 border-t border-line space-y-2">
          <span className="block text-xs font-bold text-muted">افزودن کلاس هفتگی</span>
          <div className="grid grid-cols-3 gap-2">
            <Select value={newDow} onChange={(e) => setNewDow(Number(e.target.value))}>
              {DN.map((d, i) => (
                <option key={i} value={i}>
                  {d}
                </option>
              ))}
            </Select>
            <Input type="time" value={newStart} onChange={(e) => setNewStart(e.target.value)} />
            <Input type="time" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} />
          </div>
          <Button full size="sm" icon={<Plus size={15} />} onClick={addWeeklyClass}>
            افزودن به برنامه
          </Button>
        </div>
      </Card>

      {/* Extra sessions */}
      <Card>
        <CardHeader
          icon={<Clock size={17} />}
          title="جلسات خاص و جبرانی"
          subtitle="با تاریخ مشخص"
          className="mb-4"
        />

        <div className="space-y-2">
          {state.extra.length === 0 ? (
            <p className="text-xs text-muted">جلسهٔ خاصی ثبت نشده است.</p>
          ) : (
            state.extra.map((ex, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-2 p-3 rounded-field bg-warn/[0.08] border border-warn/20"
              >
                <div className="text-xs font-bold text-ink num">
                  {fmt(fromKey(ex.key))} — {toFa(ex.start)} تا {toFa(ex.end)}
                </div>
                <button
                  onClick={() => removeExtraSession(idx)}
                  className="text-[11px] font-bold text-danger hover:underline px-1"
                >
                  حذف
                </button>
              </div>
            ))
          )}
        </div>

        <div className="pt-3 mt-3 border-t border-line space-y-2">
          <button
            type="button"
            onClick={() => setShowExtraPicker(true)}
            className="w-full h-11 text-right bg-surface-2 border border-line rounded-field px-3.5 text-xs font-bold text-ink flex items-center justify-between"
          >
            <span>{extraDate ? fmt(extraDate) : 'انتخاب تاریخ جلسه…'}</span>
            <Calendar size={15} className="text-muted" />
          </button>
          <div className="grid grid-cols-2 gap-2">
            <Input type="time" value={extraStart} onChange={(e) => setExtraStart(e.target.value)} />
            <Input type="time" value={extraEnd} onChange={(e) => setExtraEnd(e.target.value)} />
          </div>
          <Button full size="sm" variant="secondary" icon={<Plus size={15} />} onClick={addExtraSession}>
            ثبت جلسهٔ خاص
          </Button>
        </div>
      </Card>

      {/* Groups */}
      <Card>
        <CardHeader icon={<Users size={17} />} title="گروه‌بندی اعضا" className="mb-3" />

        <div className="flex flex-wrap gap-2 mb-3">
          {state.groups.map((grp) => (
            <span
              key={grp}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-2 border border-line text-[11px] font-bold text-ink"
            >
              {grp}
              {grp !== 'عمومی' && (
                <button
                  onClick={() => removeGroup(grp)}
                  aria-label={`حذف گروه ${grp}`}
                  className="text-muted hover:text-danger"
                >
                  ✕
                </button>
              )}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="نام گروه جدید…"
            className="flex-1"
          />
          <Button size="sm" onClick={addGroup} className="shrink-0">
            افزودن
          </Button>
        </div>
      </Card>

      {/* Storage & backup */}
      <Card>
        <CardHeader
          icon={<Database size={17} />}
          title="پشتیبان‌گیری و حافظه"
          action={<Badge tone="neutral">{toFa(stats.kb)} کیلوبایت</Badge>}
          className="mb-4"
        />

        <div className="rounded-field bg-surface-2 border border-line px-3.5 py-3 mb-3">
          <div className="flex items-center justify-between text-[11px] font-semibold text-muted mb-2">
            <span>مصرف حافظهٔ مرورگر</span>
            <span className="num">{toFa(stats.pct)}٪</span>
          </div>
          <div className="h-1.5 rounded-full bg-line overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${Math.max(2, stats.pct)}%` }}
            />
          </div>
          <p className="text-[11px] text-muted mt-2 num">
            {toFa(stats.sessions)} جلسه ذخیره‌شده · {toFa(stats.members)} عضو
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" icon={<Download size={15} />} onClick={handleBackup}>
            دریافت پشتیبان
          </Button>

          <label className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-field border border-line bg-surface-2 text-ink text-xs font-bold cursor-pointer hover:bg-line/50 transition-colors">
            <Upload size={15} />
            بازیابی از فایل
            <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
          </label>
        </div>

        <Button full size="sm" variant="ghost" onClick={handlePrune} className="mt-2">
          پاک‌سازی جلسات قدیمی‌تر از ۴۰ جلسه
        </Button>
      </Card>

      {/* Danger zone */}
      <Card className="border-danger/25">
        <CardHeader
          icon={<Trash2 size={17} />}
          title="مدیریت داده‌ها"
          subtitle="این اقدامات قابل بازگشت نیستند"
          className="mb-3"
        />

        <div className="space-y-2">
          {onResetToEmpty && (
            <Button
              full
              size="sm"
              variant="danger"
              icon={<Trash2 size={15} />}
              onClick={() => {
                if (
                  window.confirm(
                    'آیا مطمئن هستید؟ تمام اعضا و اطلاعات جلسات پاک شده و کلاس خالی خواهد شد.'
                  )
                ) {
                  onResetToEmpty();
                }
              }}
            >
              شروع با کلاس خالی
            </Button>
          )}

          <Button
            full
            size="sm"
            variant="secondary"
            icon={<RefreshCw size={15} />}
            onClick={() => {
              if (window.confirm('اعضای نمونهٔ آزمایشی بارگذاری شوند؟')) onResetDemo();
            }}
          >
            بارگذاری نمونهٔ آزمایشی
          </Button>
        </div>
      </Card>

      {showExtraPicker && (
        <PersianDatePicker
          initialDate={extraDate || today()}
          onSelect={(d) => setExtraDate(d)}
          onClose={() => setShowExtraPicker(false)}
          title="انتخاب تاریخ جلسهٔ خاص"
        />
      )}
    </div>
  );
};
