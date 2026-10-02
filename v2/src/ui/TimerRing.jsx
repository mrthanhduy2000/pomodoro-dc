const R = 108;
const C = 2 * Math.PI * R;

export default function TimerRing({ progress = 0, mode = 'idle', paused = false, children }) {
  const offset = C * (1 - Math.min(1, Math.max(0, progress)));
  return (
    <div className={`ring ring--${mode}${paused ? ' ring--paused' : ''}`}>
      <svg viewBox="0 0 240 240" aria-hidden="true">
        <circle className="ring__track" cx="120" cy="120" r={R} />
        <circle
          className="ring__bar"
          cx="120"
          cy="120"
          r={R}
          strokeDasharray={C}
          strokeDashoffset={offset}
          transform="rotate(-90 120 120)"
        />
      </svg>
      <div className="ring__inner">{children}</div>
    </div>
  );
}
