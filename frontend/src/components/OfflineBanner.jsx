import React, { useEffect, useState } from 'react'
import { WifiOff, RefreshCw, CloudUpload } from 'lucide-react'
import toast from 'react-hot-toast'
import { useLanguage } from '../context/LanguageContext'
import { flushOutbox, outboxCount, subscribeOutbox } from '../utils/offline'

export default function OfflineBanner() {
  const { t } = useLanguage()
  const [online, setOnline] = useState(navigator.onLine)
  const [pending, setPending] = useState(outboxCount)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    const handleOnline = async () => {
      setOnline(true)
      const queued = outboxCount()
      if (queued > 0) {
        setSyncing(true)
        const result = await flushOutbox()
        setSyncing(false)
        if (result.synced) toast.success(`${result.synced} ${t('common.pendingSync')}`)
        if (result.failed) toast.error(`${result.failed} ${t('common.error')}`)
      } else {
        toast.success(t('common.online'))
      }
    }
    const handleOffline = () => setOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    const unsubscribe = subscribeOutbox(setPending)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      unsubscribe()
    }
  }, [t])

  if (online && pending === 0 && !syncing) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[70] max-w-lg w-[calc(100%-2rem)]">
      <div className="flex items-center gap-3 rounded-2xl border border-amber-300/60 bg-amber-50/95 dark:bg-amber-950/90 dark:border-amber-800 px-4 py-3 shadow-lg backdrop-blur">
        <span className="text-amber-700 dark:text-amber-300">
          {online ? <CloudUpload size={18} /> : <WifiOff size={18} />}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
            {online ? t('common.pendingSync') : t('common.offline')}
          </p>
          <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
            {syncing ? t('common.syncing') : `${pending} action${pending === 1 ? '' : 's'} in the offline outbox`}
          </p>
        </div>
        {online && pending > 0 && (
          <button
            type="button"
            disabled={syncing}
            onClick={async () => {
              setSyncing(true)
              const result = await flushOutbox()
              setSyncing(false)
              if (result.synced) toast.success(`${result.synced} synced`)
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold px-2.5 py-1.5 disabled:opacity-50"
          >
            <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
            {t('common.syncNow')}
          </button>
        )}
      </div>
    </div>
  )
}
