import React, { useState } from 'react'
import {
  Route as RouteIcon, MapPin, Clock, Fuel, ArrowRight, Leaf,
  AlertTriangle, CheckCircle2, RefreshCw, Gauge
} from 'lucide-react'
import { api } from '../services/api'
import { useLanguage } from '../context/LanguageContext'
import { PageHeader, ErrorBlock } from '../components/ui'
import RouteMap from '../components/RouteMap'
import { formatINR, CURRENCY_SYMBOL } from '../utils/currency'
import toast from 'react-hot-toast'

const hubs = [
  { from: 'Nashik, Maharashtra', to: 'Vashi APMC Market, Mumbai' },
  { from: 'Ludhiana, Punjab', to: 'Azadpur Mandi, Delhi' },
  { from: 'Nashik, Maharashtra', to: 'Gultekdi Market Yard, Pune' },
  { from: 'Nagpur, Maharashtra', to: 'Bhopal Mandi, Madhya Pradesh' }
]

const inputClass = 'w-full rounded-xl border border-gray-200 dark:border-[#274a3d] bg-gray-50 dark:bg-[#162a23] px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500'

function Field({ label, children }) {
  return <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">{label}<div className="mt-1">{children}</div></label>
}

export default function DriverRoutes() {
  const { t } = useLanguage()
  const [form, setForm] = useState({
    pickup: 'Nashik, Maharashtra',
    destination: 'Vashi APMC Market, Mumbai',
    vehicle_type: 'Truck (10-Ton)',
    load: '5000'
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const optimize = async (event) => {
    if (event) event.preventDefault()
    setLoading(true)
    setResult(null)
    setError('')
    try {
      const data = await api.ai.routeOptimization({ ...form, load: Number(form.load) })
      setResult(data)
      toast.success(data.route_source === 'osrm' ? 'Road route calculated' : 'Straight-line estimate calculated')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const isOsrm = result?.route_source === 'osrm'

  return (
    <div>
      <PageHeader
        eyebrow="Road routing"
        title={t('driver.routePlanner')}
        subtitle={t('driver.routeSubtitle')}
      />

      <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
        {hubs.map((hub) => (
          <button
            key={`${hub.from}-${hub.to}`}
            type="button"
            onClick={() => setForm((prev) => ({ ...prev, pickup: hub.from, destination: hub.to }))}
            className="text-[11px] whitespace-nowrap px-3 py-1.5 rounded-xl bg-white dark:bg-[#12211c] border border-gray-200 dark:border-[#1e362e] hover:border-emerald-500 text-gray-700 dark:text-gray-300 font-semibold"
          >
            {hub.from.split(',')[0]} → {hub.to.split(',')[0]}
          </button>
        ))}
      </div>

      <form onSubmit={optimize} className="rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-5 mb-5">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Field label={t('farmer.pickup')}><input required maxLength={120} className={inputClass} value={form.pickup} onChange={(e) => setForm({ ...form, pickup: e.target.value })} placeholder="Nashik, Maharashtra" /></Field>
          <Field label={t('farmer.destination')}><input required maxLength={120} className={inputClass} value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} placeholder="Mumbai, Maharashtra" /></Field>
          <Field label={t('farmer.vehicleType')}>
            <select className={inputClass} value={form.vehicle_type} onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })}>
              <option>Truck (10-Ton)</option>
              <option>Tempo (3-Ton)</option>
              <option>Mini Truck (2.5-Ton)</option>
              <option>Trailer (20-Ton)</option>
            </select>
          </Field>
          <Field label="Payload (kg)"><input type="number" min="1" max="40000" className={inputClass} value={form.load} onChange={(e) => setForm({ ...form, load: e.target.value })} /></Field>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 max-w-xl">OSRM uses the OpenStreetMap road network. If it is unreachable, the fallback is a straight-line Haversine estimate multiplied by 1.28 and labelled as such.</p>
          <button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 px-5 py-2.5 text-xs font-bold text-white">
            {loading ? <RefreshCw size={15} className="animate-spin" /> : <RouteIcon size={15} />} {loading ? t('common.loading') : t('driver.getRoute')}
          </button>
        </div>
      </form>

      {error && <ErrorBlock message={error} onRetry={optimize} />}

      {!loading && !result && !error && (
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-[#274a3d] p-10 text-center text-sm text-gray-500 dark:text-gray-400">
          {t('driver.noRoute')}
        </div>
      )}

      {result && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold ${isOsrm ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'}`}>
              {isOsrm ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />} {result.data_source}
            </span>
            <span className="text-[11px] text-gray-500">{result.pickup} → {result.destination}</span>
            {result.fetched_at && <span className="text-[10px] text-gray-400">Fetched {new Date(result.fetched_at).toLocaleTimeString()}</span>}
          </div>

          {result.warning && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-3 text-xs text-amber-800 dark:text-amber-300 flex gap-2">
              <AlertTriangle size={16} className="shrink-0" /> {result.warning}
            </div>
          )}

          <RouteMap geometry={result.geometry} alternatives={result.alternatives} label={`${result.pickup} to ${result.destination}`} />

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-4"><p className="text-[10px] uppercase font-bold text-gray-400">{t('common.distance')}</p><p className="text-xl font-extrabold">{result.route.distance_km} km</p></div>
            <div className="rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-4"><p className="text-[10px] uppercase font-bold text-gray-400">{t('common.duration')}</p><p className="text-xl font-extrabold">{result.route.estimated_time_hours} h</p></div>
            <div className="rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-4"><p className="text-[10px] uppercase font-bold text-gray-400">{t('driver.fuelEstimate')}</p><p className="text-xl font-extrabold">{result.route.fuel_liters_estimate} L</p></div>
            <div className="rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-4"><p className="text-[10px] uppercase font-bold text-gray-400">{t('driver.tollEstimate')}</p><p className="text-xl font-extrabold">{result.route.estimated_tolls_inr}</p></div>
            <div className="rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-4"><p className="text-[10px] uppercase font-bold text-gray-400">{t('driver.co2')}</p><p className="text-xl font-extrabold">{result.route.co2_kg_estimate} kg</p></div>
          </div>

          <section className="rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-4">
            <h2 className="text-sm font-bold mb-3 flex items-center gap-2"><RouteIcon size={16} className="text-emerald-600" /> {t('driver.alternatives')}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {result.alternatives.map((alt, index) => (
                <div key={alt.id} className={`rounded-xl border p-3 ${alt.is_primary ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30' : 'border-gray-200 dark:border-[#274a3d]'}`}>
                  <p className="text-[11px] font-bold">{alt.is_primary ? t('driver.primaryRoute') : `${t('driver.alternatives')} ${index}`}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{alt.distance_km} km · {alt.duration_minutes} {t('common.min')}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="rounded-xl bg-gray-50 dark:bg-[#162a23] p-3 text-[11px] text-gray-500 dark:text-gray-400">
            <p className="font-semibold text-gray-700 dark:text-gray-200">{result.engine_info.name}</p>
            <p className="mt-1">{result.engine_info.note}</p>
            <p className="mt-1">Fuel, toll and CO₂ values are deterministic estimates from distance, vehicle class and payload. They are not live toll or fuel-price feeds.</p>
          </div>
        </div>
      )}
    </div>
  )
}
