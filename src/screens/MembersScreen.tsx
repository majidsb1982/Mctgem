import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  MessageCircle,
  FileSpreadsheet,
  Upload,
  Edit2,
  Trash2,
  Camera,
  X,
  Mic,
  Calendar,
  Shield,
  HelpCircle
} from 'lucide-react';
import { AppState, Member, JalaliDate } from '../types';
import { fmt, toFa } from '../utils/jalali';
import { generateUid } from '../utils/storage';
import { PersianDatePicker } from '../components/PersianDatePicker';
import { getWhatsAppLink } from '../utils/reports';
import { VoiceRecorder } from '../utils/audio';

interface MembersScreenProps {
  state: AppState;
  onUpdateState: (fn: (prev: AppState) => AppState) => void;
  onResetDemo?: () => void;
  onResetToEmpty?: () => void;
}

const NEEDS_LIST = [
  ['wheelchair', 'ویلچر / کم‌توان'],
  ['elderly', 'سالمند'],
  ['companion', 'نیاز به همراه'],
  ['deaf', 'ناشنوا / کم‌شنوا'],
  ['blind', 'نابینا / کم‌بینا'],
  ['medical', 'مراقبت دارویی'],
];

export const MembersScreen: React.FC<MembersScreenProps> = ({
  state,
  onUpdateState,
  onResetDemo,
  onResetToEmpty,
}) => {
  const [search, setSearch] = useState('');
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formPhones, setFormPhones] = useState<string[]>(['']);
  const [formBirth, setFormBirth] = useState<JalaliDate | null>(null);
  const [formRoles, setFormRoles] = useState<string[]>([]);
  const [formGroup, setFormGroup] = useState('عمومی');
  const [formNote, setFormNote] = useState('');
  const [formPrivateNote, setFormPrivateNote] = useState('');
  const [formNeeds, setFormNeeds] = useState<string[]>([]);
  const [formCareFlag, setFormCareFlag] = useState(false);
  const [formSupporterId, setFormSupporterId] = useState<string>('');
  const [formConsentContact, setFormConsentContact] = useState(true);
  const [formConsentPhoto, setFormConsentPhoto] = useState(true);
  const [formPhoto, setFormPhoto] = useState<string | null>(null);
  const [formVoice, setFormVoice] = useState<string | null>(null);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceRecorder, setVoiceRecorder] = useState<VoiceRecorder | null>(null);

  const openAddModal = () => {
    setEditingMember(null);
    setFormName('');
    setFormPhones(['']);
    setFormBirth(null);
    setFormRoles([]);
    setFormGroup('عمومی');
    setFormNote('');
    setFormPrivateNote('');
    setFormNeeds([]);
    setFormCareFlag(false);
    setFormSupporterId('');
    setFormConsentContact(true);
    setFormConsentPhoto(true);
    setFormPhoto(null);
    setFormVoice(null);
    setIsModalOpen(true);
  };

  const openEditModal = (member: Member) => {
    setEditingMember(member);
    setFormName(member.name);
    setFormPhones(member.phones && member.phones.length > 0 ? [...member.phones] : ['']);
    setFormBirth(member.birth || null);
    setFormRoles(member.roles || []);
    setFormGroup(member.group || 'عمومی');
    setFormNote(member.note || '');
    setFormPrivateNote(member.privateNote || '');
    setFormNeeds(member.needs || []);
    setFormCareFlag(!!member.careFlag);
    setFormSupporterId(member.supporterId || '');
    setFormConsentContact(member.consentContact !== false);
    setFormConsentPhoto(member.consentPhoto !== false);
    setFormPhoto(member.photo || null);
    setFormVoice(member.voice || null);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    const trimmedName = formName.trim();
    if (!trimmedName) {
      alert('لطفاً نام عضو را وارد کنید.');
      return;
    }

    const cleanedPhones = formPhones.map((p) => p.trim()).filter(Boolean);

    const memberData: Member = {
      id: editingMember ? editingMember.id : generateUid(),
      name: trimmedName,
      phones: cleanedPhones,
      birth: formBirth,
      roles: formRoles,
      group: formGroup,
      note: formNote.trim(),
      privateNote: formPrivateNote.trim(),
      needs: formNeeds,
      careFlag: formCareFlag,
      supporterId: formSupporterId || null,
      consentContact: formConsentContact,
      consentPhoto: formConsentPhoto,
      photo: formPhoto,
      voice: formVoice,
    };

    onUpdateState((prev) => {
      let updatedMembers: Member[];
      if (editingMember) {
        updatedMembers = prev.members.map((m) =>
          m.id === editingMember.id ? memberData : m
        );
      } else {
        updatedMembers = [...prev.members, memberData];
      }
      return {
        ...prev,
        members: updatedMembers,
      };
    });

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`آیا از حذف عضو «${name}» اطمینان دارید؟`)) {
      onUpdateState((prev) => ({
        ...prev,
        members: prev.members.filter((m) => m.id !== id),
      }));
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 160;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const minDim = Math.min(img.width, img.height);
          ctx.drawImage(
            img,
            (img.width - minDim) / 2,
            (img.height - minDim) / 2,
            minDim,
            minDim,
            0,
            0,
            size,
            size
          );
          setFormPhoto(canvas.toDataURL('image/jpeg', 0.75));
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const startVoice = async () => {
    const rec = new VoiceRecorder();
    const ok = await rec.start();
    if (ok) {
      setVoiceRecorder(rec);
      setIsRecording(true);
    }
  };

  const stopVoice = async () => {
    if (voiceRecorder) {
      const data = await voiceRecorder.stop();
      if (data) {
        setFormVoice(data);
      }
      setVoiceRecorder(null);
      setIsRecording(false);
    }
  };

  const exportCSV = () => {
    const rows = [
      ['نام', 'شماره‌های تماس', 'گروه', 'نقش‌ها', 'تاریخ تولد', 'یادداشت عمومی'],
      ...state.members.map((m) => [
        m.name,
        (m.phones || []).join(' - '),
        m.group || 'عمومی',
        (m.roles || []).join('، '),
        m.birth ? fmt(m.birth) : '',
        m.note || '',
      ]),
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      rows.map((e) => e.map((x) => `"${x.replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `اعضای-کلاس-${state.settings.className}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length <= 1) return;

      const newMembers: Member[] = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map((p) => p.replace(/^"|"$/g, '').trim());
        const name = parts[0];
        if (!name) continue;
        const phones = parts[1] ? parts[1].split('-').map((x) => x.trim()) : [];
        newMembers.push({
          id: generateUid(),
          name,
          phones,
          roles: [],
          group: parts[2] || 'عمومی',
          note: parts[5] || '',
        });
      }

      if (newMembers.length > 0) {
        onUpdateState((prev) => ({
          ...prev,
          members: [...prev.members, ...newMembers],
        }));
        alert(`${toFa(newMembers.length)} عضو جدید با موفقیت اضافه شدند.`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const safeMembers = Array.isArray(state?.members) ? state.members.filter(Boolean) : [];
  const filteredMembers = safeMembers.filter((m) =>
    search ? (m.name || '').includes(search) : true
  );

  return (
    <div className="space-y-4 pb-12 animate-fade-in" dir="rtl">
      {/* Header card with action */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Users size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">
                فهرست اعضای کلاس ({toFa(state.members.length)} نفر)
              </h3>
              <span className="text-xs text-slate-400 font-semibold">
                مدیریت مشخصات، شماره‌ها و حامی‌ها
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="راهنما"
            >
              <HelpCircle size={18} />
            </button>
            <button
              onClick={openAddModal}
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-3.5 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95 transition-all"
            >
              <UserPlus size={16} />
              <span>افزودن عضو</span>
            </button>
          </div>
        </div>

        {/* Search & Import/Export */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="relative flex-1">
            <Search size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجوی نام عضو..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pr-10 pl-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={exportCSV}
            className="border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1"
          >
            <FileSpreadsheet size={15} />
            <span>خروجی</span>
          </button>

          <label className="border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1 cursor-pointer">
            <Upload size={15} />
            <span>ورود</span>
            <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
          </label>
        </div>

        {/* Roles legend */}
        <div className="flex items-center gap-4 pt-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 flex-wrap">
          <span className="flex items-center gap-1">📞 پیگیری حضور</span>
          <span className="flex items-center gap-1">💰 شهریه</span>
          <span className="flex items-center gap-1">📋 تکالیف</span>
          <span className="flex items-center gap-1">🤝 حامی کلاس</span>
        </div>
      </div>

      {/* Help Banner if toggled */}
      {showHelp && (
        <div className="p-4 rounded-3xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 space-y-2 leading-relaxed">
          <h4 className="font-bold text-sm">💡 راهنمای صفحه اعضا</h4>
          <ul className="list-disc list-inside space-y-1 opacity-90">
            <li>برای هر عضو می‌توانید تا ۳ شماره تماس، تاریخ تولد شمسی و نقش‌های کلاسی ثبت کنید.</li>
            <li>بخش «یادداشت محرمانه» هرگز در خروجی‌ها یا گزارش‌های اشتراک‌گذاری‌شده نمایش داده نمی‌شود.</li>
            <li>آیکون‌های تماس و واتساپ امکان ارتباط مستقیم را با اعضا فراهم می‌کنند.</li>
          </ul>
        </div>
      )}

      {/* Members List */}
      <div className="space-y-2.5">
        {safeMembers.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 text-center space-y-4">
            <span className="text-4xl block mb-1">👥</span>
            <div>
              <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100 mb-1">
                هنوز هیچ عضوی برای این کلاس ثبت نشده است
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                می‌توانید اعضای کلاس را به صورت دستی یا از طریق فایل اکسل/متنی اضافه کنید.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                onClick={openAddModal}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-2xl text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <UserPlus size={16} />
                <span>➕ افزودن اولین عضو</span>
              </button>
              {onResetDemo && (
                <button
                  onClick={onResetDemo}
                  className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold py-2.5 px-4 rounded-2xl text-xs flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  <Sparkles size={14} className="text-amber-500" />
                  <span>بارگذاری نمونه آزمایشی</span>
                </button>
              )}
            </div>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 text-center">
            <span className="text-3xl block mb-2">🔍</span>
            <p className="font-bold text-sm text-slate-600 dark:text-slate-300">
              عضوی با این مشخصات یافت نشد.
            </p>
          </div>
        ) : (
          filteredMembers.map((member) => {
            const firstPhone = (member.phones || [])[0];
            const extraPhonesCount = (member.phones || []).length - 1;
            const supporter = member.supporterId ? (state?.members || []).find((x) => x.id === member.supporterId) : null;

            return (
              <div
                key={member.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  {/* Photo or Avatar */}
                  {member.photo && member.consentPhoto !== false ? (
                    <img
                      src={member.photo}
                      alt={member.name}
                      className="w-12 h-12 rounded-2xl object-cover shadow-sm"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center font-black text-slate-700 dark:text-slate-200 text-base shadow-sm">
                      {member.name.charAt(0)}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                        {member.name}
                      </h4>
                      {/* Roles */}
                      {(member.roles || []).map((r) => (
                        <span key={r} className="text-xs" title={r}>
                          {r === 'attend' ? '📞' : r === 'fee' ? '💰' : r === 'hw' ? '📋' : '🤝'}
                        </span>
                      ))}
                      {member.careFlag && (
                        <span className="px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-[10px] font-bold">
                          حمایتی
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                      {firstPhone ? (
                        <span className="font-mono">{toFa(firstPhone)}</span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">بدون شماره</span>
                      )}
                      {extraPhonesCount > 0 && (
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1 rounded text-slate-500">
                          +{toFa(extraPhonesCount)}
                        </span>
                      )}
                      {supporter && (
                        <span className="text-blue-600 dark:text-blue-400 text-[11px]">
                          · حامی: {supporter.name}
                        </span>
                      )}
                      {member.birth && (
                        <span className="text-slate-400 text-[11px]">
                          · 🎂 {fmt(member.birth)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {firstPhone && (
                    <>
                      <a
                        href={`tel:${firstPhone}`}
                        className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200"
                        title="تماس تلفنی"
                      >
                        <Phone size={14} />
                      </a>
                      <a
                        href={getWhatsAppLink(firstPhone)}
                        target="_blank"
                        rel="noreferrer"
                        className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 shadow-sm"
                        title="ارسال پیام در واتساپ"
                      >
                        <MessageCircle size={14} />
                      </a>
                    </>
                  )}
                  <button
                    onClick={() => openEditModal(member)}
                    className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200"
                    title="ویرایش"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(member.id, member.name)}
                    className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-rose-500 flex items-center justify-center hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    title="حذف"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Member Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto" dir="rtl">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">
                {editingMember ? '✏️ ویرایش مشخصات عضو' : '＋ افزودن عضو جدید'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <X size={20} />
              </button>
            </div>

            {/* Photo Avatar Upload */}
            <div className="flex items-center gap-4">
              {formPhoto ? (
                <div className="relative">
                  <img
                    src={formPhoto}
                    alt="عکس عضو"
                    className="w-16 h-16 rounded-2xl object-cover shadow-sm"
                  />
                  <button
                    onClick={() => setFormPhoto(null)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                  <Users size={28} />
                </div>
              )}

              <div>
                <label className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm">
                  <Camera size={15} />
                  <span>{formPhoto ? 'تغییر عکس' : 'انتخاب عکس'}</span>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                نام و نام خانوادگی *
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="مثلاً علی رضایی"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Phone Numbers (up to 3) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
                شماره‌های تماس (تا ۳ شماره):
              </label>
              {formPhones.map((ph, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="tel"
                    dir="ltr"
                    value={ph}
                    onChange={(e) => {
                      const updated = [...formPhones];
                      updated[idx] = e.target.value;
                      setFormPhones(updated);
                    }}
                    placeholder="09123456789"
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {formPhones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setFormPhones(formPhones.filter((_, i) => i !== idx))}
                      className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
              {formPhones.length < 3 && (
                <button
                  type="button"
                  onClick={() => setFormPhones([...formPhones, ''])}
                  className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
                >
                  ＋ افزودن شماره دیگر
                </button>
              )}
            </div>

            {/* Birth Date (Jalali) */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                تاریخ تولد (شمسی)
              </label>
              <button
                type="button"
                onClick={() => setShowDatePicker(true)}
                className="w-full text-right bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between"
              >
                <span>{formBirth ? fmt(formBirth) : 'انتخاب تاریخ تولد...'}</span>
                <Calendar size={16} className="text-slate-400" />
              </button>
            </div>

            {/* Roles Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                نقش‌ها در کلاس:
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                {[
                  ['attend', '📞 پیگیری حضور'],
                  ['fee', '💰 مسئول شهریه'],
                  ['hw', '📋 مسئول تکالیف'],
                  ['support', '🤝 حامی (عضو قدیمی)'],
                ].map(([rKey, rLabel]) => (
                  <label key={rKey} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formRoles.includes(rKey)}
                      onChange={(e) => {
                        if (e.target.checked) setFormRoles([...formRoles, rKey]);
                        else setFormRoles(formRoles.filter((r) => r !== rKey));
                      }}
                      className="rounded text-blue-600"
                    />
                    <span>{rLabel}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Special Needs & Care Flag */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
                نیازهای خاص و مراقبت:
              </label>
              <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-semibold">
                {NEEDS_LIST.map(([nKey, nLabel]) => (
                  <label key={nKey} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formNeeds.includes(nKey)}
                      onChange={(e) => {
                        if (e.target.checked) setFormNeeds([...formNeeds, nKey]);
                        else setFormNeeds(formNeeds.filter((n) => n !== nKey));
                      }}
                      className="rounded text-blue-600"
                    />
                    <span>{nLabel}</span>
                  </label>
                ))}
              </div>

              <label className="flex items-center gap-2 p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200 text-xs font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={formCareFlag}
                  onChange={(e) => setFormCareFlag(e.target.checked)}
                  className="rounded text-rose-600"
                />
                <span>علامت «نیازمند حمایت ویژه»</span>
              </label>
            </div>

            {/* Supporter */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                حامی مرتبط (عضو پشتیبان):
              </label>
              <select
                value={formSupporterId}
                onChange={(e) => setFormSupporterId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none"
              >
                <option value="">— بدون حامی —</option>
                {state.members
                  .filter((m) => !editingMember || m.id !== editingMember.id)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Public Note */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                یادداشت عمومی
              </label>
              <input
                type="text"
                value={formNote}
                onChange={(e) => setFormNote(e.target.value)}
                placeholder="توضیحات معمولی..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
              />
            </div>

            {/* Confidential Private Note */}
            <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1">
              <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Shield size={14} className="text-rose-500" />
                <span>🔒 یادداشت محرمانه درمانگر</span>
              </label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                این یادداشت هرگز در هیچ گزارش حامی، اشتراک‌گذاری یا فایل خروجی نمایش داده نمی‌شود.
              </p>
              <textarea
                value={formPrivateNote}
                onChange={(e) => setFormPrivateNote(e.target.value)}
                rows={2}
                placeholder="شرایط حساس، ترجیحات تماس، نکات خاص..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
              />
            </div>

            {/* Voice Note */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                یادداشت صوتی عضو
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={isRecording ? stopVoice : startVoice}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                    isRecording
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <Mic size={14} />
                  <span>{isRecording ? 'توقف ضبط' : '🎙 ضبط صدا'}</span>
                </button>
                {formVoice && (
                  <div className="flex items-center gap-2">
                    <audio controls src={formVoice} className="h-8 max-w-45" />
                    <button
                      type="button"
                      onClick={() => setFormVoice(null)}
                      className="text-xs text-rose-500 font-bold"
                    >
                      حذف
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all"
              >
                💾 ذخیره مشخصات عضو
              </button>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold text-xs"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Date Picker Modal */}
      {showDatePicker && (
        <PersianDatePicker
          initialDate={formBirth}
          onSelect={(d) => setFormBirth(d)}
          onClose={() => setShowDatePicker(false)}
          title="انتخاب تاریخ تولد شمسی"
        />
      )}
    </div>
  );
};
