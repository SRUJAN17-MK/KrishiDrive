import React, { forwardRef } from 'react'
import { Loader2, AlertCircle, Inbox, RefreshCw } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

/* -------------------------------------------------------------------------- */
/*  1. BUTTON                                                                 */
/* -------------------------------------------------------------------------- */
export const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
    size = 'md', // 'sm' | 'md' | 'lg'
    loading = false,
    disabled = false,
    icon: Icon,
    iconPosition = 'left',
    type = 'button',
    className = '',
    ...props
  },
  ref
) {
  const baseClasses =
    'inline-flex items-center justify-center font-bold transition-all duration-200 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'

  const sizeClasses = {
    sm: 'text-xs min-h-[36px] px-3 py-1.5 rounded-lg gap-1.5',
    md: 'text-xs sm:text-sm min-h-[44px] px-4 py-2.5 rounded-xl gap-2',
    lg: 'text-sm sm:text-base min-h-[48px] px-5 py-3 rounded-xl gap-2.5'
  }

  const variantClasses = {
    primary:
      'bg-amber hover:bg-warmgold text-midnight shadow-amber-glow hover:shadow-lg focus-visible:ring-amber active:translate-y-0',
    secondary:
      'bg-electric hover:bg-bright text-white shadow-blue-glow hover:shadow-lg focus-visible:ring-bright active:translate-y-0',
    outline:
      'bg-transparent border border-gray-300 dark:border-charcoal-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-charcoal-800 hover:border-bright focus-visible:ring-bright',
    ghost:
      'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-charcoal-800 focus-visible:ring-bright',
    danger:
      'bg-red-600 hover:bg-red-700 text-white shadow-sm focus-visible:ring-red-500'
  }

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={`${baseClasses} ${sizeClasses[size] || sizeClasses.md} ${variantClasses[variant] || variantClasses.primary} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="animate-spin shrink-0" size={size === 'sm' ? 14 : 16} />
      ) : Icon && iconPosition === 'left' ? (
        <Icon size={size === 'sm' ? 14 : 16} className="shrink-0" />
      ) : null}

      <span>{children}</span>

      {!loading && Icon && iconPosition === 'right' && (
        <Icon size={size === 'sm' ? 14 : 16} className="shrink-0" />
      )}
    </button>
  )
})

/* -------------------------------------------------------------------------- */
/*  2. CARD COMPONENTS                                                        */
/* -------------------------------------------------------------------------- */
export function Card({ children, className = '', hover = false, ...props }) {
  return (
    <div
      className={`rounded-2xl border border-gray-200 dark:border-charcoal-800 bg-white dark:bg-charcoal shadow-sm transition-all duration-200 ${
        hover ? 'hover:shadow-card-hover hover:border-bright/40 hover:-translate-y-0.5' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`p-4 sm:p-5 border-b border-gray-100 dark:border-charcoal-800/80 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className = '', ...props }) {
  return (
    <h3 className={`text-sm sm:text-base font-bold text-gray-900 dark:text-white ${className}`} {...props}>
      {children}
    </h3>
  )
}

export function CardDescription({ children, className = '', ...props }) {
  return (
    <p className={`text-xs text-gray-500 dark:text-muted mt-1 leading-relaxed ${className}`} {...props}>
      {children}
    </p>
  )
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={`p-4 sm:p-5 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div className={`p-4 sm:p-5 pt-0 border-t border-gray-100 dark:border-charcoal-800/80 mt-2 ${className}`} {...props}>
      {children}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  3. BADGE                                                                  */
/* -------------------------------------------------------------------------- */
export function Badge({
  children,
  variant = 'neutral', // 'primary' | 'electric' | 'bright' | 'amber' | 'success' | 'danger' | 'neutral'
  size = 'md', // 'sm' | 'md'
  icon: Icon,
  className = '',
  ...props
}) {
  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-[11px] px-2.5 py-1 gap-1.5'
  }

  const variantClasses = {
    primary: 'bg-blue-50 text-electric border-bright/30 dark:bg-electric/25 dark:text-bright',
    electric: 'bg-blue-50 text-electric border-electric/30 dark:bg-electric/20 dark:text-bright',
    bright: 'bg-sky-50 text-bright-700 border-bright/30 dark:bg-bright/20 dark:text-bright-300',
    amber: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300',
    danger: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300',
    neutral: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-charcoal-800 dark:text-gray-300 dark:border-gray-700'
  }

  return (
    <span
      className={`inline-flex items-center font-bold rounded-full border tracking-wide uppercase ${sizeClasses[size] || sizeClasses.md} ${variantClasses[variant] || variantClasses.neutral} ${className}`}
      {...props}
    >
      {Icon && <Icon size={size === 'sm' ? 10 : 12} className="shrink-0" />}
      <span>{children}</span>
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/*  4. INPUT                                                                  */
/* -------------------------------------------------------------------------- */
export const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    icon: Icon,
    className = '',
    containerClassName = '',
    id,
    ...props
  },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 text-gray-400 dark:text-muted pointer-events-none">
            <Icon size={16} />
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          className={`w-full min-h-[44px] rounded-xl border bg-white dark:bg-midnight text-gray-900 dark:text-offwhite text-xs sm:text-sm transition-all duration-150 outline-none ${
            Icon ? 'pl-9 pr-3.5 py-2.5' : 'px-3.5 py-2.5'
          } ${
            error
              ? 'border-red-400 dark:border-red-600 focus:ring-2 focus:ring-red-400'
              : 'border-gray-200 dark:border-charcoal-800 focus:border-bright focus:ring-2 focus:ring-bright/20'
          } ${className}`}
          {...props}
        />
      </div>

      {error ? (
        <p className="text-[11px] text-red-600 dark:text-red-400 mt-1 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-gray-500 dark:text-muted mt-1">{helperText}</p>
      ) : null}
    </div>
  )
})

