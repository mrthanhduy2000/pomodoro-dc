import { useState } from 'react';

import { useLogStore } from '../store/logStore.js';
import { loadLegacyEvents } from '../lib/legacy.js';
import { enablePush, pushEnabled, pushSupport } from '../lib/push.js';
import { syncNow } from '../lib/sync.js';
import setupSql from '../../../supabase/v2_events.sql?raw';

// The one step the app cannot do for itself: creating the table needs Đàm's Supabase login.
const SQL_EDITOR = 'https://supabase.com/dashboard/project/jcefdsdccmnmqvuwelmm/sql/new';

function NumberField({ label, value, min, max, onCommit }) {
  const [draft, setDraft] = useState(String(value));
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          const n = Math.round(Number(draft));
          if (Number.isFinite(n) && n >= min && n <= max && n !== value) onCommit(n);
          else setDraft(String(value));
        }}
      />
    </label>
  );
}

/** Shown only while the cloud table is missing: copy the SQL, paste it in Supabase, come back. */
function CloudSetup() {
  const [copied, setCopied] = useState('');
  return (
    <div className="setup">
      <p>Bật đồng bộ một lần duy nhất (khoảng 1 phút):</p>
      <ol>
        <li>
          <button
            type="button"
            className="btn btn--small btn--primary"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(setupSql);
                setCopied('Đã chép lệnh.');
              } catch {
                setCopied('Không chép được tự động — mở mục bên dưới và chép tay.');
              }
            }}
          >
            Chép lệnh tạo bảng
          </button>
          {copied && <span className="muted small"> {copied}</span>}
        </li>
        <li><a href={SQL_EDITOR} target="_blank" rel="noreferrer">Mở trình soạn SQL của Supabase</a>, dán vào, bấm <b>Run</b>.</li>
        <li>Quay lại đây: app tự kiểm tra lại, hoặc <button type="button" className="link" onClick={() => void syncNow()}>kiểm tra ngay</button>.</li>
      </ol>
      <details>
        <summary className="muted small">Xem lệnh (chỉ tạo bảng mới events_v2, không đụng dữ liệu bản 1)</summary>
        <pre className="sql">{setupSql}</pre>
      </details>
    </div>
  );
}

const NEW_COLORS = ['#e05a47', '#c45bb2', '#4a7bd0', '#3f9b7a', '#d99a2b', '#8a6a3c'];

