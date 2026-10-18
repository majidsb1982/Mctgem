import React from 'react';
import {
  FileText,
  Settings,
  Sparkles,
  Award,
  ShieldCheck,
  WifiOff,
} from 'lucide-react';
import { AppState } from '../types';
import { Card, ListRow } from '../components/ui';

interface MoreScreenProps {
  onNavigate: (screen: string) => void;
  state: AppState;
}

export const MoreScreen: React.FC<MoreScreenProps> = ({ onNavigate }) => {
  const sections = [
    {
      group: 'کارهای تکمیلی',
      items: [
        {
          id: 'reports',
          title: 'گزارش‌ها و ارتباطات',
          desc: 'گزارش حامی، پیام‌ها و خروجی متنی',
          icon: Sparkles,
          tone: 'accent' as const,
        },
        {
          id: 'homework',
          title: 'تکالیف کلاسی',
          desc: 'ثبت تکلیف صوتی/متنی و آرشیو دوره‌ها',
          icon: FileText,
          tone: 'success' as const,
        },
        {
          id: 'period',
          title: 'دوره و مسئولان',
          desc: 'انتصاب مسئولان حضور، شهریه و حامی‌ها',
          icon: Award,
          tone: 'warn' as const,
        },
      ],
    },
    {
      group: 'تنظیمات و داده‌ها',
      items: [
        {
          id: 'settings',
          title: 'تنظیمات برنامه',
          desc: 'ظاهر، برنامهٔ کلاسی، یادآورها و پشتیبان‌گیری',
          icon: Settings,
          tone: 'neutral' as const,
        },
      ],
    },
  ];

  return (
    <div className="space-y-5 pb-12">
      {sections.map((sec) => (
        <div key={sec.group}>
          <h3 className="text-xs font-bold text-muted px-1 mb-2">{sec.group}</h3>
          <Card padded={false} className="p-1.5">
            {sec.items.map((item) => {
              const Icon = item.icon;
              return (
                <ListRow
                  key={item.id}
                  icon={<Icon size={19} />}
                  title={item.title}
                  description={item.desc}
                  tone={item.tone}
                  onClick={() => onNavigate(item.id)}
                />
              );
            })}
          </Card>
        </div>
      ))}

      <div className="rounded-card border border-line bg-surface-2/60 p-4 flex items-start gap-3">
        <span className="w-9 h-9 shrink-0 rounded-xl bg-success/10 text-success flex items-center justify-center">
          <ShieldCheck size={19} />
        </span>
        <div>
          <p className="text-xs font-bold text-ink">کاملاً آفلاین و روی همین دستگاه</p>
          <p className="text-[11px] text-muted leading-6 mt-1">
            تمام داده‌های اعضا در حافظهٔ محلی مرورگر ذخیره می‌شود و به هیچ سروری ارسال نمی‌گردد.
            برای اطمینان، از بخش تنظیمات فایل پشتیبان بگیرید.
          </p>
          <p className="text-[11px] text-muted leading-6 mt-1 inline-flex items-center gap-1">
            <WifiOff size={12} />
            بدون نیاز به اینترنت
          </p>
        </div>
      </div>
    </div>
  );
};
