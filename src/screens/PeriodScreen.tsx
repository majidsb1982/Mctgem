import React, { useState } from 'react';
import { Award, Check, Save, Users } from 'lucide-react';
import { AppState, PeriodData } from '../types';
import { Button, Card, CardHeader, Field, Input, Textarea } from '../components/ui';

interface PeriodScreenProps {
  state: AppState;
  onUpdateState: (fn: (prev: AppState) => AppState) => void;
  onNavigate: (screen: string) => void;
}

interface PickerProps {
  label: string;
  hint: string;
  members: AppState['members'];
  selected: string[];
  onToggle: (id: string) => void;
}

const MemberPicker: React.FC<PickerProps> = ({ label, hint, members, selected, onToggle }) => (
  <div>
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs font-bold text-muted">{label}</span>
      <span className="text-[10px] font-bold text-accent-ink num">
        {selected.length.toLocaleString('fa-IR')} انتخاب
      </span>
    </div>
    <p className="text-[11px] text-muted mb-2 leading-5">{hint}</p>

    {members.length === 0 ? (
      <p className="text-xs text-muted py-2">عضوی برای انتخاب وجود ندارد.</p>
    ) : (
      <div className="grid grid-cols-2 gap-1.5 max-h-52 overflow-y-auto p-1">
        {members.map((m) => {
          const active = selected.includes(m.id);
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onToggle(m.id)}
              aria-pressed={active}
              className={`flex items-center gap-2 min-h-11 px-2.5 rounded-field border text-start transition-colors ${
                active
                  ? 'border-accent/40 bg-accent/[0.08] text-ink'
                  : 'border-line bg-surface text-muted hover:bg-surface-2'
              }`}
            >
              <span
                className={`w-5 h-5 shrink-0 rounded-full border flex items-center justify-center ${
                  active ? 'bg-accent border-accent text-accent-fg' : 'border-line'
                }`}
              >
                {active && <Check size={12} strokeWidth={3} />}
              </span>
              <span className="text-xs font-semibold truncate">{m.name}</span>
            </button>
          );
        })}
      </div>
    )}
  </div>
);

export const PeriodScreen: React.FC<PeriodScreenProps> = ({ state, onUpdateState, onNavigate }) => {
  const [title, setTitle] = useState(state.period.title || 'دوره جاری');
  const [attendIds, setAttendIds] = useState<string[]>(state.period.attendIds || []);
  const [feeIds, setFeeIds] = useState<string[]>(state.period.feeIds || []);
  const [hwIds, setHwIds] = useState<string[]>(state.period.hwIds || []);
  const [note, setNote] = useState(state.period.note || '');

  const hamis = state.members.filter((m) => (m.roles || []).includes('support'));

  const togglePick = (id: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
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
      const updatedMembers = prev.members.map((m) => {
        const roles = new Set(m.roles || []);
        if (attendIds.includes(m.id)) roles.add('attend');
        if (feeIds.includes(m.id)) roles.add('fee');
        if (hwIds.includes(m.id)) roles.add('hw');
        return { ...m, roles: Array.from(roles) };
      });

      return { ...prev, period: updatedPeriod, members: updatedMembers };
    });

    alert('دوره و مسئولان جدید با موفقیت ذخیره شدند.');
    onNavigate('home');
  };

  return (
    <div className="space-y-4 pb-12">
      <Card>
        <CardHeader
          icon={<Award size={17} />}
          title="دورهٔ جاری"
          subtitle="در هر دوره، مسئولان پیگیری با نظر درمانگر تغییر می‌کنند."
          className="mb-4"
        />

        <Field label="عنوان دوره">
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثلاً دورهٔ بهار ۱۴۰۵"
          />
        </Field>
      </Card>

      <Card>
        <div className="space-y-5">
          <MemberPicker
            label="مسئولان پیگیری حضور"
            hint="می‌توانید چند نفر را انتخاب کنید."
            members={state.members}
            selected={attendIds}
            onToggle={(id) => togglePick(id, attendIds, setAttendIds)}
          />

          <div className="border-t border-line pt-4">
            <MemberPicker
              label="مسئولان پیگیری شهریه"
              hint="پیگیری واریزها و تماس با بدهکاران."
              members={state.members}
              selected={feeIds}
              onToggle={(id) => togglePick(id, feeIds, setFeeIds)}
            />
          </div>

          <div className="border-t border-line pt-4">
            <MemberPicker
              label="مسئول تکالیف"
              hint="ثبت و ارسال تکلیف هر جلسه."
              members={state.members}
              selected={hwIds}
              onToggle={(id) => togglePick(id, hwIds, setHwIds)}
            />
          </div>
        </div>
      </Card>

      <Card>
        <Field label="توضیحات و اهداف دوره">
          <Textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="اهداف ویژهٔ این دوره…"
          />
        </Field>

        {hamis.length > 0 && (
          <div className="mt-3 rounded-field bg-surface-2 border border-line px-3 py-2.5">
            <span className="text-[11px] font-bold text-ink flex items-center gap-1.5 mb-1">
              <Users size={13} className="text-accent-ink" />
              حامی‌های شناخته‌شده
            </span>
            <span className="text-[11px] text-muted leading-5">{hamis.map((m) => m.name).join('، ')}</span>
          </div>
        )}
      </Card>

      <Button full size="lg" icon={<Save size={16} />} onClick={handleSave}>
        ذخیرهٔ دوره و مسئولان
      </Button>
    </div>
  );
};
