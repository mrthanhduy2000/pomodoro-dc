import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AppErrorBoundary from './components/AppErrorBoundary.jsx'
import {
  attemptRuntimeRecovery,
  cleanupRuntimeRecoveryState,
} from './utils/runtimeRecovery.js'

function readPersistedUiTheme() {
  if (typeof window === 'undefined') return 'light'

  try {
    const raw = window.localStorage.getItem('civjourney-settings-v2')
    if (!raw) return 'light'

    const parsed = JSON.parse(raw)
    const theme = parsed?.state?.uiTheme ?? parsed?.uiTheme
    return theme === 'dark' ? 'dark' : 'light'
  } catch (error) {
    console.warn('[bootstrap] Cannot read persisted UI theme', error)
    return 'light'
  }
}

function reportReactRootError(kind, error, errorInfo) {
  console.error(`[react-root:${kind}]`, error, errorInfo)
  void attemptRuntimeRecovery(error, `react-root:${kind}`)
}

function installGlobalErrorHandlers() {
  if (typeof window === 'undefined') return
  if (window.__civjourneyGlobalErrorHandlersInstalled) return

  window.__civjourneyGlobalErrorHandlersInstalled = true

  window.addEventListener('error', (event) => {
    console.error('[window:error]', event.error ?? event.message, event)
    void attemptRuntimeRecovery(event.error ?? event.message, 'window-error')
  })

  window.addEventListener('unhandledrejection', (event) => {
    console.error('[window:unhandledrejection]', event.reason, event)
    void attemptRuntimeRecovery(event.reason, 'window-rejection')
  })
}

const initialUiTheme = readPersistedUiTheme()
cleanupRuntimeRecoveryState()
installGlobalErrorHandlers()

createRoot(document.getElementById('root'), {
  onCaughtError: (error, errorInfo) => reportReactRootError('caught', error, errorInfo),
  onUncaughtError: (error, errorInfo) => reportReactRootError('uncaught', error, errorInfo),
}).render(
  <StrictMode>
    <AppErrorBoundary
      area="toàn bộ ứng dụng"
      description="Renderer gặp lỗi trước khi giao diện hoàn tất. Thử render lại tại chỗ hoặc tải lại ứng dụng để khôi phục phiên gần nhất."
      theme={initialUiTheme}
      variant="root"
    >
      <App />
    </AppErrorBoundary>
  </StrictMode>,
)
