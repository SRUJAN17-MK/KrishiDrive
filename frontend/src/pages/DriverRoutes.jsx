import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Route as RouteIcon, MapPin, Clock, Fuel, ArrowRight, Leaf,
  AlertTriangle, CheckCircle2, RefreshCw, Gauge, Crosshair,
  Plus, Trash2, Navigation, Layers
} from 'lucide-react'
import { api } from '../services/api'
import { useLanguage } from '../context/LanguageContext'
import { PageHeader, ErrorBlock } from '../components/ui'
import RouteMap from '../components/RouteMap'
import { formatINR } from '../utils/currency'
import toast from 'react-hot-toast'

const hubs = [
  { from: 'Nashik, Maharashtra', to: 'Vashi APMC Market, Mumbai' },
  { from: 'Ludhiana, Punjab', to: 'Azadpur Mandi, Delhi' },
  { from: 'Nashik, Maharashtra', to: 'Gultekdi Market Yard, Pune' },
  { from: 'Nagpur, Maharashtra', to: 'Bhopal Mandi, Madhya Pradesh' },
  { from: 'Lasalgaon, Maharashtra', to: 'Vashi APMC Market, Mumbai' },
  { from: 'Baramati, Maharashtra', to: 'Gultekdi Market Yard, Pune' }
]

const inputClass = 'w-full rounded-xl border border-gray-200 dark:border-[#274a3d] bg-gray-50 dark:bg-[#162a23] px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500'

function Field({ label, children }) {
  return (
    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  )
}

