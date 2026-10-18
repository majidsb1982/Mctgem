import React, { useState } from 'react';
import {
  Wallet,
  Phone,
  MessageCircle,
  CheckCircle2,
  FileSpreadsheet,
  Share2,
  Search,
  RotateCcw,
  UserPlus,
  Clock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AppState, Member, FeeStatus } from '../types';
import { fmt, fromKey, toFa } from '../utils/jalali';
import { getFeeReportText, copyToClipboard, shareText, getWhatsAppLink } from '../utils/reports';
import { playAlertTone } from '../utils/audio';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  IconButton,
  Input,
  SegmentedTabs,
  Select,
  Sheet,
} from '../components/ui';

interface FeesScreenProps {
  state: AppState;
  onUpdateState: (fn: (prev: AppState) => AppState) => void;
  activeSessionKey: string;
  onSelectSession?: (key: string) => void;
  onNavigate?: (screen: string) => void;
}

export const FeesScreen: React.FC<FeesScreenProps> = ({
  state,
  onUpdateState,
  activeSessionKey,
  onSelectSession,
  onNavigate,
}) => {
  const [feeTab, setFeeTab] = useState<'pay' | 'follow' | 'done'>('pay');
  const [search, setSearch] = useState('');
  const [reportModal, setReportModal] = useState<string | null>(null);

  const feeData = (state?.fees && state.fees[activeSessionKey]) || {};
  const safeMembers = Array.isArray(state?.members) ? state.members.filter(Boolean) : [];

  const paidMembers = safeMembers.filter((m) => !!feeData[m.id]?.paid);
  const unpaidMembers = safeMembers.filter((m) => !feeData[m.id]?.paid);

  const followUpNeeded = unpaidMembers.filter((m) => !feeData[m.id]?.fc);
  const followUpDone = safeMembers.filter((m) => !!feeData[m.id]?.paid || !!feeData[m.id]?.fc);

  const pct = safeMembers.length ? Math.round((paidMembers.length / safeMembers.length) * 100) : 0;

  const togglePaid = (memberId: string) => {
    onUpdateState((prev) => {
      const currentFees = prev.fees[activeSessionKey] || {};
      const cur = currentFees[memberId] || {};
      const newPaid = !cur.paid;

      const updated: Record<string, FeeStatus> = {
        ...currentFees,
        [memberId]: {
          ...cur,
          paid: newPaid,
          fc: newPaid ? ('paid' as const) : null,
          date: newPaid ? new Date().toISOString() : undefined,
        },
      };

      const allPaidNow = prev.members.every((m) =>
        m.id === memberId ? newPaid : !!updated[m.id]?.paid
      );
      if (allPaidNow && prev.members.length > 0) {
        confetti({ particleCount: 100, spread: 70 });
        playAlertTone('success');
      } else {
        playAlertTone('beep');
      }

      return { ...prev, fees: { ...prev.fees, [activeSessionKey]: updated } };
    });
  };

  const setFollowStatus = (memberId: string, status: 'promised' | 'noanswer' | 'paid') => {
    onUpdateState((prev) => {
      const currentFees = prev.fees[activeSessionKey] || {};
      const cur = currentFees[memberId] || {};
      const isPaid = status === 'paid';

      const updated = {
        ...currentFees,
        [memberId]: {
          ...cur,
          fc: status,
          paid: isPaid ? true : cur.paid,
          date: isPaid ? new Date().toISOString() : cur.date,
        },
      };

      if (isPaid) {
        const allPaid = prev.members.every((m) => (m.id === memberId ? true : !!updated[m.id]?.paid));
        if (allPaid) {
          confetti({ particleCount: 100, spread: 70 });
          playAlertTone('success');
        } else {
          playAlertTone('beep');
        }
      } else {
        playAlertTone('beep');
      }

      return { ...prev, fees: { ...prev.fees, [activeSessionKey]: updated } };
    });
  };

  const updateFeeNote = (memberId: string, noteVal: string) => {
    onUpdateState((prev) => {
      const currentFees = prev.fees[activeSessionKey] || {};
      const cur = currentFees[memberId] || {};
      return {
        ...prev,
        fees: {
          ...prev.fees,
          [activeSessionKey]: { ...currentFees, [memberId]: { ...cur, note: noteVal } },
        },
      };
    });
  };

  const restoreFee = (memberId: string) => {
    onUpdateState((prev) => {
      const currentFees = prev.fees[activeSessionKey] || {};
      const cur = currentFees[memberId] || {};
      return {
        ...prev,
        fees: {
          ...prev.fees,
          [activeSessionKey]: { ...currentFees, [memberId]: { ...cur, fc: null, paid: false } },
        },
      };
    });
  };

  const exportCSV = () => {
    const rows = [
      ['نام عضو', 'شماره تماس', 'وضعیت پرداخت', 'وضعیت پیگیری', 'یادداشت فیش'],
      ...state.members.map((m) => {
        const cur = feeData[m.id] || {};
        return [
          m.name,
          (m.phones || []).join(' - '),
          cur.paid ? 'پرداخت شده' : 'پرداخت نشده',
          cur.fc === 'promised'
            ? 'قول داد'
            : cur.fc === 'noanswer'
            ? 'بی‌پاسخ'
            : cur.paid
            ? 'پرداخت شد'
            : 'پیگیری نشده',
          cur.note || '',
        ];
      }),
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      rows.map((e) => e.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `شهریه-${activeSessionKey}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const openReport = () => setReportModal(getFeeReportText(state, activeSessionKey));

  const filterList = (arr: Member[]) => (search ? arr.filter((m) => m.name.includes(search)) : arr);

  const sessionOptions = Array.from(
    new Set([
      activeSessionKey,
      ...Object.keys(state?.sessions || {}),
      ...Object.keys(state?.fees || {}),
    ])
  )
    .sort()
    .reverse();

  return (
    <div className="space-y-4 pb-12">
      {/* Summary */}
      <Card>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-ink flex items-center gap-2">
              <Wallet size={17} className="text-accent-ink" />
              شهریهٔ جلسه
            </p>
            <p className="text-[11px] text-muted mt-1 num">{fmt(fromKey(activeSessionKey))}</p>
          </div>
          <Badge tone={unpaidMembers.length ? 'warn' : 'success'} dot>
            {unpaidMembers.length ? `${toFa(unpaidMembers.length)} مانده` : 'تکمیل'}
          </Badge>
        </div>

        {onSelectSession && (
          <Select
            value={activeSessionKey}
            onChange={(e) => onSelectSession(e.target.value)}
            className="mb-3"
          >
            {sessionOptions.map((k) => (
              <option key={k} value={k}>
                جلسهٔ {fmt(fromKey(k))}
              </option>
            ))}
          </Select>
        )}

        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: 'پرداخت‌شده', value: paidMembers.length, tone: 'text-success' },
            { label: 'مانده', value: unpaidMembers.length, tone: 'text-danger' },
            { label: 'درصد', value: `${pct}٪`, tone: 'text-accent-ink' },
          ].map((s) => (
            <div key={s.label} className="rounded-field bg-surface-2 border border-line px-2 py-2 text-center">
              <div className={`text-base font-extrabold num ${s.tone}`}>
                {typeof s.value === 'number' ? toFa(s.value) : toFa(s.value)}
              </div>
              <div className="text-[10px] font-semibold text-muted mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="h-2 rounded-full bg-surface-2 overflow-hidden mb-3">
          <div
            className="h-full rounded-full bg-success transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" icon={<Share2 size={15} />} onClick={openReport} className="flex-1">
            گزارش به حامی
          </Button>
          <Button size="sm" variant="secondary" icon={<FileSpreadsheet size={15} />} onClick={exportCSV}>
            اکسل
          </Button>
        </div>
      </Card>

      <SegmentedTabs
        items={[
          { id: 'pay', label: 'پرداخت‌ها', count: safeMembers.length },
          { id: 'follow', label: 'پیگیری', count: followUpNeeded.length },
          { id: 'done', label: 'انجام‌شده', count: followUpDone.length },
        ]}
        value={feeTab}
        onChange={(v) => setFeeTab(v as 'pay' | 'follow' | 'done')}
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
          placeholder="جستجوی نام عضو…"
          className="ps-10"
        />
      </div>

      {/* Payments */}
      {feeTab === 'pay' && (
        <div className="space-y-2.5">
          {safeMembers.length === 0 ? (
            <EmptyState
              icon={<Wallet size={22} />}
              title="هنوز عضوی ثبت نشده است"
              description="برای ثبت وضعیت شهریه، ابتدا اعضای گروه را اضافه کنید."
              action={
                onNavigate ? (
                  <Button size="sm" icon={<UserPlus size={15} />} onClick={() => onNavigate('members')}>
                    افزودن عضو
                  </Button>
                ) : undefined
              }
            />
          ) : filterList(safeMembers).length === 0 ? (
            <EmptyState icon={<Search size={22} />} title="عضوی با این نام پیدا نشد" />
          ) : (
            filterList(safeMembers).map((member) => {
              const cur = feeData[member.id] || {};
              const isPaid = !!cur.paid;

              return (
                <Card
                  key={member.id}
                  className={`space-y-2.5 ${isPaid ? 'border-s-4 border-s-success' : 'border-s-4 border-s-danger/40'}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 shrink-0 rounded-xl bg-surface-2 border border-line flex items-center justify-center font-bold text-sm text-ink">
                        {member.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-ink truncate">{member.name}</h4>
                        <span className="text-[11px] text-muted num">
                          {(member.phones || [])[0] ? toFa((member.phones || [])[0]) : 'بدون شماره'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => togglePaid(member.id)}
                      className={`h-9 px-3 rounded-field text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 shrink-0 border ${
                        isPaid
                          ? 'bg-success text-white border-success'
                          : 'bg-danger/[0.07] text-danger border-danger/25'
                      }`}
                    >
                      {isPaid ? (
                        <>
                          <CheckCircle2 size={14} />
                          پرداخت شد
                        </>
                      ) : (
                        'پرداخت نشده'
                      )}
                    </button>
                  </div>

                  {isPaid && (
                    <Input
                      type="text"
                      placeholder="یادداشت فیش (مثلاً عکس فیش در واتساپ)…"
                      value={cur.note || ''}
                      onChange={(e) => updateFeeNote(member.id, e.target.value)}
                      className="h-10 text-xs"
                    />
                  )}
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Follow-up */}
      {feeTab === 'follow' && (
        <div className="space-y-2.5">
          {filterList(followUpNeeded).length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 size={22} />}
              title="همه پیگیری شده‌اند"
              description="یا پرداخت کرده‌اند یا وضعیت پیگیری‌شان ثبت شده است."
            />
          ) : (
            filterList(followUpNeeded).map((member) => {
              const cur = feeData[member.id] || {};
              return (
                <Card key={member.id} className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 shrink-0 rounded-xl bg-warn/10 text-warn flex items-center justify-center font-bold text-sm">
                        {member.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-ink truncate">{member.name}</h4>
                        <Badge tone="danger" className="mt-1">
                          پرداخت نشده
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {(member.phones || []).slice(0, 2).map((phone, idx) => (
                        <React.Fragment key={idx}>
                          <a
                            href={`tel:${phone}`}
                            aria-label={`تماس با شمارهٔ ${toFa(idx + 1)}`}
                            className="w-10 h-10 rounded-xl bg-surface-2 border border-line text-ink flex items-center justify-center hover:bg-line/50"
                          >
                            <Phone size={15} />
                          </a>
                          <a
                            href={getWhatsAppLink(
                              phone,
                              `سلام ${member.name} عزیز 🌸 یادآوری مهلت واریز شهریه جلسهٔ ${fmt(
                                fromKey(activeSessionKey)
                              )}. سپاسگزاریم.`
                            )}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`واتساپ شمارهٔ ${toFa(idx + 1)}`}
                            className="w-10 h-10 rounded-xl bg-success text-white flex items-center justify-center"
                          >
                            <MessageCircle size={15} />
                          </a>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'promised' as const, label: 'قول داد' },
                      { id: 'noanswer' as const, label: 'جواب نداد' },
                      { id: 'paid' as const, label: 'پرداخت کرد' },
                    ].map((opt) => {
                      const active = cur.fc === opt.id;
                      const isPaidOpt = opt.id === 'paid';
                      return (
                        <button
                          key={opt.id}
                          onClick={() => setFollowStatus(member.id, opt.id)}
                          className={`min-h-10 rounded-field border text-[11px] font-bold transition-all active:scale-95 ${
                            isPaidOpt
                              ? 'bg-success text-white border-success'
                              : active
                              ? opt.id === 'promised'
                                ? 'bg-warn text-white border-warn'
                                : 'bg-danger text-white border-danger'
                              : 'bg-surface-2 border-line text-muted hover:bg-line/50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Done */}
      {feeTab === 'done' && (
        <div className="space-y-2">
          {filterList(followUpDone).length === 0 ? (
            <EmptyState
              icon={<Clock size={22} />}
              title="هنوز موردی ثبت نشده"
              description="پرداخت‌ها و پیگیری‌های انجام‌شده اینجا فهرست می‌شوند."
            />
          ) : (
            filterList(followUpDone).map((member) => {
              const cur = feeData[member.id] || {};
              const isPaid = !!cur.paid;
              const label = isPaid
                ? 'پرداخت شد'
                : cur.fc === 'promised'
                ? 'قول داده'
                : cur.fc === 'noanswer'
                ? 'بی‌پاسخ'
                : 'پیگیری شده';

              return (
                <Card key={member.id} padded={false} className="p-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 shrink-0 rounded-xl bg-surface-2 border border-line flex items-center justify-center font-bold text-xs text-ink">
                      {member.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-ink truncate">{member.name}</h4>
                      <Badge tone={isPaid ? 'success' : 'warn'} className="mt-1">
                        {label}
                      </Badge>
                    </div>
                  </div>

                  <IconButton aria-label="بازگردانی وضعیت" onClick={() => restoreFee(member.id)}>
                    <RotateCcw size={16} />
                  </IconButton>
                </Card>
              );
            })
          )}
        </div>
      )}

      <Sheet
        open={!!reportModal}
        onClose={() => setReportModal(null)}
        title="گزارش وضعیت شهریه"
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
                  alert('متن گزارش شهریه کپی شد.');
                }
              }}
            >
              کپی متن
            </Button>
            <Button
              full
              size="sm"
              variant="secondary"
              onClick={() => reportModal && shareText('گزارش شهریه', reportModal)}
            >
              ارسال
            </Button>
          </div>
        }
      >
        <textarea
          readOnly
          value={reportModal || ''}
          rows={12}
          className="w-full bg-surface-2 border border-line rounded-field p-3.5 text-xs text-ink leading-7 focus:outline-none"
        />
      </Sheet>
    </div>
  );
};
