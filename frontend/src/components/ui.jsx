import React from 'react'
import { Loader2, AlertCircle, Inbox, RefreshCw } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

export function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
      <div>
        {eyebrow && <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-bright dark:text-bright-400 mb-1">{eyebrow}</p>}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 dark:text-muted mt-1.5 max-w-3xl leading-relaxed">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function LoadingBlock({ label }) {
  const { t } = useLanguage()
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3" role="status" aria-live="polite">
      <Loader2 className="animate-spin text-bright" size={28} />
      <p className="text-sm text-gray-500 dark:text-muted">{label || t('common.loading')}</p>
    </div>
  )
}

export function ErrorBlock({ message, onRetry }) {
  const { t } = useLanguage()
  return (
    <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-6 text-center" role="alert">
      <AlertCircle className="mx-auto text-red-500 mb-2" size={26} />
      <p className="text-sm font-semibold text-red-800 dark:text-red-200">{message || t('common.error')}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-3 py-2 text-xs font-bold text-white">
          <RefreshCw size={14} /> {t('common.retry')}
        </button>
      )}
    </div>
  )
}

export function EmptyState({ title, body, action }) {
  const { t } = useLanguage()
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 dark:border-[#1E293B] bg-white/70 dark:bg-[#111827]/70 p-10 text-center">
      <Inbox className="mx-auto text-gray-400 dark:text-muted mb-3" size={28} />
      <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{title || t('common.noData')}</p>
      {body && <p className="text-xs text-gray-500 dark:text-muted mt-1 max-w-md mx-auto">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

const badgeColors = {
  pending: 'bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60',
  matched: 'bg-blue-50 text-electric border-blue-200 dark:bg-electric-900/40 dark:text-bright-300 dark:border-electric-700/60',
  in_transit: 'bg-sky-50 text-bright-700 border-sky-200 dark:bg-bright-950/40 dark:text-bright-300 dark:border-bright-700/60',
  delivered: 'bg-blue-50 text-electric border-blue-200 dark:bg-electric-900/40 dark:text-bright dark:border-electric-700/60',
  completed: 'bg-blue-50 text-electric border-blue-200 dark:bg-electric-900/40 dark:text-bright dark:border-electric-700/60',
  cancelled: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-[#1E293B] dark:text-gray-300 dark:border-gray-700',
  growing: 'bg-sky-50 text-bright-700 border-sky-200 dark:bg-bright-950/40 dark:text-bright-300 dark:border-bright-700/60',
  harvested: 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60'
}

export function StatusBadge({ status }) {
  const { t } = useLanguage()
  const key = String(status || '').toLowerCase()
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${badgeColors[key] || badgeColors.cancelled}`}>
      {t(`status.${key}`) || status}
    </span>
  )
}

export function StatCard({ label, value, hint, icon: Icon, tone = 'blue' }) {
  const tones = {
    blue: 'bg-blue-50 text-electric dark:bg-midnight-800/80 dark:text-bright-400',
    bright: 'bg-sky-50 text-bright dark:bg-midnight-800/80 dark:text-bright-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    emerald: 'bg-sky-50 text-bright dark:bg-midnight-800/80 dark:text-bright-300',
    indigo: 'bg-blue-50 text-electric dark:bg-midnight-800/80 dark:text-bright-400'
  }
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-[#1E293B] bg-white dark:bg-[#111827] p-4 shadow-sm hover:border-bright/40 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-muted">{label}</p>
          <p className="text-2xl font-extrabold mt-1 text-gray-900 dark:text-white">{value}</p>
          {hint && <p className="text-[11px] text-gray-500 dark:text-muted mt-1">{hint}</p>}
        </div>
        {Icon && <span className={`rounded-xl p-2.5 ${tones[tone] || tones.blue}`}><Icon size={18} /></span>}
      </div>
    </div>
  )
}
