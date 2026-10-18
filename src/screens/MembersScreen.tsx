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
  HelpCircle,
  Sparkles,
  PhoneCall,
  Wallet,
  ClipboardList,
  HeartHandshake,
  Check,
  Square,
  Cake,
} from 'lucide-react';
import { AppState, Member, JalaliDate } from '../types';
import { fmt, toFa } from '../utils/jalali';
import { generateUid } from '../utils/storage';
import { PersianDatePicker } from '../components/PersianDatePicker';
import { getWhatsAppLink } from '../utils/reports';
import { VoiceRecorder } from '../utils/audio';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  IconButton,
  Input,
  Select,
  Sheet,
  Textarea,
} from '../components/ui';

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

const ROLES = [
  { key: 'attend', label: 'پیگیری حضور', icon: PhoneCall },
  { key: 'fee', label: 'مسئول شهریه', icon: Wallet },
  { key: 'hw', label: 'مسئول تکالیف', icon: ClipboardList },
  { key: 'support', label: 'حامی کلاس', icon: HeartHandshake },
];

export const MembersScreen: React.FC<MembersScreenProps> = ({
  state,
  onUpdateState,
  onResetDemo,
}) => {
  const [search, setSearch] = useState('');
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

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

    onUpdateState((prev) => ({
      ...prev,
      members: editingMember
        ? prev.members.map((m) => (m.id === editingMember.id ? memberData : m))
        : [...prev.members, memberData],
    }));

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`آیا از حذف عضو «${name}» اطمینان دارید؟`)) {
      onUpdateState((prev) => ({ ...prev, members: prev.members.filter((m) => m.id !== id) }));
      setIsModalOpen(false);
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
      if (data) setFormVoice(data);
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
      rows.map((e) => e.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n');
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
        onUpdateState((prev) => ({ ...prev, members: [...prev.members, ...newMembers] }));
        alert(`${toFa(newMembers.length)} عضو جدید با موفقیت اضافه شدند.`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const safeMembers = Array.isArray(state?.members) ? state.members.filter(Boolean) : [];
  const filteredMembers = safeMembers.filter((m) => (search ? (m.name || '').includes(search) : true));

  return (
    <div className="space-y-4 pb-12">
      {/* Toolbar */}
      <Card>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-9 h-9 rounded-xl bg-accent/10 text-accent-ink flex items-center justify-center shrink-0">
              <Users size={18} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink leading-6">
                اعضای کلاس
                <span className="text-muted font-semibold text-xs num"> ({toFa(safeMembers.length)})</span>
              </p>
              <p className="text-[11px] text-muted leading-4 truncate">
                مشخصات، نقش‌ها و راه‌های تماس
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <IconButton
              aria-label="راهنمای صفحه اعضا"
              onClick={() => setShowHelp((v) => !v)}
              active={showHelp}
            >
              <HelpCircle size={18} />
            </IconButton>
            <Button size="sm" icon={<UserPlus size={15} />} onClick={openAddModal}>
              افزودن
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute start-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجوی نام…"
              className="ps-9 h-10 text-xs"
            />
          </div>

          <IconButton aria-label="خروجی اکسل اعضا" onClick={exportCSV}>
            <FileSpreadsheet size={17} />
          </IconButton>

          <label className="inline-flex items-center justify-center h-11 w-11 rounded-xl text-muted hover:bg-surface-2 hover:text-ink cursor-pointer transition-colors">
            <Upload size={17} />
            <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" aria-label="ورود از فایل CSV" />
          </label>
        </div>

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {ROLES.map((r) => {
            const Icon = r.icon;
            return (
              <span
                key={r.key}
                className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted"
              >
                <Icon size={12} className="text-accent-ink" />
                {r.label}
              </span>
            );
          })}
        </div>
      </Card>

      {showHelp && (
        <Card className="border-accent/25 bg-accent/[0.04]">
          <h4 className="font-bold text-sm text-ink mb-2">راهنمای صفحه اعضا</h4>
          <ul className="list-disc list-inside space-y-1.5 text-[11px] text-muted leading-6">
            <li>برای هر عضو تا ۳ شماره تماس، تاریخ تولد شمسی و نقش‌های کلاسی ثبت کنید.</li>
            <li>«یادداشت محرمانه» هرگز در گزارش‌ها و خروجی‌ها نمایش داده نمی‌شود.</li>
            <li>آیکون‌های تماس و واتساپ ارتباط مستقیم با عضو را ممکن می‌کنند.</li>
          </ul>
        </Card>
      )}

      {/* List */}
      <div className="space-y-2">
        {safeMembers.length === 0 ? (
          <EmptyState
            icon={<Users size={22} />}
            title="هنوز عضوی ثبت نشده است"
            description="اعضا را دستی اضافه کنید یا از فایل CSV وارد کنید."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button size="sm" icon={<UserPlus size={15} />} onClick={openAddModal}>
                  افزودن اولین عضو
                </Button>
                {onResetDemo && (
                  <Button size="sm" variant="secondary" icon={<Sparkles size={14} />} onClick={onResetDemo}>
                    نمونهٔ آزمایشی
                  </Button>
                )}
              </div>
            }
          />
        ) : filteredMembers.length === 0 ? (
          <EmptyState icon={<Search size={22} />} title="عضوی با این مشخصات پیدا نشد" />
        ) : (
          filteredMembers.map((member) => {
            const firstPhone = (member.phones || [])[0];
            const extraPhonesCount = (member.phones || []).length - 1;
            const supporter = member.supporterId
              ? (state?.members || []).find((x) => x.id === member.supporterId)
              : null;

            return (
              <Card key={member.id} padded={false} className="p-3">
                <div className="flex items-center gap-3">
                  {member.photo && member.consentPhoto !== false ? (
                    <img
                      src={member.photo}
                      alt={member.name}
                      className="w-11 h-11 rounded-xl object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 shrink-0 rounded-xl bg-surface-2 border border-line flex items-center justify-center font-bold text-sm text-ink">
                      {member.name.charAt(0)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-bold text-sm text-ink truncate">{member.name}</h4>
                      {member.careFlag && <Badge tone="danger">حمایتی</Badge>}
                      {(member.roles || []).map((r) => {
                        const meta = ROLES.find((x) => x.key === r);
                        if (!meta) return null;
                        const Icon = meta.icon;
                        return (
                          <span
                            key={r}
                            title={meta.label}
                            className="w-5 h-5 rounded-md bg-accent/10 text-accent-ink flex items-center justify-center"
                          >
                            <Icon size={12} />
                          </span>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-[11px] text-muted flex-wrap">
                      {firstPhone ? (
                        <span className="num">{toFa(firstPhone)}</span>
                      ) : (
                        <span>بدون شماره</span>
                      )}
                      {extraPhonesCount > 0 && <span className="num">+{toFa(extraPhonesCount)}</span>}
                      {supporter && <span>· حامی: {supporter.name}</span>}
                      {member.birth && (
                        <span className="inline-flex items-center gap-0.5 num">
                          <Cake size={11} />
                          {fmt(member.birth)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 shrink-0">
                    {firstPhone && (
                      <>
                        <a
                          href={`tel:${firstPhone}`}
                          aria-label={`تماس با ${member.name}`}
                          className="w-9 h-9 rounded-xl text-success hover:bg-success/10 flex items-center justify-center transition-colors"
                        >
                          <Phone size={15} />
                        </a>
                        <a
                          href={getWhatsAppLink(firstPhone)}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`واتساپ ${member.name}`}
                          className="w-9 h-9 rounded-xl text-success hover:bg-success/10 flex items-center justify-center transition-colors"
                        >
                          <MessageCircle size={15} />
                        </a>
                      </>
                    )}
                    <IconButton aria-label={`ویرایش ${member.name}`} size="sm" onClick={() => openEditModal(member)}>
                      <Edit2 size={15} />
                    </IconButton>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Add / edit sheet */}
      <Sheet
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMember ? 'ویرایش مشخصات عضو' : 'افزودن عضو جدید'}
        subtitle="فقط نام الزامی است؛ بقیهٔ موارد اختیاری‌اند."
        width="lg"
        footer={
          <div className="flex items-center gap-2">
            <Button full onClick={handleSave}>
              ذخیرهٔ مشخصات
            </Button>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              انصراف
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Photo */}
          <div className="flex items-center gap-3">
            {formPhoto ? (
              <div className="relative">
                <img src={formPhoto} alt="عکس عضو" className="w-16 h-16 rounded-xl object-cover" />
                <button
                  onClick={() => setFormPhoto(null)}
                  aria-label="حذف عکس"
                  className="absolute -top-1.5 -end-1.5 w-5 h-5 rounded-full bg-danger text-white flex items-center justify-center"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div className="w-16 h-16 rounded-xl bg-surface-2 border border-line flex items-center justify-center text-muted">
                <Users size={26} />
              </div>
            )}

            <label className="inline-flex items-center gap-1.5 h-10 px-3 rounded-field bg-surface-2 border border-line text-ink text-xs font-bold cursor-pointer hover:bg-line/50 transition-colors">
              <Camera size={15} />
              {formPhoto ? 'تغییر عکس' : 'انتخاب عکس'}
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>
          </div>

          <Field label="نام و نام خانوادگی *">
            <Input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="مثلاً علی رضایی"
            />
          </Field>

          <div className="space-y-2">
            <span className="block text-xs font-bold text-muted">شماره‌های تماس (تا ۳ شماره)</span>
            {formPhones.map((ph, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  type="tel"
                  dir="ltr"
                  value={ph}
                  onChange={(e) => {
                    const updated = [...formPhones];
                    updated[idx] = e.target.value;
                    setFormPhones(updated);
                  }}
                  placeholder="09123456789"
                  className="flex-1 text-xs"
                />
                {formPhones.length > 1 && (
                  <IconButton
                    aria-label="حذف این شماره"
                    onClick={() => setFormPhones(formPhones.filter((_, i) => i !== idx))}
                    className="text-danger hover:bg-danger/10 hover:text-danger"
                  >
                    <X size={16} />
                  </IconButton>
                )}
              </div>
            ))}
            {formPhones.length < 3 && (
              <button
                type="button"
                onClick={() => setFormPhones([...formPhones, ''])}
                className="text-xs font-bold text-accent-ink hover:underline"
              >
                + افزودن شمارهٔ دیگر
              </button>
            )}
          </div>

          <Field label="تاریخ تولد (شمسی)">
            <button
              type="button"
              onClick={() => setShowDatePicker(true)}
              className="w-full h-11 text-right bg-surface-2 border border-line rounded-field px-3.5 text-sm font-semibold text-ink flex items-center justify-between"
            >
              <span className="num">{formBirth ? fmt(formBirth) : 'انتخاب تاریخ…'}</span>
              <Calendar size={16} className="text-muted" />
            </button>
          </Field>

          {/* Roles */}
          <div>
            <span className="block text-xs font-bold text-muted mb-2">نقش‌ها در کلاس</span>
            <div className="grid grid-cols-2 gap-1.5">
              {ROLES.map((r) => {
                const active = formRoles.includes(r.key);
                const Icon = r.icon;
                return (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() =>
                      setFormRoles(
                        active ? formRoles.filter((x) => x !== r.key) : [...formRoles, r.key]
                      )
                    }
                    aria-pressed={active}
                    className={`flex items-center gap-2 min-h-11 px-2.5 rounded-field border text-start transition-colors ${
                      active
                        ? 'border-accent/40 bg-accent/[0.08] text-ink'
                        : 'border-line bg-surface text-muted hover:bg-surface-2'
                    }`}
                  >
                    <Icon size={15} className={active ? 'text-accent-ink' : 'text-muted'} />
                    <span className="text-[11px] font-semibold truncate">{r.label}</span>
                    {active && <Check size={13} className="ms-auto text-accent-ink" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Needs */}
          <div>
            <span className="block text-xs font-bold text-muted mb-2">نیازهای خاص و مراقبت</span>
            <div className="grid grid-cols-2 gap-1.5">
              {NEEDS_LIST.map(([nKey, nLabel]) => {
                const active = formNeeds.includes(nKey);
                return (
                  <button
                    key={nKey}
                    type="button"
                    onClick={() =>
                      setFormNeeds(active ? formNeeds.filter((n) => n !== nKey) : [...formNeeds, nKey])
                    }
                    aria-pressed={active}
                    className={`min-h-10 px-2.5 rounded-field border text-[11px] font-semibold transition-colors ${
                      active
                        ? 'border-accent/40 bg-accent/[0.08] text-ink'
                        : 'border-line bg-surface text-muted hover:bg-surface-2'
                    }`}
                  >
                    {nLabel}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setFormCareFlag((v) => !v)}
              aria-pressed={formCareFlag}
              className={`w-full mt-2 min-h-11 px-3 rounded-field border flex items-center gap-2 text-xs font-bold transition-colors ${
                formCareFlag
                  ? 'border-danger/40 bg-danger/[0.08] text-danger'
                  : 'border-line bg-surface text-muted'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                  formCareFlag ? 'bg-danger border-danger text-white' : 'border-line'
                }`}
              >
                {formCareFlag && <Check size={12} strokeWidth={3} />}
              </span>
              نیازمند حمایت ویژه
            </button>
          </div>

          <Field label="گروه">
            <Select value={formGroup} onChange={(e) => setFormGroup(e.target.value)}>
              {(state.groups || ['عمومی']).map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="حامی مرتبط (عضو پشتیبان)">
            <Select value={formSupporterId} onChange={(e) => setFormSupporterId(e.target.value)}>
              <option value="">— بدون حامی —</option>
              {state.members
                .filter((m) => !editingMember || m.id !== editingMember.id)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
            </Select>
          </Field>

          <Field label="یادداشت عمومی">
            <Input
              type="text"
              value={formNote}
              onChange={(e) => setFormNote(e.target.value)}
              placeholder="توضیحات معمولی…"
            />
          </Field>

          {/* Confidential */}
          <div className="rounded-field bg-surface-2 border border-line p-3 space-y-1.5">
            <span className="text-xs font-bold text-ink flex items-center gap-1.5">
              <Shield size={14} className="text-danger" />
              یادداشت محرمانهٔ درمانگر
            </span>
            <p className="text-[11px] text-muted leading-5">
              این یادداشت در هیچ گزارش، اشتراک‌گذاری یا فایل خروجی نمایش داده نمی‌شود.
            </p>
            <Textarea
              value={formPrivateNote}
              onChange={(e) => setFormPrivateNote(e.target.value)}
              rows={2}
              placeholder="شرایط حساس، ترجیحات تماس، نکات خاص…"
              className="text-xs"
            />
          </div>

          {/* Voice */}
          <div>
            <span className="block text-xs font-bold text-muted mb-2">یادداشت صوتی عضو</span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={isRecording ? 'danger' : 'secondary'}
                icon={isRecording ? <Square size={13} /> : <Mic size={13} />}
                onClick={isRecording ? stopVoice : startVoice}
              >
                {isRecording ? 'توقف ضبط' : 'ضبط صدا'}
              </Button>
              {formVoice && (
                <>
                  <audio controls src={formVoice} className="h-8 flex-1 min-w-0" />
                  <button
                    type="button"
                    onClick={() => setFormVoice(null)}
                    className="text-[11px] font-bold text-danger shrink-0"
                  >
                    حذف
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setFormConsentContact((v) => !v)}
              className={`min-h-10 rounded-field border text-[11px] font-semibold ${
                formConsentContact
                  ? 'border-success/30 bg-success/[0.07] text-success'
                  : 'border-line text-muted'
              }`}
            >
              اجازهٔ تماس
            </button>
            <button
              type="button"
              onClick={() => setFormConsentPhoto((v) => !v)}
              className={`min-h-10 rounded-field border text-[11px] font-semibold ${
                formConsentPhoto
                  ? 'border-success/30 bg-success/[0.07] text-success'
                  : 'border-line text-muted'
              }`}
            >
              اجازهٔ انتشار عکس
            </button>
          </div>

          {editingMember && (
            <Button
              full
              size="sm"
              variant="danger"
              icon={<Trash2 size={15} />}
              onClick={() => handleDelete(editingMember.id, editingMember.name)}
            >
              حذف این عضو
            </Button>
          )}
        </div>
      </Sheet>

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
