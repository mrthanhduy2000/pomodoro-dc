import { lazy, Suspense, useEffect, useState, useSyncExternalStore } from 'react';

import { useTimerApp } from './app/useTimerApp.js';
import { getSyncStatus, onSyncStatus, startSync } from './lib/sync.js';
import { todaySummary } from './engine/stats.js';
import { clock } from './ui/format.js';
import CityView from './ui/CityView.jsx';
import FocusView from './ui/FocusView.jsx';
import StatsView from './ui/StatsView.jsx';
import SettingsView from './ui/SettingsView.jsx';

const GptEdition = lazy(() => import('./gpt/GptEdition.jsx'));
const GPT = new URLSearchParams(window.location.search).get('edition') === 'gpt';

const TABS = [
  { id: 'focus', label: 'Tập trung' },
  { id: 'city', label: 'Thành phố' },
  { id: 'stats', label: 'Thống kê' },
  { id: 'settings', label: 'Cài đặt' },
];

function useSyncStatus() {
  useEffect(() => startSync(), []);
  return useSyncExternalStore(onSyncStatus, getSyncStatus);
}

export default function App() {
  const app = useTimerApp();
  const sync = useSyncStatus();
  const [tab, setTab] = useState('focus');
  const today = todaySummary(app.state, app.now);
  const tl = app.timeline;

  useEffect(() => {
    document.title = tl ? `${clock(tl.remainingMs)} · ${tl.mode === 'break' ? 'Nghỉ' : 'Tập trung'}` : `DC Pomodoro · ${GPT ? 'GPT' : 'bản 2'}`;
  }, [tl]);

  if (GPT) return <Suspense fallback={<main className="page">Đang mở phiên bản GPT…</main>}><GptEdition app={app} sync={sync} /></Suspense>;

  return (
    <div className="shell">
      <header className="top">
        <div className="brand">
          DC Pomodoro <span className="badge">bản 2 · thử nghiệm</span>
        </div>
        <nav className="tabs" aria-label="Màn hình">
          {TABS.map((t) => (
            <button key={t.id} type="button" className={`tab${tab === t.id ? ' tab--on' : ''}`} aria-current={tab === t.id} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>
        <div className="top__right">
          <a className="btn btn--small" href="?edition=gpt">Phiên bản GPT ↗</a>
          <span className="muted">{today.count}/{app.state.prefs.dailyGoal} hôm nay</span>
          <span className={`sync-dot sync-dot--${sync.state}`} title={sync.detail || sync.state} />
        </div>
      </header>
      <main className="page">
        {tab === 'focus' && <FocusView app={app} goTo={setTab} />}
        {tab === 'city' && <CityView app={app} />}
        {tab === 'stats' && <StatsView app={app} />}
        {tab === 'settings' && <SettingsView app={app} sync={sync} />}
      </main>
    </div>
  );
}
