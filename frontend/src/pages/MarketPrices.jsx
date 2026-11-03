import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Store, Search, AlertTriangle, RefreshCw, Info, LogIn } from 'lucide-react'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { PageHeader, LoadingBlock, ErrorBlock, EmptyState } from '../components/ui'
import { VoiceInputButton } from '../components/VoiceControls'

const money = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })

export default function MarketPrices() {
  const { isAuthenticated } = useAuth()
  const { t } = useLanguage()
  const [status, setStatus] = useState(null)
  const [statusError, setStatusError] = useState('')
  const [form, setForm] = useState({ commodity: 'Tomato', state: 'Maharashtra', district: '' })
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadStatus = async () => {
    setStatusError('')
    try {
      setStatus(await api.market.status())
    } catch (err) {
      setStatusError(err.message)
    }
  }

  useEffect(() => { loadStatus() }, [])

  const search = async (event) => {
    if (event) event.preventDefault()
    if (!isAuthenticated) return
    setLoading(true)
    setError('')
    try {
      setData(await api.market.prices(form))
    } catch (err) {
      setError(err.message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated && status?.configured) search()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, status?.configured])

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <PageHeader
        eyebrow="Agmarknet · data.gov.in"
        title={t('market.title')}
        subtitle={t('market.subtitle')}
        actions={<span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/60 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-800 px-3 py-1.5 text-[11px] font-semibold text-amber-800 dark:text-amber-300"><Info size={13} /> {status?.configured ? t('common.live') : t('common.notConfigured')}</span>}
      />

      {statusError && <ErrorBlock message={statusError} onRetry={loadStatus} />}

      {status && !status.configured && (
        <div className="rounded-2xl border border-amber-300/60 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-5 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" size={20} />
            <div>
              <h2 className="text-sm font-bold text-amber-900 dark:text-amber-200">{t('market.notConfiguredTitle')}</h2>
              <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-1 leading-relaxed">{t('market.notConfiguredBody')}</p>
              <code className="inline-block mt-2 text-[11px] bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 px-2 py-1 rounded">AGMARKNET_API_KEY=…</code>
              <a href={status.setup_url} target="_blank" rel="noreferrer" className="block text-xs font-semibold text-amber-900 dark:text-amber-200 underline mt-2">data.gov.in</a>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={search} className="rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-4 mb-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
            {t('market.commodity')}
            <div className="flex items-center gap-2 mt-1">
              <input
                value={form.commodity}
                onChange={(e) => setForm({ ...form, commodity: e.target.value })}
                placeholder="Tomato"
                className="w-full rounded-xl border border-gray-200 dark:border-[#274a3d] bg-gray-50 dark:bg-[#162a23] px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <VoiceInputButton onResult={(text) => setForm((f) => ({ ...f, commodity: text }))} />
            </div>
          </label>
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
            {t('market.state')}
            <input
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              placeholder="Maharashtra"
              className="w-full mt-1 rounded-xl border border-gray-200 dark:border-[#274a3d] bg-gray-50 dark:bg-[#162a23] px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </label>
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
            {t('market.district')} <span className="font-normal text-gray-400">({t('common.optional')})</span>
            <input
              value={form.district}
              onChange={(e) => setForm({ ...form, district: e.target.value })}
              placeholder="Nashik"
              className="w-full mt-1 rounded-xl border border-gray-200 dark:border-[#274a3d] bg-gray-50 dark:bg-[#162a23] px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading || !status?.configured || !isAuthenticated}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white text-sm font-bold px-4 py-2.5"
            >
              <Search size={16} /> {loading ? t('common.loading') : t('market.searchPrices')}
            </button>
          </div>
        </div>
        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-3">{t('market.queryHint')}</p>
      </form>

      {!isAuthenticated && status?.configured && (
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">Sign in to query live mandi prices</p>
            <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 mt-1">The price endpoint is authenticated to prevent API-key abuse.</p>
          </div>
          <Link to="/login" className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-4 py-2 text-xs font-bold text-white"><LogIn size={14} /> {t('common.signIn')}</Link>
        </div>
      )}

      {loading && <LoadingBlock label={t('market.searchPrices')} />}
      {error && <ErrorBlock message={error} onRetry={search} />}

      {data && !loading && (
        data.available === false ? (
          <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-sm font-bold text-red-800 dark:text-red-200">Live prices unavailable</p>
                <p className="text-xs text-red-700/80 dark:text-red-300/80 mt-1">{data.reason}</p>
              </div>
            </div>
          </div>
        ) : data.records?.length === 0 ? (
          <EmptyState title={t('market.noRecords')} body={t('market.queryHint')} />
        ) : (
          <div className="rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-gray-100 dark:border-[#1e362e]">
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{data.count} records · {data.source}</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  {data.cached ? 'Cached (15 min TTL)' : 'Fetched now'} · Last arrival {data.last_updated || 'unknown'} · Prices per quintal
                </p>
              </div>
              <button onClick={search} className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400"><RefreshCw size={13} /> {t('common.retry')}</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-[#162a23] text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">{t('market.commodity')}</th>
                    <th className="px-4 py-2.5 font-semibold">{t('market.district')} / Market</th>
                    <th className="px-4 py-2.5 font-semibold text-right">{t('market.minPrice')}</th>
                    <th className="px-4 py-2.5 font-semibold text-right">{t('market.modalPrice')}</th>
                    <th className="px-4 py-2.5 font-semibold text-right">{t('market.maxPrice')}</th>
                    <th className="px-4 py-2.5 font-semibold">{t('common.date')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-[#1e362e]">
                  {data.records.map((row, index) => (
                    <tr key={`${row.market}-${row.commodity}-${row.arrival_date}-${index}`} className="hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20">
                      <td className="px-4 py-2.5 font-semibold text-gray-900 dark:text-white">{row.commodity}{row.variety ? ` · ${row.variety}` : ''}</td>
                      <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300">{row.market}, {row.district}, {row.state}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">₹{money.format(row.min_price ?? 0)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-bold text-emerald-700 dark:text-emerald-400">₹{money.format(row.modal_price ?? 0)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">₹{money.format(row.max_price ?? 0)}</td>
                      <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 whitespace-nowrap">{row.arrival_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-gray-100 dark:border-[#1e362e] text-[11px] text-gray-500 dark:text-gray-400">
              {data.note || 'Prices are as reported by APMC markets. Modal price is not a guaranteed rate.'}
            </div>
          </div>
        )
      )}

      {!data && !loading && !error && status?.configured && isAuthenticated && (
        <EmptyState title={t('market.noRecords')} body={t('market.queryHint')} />
      )}
    </div>
  )
}