export default function DriverRoutes() {
  const { t } = useLanguage()
  const [searchParams] = useSearchParams()

  const [form, setForm] = useState({
    pickup: searchParams.get('pickup') || 'Nashik, Maharashtra',
    destination: searchParams.get('destination') || 'Vashi APMC Market, Mumbai',
    vehicle_type: searchParams.get('vehicle') || 'Truck (10-Ton)',
    load: searchParams.get('load') || '5000'
  })

  const [waypoints, setWaypoints] = useState([])
  const [result, setResult] = useState(null)
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(0)
  const [loading, setLoading] = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [error, setError] = useState('')

  const optimize = async (event) => {
    if (event) event.preventDefault()
    setLoading(true)
    setResult(null)
    setError('')
    setSelectedRouteIdx(0)
    try {
      const activeWaypoints = waypoints.map((w) => w.trim()).filter(Boolean)
      const data = await api.ai.routeOptimization({
        ...form,
        waypoints: activeWaypoints,
        load: Number(form.load)
      })
      setResult(data)
      toast.success(data.route_source === 'osrm' ? 'Real road route calculated' : 'Straight-line estimate calculated')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Auto-optimize if query parameters were passed from deliveries/jobs
  useEffect(() => {
    const qPickup = searchParams.get('pickup')
    const qDest = searchParams.get('destination')
    if (qPickup && qDest) {
      optimize()
    }
  }, [])

  // GPS Geolocation for Pickup
  const handleUseGps = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        const coordStr = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
        setForm((prev) => ({ ...prev, pickup: coordStr }))
        toast.success(`GPS Location set: ${coordStr}`)
        setGpsLoading(false)
      },
      (err) => {
        let msg = 'Failed to get GPS location'
        if (err.code === 1) msg = 'Location access denied. Enable permissions in browser.'
        else if (err.code === 2) msg = 'GPS signal unavailable.'
        else if (err.code === 3) msg = 'GPS request timed out.'
        toast.error(msg)
        setGpsLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const addWaypoint = () => {
    if (waypoints.length >= 4) {
      toast.error('Maximum 4 intermediate stops supported')
      return
    }
    setWaypoints((prev) => [...prev, ''])
  }

  const updateWaypoint = (index, value) => {
    setWaypoints((prev) => {
      const copy = [...prev]
      copy[index] = value
      return copy
    })
  }

  const removeWaypoint = (index) => {
    setWaypoints((prev) => prev.filter((_, i) => i !== index))
  }

  const isOsrm = result?.route_source === 'osrm'

  // Determine geometry to display: either primary or selected alternative
  const activeGeometry = (result?.alternatives && result.alternatives[selectedRouteIdx]?.geometry) || result?.geometry || []

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Agricultural Road Routing"
        title={t('driver.routePlanner')}
        subtitle={t('driver.routeSubtitle')}
      />

      {/* Preset Hubs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {hubs.map((hub) => (
          <button
            key={`${hub.from}-${hub.to}`}
            type="button"
            onClick={() => {
              setForm((prev) => ({ ...prev, pickup: hub.from, destination: hub.to }))
              setWaypoints([])
            }}
            className="text-[11px] whitespace-nowrap px-3 py-1.5 rounded-xl bg-white dark:bg-[#12211c] border border-gray-200 dark:border-[#1e362e] hover:border-emerald-500 text-gray-700 dark:text-gray-300 font-semibold transition"
          >
            {hub.from.split(',')[0]} → {hub.to.split(',')[0]}
          </button>
        ))}
      </div>

      {/* Main Route Planning Form */}
      <form onSubmit={optimize} className="rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-5 shadow-sm">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Field label={t('farmer.pickup')}>
            <div className="relative flex items-center">
              <input
                required
                maxLength={120}
                className={`${inputClass} pr-9`}
                value={form.pickup}
                onChange={(e) => setForm({ ...form, pickup: e.target.value })}
                placeholder="Nashik, Maharashtra or Coordinates"
              />
              <button
                type="button"
                onClick={handleUseGps}
                disabled={gpsLoading}
                title="Use Current GPS Location"
                className="absolute right-2 p-1 text-gray-400 hover:text-emerald-600 disabled:opacity-50"
              >
                <Crosshair size={15} className={gpsLoading ? 'animate-spin text-emerald-600' : ''} />
              </button>
            </div>
          </Field>

          <Field label={t('farmer.destination')}>
            <input
              required
              maxLength={120}
              className={inputClass}
              value={form.destination}
              onChange={(e) => setForm({ ...form, destination: e.target.value })}
              placeholder="Vashi APMC Market, Mumbai"
            />
          </Field>

          <Field label={t('farmer.vehicleType')}>
            <select
              className={inputClass}
              value={form.vehicle_type}
              onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })}
            >
              <option>Truck (10-Ton)</option>
              <option>Tempo (3-Ton)</option>
              <option>Mini Truck (2.5-Ton)</option>
              <option>Trailer (20-Ton)</option>
            </select>
          </Field>

          <Field label="Payload (kg)">
            <input
              type="number"
              min="1"
              max="40000"
              className={inputClass}
              value={form.load}
              onChange={(e) => setForm({ ...form, load: e.target.value })}
            />
          </Field>
        </div>

        {/* Multi-Stop Waypoints */}
        {waypoints.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-[#1e362e] space-y-2">
            <div className="text-xs font-bold text-gray-700 dark:text-gray-200">
              Intermediate Mandi Drops &amp; Waypoint Stops
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {waypoints.map((wpt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 w-14 shrink-0">
                    Stop #{idx + 1}
                  </span>
                  <input
                    className={inputClass}
                    value={wpt}
                    onChange={(e) => updateWaypoint(idx, e.target.value)}
                    placeholder="Town, Mandi, or Hub"
                  />
                  <button
                    type="button"
                    onClick={() => removeWaypoint(idx)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg shrink-0"
                    title="Remove stop"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-3 border-t border-gray-100 dark:border-[#1e362e]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={addWaypoint}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              <Plus size={14} /> Add Delivery Stop ({waypoints.length}/4)
            </button>
            <span className="text-gray-300 dark:text-gray-700">|</span>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 max-w-md">
              OSRM calculates real highway road networks. If unreachable, a labelled Haversine estimate is provided.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 px-5 py-2.5 text-xs font-bold text-white transition shadow"
          >
            {loading ? <RefreshCw size={15} className="animate-spin" /> : <RouteIcon size={15} />}
            {loading ? t('common.loading') : t('driver.getRoute')}
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
          {/* Status Badge & Meta */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold ${
                  isOsrm
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {isOsrm ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />} {result.data_source}
              </span>
              <span className="text-[11px] text-gray-600 dark:text-gray-300 font-medium">
                {result.pickup} → {result.destination}
              </span>
              {result.fetched_at && (
                <span className="text-[10px] text-gray-400">
                  Calculated {new Date(result.fetched_at).toLocaleTimeString()}
                </span>
              )}
            </div>

            <div className="text-xs text-gray-500">
              Payload: <strong className="text-gray-900 dark:text-white">{result.load_kg?.toLocaleString()} kg</strong> ({result.vehicle_type})
            </div>
          </div>

          {result.warning && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-3 text-xs text-amber-800 dark:text-amber-300 flex gap-2">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>{result.warning}</span>
            </div>
          )}

          {/* Interactive Leaflet Map */}
          <RouteMap
            geometry={activeGeometry}
            alternatives={result.alternatives}
            waypoints={result.waypoints}
            pickup={result.pickup}
            destination={result.destination}
            height={420}
            label={`${result.pickup} to ${result.destination}`}
          />

          {/* Route Metrics Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-4 shadow-sm">
              <p className="text-[10px] uppercase font-bold text-gray-400">{t('common.distance')}</p>
              <p className="text-xl font-extrabold text-gray-900 dark:text-white mt-1">
                {result.alternatives?.[selectedRouteIdx]?.distance_km ?? result.route.distance_km} km
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-4 shadow-sm">
              <p className="text-[10px] uppercase font-bold text-gray-400">{t('common.duration')}</p>
              <p className="text-xl font-extrabold text-gray-900 dark:text-white mt-1">
                {result.alternatives?.[selectedRouteIdx]?.duration_hours ?? result.route.estimated_time_hours} h
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-4 shadow-sm">
              <p className="text-[10px] uppercase font-bold text-gray-400">{t('driver.fuelEstimate')}</p>
              <p className="text-xl font-extrabold text-gray-900 dark:text-white mt-1">
                {result.route.fuel_liters_estimate} L
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-4 shadow-sm">
              <p className="text-[10px] uppercase font-bold text-gray-400">{t('driver.tollEstimate')}</p>
              <p className="text-xl font-extrabold text-gray-900 dark:text-white mt-1">
                {result.route.estimated_tolls_inr}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-4 shadow-sm">
              <p className="text-[10px] uppercase font-bold text-gray-400">{t('driver.co2')}</p>
              <p className="text-xl font-extrabold text-gray-900 dark:text-white mt-1">
                {result.route.co2_kg_estimate} kg
              </p>
            </div>
          </div>

          {/* Leg Breakdown if intermediate stops exist */}
          {result.legs && result.legs.length > 1 && (
            <section className="rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-4 shadow-sm">
              <h2 className="text-sm font-bold mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
                <Navigation size={16} className="text-emerald-600" /> Multi-Stop Delivery Sequence
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {result.legs.map((leg, index) => (
                  <div key={index} className="rounded-xl border border-gray-200 dark:border-[#274a3d] p-3 text-xs bg-gray-50/50 dark:bg-[#162a23]/50">
                    <p className="font-bold text-emerald-700 dark:text-emerald-400">Leg #{leg.step}</p>
                    <p className="text-gray-700 dark:text-gray-200 font-semibold mt-1">
                      {leg.distance_km} km · {leg.duration_minutes} min
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Alternative Routes Switcher */}
          {result.alternatives && result.alternatives.length > 0 && (
            <section className="rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-4 shadow-sm">
              <h2 className="text-sm font-bold mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
                <RouteIcon size={16} className="text-emerald-600" /> {t('driver.alternatives')}
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {result.alternatives.map((alt, index) => (
                  <button
                    key={alt.id}
                    type="button"
                    onClick={() => setSelectedRouteIdx(index)}
                    className={`rounded-xl border p-3 text-left transition cursor-pointer ${
                      selectedRouteIdx === index
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
                        : 'border-gray-200 dark:border-[#274a3d] hover:border-gray-300 dark:hover:border-[#386b58]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-bold text-gray-900 dark:text-white">
                        {alt.is_primary ? t('driver.primaryRoute') : `${t('driver.alternatives')} ${index}`}
                      </p>
                      {selectedRouteIdx === index && (
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full">
                          Active Map
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                      {alt.distance_km} km · {alt.duration_minutes} {t('common.min')}
                    </p>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Engine & Transparency Disclosure */}
          <div className="rounded-xl bg-gray-50 dark:bg-[#162a23] p-3 text-[11px] text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-[#1e362e]">
            <p className="font-semibold text-gray-700 dark:text-gray-200">{result.engine_info.name}</p>
            <p className="mt-1">{result.engine_info.note}</p>
            <p className="mt-1">
              Fuel, toll, and CO₂ values are deterministic engineering estimates calculated from highway distances, vehicle classes, and cargo payload.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