/* -------------------------------------------------------------------------- */
/*  5. SKELETON LOADERS                                                       */
/* -------------------------------------------------------------------------- */
export function Skeleton({ className = '', variant = 'text' }) {
  const variantClasses = {
    text: 'h-4 w-full rounded',
    circle: 'rounded-full',
    card: 'h-32 w-full rounded-2xl',
    button: 'h-11 w-28 rounded-xl'
  }

  return (
    <div
      className={`skeleton ${variantClasses[variant] || ''} ${className}`}
      aria-hidden="true"
    />
  )
}

export function SkeletonCard({ lines = 3, className = '' }) {
  return (
    <Card className={`p-5 space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton variant="circle" className="w-8 h-8" />
      </div>
      <div className="space-y-2 pt-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className={`h-3 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
        ))}
      </div>
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/*  6. EXISTING CORE COMPONENTS (Enhanced)                                    */
/* -------------------------------------------------------------------------- */
export function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
      <div>
        {eyebrow && <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-bright dark:text-bright-400 mb-1">{eyebrow}</p>}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">{title}</h1>
        {subtitle && <p className="text-xs sm:text-sm text-gray-500 dark:text-muted mt-1.5 max-w-3xl leading-relaxed">{subtitle}</p>}
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
    <div className="rounded-2xl border border-dashed border-gray-300 dark:border-charcoal-800 bg-white/70 dark:bg-charcoal/70 p-10 text-center">
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
  cancelled: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-charcoal-800 dark:text-gray-300 dark:border-gray-700',
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
    <Card hover className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-muted">{label}</p>
          <p className="text-2xl font-extrabold mt-1 text-gray-900 dark:text-white">{value}</p>
          {hint && <p className="text-[11px] text-gray-500 dark:text-muted mt-1">{hint}</p>}
        </div>
        {Icon && <span className={`rounded-xl p-2.5 ${tones[tone] || tones.blue}`}><Icon size={18} /></span>}
      </div>
    </Card>
  )
}
