import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Store, Search, AlertTriangle, RefreshCw, Info, LogIn,
  MapPin, TrendingUp, Lock, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Trophy
} from 'lucide-react'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { PageHeader, LoadingBlock, ErrorBlock, EmptyState } from '../components/ui'
import { VoiceInputButton } from '../components/VoiceControls'

const money = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })

// ─── Where-to-Sell tab ───────────────────────────────────────────────────────

function WhereSellTab() {
  const [form, setForm] = useState({
    commodity: 'Wheat',
    quantityKg: 1000,
    originLocation: 'Nashik, Maharashtra'
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [sortKey, setSortKey] = useState('net_realization')
  const [sortDir, setSortDir] = useState('desc')

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const json = await api.market.whereToSell({
        commodity: form.commodity,
        quantity_kg: Number(form.quantityKg),
        origin_location: form.originLocation
      })
      setResult(json)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <ChevronUp size={12} className="opacity-20" />
    return sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
  }

  const sortedMarkets = result?.markets
    ? [...result.markets].sort((a, b) => {
        const av = a[sortKey] ?? 0
        const bv = b[sortKey] ?? 0
        return sortDir === 'asc' ? av - bv : bv - av
      })
    : []

  const best = sortedMarkets[0]

  return (
    <div className="space-y-6">
      {/* Form */}
      <form onSubmit={submit} className="rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
            Commodity
            <input
              value={form.commodity}
              onChange={e => setForm({ ...form, commodity: e.target.value })}
              placeholder="Wheat"
              className="w-full mt-1 rounded-xl border border-gray-200 dark:border-[#274a3d] bg-gray-50 dark:bg-[#162a23] px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </label>
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
            Quantity (kg)
            <input
              type="number"
              min={1}
              value={form.quantityKg}
              onChange={e => setForm({ ...form, quantityKg: e.target.value })}
              placeholder="1000"
              className="w-full mt-1 rounded-xl border border-gray-200 dark:border-[#274a3d] bg-gray-50 dark:bg-[#162a23] px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </label>
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
            Origin Location
            <input
              value={form.originLocation}
              onChange={e => setForm({ ...form, originLocation: e.target.value })}
              placeholder="Nashik, Maharashtra"
              className="w-full mt-1 rounded-xl border border-gray-200 dark:border-[#274a3d] bg-gray-50 dark:bg-[#162a23] px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white text-sm font-bold px-4 py-2.5 transition"
            >
              <TrendingUp size={16} />
              {loading ? 'Analysing…' : 'Find Best Market'}
            </button>
          </div>
        </div>
        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-3">
          Compares modal prices from multiple APMC mandis weighted against road-distance freight cost.
        </p>
      </form>

      {loading && <LoadingBlock label="Calculating best market…" />}
      {error && <ErrorBlock message={error} onRetry={submit} />}

      {result && !loading && (
        result.available === false ? (
          <div className="rounded-2xl border border-amber-300/60 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
                  Where-to-Sell analysis unavailable
                </p>
                <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-1 leading-relaxed">
                  {result.reason || 'This feature requires live Agmarknet price data (AGMARKNET_API_KEY). Without it we cannot compare market prices across mandis.'}
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-2 font-semibold">
                  ✓ OSRM road-distance routing engine is live and ready.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Winner banner */}
            {result.winner && (
              <div className="rounded-2xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 p-4 flex items-center gap-3">
                <Trophy className="text-emerald-600 dark:text-emerald-400 shrink-0" size={24} />
                <div>
                  <p className="text-sm font-extrabold text-emerald-900 dark:text-emerald-200">
                    Best Market: {result.winner.name}
                  </p>
                  {result.winner.advantage != null && (
                    <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                      Net ₹{money.format(result.winner.advantage)} more than the nearest market
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Results table */}
            <div className="rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-[#162a23] text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold">Market</th>
                      <th
                        className="px-4 py-2.5 font-semibold text-right cursor-pointer select-none hover:text-emerald-600"
                        onClick={() => toggleSort('modal_price')}
                      >
                        <span className="inline-flex items-center gap-1">Modal Price<SortIcon col="modal_price" /></span>
                      </th>
                      <th
                        className="px-4 py-2.5 font-semibold text-right cursor-pointer select-none hover:text-emerald-600"
                        onClick={() => toggleSort('distance_km')}
                      >
                        <span className="inline-flex items-center gap-1">Road Dist (km)<SortIcon col="distance_km" /></span>
                      </th>
                      <th
                        className="px-4 py-2.5 font-semibold text-right cursor-pointer select-none hover:text-emerald-600"
                        onClick={() => toggleSort('freight_cost')}
                      >
                        <span className="inline-flex items-center gap-1">Freight (₹)<SortIcon col="freight_cost" /></span>
                      </th>
                      <th
                        className="px-4 py-2.5 font-semibold text-right cursor-pointer select-none hover:text-emerald-600"
                        onClick={() => toggleSort('net_realization')}
                      >
                        <span className="inline-flex items-center gap-1">Net Realization (₹)<SortIcon col="net_realization" /></span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-[#1e362e]">
                    {sortedMarkets.map((market, idx) => {
                      const isFirst = idx === 0
                      const isSecond = idx === 1
                      return (
                        <tr
                          key={`${market.name}-${idx}`}
                          className={`hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 ${
                            isFirst ? 'bg-emerald-50/60 dark:bg-emerald-950/30' : ''
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                              {isFirst && <Trophy size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />}
                              {market.name}
                            </div>
                            <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                              {[market.district, market.state].filter(Boolean).join(', ')}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-gray-700 dark:text-gray-300">
                            ₹{money.format(market.modal_price ?? 0)}
                            <div className="text-[10px] text-gray-400">/quintal</div>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-gray-600 dark:text-gray-300">
                            {market.distance_km != null ? market.distance_km.toFixed(1) : '—'}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-gray-600 dark:text-gray-300">
                            ₹{money.format(market.freight_cost ?? 0)}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums font-extrabold">
                            <span
                              className={
                                isFirst
                                  ? 'text-emerald-700 dark:text-emerald-400'
                                  : isSecond
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-gray-800 dark:text-gray-200'
                              }
                            >
                              ₹{money.format(market.net_realization ?? 0)}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Disclaimer */}
              <div className="px-4 py-3 border-t border-gray-100 dark:border-[#1e362e] text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed flex items-start gap-2">
                <Info size={12} className="shrink-0 mt-0.5" />
                <span>
                  Net realization is estimated from OSRM road distance and tiered freight rates.
                  Actual costs may vary. Always confirm current prices at the mandi before transporting.
                </span>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function MarketPrices() {
  const { isAuthenticated } = useAuth()
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState('mandi')
  const [status, setStatus] = useState(null)
  const [statusError, setStatusError] = useState('')
  const [form, setForm] = useState({
    commodity: 'Tomato',
    state: 'Maharashtra',
    district: '',
    market: ''
  })
  const [page, setPage] = useState(1)
  const pageSize = 25
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

  const search = async (targetPage = 1, event) => {
    if (event && event.preventDefault) event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const offset = Math.max(0, (targetPage - 1) * pageSize)
      const res = await api.market.prices({
        ...form,
        limit: pageSize,
        offset
      })
      setData(res)
      setPage(targetPage)
    } catch (err) {
      setError(err.message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status?.configured) search(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status?.configured])

  const totalRecords = data?.total || data?.count || 0
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize))

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <PageHeader
        eyebrow="Agmarknet · data.gov.in"
        title={t('market.title')}
        subtitle={t('market.subtitle')}
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/60 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-800 px-3 py-1.5 text-[11px] font-semibold text-amber-800 dark:text-amber-300">
            <Info size={13} /> {status?.configured ? t('common.live') : t('common.notConfigured')}
          </span>
        }
      />

      {statusError && <ErrorBlock message={statusError} onRetry={loadStatus} />}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 rounded-xl border border-gray-200 dark:border-[#1e362e] bg-gray-50 dark:bg-[#0d1a14] p-1 w-fit">
        <button
          onClick={() => setActiveTab('mandi')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
            activeTab === 'mandi'
              ? 'bg-white dark:bg-[#12211c] text-emerald-700 dark:text-emerald-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <Store size={15} /> Mandi Prices
        </button>
        <button
          onClick={() => setActiveTab('where')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
            activeTab === 'where'
              ? 'bg-white dark:bg-[#12211c] text-emerald-700 dark:text-emerald-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <MapPin size={15} /> Where Should I Sell?
        </button>
      </div>

      {/* ── Mandi Prices tab ── */}
      {activeTab === 'mandi' && (
        <>
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

          <form onSubmit={(e) => search(1, e)} className="rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-4 mb-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
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
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                {t('market.market') || 'Market / Mandi'} <span className="font-normal text-gray-400">({t('common.optional')})</span>
                <input
                  value={form.market}
                  onChange={(e) => setForm({ ...form, market: e.target.value })}
                  placeholder="Lasalgaon"
                  className="w-full mt-1 rounded-xl border border-gray-200 dark:border-[#274a3d] bg-gray-50 dark:bg-[#162a23] px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </label>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white text-sm font-bold px-4 py-2.5 transition shadow-sm"
                >
                  <Search size={16} /> {loading ? t('common.loading') : t('market.searchPrices')}
                </button>
              </div>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-3">{t('market.queryHint')}</p>
          </form>

          {loading && <LoadingBlock label="Fetching actual mandi prices from data.gov.in Agmarknet..." />}
          {error && <ErrorBlock message={error} onRetry={() => search(page)} />}

          {data && !loading && (
            data.available === false ? (
              <div className="rounded-2xl border border-amber-300/80 dark:border-amber-700/60 bg-amber-50/80 dark:bg-amber-950/30 p-5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
                      {data.error_type === 'invalid_key'
                        ? 'data.gov.in API Key Not Authorized'
                        : data.error_type === 'rate_limited'
                        ? 'data.gov.in Rate Limit Reached'
                        : data.error_type === 'timeout'
                        ? 'data.gov.in Request Timed Out'
                        : 'Mandi Prices Unavailable'}
                    </p>
                    <p className="text-xs text-amber-800/90 dark:text-amber-300/90 mt-1 leading-relaxed">
                      {data.reason}
                    </p>
                    {data.setup_url && (
                      <a
                        href={data.setup_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block text-xs font-semibold text-emerald-700 dark:text-emerald-400 underline mt-2"
                      >
                        Obtain or renew API key at data.gov.in →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ) : data.records?.length === 0 ? (
              <EmptyState title={t('market.noRecords')} body={t('market.queryHint')} />
            ) : (
              <div className="rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] overflow-hidden shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 border-b border-gray-100 dark:border-[#1e362e] bg-gray-50/60 dark:bg-[#162a23]/30">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {data.count} {data.count === 1 ? 'record' : 'records'}
                        {data.total > data.count ? ` (of ${data.total} total)` : ''}
                      </p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                        {data.cached ? 'Cached 15m' : 'Live Stream'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                      {data.source} · Latest arrival reported: <span className="font-semibold text-gray-700 dark:text-gray-300">{data.last_updated || 'Recent'}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => search(page)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#274a3d] bg-white dark:bg-[#12211c] text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-[#1e362e] transition"
                  >
                    <RefreshCw size={13} /> {t('common.retry')}
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 dark:bg-[#162a23] text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      <tr>
                        <th className="px-4 py-3 font-semibold">{t('market.commodity')}</th>
                        <th className="px-4 py-3 font-semibold">Mandi / Market</th>
                        <th className="px-4 py-3 font-semibold text-right">{t('market.minPrice')}</th>
                        <th className="px-4 py-3 font-semibold text-right text-emerald-700 dark:text-emerald-400">{t('market.modalPrice')}</th>
                        <th className="px-4 py-3 font-semibold text-right">{t('market.maxPrice')}</th>
                        <th className="px-4 py-3 font-semibold text-center">{t('common.date')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-[#1e362e]">
                      {data.records.map((row, index) => (
                        <tr
                          key={`${row.market}-${row.commodity}-${row.arrival_date}-${index}`}
                          className="hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-colors"
                        >
                          <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                            <div>{row.commodity}</div>
                            {row.variety && row.variety !== 'Standard' && (
                              <div className="text-[10px] text-gray-500 dark:text-gray-400 font-normal">
                                Variety: {row.variety}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                            <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                              <MapPin size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                              {row.market}
                            </div>
                            <div className="text-[11px] text-gray-500 dark:text-gray-400 pl-4">
                              {[row.district, row.state].filter(Boolean).join(', ')}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-gray-600 dark:text-gray-400">
                            ₹{row.min_price != null ? money.format(row.min_price) : '—'}
                            <div className="text-[10px] text-gray-400">/quintal</div>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-extrabold text-sm shadow-xs">
                              ₹{row.modal_price != null ? money.format(row.modal_price) : '—'}
                            </span>
                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">Modal / qtl</div>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-gray-600 dark:text-gray-400">
                            ₹{row.max_price != null ? money.format(row.max_price) : '—'}
                            <div className="text-[10px] text-gray-400">/quintal</div>
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 dark:bg-[#162a23] text-gray-700 dark:text-gray-300">
                              {row.arrival_date || '—'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination bar */}
                {totalRecords > pageSize && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 dark:border-[#1e362e] bg-gray-50/50 dark:bg-[#162a23]/40">
                    <div className="text-xs text-gray-600 dark:text-gray-300">
                      Showing <span className="font-semibold text-gray-900 dark:text-white">{(page - 1) * pageSize + 1}</span> to <span className="font-semibold text-gray-900 dark:text-white">{Math.min(page * pageSize, totalRecords)}</span> of <span className="font-semibold text-gray-900 dark:text-white">{totalRecords}</span> entries
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => search(page - 1)}
                        disabled={page <= 1 || loading}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#274a3d] bg-white dark:bg-[#12211c] text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#1e362e] disabled:opacity-40 transition"
                      >
                        <ChevronLeft size={14} /> Previous
                      </button>
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-300 px-2">
                        Page {page} of {totalPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => search(page + 1)}
                        disabled={page >= totalPages || loading}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#274a3d] bg-white dark:bg-[#12211c] text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#1e362e] disabled:opacity-40 transition"
                      >
                        Next <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}

                <div className="px-4 py-3 border-t border-gray-100 dark:border-[#1e362e] text-[11px] text-gray-500 dark:text-gray-400 flex items-start gap-2">
                  <Info size={12} className="shrink-0 mt-0.5 text-emerald-600" />
                  <span>
                    {data.note || 'Prices are as officially reported by APMC mandis to the Ministry of Agriculture Agmarknet portal. Modal price is the most frequent transaction price per quintal (100 kg).'}
                  </span>
                </div>
              </div>
            )
          )}

          {!data && !loading && !error && status?.configured && (
            <EmptyState title={t('market.noRecords')} body={t('market.queryHint')} />
          )}
        </>
      )}

      {/* ── Where Should I Sell? tab ── */}
      {activeTab === 'where' && <WhereSellTab />}
    </div>
  )
}
