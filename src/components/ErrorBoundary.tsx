import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { resetToDemo } from '../utils/storage';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    resetToDemo();
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4" dir="rtl">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-rose-200 dark:border-rose-900/60 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle size={28} />
            </div>

            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">
              خطایی در اجرای صفحه رخ داد
            </h2>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              نگران نباشید، داده‌های شما محفوظ هستند. با دکمه زیر می‌توانید برنامه را مجدداً بارگذاری کنید.
            </p>

            {this.state.error && (
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-left text-[11px] font-mono text-slate-700 dark:text-slate-300 max-h-28 overflow-y-auto" dir="ltr">
                {this.state.error.message}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <RefreshCw size={15} />
                <span>بارگذاری مجدد صفحه</span>
              </button>
              <button
                onClick={this.handleReset}
                className="px-4 py-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 font-bold rounded-xl text-xs active:scale-95"
              >
                بازنشانی به داده اولیه
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
