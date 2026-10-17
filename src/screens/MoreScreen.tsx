import React from 'react';
import {
  FileText,
  Settings,
  Sparkles,
  Award,
  Download,
  HelpCircle,
  ChevronLeft,
  HeartHandshake,
  ShieldCheck
} from 'lucide-react';
import { AppState } from '../types';

interface MoreScreenProps {
  onNavigate: (screen: string) => void;
  state: AppState;
}

export const MoreScreen: React.FC<MoreScreenProps> = ({ onNavigate, state }) => {
  const sections = [
    {
      group: 'کارهای تکمیلی و هماهنگی',
      items: [
        {
          id: 'reports',
          title: 'گزارش‌ها و ارتباطات',
          desc: 'گزارش حامی، پیام‌ها و استوری گروه',
          icon: Sparkles,
          color: 'bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400',
        },
        {
          id: 'homework',
          title: 'تکالیف کلاسی',
          desc: 'ثبت تکلیف جدید صوتی/متنی و آرشیو دوره‌ها',
          icon: FileText,
          color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400',
        },
        {
          id: 'period',
          title: 'دوره جاری و انتصاب مسئولان',
          desc: 'تعیین مسئولان حضور، شهریه و حامی‌های کلاس',
          icon: Award,
          color: 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400',
        },
      ],
    },
    {
      group: 'تنظیمات و نگهداری داده‌ها',
      items: [
        {
          id: 'settings',
          title: 'تنظیمات برنامه',
          desc: 'برنامه کلاسی، رنگ، یادآورها و پشتیبان‌گیری',
          icon: Settings,
          color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        },
      ],
    },
  ];

  return (
    <div className="space-y-5 pb-12 animate-fade-in" dir="rtl">
      {/* Hero */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 text-white p-6 shadow-xl">
        <h2 className="text-lg font-black mb-1">☰ سایر بخش‌ها و ابزارها</h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          ابزارهای تکمیلی و مدیریتی گروه درمانی — برای بخش‌های اصلی (خانه، حضور، ورود، شهریه، اعضا) از نوار پایین استفاده کنید.
        </p>
      </div>

      {sections.map((sec, sIdx) => (
        <div key={sIdx} className="space-y-2">
          <h3 className="font-extrabold text-xs text-slate-500 dark:text-slate-400 px-1">
            {sec.group}
          </h3>
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-2 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
            {sec.items.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer active:scale-98 transition-all"
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold ${item.color}`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                  <ChevronLeft size={18} className="text-slate-400" />
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Security & Offline note */}
      <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
        <ShieldCheck size={22} className="text-emerald-500 shrink-0" />
        <p className="leading-relaxed">
          این برنامه کاملاً آفلاین عمل می‌کند و کلیه داده‌های اعضا روی حافظه محلی همین دستگاه ذخیره و محافظت می‌شوند.
        </p>
      </div>
    </div>
  );
};