/** One category row: rename on blur, recolour on pick, hide/show. Hiding never deletes a brick. */
function CategoryRow({ cat, canHide, onSave }) {
  const [label, setLabel] = useState(cat.label);
  return (
    <li className={`cat-row${cat.hidden ? ' cat-row--hidden' : ''}`}>
      <input type="color" className="cat-row__color" value={/^#[0-9a-f]{6}$/i.test(cat.color) ? cat.color : '#94a3b8'} aria-label={`Màu của ${cat.label}`} onChange={(e) => onSave({ ...cat, color: e.target.value })} />
      <input
        className="cat-row__label"
        value={label}
        maxLength={40}
        aria-label="Tên loại việc"
        onChange={(e) => setLabel(e.target.value)}
        onBlur={() => {
          const v = label.trim();
          if (v && v !== cat.label) onSave({ ...cat, label: v });
          else setLabel(cat.label);
        }}
      />
      <button type="button" className="link" disabled={!cat.hidden && !canHide} onClick={() => onSave({ ...cat, hidden: !cat.hidden })}>
        {cat.hidden ? 'Hiện lại' : 'Ẩn'}
      </button>
    </li>
  );
}

function Categories({ categories, onSave }) {
  const list = [...categories.values()];
  const visible = list.filter((c) => !c.hidden).length;
  const [draft, setDraft] = useState('');
  const add = () => {
    const label = draft.trim();
    if (!label) return;
    onSave({ label, color: NEW_COLORS[list.length % NEW_COLORS.length] });
    setDraft('');
  };
  return (
    <section className="card">
      <span className="eyebrow">Loại việc</span>
      <p className="muted small">Màu của loại việc là màu tầng nhà. Ẩn thì không hiện khi chọn nữa, các viên gạch cũ vẫn giữ nguyên.</p>
      <ul className="cats">
        {list.map((c) => <CategoryRow key={`${c.id}:${c.at}`} cat={c} canHide={visible > 1} onSave={onSave} />)}
      </ul>
      <form className="cat-add" onSubmit={(e) => { e.preventDefault(); add(); }}>
        <input value={draft} maxLength={40} onChange={(e) => setDraft(e.target.value)} placeholder="Loại việc mới…" aria-label="Tên loại việc mới" />
        <button type="submit" className="btn btn--small" disabled={!draft.trim()}>Thêm</button>
      </form>
    </section>
  );
}

const SYNC_TEXT = {
  idle: 'Đang khởi động…',
  syncing: 'Đang đồng bộ…',
  ok: 'Đã đồng bộ với các máy khác.',
  'missing-table': 'Chưa bật đồng bộ đám mây.',
  error: 'Đồng bộ lỗi — dữ liệu vẫn an toàn trên máy này.',
  'dev-local': 'Máy dev: không đồng bộ.',
};

export default function SettingsView({ app, sync }) {
  const { prefs } = app.state;
  const append = useLogStore((s) => s.append);
  const deviceId = useLogStore((s) => s.deviceId);
  const outbox = useLogStore((s) => s.outbox.length);
  const [importMsg, setImportMsg] = useState('');
  const [pushMsg, setPushMsg] = useState(pushEnabled() ? 'Thông báo đã bật trên máy này.' : '');
  const support = pushSupport();

  return (
    <div className="settings">
      <section className="card">
        <span className="eyebrow">Nhịp làm việc</span>
        <div className="fields">
          <NumberField key={`f${prefs.focusMin}`} label="Phiên tập trung (phút)" value={prefs.focusMin} min={5} max={180} onCommit={(n) => app.setPrefs({ focusMin: n })} />
          <NumberField key={`b${prefs.breakMin}`} label="Nghỉ giải lao (phút)" value={prefs.breakMin} min={1} max={60} onCommit={(n) => app.setPrefs({ breakMin: n })} />
          <NumberField key={`g${prefs.dailyGoal}`} label="Mục tiêu mỗi ngày (phiên)" value={prefs.dailyGoal} min={1} max={20} onCommit={(n) => app.setPrefs({ dailyGoal: n })} />
        </div>
      </section>

      <Categories categories={app.state.categories} onSave={app.upsertCategory} />

      <section className="card">
        <span className="eyebrow">Thông báo</span>
        <p className="muted">Báo khi xong phiên và khi hết giờ nghỉ, kể cả lúc app đang đóng.</p>
        {support === 'needs-install' && <p className="muted">Trên iPhone: mở bằng Safari → Chia sẻ → Thêm vào Màn hình chính, rồi mở app từ đó.</p>}
        <button
          type="button"
          className="btn"
          disabled={support !== 'ready'}
          onClick={async () => {
            setPushMsg('Đang bật…');
            try {
              await enablePush(deviceId);
              setPushMsg('Thông báo đã bật trên máy này.');
            } catch (err) {
              setPushMsg(err?.message ?? 'Không bật được thông báo.');
            }
          }}
        >
          Bật thông báo trên máy này
        </button>
        {pushMsg && <p className="muted">{pushMsg}</p>}
      </section>

      <section className="card">
        <span className="eyebrow">Lịch sử từ bản 1</span>
        <p className="muted">Chỉ đọc lịch sử phiên và loại việc của bản cũ để làm thống kê. Thành phố và tiến trình game bắt đầu lại từ đầu. Nhập nhiều lần cũng không bị trùng.</p>
        <button
          type="button"
          className="btn"
          onClick={async () => {
            setImportMsg('Đang đọc…');
            const { source, events } = await loadLegacyEvents();
            const added = append(events);
            const sessions = added.filter((e) => e.kind === 'legacy.session').length;
            setImportMsg(events.length
              ? `Đã nhập ${sessions} phiên mới (${source === 'cloud' ? 'từ đám mây' : 'từ trình duyệt này'}).`
              : 'Không tìm thấy dữ liệu bản 1.');
          }}
        >
          Nhập lịch sử bản 1
        </button>
        {importMsg && <p className="muted">{importMsg}</p>}
      </section>

      <section className="card">
        <span className="eyebrow">Đồng bộ</span>
        <p className={`sync sync--${sync.state}`}>{SYNC_TEXT[sync.state] ?? sync.state}</p>
        {sync.state === 'missing-table' ? <CloudSetup /> : sync.detail && <p className="muted small">{sync.detail}</p>}
        {outbox > 0 && <p className="muted small">{outbox} thay đổi đang chờ gửi lên.</p>}
        <p className="muted small">Bản 2 · {__APP_COMMIT__} · máy {deviceId.slice(0, 8)}</p>
      </section>
    </div>
  );
}
