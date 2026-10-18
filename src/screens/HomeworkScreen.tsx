import React, { useState } from 'react';
import { Plus, Search, Trash2, Edit2, Share2, Mic, Calendar, BookOpen, Square } from 'lucide-react';
import { AppState, HomeworkItem, JalaliDate } from '../types';
import { fmt, fromKey, toKey, today } from '../utils/jalali';
import { generateUid } from '../utils/storage';
import { PersianDatePicker } from '../components/PersianDatePicker';
import { shareText } from '../utils/reports';import { VoiceRecorder } from '../utils/audio';
import {
  Button,
  Card,
  CardHeader,
  EmptyState,
  Field,
  IconButton,
  Input,
  SegmentedTabs,
  Textarea,
} from '../components/ui';

interface HomeworkScreenProps {
  state: AppState;
  onUpdateState: (fn: (prev: AppState) => AppState) => void;
  activeSessionKey: string;
}

export const HomeworkScreen: React.FC<HomeworkScreenProps> = ({
  state,
  onUpdateState,
  activeSessionKey,
}) => {
  const [tab, setTab] = useState<'new' | 'archive'>('new');
  const [date, setDate] = useState<JalaliDate>(fromKey(activeSessionKey));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [text, setText] = useState('');
  const [audio, setAudio] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recorder, setRecorder] = useState<VoiceRecorder | null>(null);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const startRecord = async () => {
    const rec = new VoiceRecorder();
    const ok = await rec.start();
    if (ok) {
      setRecorder(rec);
      setIsRecording(true);
    }
  };

  const stopRecord = async () => {
    if (recorder) {
      const data = await recorder.stop();
      if (data) setAudio(data);
      setRecorder(null);
      setIsRecording(false);
    }
  };

  const handleSave = () => {
    if (!text.trim()) {
      alert('لطفاً متن تکلیف را بنویسید.');
      return;
    }

    const item: HomeworkItem = {
      id: editingId || generateUid(),
      key: toKey(date),
      text: text.trim(),
      audio,
    };

    onUpdateState((prev) => ({
      ...prev,
      homework: editingId
        ? prev.homework.map((h) => (h.id === editingId ? item : h))
        : [item, ...prev.homework],
    }));

    setText('');
    setAudio(null);
    setEditingId(null);
    setTab('archive');
    alert('تکلیف با موفقیت ثبت شد.');
  };

  const handleDelete = (id: string) => {
    if (confirm('این تکلیف حذف شود؟')) {
      onUpdateState((prev) => ({
        ...prev,
        homework: prev.homework.filter((h) => h.id !== id),
      }));
    }
  };

  const handleEdit = (item: HomeworkItem) => {
    setEditingId(item.id);
    setDate(fromKey(item.key));
    setText(item.text);
    setAudio(item.audio || null);
    setTab('new');
  };

  const filteredArchive = state.homework.filter((h) =>
    search ? h.text.includes(search) : true
  );

  return (
    <div className="space-y-4 pb-12">
      <SegmentedTabs
        items={[
          { id: 'new', label: editingId ? 'ویرایش تکلیف' : 'تکلیف جدید' },
          { id: 'archive', label: 'آرشیو', count: state.homework.length },
        ]}
        value={tab}
        onChange={(v) => setTab(v as 'new' | 'archive')}
      />

      {tab === 'new' ? (
        <Card>
          <CardHeader
            icon={<BookOpen size={17} />}
            title={editingId ? 'ویرایش تکلیف' : 'تکلیف جدید جلسه'}
            subtitle="متن یا توضیح صوتی تمرین این هفته"
            className="mb-4"
          />

          <div className="space-y-4">
            <Field label="تاریخ جلسهٔ مربوطه">
              <button
                type="button"
                onClick={() => setShowDatePicker(true)}
                className="w-full h-11 text-right bg-surface-2 border border-line rounded-field px-3.5 text-sm font-semibold text-ink flex items-center justify-between"
              >
                <span className="num">{fmt(date)}</span>
                <Calendar size={16} className="text-muted" />
              </button>
            </Field>

            <Field label="متن تکلیف و تمرین‌ها">
              <Textarea
                rows={5}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="تکلیف این هفته برای اعضای گروه را بنویسید…"
              />
            </Field>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant={isRecording ? 'danger' : 'secondary'}
                icon={isRecording ? <Square size={14} /> : <Mic size={14} />}
                onClick={isRecording ? stopRecord : startRecord}
              >
                {isRecording ? 'توقف ضبط' : 'ضبط صوت'}
              </Button>

              {audio && (
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <audio controls src={audio} className="h-9 flex-1" />
                  <button
                    type="button"
                    onClick={() => setAudio(null)}
                    className="text-[11px] font-bold text-danger hover:underline shrink-0"
                  >
                    حذف
                  </button>
                </div>
              )}
            </div>

            <Button full size="lg" icon={<Plus size={16} />} onClick={handleSave}>
              {editingId ? 'ذخیرهٔ تغییرات' : 'ذخیره و انتشار تکلیف'}
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          <div className="relative">
            <Search
              size={17}
              className="absolute end-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو در آرشیو تکالیف…"
              className="pe-10"
            />
          </div>

          {filteredArchive.length === 0 ? (
            <EmptyState
              icon={<BookOpen size={22} />}
              title="تکلیفی در آرشیو نیست"
              description="با ثبت اولین تکلیف، آرشیو جلسات اینجا ساخته می‌شود."
              action={
                <Button size="sm" variant="secondary" onClick={() => setTab('new')}>
                  ثبت تکلیف
                </Button>
              }
            />
          ) : (
            filteredArchive.map((hw) => (
              <Card key={hw.id} className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-accent-ink num">
                    جلسهٔ {fmt(fromKey(hw.key))}
                  </span>
                  <div className="flex items-center gap-0.5">
                    <IconButton
                      aria-label="اشتراک‌گذاری تکلیف"
                      size="sm"
                      onClick={() => shareText(`تکلیف جلسه ${fmt(fromKey(hw.key))}`, hw.text)}
                    >
                      <Share2 size={15} />
                    </IconButton>
                    <IconButton aria-label="ویرایش تکلیف" size="sm" onClick={() => handleEdit(hw)}>
                      <Edit2 size={15} />
                    </IconButton>
                    <IconButton
                      aria-label="حذف تکلیف"
                      size="sm"
                      onClick={() => handleDelete(hw.id)}
                      className="text-danger hover:bg-danger/10 hover:text-danger"
                    >
                      <Trash2 size={15} />
                    </IconButton>
                  </div>
                </div>

                <p className="text-sm text-ink/90 whitespace-pre-wrap leading-7">{hw.text}</p>

                {hw.audio && (
                  <div className="pt-1 border-t border-line">
                    <audio controls src={hw.audio} className="h-9 w-full mt-2" />
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {showDatePicker && (
        <PersianDatePicker
          initialDate={date}
          onSelect={(d) => setDate(d)}
          onClose={() => setShowDatePicker(false)}
        />
      )}
    </div>
  );
};
