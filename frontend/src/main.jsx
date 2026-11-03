import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import './index.css'

registerSW({
  immediate: true,
  onOfflineReady() {
    window.dispatchEvent(new CustomEvent('kd:pwa-offline-ready'))
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Suspense fallback={<div className="min-h-screen grid place-items-center text-sm text-gray-500">Loading KrishiDrive…</div>}>
      <App />
    </Suspense>
  </React.StrictMode>
)
