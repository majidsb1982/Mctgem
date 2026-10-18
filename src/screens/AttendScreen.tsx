import React, { useState } from 'react';
import {
  Phone,
  MessageCircle,
  Clock,
  Mic,
  RotateCcw,
  Search,
  Share2,
  FileSpreadsheet,
  DoorOpen,
  PhoneCall,
  UserPlus,
  Square,
  Check,
} from 'lucide-react';
import { AppState, AttendanceStatus } from '../types';
import { fmt, fromKey, toFa } from '../utils/jalali';
import { getRoundReportText, copyToClipboard, shareText, getWhatsAppLink } from '../utils/reports';
import { VoiceRecorder, playAlertTone } from '../utils/audio';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  IconButton,
  Input,
  SegmentedTabs,
  Select,
  Sheet,
} from '../components/ui';

interface AttendScreenProps {
  state: AppState;
  onUpdateState: (fn: (prev: AppState) => AppState) => void;
  onNavigate: (screen: string) => void;
  activeSessionKey: string;
  onSelectSession: (key: string) => void;
}

const STATUS_META = {
  present: { label: 'حاضر', active: 'bg-success text-white border-success', idle: 'text-success' },
  delay: { label: 'تأخیر', active: 'bg-warn text-white border-warn', idle: 'text-warn' },
  absent: { label: 'غایب', active: 'bg-danger text-white border-danger', idle: 'text-danger' },
  problem: { label: 'مشکل', active: 'bg-accent text-accent-fg border-accent', idle: 'text-accent-ink' },
} as const;

