import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AppErrorBoundary from './components/AppErrorBoundary.jsx'
import {
  attemptRuntimeRecovery,
  cleanupRuntimeRecoveryState,
} from './utils/runtimeRecovery.js'
import {
  GLOBAL_ERROR_HANDLERS_FLAG,
  LEGACY_GLOBAL_ERROR_HANDLERS_FLAGS,
  SETTINGS_STORAGE_KEY,
  LEGACY_SETTINGS_STORAGE_KEYS,
  LOCAL_SW_RESET_KEY,
  LEGACY_LOCAL_SW_RESET_KEYS,
  readLocalStorageValue,
  readSessionStorageValue,
} from './lib/appIdentity.js'

function readPersistedUiTheme() {
  if (typeof window === 'undefined') return 'light'

  try {
    const raw = readLocalStorageValue(SETTINGS_STORAGE_KEY, LEGACY_SETTINGS_STORAGE_KEYS)
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
  if (window[GLOBAL_ERROR_HANDLERS_FLAG] || LEGACY_GLOBAL_ERROR_HANDLERS_FLAGS.some((flag) => window[flag])) return

  window[GLOBAL_ERROR_HANDLERS_FLAG] = true
  LEGACY_GLOBAL_ERROR_HANDLERS_FLAGS.forEach((flag) => {
    window[flag] = true
  })

  window.addEventListener('error', (event) => {
    console.error('[window:error]', event.error ?? event.message, event)
    void attemptRuntimeRecovery(event.error ?? event.message, 'window-error')
  })

  window.addEventListener('unhandledrejection', (event) => {
    console.error('[window:unhandledrejection]', event.reason, event)
    void attemptRuntimeRecovery(event.reason, 'window-rejection')
  })
}

function shouldResetLocalServiceWorkers() {
  if (typeof window === 'undefined') return false
  const hostname = window.location.hostname
  return hostname === 'localhost' || hostname === '127.0.0.1'
}

async function resetLocalServiceWorkers() {
  if (!shouldResetLocalServiceWorkers()) return
  if (!('serviceWorker' in navigator)) return

  const registrations = await navigator.serviceWorker.getRegistrations()
  if (registrations.length === 0) return

  await Promise.all(registrations.map((registration) => registration.unregister()))

  if ('caches' in window) {
    const cacheKeys = await window.caches.keys()
    await Promise.all(cacheKeys.map((cacheKey) => window.caches.delete(cacheKey)))
  }

  if (readSessionStorageValue(LOCAL_SW_RESET_KEY, LEGACY_LOCAL_SW_RESET_KEYS) === 'done') return

  window.sessionStorage.setItem(LOCAL_SW_RESET_KEY, 'done')
  window.location.reload()
}

const initialUiTheme = readPersistedUiTheme()
cleanupRuntimeRecoveryState()
installGlobalErrorHandlers()
void resetLocalServiceWorkers()

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
