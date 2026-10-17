import { AppState, Member, HomeworkItem } from '../types';
import { today, toKey, getNextClass } from './jalali';

export function getDemoState(): AppState {
  const currentToday = today();
  const defaultClasses = [{ dow: 3, start: '19:00', end: '21:00' }]; // چهارشنبه‌ها ۱۹ تا ۲۱
  const nextCls = getNextClass(defaultClasses, []);
  const sessionKey = nextCls ? toKey(nextCls.date) : toKey(currentToday);

  // Set one member's birthday to today and another to tomorrow for active dashboard widgets
  const birthdayToday = { jy: 1370, jm: currentToday.jm, jd: currentToday.jd };
  const birthdayTomorrow = { jy: 1368, jm: currentToday.jm, jd: currentToday.jd + 1 };

  const members: Member[] = [
    {
      id: 'm1',
      name: 'دکتر آرش فرهمند',
      phones: ['09121112233'],
      birth: { jy: 1358, jm: 5, jd: 12 },
      roles: ['support'],
      group: 'عمومی',
      note: 'درمانگر و ناظر علمی کلاس',
      privateNote: 'ارتباط مستقیم با حامیان و ناظر ارشد دوره',
      consentContact: true,
      consentPhoto: true,
    },
    {
      id: 'm2',
      name: 'امیرحسین رضایی',
      phones: ['09122223344', '09351112233'],
      birth: { jy: 1367, jm: 3, jd: 21 },
      roles: ['attend'],
      group: 'عمومی',
      note: 'مسئول پیگیری حضور و غیاب',
      consentContact: true,
      consentPhoto: true,
    },
    {
      id: 'm3',
      name: 'سارا کمالی',
      phones: ['09193334455'],
      birth: birthdayToday,
      roles: ['fee'],
      group: 'عمومی',
      note: 'مسئول دریافت فیش و پیگیری شهریه',
      consentContact: true,
      consentPhoto: true,
    },
    {
      id: 'm4',
      name: 'مهدی شریفی',
      phones: ['09364445566'],
      birth: { jy: 1365, jm: 11, jd: 8 },
      roles: ['hw'],
      group: 'عمومی',
      note: 'مسئول ثبت و هماهنگی تکالیف هفتگی',
      consentContact: true,
      consentPhoto: true,
    },
    {
      id: 'm5',
      name: 'مریم صادقی',
      phones: ['09125556677'],
      birth: { jy: 1362, jm: 8, jd: 14 },
      roles: ['support'],
      group: 'عمومی',
      note: 'حامی قدیمی گروه و پشتیبان اعضای جدید',
      consentContact: true,
      consentPhoto: true,
    },
    {
      id: 'm6',
      name: 'نیلوفر بهرامی',
      phones: ['09186667788'],
      birth: birthdayTomorrow,
      roles: [],
      group: 'عمومی',
      note: 'عضو جدید دوره',
      privateNote: 'نیاز به توجه ویژه در مکالمات تلفنی و حمایت در ورود به بحث‌های گروهی',
      careFlag: true,
      needs: ['companion'],
      supporterId: 'm5',
      consentContact: true,
      consentPhoto: true,
    },
    {
      id: 'm7',
      name: 'علی مرادی',
      phones: ['09107778899'],
      birth: { jy: 1369, jm: 2, jd: 30 },
      roles: [],
      group: 'عمومی',
      note: 'نیاز به شیب‌راه جهت ورود ویلچر به سالن',
      needs: ['wheelchair'],
      consentContact: true,
      consentPhoto: true,
    },
    {
      id: 'm8',
      name: 'زهرا ابراهیمی',
      phones: ['09398889900'],
      birth: { jy: 1373, jm: 6, jd: 17 },
      roles: [],
      group: 'گروه الف',
      note: 'عضو فعال بحث‌های کارگاهی',
      consentContact: true,
      consentPhoto: true,
    },
    {
      id: 'm9',
      name: 'محمدرضا پناهی',
      phones: ['09139990011'],
      birth: { jy: 1366, jm: 10, jd: 25 },
      roles: [],
      group: 'گروه الف',
      consentContact: true,
      consentPhoto: true,
    },
    {
      id: 'm10',
      name: 'رویا احمدی',
      phones: ['09151113344'],
      birth: { jy: 1375, jm: 1, jd: 5 },
      roles: [],
      group: 'عمومی',
      note: 'دانشجوی ارشد روانشناسی',
      consentContact: true,
      consentPhoto: true,
    },
  ];

  const sessions: Record<string, Record<string, any>> = {
    [sessionKey]: {
      m1: { p1: 'present', p2: 'present' },
      m2: { p1: 'present', p2: 'present' },
      m3: { p1: 'present', time: '19:00' },
      m4: { p1: 'delay', time: '19:40', note: 'به دلیل ترافیک حدود ساعت ۱۹:۴۰ می‌رسد' },
      m5: { p1: 'present' },
      m6: { p1: 'problem', note: 'هماهنگی برای همراه نیاز است' },
    },
  };

  const fees: Record<string, Record<string, any>> = {
    [sessionKey]: {
      m1: { paid: true, note: 'واریز اینترنتی' },
      m2: { paid: true, note: 'فیش در واتساپ ارسال شد' },
      m3: { paid: true, note: 'مسئول مالی' },
      m4: { paid: true, note: 'واریز شتابی' },
      m5: { paid: true, note: 'حامی دوره' },
      m7: { paid: true, note: 'فیش تأیید شد' },
      m8: { fc: 'promised', note: 'قول داد تا فردا عصر فیش بفرستد' },
      m9: { fc: 'noanswer' },
    },
  };

  const homework: HomeworkItem[] = [
    {
      id: 'hw-sample-1',
      key: sessionKey,
      text: 'تمرین ثبت هیجانات روزانه: در طول این هفته، هر روز در ۳ نوبت (صبح، ظهر، شب) احساس غالب خود و محرک آن را در دفترچه یادداشت کنید و در جلسه آینده همراه داشته باشید.',
    },
    {
      id: 'hw-sample-2',
      key: '1405-07-21',
      text: 'تکلیف جلسه گذشته: تهیه فهرست ۵ ارزش بنیادین شخصی و اولویت‌بندی آن‌ها در روابط بین‌فردی.',
    },
  ];

  return {
    v: 24,
    members,
    classes: defaultClasses,
    extra: [],
    sessions,
    fees,
    homework,
    groups: ['عمومی', 'گروه الف'],
    users: [{ id: 'u-admin', name: 'مدیر', pin: '0000', role: 'admin' }],
    currentUserId: null,
    period: {
      title: 'دوره پاییز و زمستان ۱۴۰۵',
      attendIds: ['m2'],
      feeIds: ['m3'],
      hwIds: ['m4'],
      note: 'تمرکز بر ارتباط مؤثر و تقویت تاب‌آوری روانی اعضا',
    },
    doorChecks: {
      [sessionKey]: {
        '15': true,
      },
    },
    activityLog: [],
    pinnedMembers: ['m6'],
    sessionNotes: {},
    settings: {
      theme: null,
      fs: 'm',
      color: 'blue',
      alarmTimes: [15, 8, 5, 3],
      sound: true,
      className: 'گروه درمانی رشد و خودآگاهی',
      maxSessions: 40,
      privacyMode: false,
      hidePrivateInReports: true,
      requireLogin: false,
      quickConfirm: true,
      feeDeadlineDays: 1,
      smartSort: true,
      onlyMine: false,
    },
    _lastSession: sessionKey,
    _lastFee: sessionKey,
    timer: null,
  };
}
