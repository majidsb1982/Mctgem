import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

declare global {
  interface Window {
    __mctMounted?: boolean;
    __mctForceMount?: () => void;
    emergencyCleanReset?: () => void;
  }
}

function mount() {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('MCT: Could not find #root element to mount React.');
    return;
  }

  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    );
    window.__mctMounted = true;
    console.log('MCT: React application mounted successfully.');
  } catch (err: any) {
    console.error('MCT: Error during ReactDOM.createRoot render:', err);
    window.__mctMounted = false;
    rootElement.innerHTML = `
      <div style="direction:rtl;padding:32px 20px;text-align:center;font-family:sans-serif;max-width:400px;margin:40px auto;background:#fff;border-radius:24px;box-shadow:0 10px 30px rgba(0,0,0,0.08);border:1px solid #fee2e2;">
        <div style="width:52px;height:52px;background:#fee2e2;color:#dc2626;border-radius:16px;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:24px;">⚠️</div>
        <h2 style="color:#1e293b;font-size:18px;font-weight:bold;margin:0 0 8px;">خطا در راه‌اندازی برنامه</h2>
        <p style="color:#64748b;font-size:13px;line-height:1.6;margin:0 0 20px;">مشکلی در شروع نرم‌افزار پیش آمده است: ${err?.message || ''}</p>
        <button onclick="localStorage.removeItem('mct:data');window.location.reload();" style="width:100%;padding:12px;background:#2563eb;color:#fff;border:none;border-radius:14px;font-weight:bold;font-size:14px;cursor:pointer;">
          بازنشانی به حالت پیش‌فرض و ورود
        </button>
      </div>
    `;
  }
}

window.__mctForceMount = mount;

// Mount immediately as #root is already in the document
if (document.getElementById('root')) {
  mount();
} else if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}
