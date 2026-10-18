import React from 'react';
import { Home, PhoneCall, DoorOpen, Wallet, Users, LayoutGrid } from 'lucide-react';
import { AppState } from '../types';
import { CountBadge } from './ui';

interface NavProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  state: AppState;
  activeSessionKey: string;
}

export const Nav: React.FC<NavProps> = ({ currentScreen, onNavigate, state, activeSessionKey }) => {
  const sessionData = (state?.sessions && state.sessions[activeSessionKey]) || {};
  const feeData = (state?.fees && state.fees[activeSessionKey]) || {};
  const safeMembers = Array.isArray(state?.members) ? state.members.filter(Boolean) : [];

  const pendingAttend = safeMembers.filter((m) => !sessionData[m.id]?.p1).length;
  const pendingEntry = safeMembers.filter((m) => !sessionData[m.id]?.p2).length;
  const pendingFees = safeMembers.filter((m) => !feeData[m.id]?.paid).length;

  const items = [
    { id: 'home', label: 'خانه', icon: Home, badge: 0 },
    { id: 'attend', label: 'تماس ۱', icon: PhoneCall, badge: pendingAttend },
    { id: 'entry', label: 'ورود ۲', icon: DoorOpen, badge: pendingEntry },
    { id: 'fees', label: 'شهریه', icon: Wallet, badge: pendingFees },
    { id: 'members', label: 'اعضا', icon: Users, badge: 0 },
    { id: 'more', label: 'بخش‌ها', icon: LayoutGrid, badge: 0 },
  ];

  return (
    <nav
      aria-label="ناوبری اصلی"
      className="fixed bottom-0 inset-x-0 z-40 bg-surface/92 backdrop-blur-lg border-t border-line pb-safe"
    >
      <div className="max-w-3xl mx-auto px-1.5 h-[62px] flex items-stretch justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 rounded-xl my-1.5 transition-colors active:scale-95 ${
                isActive ? 'text-accent-ink' : 'text-muted hover:text-ink'
              }`}
            >
              <span
                className={`relative flex items-center justify-center w-11 h-7 rounded-full transition-colors ${
                  isActive ? 'bg-accent/12' : ''
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.4 : 1.9} />
                <CountBadge count={item.badge} />
              </span>
              <span className={`text-[10px] leading-4 ${isActive ? 'font-extrabold' : 'font-semibold'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
