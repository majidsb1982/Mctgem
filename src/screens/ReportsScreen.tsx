import React, { useState } from 'react';
import {
  Share2,
  Copy,
  Check,
  PhoneCall,
  DoorOpen,
  Wallet,
  HeartHandshake,
  Calendar,
  FileText,
} from 'lucide-react';
import { AppState } from '../types';
import {
  getRoundReportText,
  getFeeReportText,
  getHumanHamiSummary,
  copyToClipboard,
  shareText,
} from '../utils/reports';
import { fmt, fromKey } from '../utils/jalali';
import { Button, Card, CardHeader, ListRow, Select, Sheet } from '../components/ui';

interface ReportsScreenProps {
  state: AppState;
  activeSessionKey: string;
  onSelectSession?: (key: string) => void;
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({
  state,
  activeSessionKey,
  onSelectSession,
}) => {
  const [modalTitle, setModalTitle] = useState<string>('');
  const [modalText, setModalText] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const sessionKeys = Array.from(
    new Set([activeSessionKey, ...Object.keys(state?.sessions || {})])
  )
    .sort()
    .reverse();

  const showReport = (title: string, text: string) => {
    setModalTitle(title);
    setModalText(text);
    setCopied(false);
  };

  const handleCopy = () => {
    if (modalText) {
      copyToClipboard(modalText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const tiles = [
    {
      title: 'گزارش نوبت ۱',
      desc: 'حاضرین، تأخیرها، غایبین و موارد نیازمند هماهنگی',
      icon: PhoneCall,
      tone: 'accent' as const,
      action: () =>
        showReport('گزارش نوبت ۱ (تماس‌های قبلی)', getRoundReportText(state, activeSessionKey, 1, true)),
    },
    {
      title: 'گزارش نوبت ۲',
      desc: 'حضور نهایی و وضعیت ورود اعضا به کلاس',
      icon: DoorOpen,
      tone: 'success' as const,
      action: () =>
        showReport('گزارش نوبت ۲ (پشت در کلاس)', getRoundReportText(state, activeSessionKey, 2, true)),
    },
    {
      title: 'گزارش شهریه',
      desc: 'آمار واریزها، قول‌ها و موارد پیگیری‌نشده',
      icon: Wallet,
      tone: 'warn' as const,
      action: () => showReport('گزارش شهریهٔ جلسه', getFeeReportText(state, activeSessionKey)),
    },
    {
      title: 'خلاصهٔ حمایتی',
      desc: 'متن گرم و همدلانه برای حامیان و درمانگر',
      icon: HeartHandshake,
      tone: 'danger' as const,
      action: () => showReport('خلاصهٔ حمایتی برای حامی‌ها', getHumanHamiSummary(state, activeSessionKey)),
    },
  ];

  return (
    <div className="space-y-4 pb-12">
      <Card>
        <CardHeader
          icon={<FileText size={17} />}
          title="خروجی گزارش"
          subtitle="یادداشت‌های محرمانه به‌صورت خودکار حذف می‌شوند."
          className="mb-4"
        />

        {onSelectSession && (
          <div className="flex items-center gap-2">
            <Calendar size={15} className="text-muted shrink-0" />
            <span className="text-xs font-bold text-muted shrink-0">جلسهٔ گزارش:</span>
            <Select
              value={activeSessionKey}
              onChange={(e) => onSelectSession(e.target.value)}
              className="flex-1"
            >
              {sessionKeys.map((k) => (
                <option key={k} value={k}>
                  جلسهٔ {fmt(fromKey(k))}
                </option>
              ))}
            </Select>
          </div>
        )}
      </Card>

      <Card padded={false} className="p-1.5">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <ListRow
              key={t.title}
              icon={<Icon size={19} />}
              title={t.title}
              description={t.desc}
              tone={t.tone}
              trailing={<Share2 size={15} className="text-muted/60 shrink-0" />}
              onClick={t.action}
            />
          );
        })}
      </Card>

      <Sheet
        open={!!modalText}
        onClose={() => setModalText(null)}
        title={modalTitle}
        subtitle="متن آمادهٔ کپی یا اشتراک‌گذاری در پیام‌رسان‌ها"
        width="lg"
        footer={
          <div className="flex items-center gap-2">
            <Button full size="sm" icon={copied ? <Check size={15} /> : <Copy size={15} />} onClick={handleCopy}>
              {copied ? 'کپی شد' : 'کپی متن'}
            </Button>
            <Button
              full
              size="sm"
              variant="secondary"
              icon={<Share2 size={15} />}
              onClick={() => modalText && shareText(modalTitle, modalText)}
            >
              اشتراک‌گذاری
            </Button>
          </div>
        }
      >
        <textarea
          readOnly
          value={modalText || ''}
          rows={14}
          className="w-full bg-surface-2 border border-line rounded-field p-3.5 text-xs text-ink leading-7 focus:outline-none focus:border-accent/50"
        />
      </Sheet>
    </div>
  );
};
