import React from 'react';
import { Home, PhoneCall, DoorOpen, DollarSign, Users, Menu } from 'lucide-react';
import { AppState } from '../types';
import { toFa } from '../utils/jalali';

interface NavProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  state: AppState;
  activeSessionKey: string;
}

export const Nav: React.FC<NavProps> = ({ currentScreen, onNavigate, state, activeSessionKey }) => {
  // Pending attendance count for active session
  const sessionData = (state?.sessions && state.sessions[activeSessionKey]) || {};
  const safeMembers = Array.isArray(state?.members) ? state.members.filter(Boolean) : [];
  const pendingAttendCount = safeMembers.filter((m) => !(sessionData[m.id]?.p1)).length;

  // Pending fee count for active session
  const feeData = (state?.fees && state.fees[activeSessionKey]) || {};
  const pendingFeeCount = safeMembers.filter((m) => !(feeData[m.id]?.paid)).length;

  const items = [
    {
      id: 'home',
      label: 'خانه',
      icon: Home,
      badge: 0,
    },
    {
      id: 'attend',
      label: 'حضور ۱',
      icon: PhoneCall,
      badge: pendingAttendCount,
    },
    {
      id: 'entry',
      label: 'ورود ۲',
      icon: DoorOpen,
      badge: 0,
    },
    {
      id: 'fees',
      label: 'شهریه',
      icon: DollarSign,
      badge: pendingFeeCount,
    },
    {
      id: 'members',
      label: 'اعضا',
      icon: Users,
      badge: 0,
    },
    {
      id: 'more',
      label: 'بخش‌ها',
      icon: Menu,
      badge: 0,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe transition-colors">
      <div className="max-w-3xl mx-auto px-2 h-16 flex items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex-1 py-1.5 flex flex-col items-center justify-center relative transition-all active:scale-95 ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon size={21} strokeWidth={isActive ? 2.5 : 2} />
                {item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-4.5 h-4.5 px-1 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-sm">
                    {toFa(item.badge)}
                  </span>
                )}
              </div>
              <span className={`text-[11px] mt-1 ${isActive ? 'font-extrabold' : 'font-medium'}`}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-8 h-1 bg-blue-600 dark:bg-blue-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
