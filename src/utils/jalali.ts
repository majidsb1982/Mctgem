import { JalaliDate, ClassSchedule, ExtraSession } from '../types';

const br = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
const div = (a: number, b: number) => ~~(a / b);
const mod = (a: number, b: number) => a - ~~(a / b) * b;

function cal(jy: number) {
  let gy = jy + 621;
  let lJ = -14;
  let jp = br[0];
  let jm = 0;
  let jump = 0;
  let n = 0;
  for (let i = 1; i < br.length; i++) {
    jm = br[i];
    jump = jm - jp;
    if (jy < jm) break;
    lJ += div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }
  n = jy - jp;
  lJ += div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) lJ++;
  const lG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + lJ - lG;
  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;
  return { leap, gy, march };
}

const g2d = (gy: number, gm: number, gd: number) => {
  let d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4) + div(153 * mod(gm + 9, 12) + 2, 5) + gd - 34840408;
  return d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
};

const d2g = (j: number) => {
  let jj = 4 * j + 139361631;
  jj = jj + div(div(4 * j + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(jj, 1461), 4) * 5 + 308;
  return {
    gd: div(mod(i, 153), 5) + 1,
    gm: mod(div(i, 153), 12) + 1,
    gy: div(jj, 1461) - 100100 + div(8 - (mod(div(i, 153), 12) + 1), 6)
  };
};

export function d2j(jdn: number): JalaliDate {
  const gy = d2g(jdn).gy;
  let jy = gy - 621;
  const r = cal(jy);
  const j1 = g2d(gy, 3, r.march);
  let k = jdn - j1;
  if (k >= 0) {
    if (k <= 185) return { jy, jm: 1 + div(k, 31), jd: mod(k, 31) + 1 };
    k -= 186;
  } else {
    jy--;
    k += 179;
    if (r.leap === 1) k++;
  }
  return { jy, jm: 7 + div(k, 30), jd: mod(k, 30) + 1 };
}

export const toJ = (gy: number, gm: number, gd: number): JalaliDate => d2j(g2d(gy, gm, gd));

export const toG = (jy: number, jm: number, jd: number) => {
  const r = cal(jy);
  return d2g(g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1);
};

export const mLen = (jy: number, jm: number) => (jm <= 6 ? 31 : jm <= 11 ? 30 : cal(jy).leap === 0 ? 30 : 29);

export const MN = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

export const DN = [
  'شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'
];

export const toFa = (s: string | number | undefined | null): string => {
  if (s === undefined || s === null) return '';
  if (typeof s === 'number' && isNaN(s)) return '';
  return String(s).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
};

export const fmt = (j?: JalaliDate | null): string => {
  if (!j || !j.jy || !j.jm || !j.jd) return '—';
  return toFa(`${j.jy}/${String(j.jm).padStart(2, '0')}/${String(j.jd).padStart(2, '0')}`);
};

export const today = (): JalaliDate => {
  const d = new Date();
  return toJ(d.getFullYear(), d.getMonth() + 1, d.getDate());
};

export const toKey = (j?: JalaliDate | null): string => {
  if (!j || !j.jy) return '1405-01-01';
  return `${j.jy}-${String(j.jm).padStart(2, '0')}-${String(j.jd).padStart(2, '0')}`;
};

export const fromKey = (k?: string | null): JalaliDate => {
  if (!k || typeof k !== 'string') return today();
  const p = k.split('-');
  if (p.length < 3) return today();
  const jy = parseInt(p[0], 10) || 1405;
  const jm = parseInt(p[1], 10) || 1;
  const jd = parseInt(p[2], 10) || 1;
  return { jy, jm, jd };
};

export const dow = (j?: JalaliDate | null): number => {
  if (!j || !j.jy) return 0;
  try {
    const g = toG(j.jy, j.jm, j.jd);
    if (!g || isNaN(g.gy)) return 0;
    return (new Date(g.gy, g.gm - 1, g.gd).getDay() + 1) % 7;
  } catch {
    return 0;
  }
};

export interface NextClassResult {
  t: Date;
  date: JalaliDate;
  c: {
    dow: number;
    start: string;
    end: string;
    extra?: boolean;
    date?: JalaliDate;
  };
}

export function getNextClass(classes?: ClassSchedule[] | null, extra?: ExtraSession[] | null): NextClassResult | null {
  const safeClasses = Array.isArray(classes) ? classes : [];
  const safeExtra = Array.isArray(extra) ? extra : [];
  if (!safeClasses.length && !safeExtra.length) return null;

  const now = new Date();
  let best: NextClassResult | null = null;

  for (let i = 0; i < 8; i++) {
    const dt = new Date(now);
    dt.setDate(now.getDate() + i);
    const dw = (dt.getDay() + 1) % 7;
    for (const c of safeClasses) {
      if (!c || c.dow !== dw) continue;
      const [hStr, miStr] = (c.start || '19:00').split(':');
      const h = parseInt(hStr, 10) || 19;
      const mi = parseInt(miStr, 10) || 0;
      const t = new Date(dt);
      t.setHours(h, mi, 0, 0);
      if (t.getTime() > now.getTime() - 2 * 3600e3 && (!best || t.getTime() < best.t.getTime())) {
        best = {
          t,
          c: {
            dow: c.dow,
            start: c.start || '19:00',
            end: c.end || '21:00',
          },
          date: toJ(dt.getFullYear(), dt.getMonth() + 1, dt.getDate())
        };
      }
    }
  }

  for (const ex of safeExtra) {
    if (!ex || !ex.key) continue;
    const j = fromKey(ex.key);
    const g = toG(j.jy, j.jm, j.jd);
    const [hStr, miStr] = (ex.start || '19:00').split(':');
    const h = parseInt(hStr, 10) || 19;
    const mi = parseInt(miStr, 10) || 0;
    const t = new Date(g.gy, g.gm - 1, g.gd, h, mi, 0, 0);
    if (t.getTime() > now.getTime() - 2 * 3600e3 && (!best || t.getTime() < best.t.getTime())) {
      best = {
        t,
        c: { dow: dow(j), start: ex.start || '19:00', end: ex.end || '21:00', extra: true, date: j },
        date: j
      };
    }
  }

  return best;
}
