import React from 'react';
import { hardReloadCurrentPage, isRecoverableAssetError } from '../utils/runtimeRecovery.js';

function didResetKeysChange(prevResetKeys = [], resetKeys = []) {
  if (prevResetKeys.length !== resetKeys.length) return true;

  for (let index = 0; index < prevResetKeys.length; index += 1) {
    if (!Object.is(prevResetKeys[index], resetKeys[index])) {
      return true;
    }
  }

  return false;
}

function formatErrorMessage(error) {
  if (typeof error === 'string' && error.trim()) return error.trim();
  if (error instanceof Error && error.message) return error.message;
  return 'Không đọc được thông điệp lỗi cụ thể.';
}

function formatStackPreview(error, componentStack) {
  if (componentStack?.trim()) {
    return componentStack.trim();
  }

  if (error instanceof Error && error.stack) {
    return error.stack
      .split('\n')
      .slice(0, 8)
      .join('\n')
      .trim();
  }

  return '';
}

function BoundaryFallback({
  area,
  componentStack,
  description,
  error,
  headline,
  onReload,
  onRetry,
  theme,
  variant = 'section',
}) {
  const isRoot = variant === 'root';
  const stackPreview = formatStackPreview(error, componentStack);
  const defaultHeadline = isRoot
    ? 'Ứng dụng vừa gặp lỗi khi render'
    : `${area ?? 'Khu vực này'} vừa gặp lỗi`;
  const defaultDescription = isRoot
    ? 'Bạn có thể thử render lại ngay tại chỗ hoặc tải lại ứng dụng để khôi phục giao diện.'
    : 'Phần này không render được đúng cách. Thử dựng lại khu vực này trước, nếu vẫn lỗi thì tải lại ứng dụng.';

  return (
    <div
      data-theme={theme ?? undefined}
      className={isRoot ? 'min-h-screen bg-[var(--canvas)] text-[var(--ink)]' : 'h-full text-[var(--ink)]'}
    >
      <div className={isRoot ? 'flex min-h-screen items-center justify-center px-5 py-8' : 'flex h-full items-center justify-center px-4 py-8'}>
        <div
          className={`w-full border ${isRoot ? 'max-w-[760px] rounded-[32px] p-6 md:p-8' : 'max-w-[680px] rounded-[28px] p-5 md:p-6'}`}
          style={{
            borderColor: 'var(--line)',
            background: 'var(--panel-strong)',
            boxShadow: isRoot
              ? '0 30px 72px rgba(31,30,29,0.14)'
              : '0 18px 42px rgba(31,30,29,0.10)',
          }}
        >
          <div className="mono text-[11px] uppercase tracking-[0.24em]" style={{ color: 'var(--accent)' }}>
            Render recovery
          </div>
          <h1 className={`serif mt-3 tracking-[-0.03em] text-[var(--ink)] ${isRoot ? 'text-[30px] md:text-[36px]' : 'text-[24px] md:text-[28px]'}`}>
            {headline ?? defaultHeadline}
          </h1>
          <p className="mt-3 max-w-[58ch] text-[14px] leading-[1.7] text-[var(--muted)]">
            {description ?? defaultDescription}
          </p>

          <div
            className="mt-5 rounded-[22px] border p-4"
            style={{
              borderColor: 'var(--line)',
              background: 'var(--panel-soft)',
            }}
          >
            <div className="mono text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">Thông điệp lỗi</div>
            <div className="mt-2 text-[14px] leading-[1.7] text-[var(--ink)]">
              {formatErrorMessage(error)}
            </div>
          </div>

          {stackPreview && (
            <details
              className="mt-4 rounded-[20px] border px-4 py-3"
              style={{
                borderColor: 'var(--line)',
                background: 'rgba(255,255,255,0.54)',
              }}
            >
              <summary className="mono cursor-pointer text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                Chi tiết kỹ thuật
              </summary>
              <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-[12px] leading-[1.6] text-[var(--ink-2)]">
                {stackPreview}
              </pre>
            </details>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onRetry}
              className="rounded-full border px-4 py-2.5 text-sm font-semibold transition"
              style={{
                borderColor: 'rgba(201,100,66,0.22)',
                background: 'var(--ink)',
                color: 'var(--canvas)',
                boxShadow: '0 12px 24px rgba(31,30,29,0.12)',
              }}
            >
              Thử render lại
            </button>
            <button
              type="button"
              onClick={onReload}
              className="rounded-full border px-4 py-2.5 text-sm font-semibold transition"
              style={{
                borderColor: 'var(--line)',
                background: 'rgba(244,242,236,0.82)',
                color: 'var(--ink)',
              }}
            >
              Tải lại ứng dụng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      componentStack: '',
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ componentStack: errorInfo?.componentStack ?? '' });
    this.props.onError?.(error, errorInfo);
  }

  componentDidUpdate(prevProps) {
    if (!this.state.error) return;

    if (didResetKeysChange(prevProps.resetKeys, this.props.resetKeys)) {
      this.resetBoundary();
    }
  }

  resetBoundary = () => {
    this.setState({
      componentStack: '',
      error: null,
    });

    this.props.onReset?.();
  };

  reloadApplication = () => {
    this.props.onReload?.(this.state.error);

    if (isRecoverableAssetError(this.state.error)) {
      void hardReloadCurrentPage({
        reason: 'boundary-reload',
        scope: 'boundary-reload',
        force: true,
      });
      return;
    }

    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    const {
      area,
      children,
      description,
      fallback,
      headline,
      theme,
      variant,
    } = this.props;
    const { componentStack, error } = this.state;

    if (error) {
      if (typeof fallback === 'function') {
        return fallback({
          componentStack,
          error,
          reloadApplication: this.reloadApplication,
          resetErrorBoundary: this.resetBoundary,
        });
      }

      return (
        <BoundaryFallback
          area={area}
          componentStack={componentStack}
          description={description}
          error={error}
          headline={headline}
          onReload={this.reloadApplication}
          onRetry={this.resetBoundary}
          theme={theme}
          variant={variant}
        />
      );
    }

    return children;
  }
}
