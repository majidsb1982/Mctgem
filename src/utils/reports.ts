import { AppState, Member } from '../types';
import { fmt, fromKey, toFa, DN } from './jalali';

export function getRoundReportText(state: AppState, sessionKey: string, round: 1 | 2, full: boolean = true): string {
  const s = state.sessions[sessionKey] || {};
  const g: Record<string, Member[]> = {
    present: [],
    delay: [],
    absent: [],
    problem: [],
    none: []
  };

  const safeMembers = Array.isArray(state?.members) ? state.members.filter(Boolean) : [];
  for (const m of safeMembers) {
    const cur = s[m.id] || {};
    const st = round === 2 ? (cur.p2 || cur.p1) : cur.p1;
    (g[st || 'none'] || g.none).push(m);
  }

  const fm = (m: Member) => {
    const ex = s[m.id] || {};
    let t = m.name;
    const tm = round === 1 ? ex.time : (ex.time2 || ex.time);
    if (tm) t += ` (حدود ${toFa(tm)})`;
    const note = round === 1 ? ex.note : (ex.note2 || ex.note);
    if (note) t += ` — ${note}`;
    return t;
  };

  const roundName = round === 1 ? 'نوبت ۱ (تماس‌های قبلی)' : 'نوبت ۲ (پشت در کلاس)';
  const dateObj = fromKey(sessionKey);
  const dw = DN[new Date(dateObj.jy, dateObj.jm, dateObj.jd).getDay() % 7] || '';

  const lines: string[] = [];
  lines.push(`🤝 گزارش به حامی‌ها — ${state.settings.className || 'کلاس'}`);
  lines.push(roundName);
  lines.push(`جلسه: ${fmt(dateObj)}`);
  lines.push('');

  const statusIcons: Record<string, string> = {
    present: '✅ حاضر',
    delay: '⏰ تأخیر',
    absent: '📭 غایب',
    problem: '💬 مشکل / هماهنگی',
    none: '⏳ ثبت‌نشده'
  };

  const keys = full ? ['present', 'delay', 'absent', 'problem', 'none'] : ['delay', 'absent', 'problem'];

  for (const k of keys) {
    if (g[k].length) {
      lines.push(`${statusIcons[k]} (${toFa(g[k].length)}):`);
      g[k].forEach((m) => {
        lines.push(`• ${fm(m)}`);
      });
      lines.push('');
    }
  }

  lines.push('— برای حامی‌ها (اعضای قدیمی پشتیبان) — بدون اطلاعات محرمانه —');
  return lines.join('\n');
}

export function getFeeReportText(state: AppState, feeKey: string): string {
  const f = (state?.fees && state.fees[feeKey]) || {};
  const safeMembers = Array.isArray(state?.members) ? state.members.filter(Boolean) : [];
  const paid = safeMembers.filter((m) => f[m.id] && f[m.id].paid);
  const un = safeMembers.filter((m) => !(f[m.id] && f[m.id].paid));
  const promised = un.filter((m) => (f[m.id] || {}).fc === 'promised');
  const noans = un.filter((m) => (f[m.id] || {}).fc === 'noanswer');
  const notYet = un.filter((m) => !(f[m.id] || {}).fc);

  const dateObj = fromKey(feeKey);
  const lines: string[] = [];
  lines.push(`💰 گزارش شهریه — ${state?.settings?.className || 'کلاس'}`);
  lines.push(`جلسه: ${fmt(dateObj)}`);
  lines.push('');
  lines.push(`✅ پرداخت‌شده (${toFa(paid.length)}): ${paid.map((m) => m.name).join('، ') || '—'}`);
  lines.push(`🗣 قول داده (${toFa(promised.length)}): ${promised.map((m) => m.name).join('، ') || '—'}`);
  lines.push(`📵 بی‌پاسخ (${toFa(noans.length)}): ${noans.map((m) => m.name).join('، ') || '—'}`);
  lines.push(`⏳ پیگیری‌نشده (${toFa(notYet.length)}): ${notYet.map((m) => m.name).join('، ') || '—'}`);

  return lines.join('\n');
}

export function getHumanHamiSummary(state: AppState, sessionKey: string): string {
  const s = (state?.sessions && state.sessions[sessionKey]) || {};
  const f = (state?.fees && state.fees[sessionKey]) || {};
  const dateObj = fromKey(sessionKey);
  const safeMembers = Array.isArray(state?.members) ? state.members.filter(Boolean) : [];

  const total = safeMembers.length;
  const present = safeMembers.filter((m) => (s[m.id] || {}).p2 === 'present' || (s[m.id] || {}).p1 === 'present').length;
  const needSupport = safeMembers.filter((m) => (s[m.id] || {}).p2 === 'problem' || (s[m.id] || {}).p1 === 'problem' || m.careFlag);
  const unpaid = safeMembers.filter((m) => !(f[m.id] && f[m.id].paid)).length;

  return `سلام حامیان گرامی 🌸\nخلاصه وضعیت کلاس (${fmt(dateObj)}):\nاز مجموع ${toFa(total)} عضو، ${toFa(present)} نفر در جلسه حضور داشتند.\n${needSupport.length > 0 ? `تعداد ${toFa(needSupport.length)} عضو نیاز به پیگیری و گفتگوی حمایتی دارند: ${needSupport.map((m) => m.name).join('، ')}\n` : 'خوشبختانه شرایط همه اعضا پایدار گزارش شده است.\n'}وضعیت شهریه: ${toFa(total - unpaid)} واریزی ثبت شده و ${toFa(unpaid)} مورد در حال پیگیری است.\nاز همراهی و حمایت صمیمانه شما سپاسگزاریم.`;
}

export function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => fallbackCopy(text));
  }
  return Promise.resolve(fallbackCopy(text));
}

function fallbackCopy(text: string): boolean {
  try {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    el.remove();
    return ok;
  } catch (e) {
    return false;
  }
}

export function shareText(title: string, text: string) {
  if (navigator.share) {
    navigator.share({ title, text }).catch(() => {});
  } else {
    copyToClipboard(text);
  }
}

export function getWhatsAppLink(phone: string, message: string = ''): string {
  let clean = phone.replace(/[۰-۹]/g, (x) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(x).toString()).replace(/\D/g, '');
  if (clean.startsWith('0')) clean = '98' + clean.slice(1);
  else if (!clean.startsWith('98')) clean = '98' + clean;
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${clean}${message ? '?text=' + encoded : ''}`;
}
