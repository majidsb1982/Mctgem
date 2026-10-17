import React, { useState } from 'react';
import { FileText, Plus, Archive, Search, Trash2, Edit2, Share2, Mic, Calendar } from 'lucide-react';
import { AppState, HomeworkItem, JalaliDate } from '../types';
import { fmt, fromKey, toKey, today, toFa } from '../utils/jalali';
import { generateUid } from '../utils/storage';
import { PersianDatePicker } from '../components/PersianDatePicker';
import { copyToClipboard, shareText } from '../utils/reports';
import { VoiceRecorder } from '../utils/audio';

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

    onUpdateState((prev) => {
      let updated: HomeworkItem[];
      if (editingId) {
        updated = prev.homework.map((h) => (h.id === editingId ? item : h));
      } else {
        updated = [item, ...prev.homework];
      }
      return {
        ...prev,
        homework: updated,
      };
    });

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
    <div className="space-y-4 pb-12 animate-fade-in" dir="rtl">
      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl text-xs font-bold">
        <button
          onClick={() => setTab('new')}
          className={`flex-1 py-2.5 rounded-xl transition-all ${
            tab === 'new'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm font-extrabold'
              : 'text-slate-500'
          }`}
        >
          ➕ {editingId ? 'ویرایش تکلیف' : 'تکلیف جدید'}
        </button>
        <button
          onClick={() => setTab('archive')}
          className={`flex-1 py-2.5 rounded-xl transition-all ${
            tab === 'archive'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm font-extrabold'
              : 'text-slate-500'
          }`}
        >
          📚 آرشیو تکالیف ({toFa(state.homework.length)})
        </button>
      </div>

      {tab === 'new' ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">
            {editingId ? '✏️ ویرایش تکلیف' : '📚 تکلیف جدید جلسه'}
          </h3>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
              تاریخ جلسه مربوطه:
            </label>
            <button
              onClick={() => setShowDatePicker(true)}
              className="w-full text-right bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between"
            >
              <span>{fmt(date)}</span>
              <Calendar size={16} className="text-slate-400" />
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
              متن تکلیف و تمرین‌ها:
            </label>
            <textarea
              rows={5}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="تکلیف این هفته برای اعضای گروه را بنویسید..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={isRecording ? stopRecord : startRecord}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                isRecording
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
              }`}
            >
              <Mic size={14} />
              <span>{isRecording ? 'توقف ضبط' : '🎙 ضبط صوت تکلیف'}</span>
            </button>

            {audio && (
              <div className="flex items-center gap-2">
                <audio controls src={audio} className="h-8 max-w-45" />
                <button
                  type="button"
                  onClick={() => setAudio(null)}
                  className="text-xs text-rose-500 font-bold"
                >
                  حذف
                </button>
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              onClick={handleSave}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 rounded-2xl text-xs shadow-md shadow-blue-500/20 active:scale-95 transition-all"
            >
              💾 ذخیره و انتشار تکلیف
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative">
            <Search size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو در آرشیو تکالیف..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pr-10 pl-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none"
            />
          </div>

          {filteredArchive.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 text-center">
              <span className="text-3xl block mb-2">📚</span>
              <p className="font-bold text-sm text-slate-600 dark:text-slate-300">
                تکلیفی در آرشیو ثبت نشده است.
              </p>
            </div>
          ) : (
            filteredArchive.map((hw) => (
              <div
                key={hw.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400">
                    جلسه {fmt(fromKey(hw.key))}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        shareText(`تکلیف جلسه ${fmt(fromKey(hw.key))}`, hw.text);
                      }}
                      className="p-1.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="ارسال"
                    >
                      <Share2 size={15} />
                    </button>
                    <button
                      onClick={() => handleEdit(hw)}
                      className="p-1.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="ویرایش"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(hw.id)}
                      className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      title="حذف"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {hw.text}
                </p>

                {hw.audio && (
                  <div className="pt-1">
                    <audio controls src={hw.audio} className="h-8 w-full" />
                  </div>
                )}
              </div>
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