export const AttendScreen: React.FC<AttendScreenProps> = ({
  state,
  onUpdateState,
  onNavigate,
  activeSessionKey,
  onSelectSession,
}) => {
  const [doneTab, setDoneTab] = useState(false);
  const [search, setSearch] = useState('');
  const [reportModal, setReportModal] = useState<string | null>(null);
  const [recordingForId, setRecordingForId] = useState<string | null>(null);
  const [recorderInstance, setRecorderInstance] = useState<VoiceRecorder | null>(null);

  const sessionData = (state?.sessions && state.sessions[activeSessionKey]) || {};

  const sessionKeys = Array.from(
    new Set([activeSessionKey, ...Object.keys(state?.sessions || {})])
  )
    .sort()
    .reverse();

  const safeMembers = Array.isArray(state?.members) ? state.members.filter(Boolean) : [];

  const uncalled = safeMembers.filter((m) => !sessionData[m.id]?.p1);
  const called = safeMembers.filter((m) => !!sessionData[m.id]?.p1);

  const displayedMembers = (doneTab ? called : uncalled).filter((m) =>
    search ? (m.name || '').includes(search) : true
  );

  const pct = safeMembers.length ? Math.round((called.length / safeMembers.length) * 100) : 0;

  const setStatus = (memberId: string, status: 'present' | 'delay' | 'absent' | 'problem') => {
    onUpdateState((prev) => {
      const prevSession = prev.sessions[activeSessionKey] || {};
      const currentMemberStatus = prevSession[memberId] || {};
      const isToggleOff = currentMemberStatus.p1 === status;

      const newMemberStatus: AttendanceStatus = isToggleOff
        ? { ...currentMemberStatus, p1: null }
        : {
            ...currentMemberStatus,
            p1: status,
            time: currentMemberStatus.time || (status === 'delay' ? '19:30' : undefined),
          };

      return {
        ...prev,
        sessions: {
          ...prev.sessions,
          [activeSessionKey]: { ...prevSession, [memberId]: newMemberStatus },
        },
      };
    });
    playAlertTone('beep');
  };

  const updateTime = (memberId: string, timeVal: string) => {
    onUpdateState((prev) => {
      const prevSession = prev.sessions[activeSessionKey] || {};
      const cur = prevSession[memberId] || {};
      return {
        ...prev,
        sessions: {
          ...prev.sessions,
          [activeSessionKey]: { ...prevSession, [memberId]: { ...cur, time: timeVal } },
        },
      };
    });
  };

  const updateNote = (memberId: string, noteVal: string) => {
    onUpdateState((prev) => {
      const prevSession = prev.sessions[activeSessionKey] || {};
      const cur = prevSession[memberId] || {};
      return {
        ...prev,
        sessions: {
          ...prev.sessions,
          [activeSessionKey]: { ...prevSession, [memberId]: { ...cur, note: noteVal } },
        },
      };
    });
  };

  const restoreMember = (memberId: string) => {
    onUpdateState((prev) => {
      const prevSession = prev.sessions[activeSessionKey] || {};
      const cur = prevSession[memberId] || {};
      return {
        ...prev,
        sessions: {
          ...prev.sessions,
          [activeSessionKey]: { ...prevSession, [memberId]: { ...cur, p1: null } },
        },
      };
    });
  };

  const startVoiceRecord = async (memberId: string) => {
    const rec = new VoiceRecorder();
    const ok = await rec.start();
    if (ok) {
      setRecorderInstance(rec);
      setRecordingForId(memberId);
    } else {
      alert('دسترسی به میکروفون داده نشد یا پشتیبانی نمی‌شود.');
    }
  };

  const stopVoiceRecord = async (memberId: string) => {
    if (recorderInstance) {
      const audioData = await recorderInstance.stop();
      if (audioData) {
        onUpdateState((prev) => {
          const prevSession = prev.sessions[activeSessionKey] || {};
          const cur = prevSession[memberId] || {};
          return {
            ...prev,
            sessions: {
              ...prev.sessions,
              [activeSessionKey]: { ...prevSession, [memberId]: { ...cur, a1: audioData } },
            },
          };
        });
      }
      setRecorderInstance(null);
      setRecordingForId(null);
    }
  };

  const exportCSV = () => {
    const rows = [
      ['نام عضو', 'شماره تماس', 'وضعیت نوبت ۱', 'ساعت تأخیر', 'یادداشت'],
      ...state.members.map((m) => {
        const cur = sessionData[m.id] || {};
        const stLabel =
          cur.p1 === 'present'
            ? 'حاضر'
            : cur.p1 === 'delay'
            ? 'تأخیر'
            : cur.p1 === 'absent'
            ? 'غایب'
            : cur.p1 === 'problem'
            ? 'مشکل'
            : 'ثبت‌نشده';
        return [m.name, (m.phones || []).join(' - '), stLabel, cur.time || '', cur.note || ''];
      }),
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      rows.map((e) => e.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `حضور-نوبت1-${activeSessionKey}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const openReport = () => setReportModal(getRoundReportText(state, activeSessionKey, 1, true));

  return (
    <div className="space-y-4 pb-12">
      {/* Session + progress */}
      <Card>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-accent/10 text-accent-ink flex items-center justify-center">
              <PhoneCall size={17} />
            </span>
            <div>
              <p className="text-sm font-bold text-ink leading-6">تماس‌های نوبت ۱</p>
              <p className="text-[11px] text-muted leading-4">قبل از کلاس با اعضا هماهنگ کنید</p>
            </div>
          </div>
          <Badge tone="accent">{toFa(pct)}٪</Badge>
        </div>

        <Select value={activeSessionKey} onChange={(e) => onSelectSession(e.target.value)}>
          {sessionKeys.map((k) => (
            <option key={k} value={k}>
              جلسهٔ {fmt(fromKey(k))}
            </option>
          ))}
        </Select>

        <div className="mt-3">
          <div className="flex justify-between text-[11px] font-bold mb-1.5">
            <span className="text-muted">
              ثبت‌شده: <b className="text-accent-ink num">{toFa(called.length)}</b> از{' '}
              <span className="num">{toFa(safeMembers.length)}</span>
            </span>
            <span className="text-accent-ink num">{toFa(pct)}٪</span>
          </div>
          <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 overflow-x-auto no-scrollbar">
          <Button size="sm" icon={<DoorOpen size={15} />} onClick={() => onNavigate('entry')}>
            نوبت ۲
          </Button>
          <Button size="sm" variant="secondary" icon={<Share2 size={15} />} onClick={openReport}>
            گزارش حامی
          </Button>
          <Button size="sm" variant="ghost" icon={<FileSpreadsheet size={15} />} onClick={exportCSV}>
            اکسل
          </Button>
        </div>
      </Card>

      <SegmentedTabs
        items={[
          { id: 'pending', label: 'ثبت‌نشده', count: uncalled.length },
          { id: 'done', label: 'ثبت‌شده', count: called.length },
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
            icon={<PhoneCall size={22} />}
            title="هنوز عضوی ثبت نشده است"
            description="برای ثبت تماس‌های نوبت ۱، ابتدا اعضای گروه را اضافه کنید."
            action={
              <Button size="sm" icon={<UserPlus size={15} />} onClick={() => onNavigate('members')}>
                افزودن عضو
              </Button>
            }
          />
        ) : displayedMembers.length === 0 ? (
          <EmptyState
            icon={<Check size={22} />}
            title={doneTab ? 'هنوز تماسی ثبت نشده' : 'همهٔ تماس‌های این جلسه ثبت شد'}
            description={
              doneTab
                ? 'پس از ثبت وضعیت هر عضو، فهرست اینجا نمایش داده می‌شود.'
                : 'می‌توانید گزارش را برای حامیان ارسال کنید.'
            }
          />
        ) : (
          displayedMembers.map((member) => {
            const cur = sessionData[member.id] || {};
            const isRecording = recordingForId === member.id;
            const status = cur.p1 as keyof typeof STATUS_META | undefined;

            return (
              <Card
                key={member.id}
                className={`space-y-3 ${status ? 'border-accent/25' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-surface-2 border border-line text-ink flex items-center justify-center font-bold text-sm">
                      {member.name.trim().charAt(0) || '؟'}
                    </div>

                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-ink truncate">{member.name}</h4>
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        {member.careFlag && <Badge tone="danger">حمایتی</Badge>}
                        {member.needs && member.needs.length > 0 && (
                          <Badge tone="warn">نیاز ویژه</Badge>
                        )}
                        {status && (
                          <Badge
                            tone={
                              status === 'present'
                                ? 'success'
                                : status === 'delay'
                                ? 'warn'
                                : status === 'absent'
                                ? 'danger'
                                : 'accent'
                            }
                          >
                            {status === 'delay'
                              ? `تأخیر ${toFa(cur.time || '19:30')}`
                              : STATUS_META[status].label}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {(member.phones || []).slice(0, 2).map((phone, pIdx) => (
                      <React.Fragment key={pIdx}>
                        <a
                          href={`tel:${phone}`}
                          title={`تماس با شمارهٔ ${toFa(pIdx + 1)}`}
                          aria-label={`تماس با شمارهٔ ${toFa(pIdx + 1)}`}
                          className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center hover:bg-success/15 active:scale-95 transition-transform"
                        >
                          <Phone size={16} />
                        </a>
                        <a
                          href={getWhatsAppLink(phone)}
                          target="_blank"
                          rel="noreferrer"
                          title={`واتساپ شمارهٔ ${toFa(pIdx + 1)}`}
                          aria-label={`واتساپ شمارهٔ ${toFa(pIdx + 1)}`}
                          className="w-10 h-10 rounded-xl bg-success text-white flex items-center justify-center hover:brightness-110 active:scale-95 transition-transform"
                        >
                          <MessageCircle size={16} />
                        </a>
                      </React.Fragment>
                    ))}
                    {doneTab && (
                      <IconButton
                        aria-label="بازگردانی به ثبت‌نشده"
                        onClick={() => restoreMember(member.id)}
                      >
                        <RotateCcw size={16} />
                      </IconButton>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {(Object.keys(STATUS_META) as (keyof typeof STATUS_META)[]).map((key) => {
                    const active = cur.p1 === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setStatus(member.id, key)}
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

                {cur.p1 === 'delay' && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-field bg-warn/[0.08] border border-warn/20">
                    <Clock size={15} className="text-warn shrink-0" />
                    <span className="text-[11px] font-bold text-ink">ساعت تقریبی ورود</span>
                    <input
                      type="time"
                      value={cur.time || '19:30'}
                      onChange={(e) => updateTime(member.id, e.target.value)}
                      className="ms-auto h-9 bg-surface border border-line rounded-lg px-2 text-xs font-bold text-ink"
                    />
                  </div>
                )}

                {cur.p1 && cur.p1 !== 'present' && (
                  <div className="space-y-2 pt-1">
                    <Input
                      type="text"
                      placeholder="یادداشت پیگیری (اختیاری)…"
                      value={cur.note || ''}
                      onChange={(e) => updateNote(member.id, e.target.value)}
                      className="h-10 text-xs"
                    />

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={isRecording ? 'danger' : 'secondary'}
                        icon={isRecording ? <Square size={13} /> : <Mic size={13} />}
                        onClick={() =>
                          isRecording ? stopVoiceRecord(member.id) : startVoiceRecord(member.id)
                        }
                      >
                        {isRecording ? 'توقف ضبط' : 'یادداشت صوتی'}
                      </Button>
                      {cur.a1 && <audio controls src={cur.a1} className="h-8 flex-1 min-w-0" />}
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      <Sheet
        open={!!reportModal}
        onClose={() => setReportModal(null)}
        title="گزارش نوبت ۱"
        subtitle="آمادهٔ ارسال به حامیان"
        width="lg"
        footer={
          <div className="flex items-center gap-2">
            <Button
              full
              size="sm"
              icon={<Share2 size={15} />}
              onClick={() => reportModal && copyToClipboard(reportModal)}
            >
              کپی متن
            </Button>
            <Button
              full
              size="sm"
              variant="secondary"
              onClick={() => reportModal && shareText('گزارش نوبت ۱', reportModal)}
            >
              اشتراک‌گذاری
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
