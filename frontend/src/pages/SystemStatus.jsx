import React, { useEffect, useState } from 'react'
import {
  Server, CheckCircle2, XCircle, Clock, AlertTriangle,
  Globe, Database, Cpu, Cloud, RefreshCw, ExternalLink, Wifi
} from 'lucide-react'

function StatusPill({ status }) {
  if (status === 'ok' || status === 'connected') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#064FAE]/20 text-[#0785E8] text-[11px] font-bold rounded-full">
        <CheckCircle2 size={12} /> UP
      </span>
    )
  }
  if (status === 'degraded' || status === 'unconfigured') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#FF9800]/20 text-[#FF9800] text-[11px] font-bold rounded-full">
        <AlertTriangle size={12} /> {status === 'unconfigured' ? 'NOT CONFIGURED' : 'DEGRADED'}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 text-[11px] font-bold rounded-full">
      <XCircle size={12} /> DOWN
    </span>
  )
}

function LatencyBadge({ ms }) {
  if (!ms && ms !== 0) return <span className="text-gray-400 text-xs">—</span>
  const color = ms < 300 ? 'text-[#0785E8]' : ms < 1000 ? 'text-[#FF9800]' : 'text-red-500'
  return <span className={`text-xs font-bold tabular-nums ${color}`}>{ms} ms</span>
}

const SERVICE_META = {
  database: {
    label: 'SQLite 3 Database (WAL mode, ACID)',
    icon: Database,
    description: 'On-device relational SQLite database with WAL journal mode, strict foreign keys, and transactions.',
    link: null
  },
  satellite_intelligence: {
    label: 'Copernicus Sentinel-2 & ECMWF Land Surface',
    icon: Globe,
    description: 'Daily global satellite reanalysis: 0-9cm root zone moisture, soil temp, DEM elevation & slope via Open-Meteo.',
    link: 'https://open-meteo.com/en/docs/elevation-api'
  },
  weather_service: {
    label: 'Open-Meteo Weather API',
    icon: Cloud,
    description: 'Real-time weather, hourly precipitation, temperature, and agricultural moisture conditions. No API key required.',
    link: 'https://open-meteo.com'
  },
  routing_service: {
    label: 'OSRM Route Engine (OpenStreetMap)',
    icon: Globe,
    description: 'Real road distance & travel duration routing for transport bookings and Where to Sell net profit calculation.',
    link: 'https://project-osrm.org'
  },
  mandi_prices: {
    label: 'Agmarknet APMC Mandi Prices (data.gov.in)',
    icon: Server,
    description: 'Official Ministry of Agriculture APMC wholesale prices. Verified baseline reference when AGMARKNET_API_KEY is not set.',
    link: 'https://data.gov.in'
  },
  ai_onnx_inference: {
    label: 'ONNX Runtime (PlantVillage MobileNetV2)',
    icon: Cpu,
    description: 'Inference model for 38 crop disease classes. Measured CPU latency ~3.3 ms. Snapdragon NPU unverified for this build.',
    link: null
  }
}

export default function SystemStatus() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastChecked, setLastChecked] = useState(null)

  const fetchStatus = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/system/status')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setStatus(data)
      setLastChecked(new Date())
    } catch (err) {
      setError(`Failed to fetch system status: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const services = status?.subsystems || status?.services || {}
  const allUp = Object.values(services).every(s => s?.status === 'ok' || s?.status === 'connected')
  const anyDown = Object.values(services).some(s => s?.status === 'error' || s?.status === 'down')

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className={`w-3 h-3 rounded-full animate-pulse ${
            loading ? 'bg-gray-400' : anyDown ? 'bg-red-500' : allUp ? 'bg-[#0785E8]' : 'bg-[#FF9800]'
          }`} />
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-[#F8FAFC]">
            KrishiDrive System &amp; Integration Status
          </h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-[#A7B4C5]">
          Real-time probe of all external APIs, database, and AI runtime. Latency measured at request time from the backend server.
        </p>
        <div className="flex items-center gap-4 mt-3">
          {lastChecked && (
            <span className="text-xs text-gray-400 dark:text-[#A7B4C5]">
              Last checked: {lastChecked.toLocaleTimeString('en-IN')}
            </span>
          )}
          <button
            onClick={fetchStatus}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0785E8] hover:text-[#FF9800] disabled:opacity-50 transition"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh Now
          </button>
        </div>
      </div>

      {/* Overall Health Banner */}
      {!loading && !error && (
        <div className={`mb-6 p-4 rounded-2xl border flex items-center gap-3 ${
          anyDown
            ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
            : allUp
            ? 'bg-[#064FAE]/10 dark:bg-[#064FAE]/20 border-[#064FAE]/30'
            : 'bg-[#FF9800]/10 dark:bg-[#FF9800]/20 border-[#FF9800]/30'
        }`}>
          {anyDown
            ? <XCircle size={20} className="text-red-500 shrink-0" />
            : allUp
            ? <CheckCircle2 size={20} className="text-[#0785E8] shrink-0" />
            : <AlertTriangle size={20} className="text-[#FF9800] shrink-0" />
          }
          <div>
            <p className={`text-sm font-bold ${
              anyDown ? 'text-red-800 dark:text-red-200'
              : allUp ? 'text-gray-900 dark:text-[#F8FAFC]'
              : 'text-[#FF9800]'
            }`}>
              {anyDown ? 'Some integrations are unavailable'
                : allUp ? 'All configured services are operational'
                : 'Some services need configuration'}
            </p>
            <p className="text-xs text-gray-500 dark:text-[#A7B4C5] mt-0.5">
              {Object.values(services).filter(s => s?.status === 'ok' || s?.status === 'connected').length} / {Object.keys(services).length} services operational
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-800 dark:text-red-200">
          <div className="flex items-center gap-2">
            <XCircle size={16} /> {error}
          </div>
          <button onClick={fetchStatus} className="text-xs underline mt-2">Retry</button>
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-gray-100 dark:bg-[#07172F] animate-pulse" />
          ))}
        </div>
      )}

      {/* Service Cards */}
      {!loading && services && (
        <div className="space-y-3">
          {Object.entries(SERVICE_META).map(([key, meta]) => {
            const svc = services[key] || {}
            const Icon = meta.icon

            return (
              <div
                key={key}
                className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-200 dark:border-[#1E293B] p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#064FAE]/15 flex items-center justify-center text-[#0785E8] shrink-0">
                      <Icon size={20} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                          {meta.label}
                        </h3>
                        <StatusPill status={svc.status || 'error'} />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-[#A7B4C5] mt-1 leading-relaxed">
                        {meta.description}
                      </p>
                      {svc.message && (
                        <p className="text-xs text-[#FF9800] mt-1 font-medium">
                          {svc.message}
                        </p>
                      )}
                      {svc.error && (
                        <p className="text-xs text-red-500 mt-1">
                          Error: {svc.error}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 text-right flex flex-col items-end gap-2">
                    <LatencyBadge ms={svc.latency_ms} />
                    <span className="text-[10px] text-gray-400 dark:text-[#A7B4C5] uppercase tracking-wider">Latency</span>
                    {meta.link && (
                      <a
                        href={meta.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-[#0785E8] hover:text-[#FF9800] flex items-center gap-0.5"
                      >
                        Docs <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Transparency Note */}
      <div className="mt-8 p-4 bg-gray-50 dark:bg-[#111827] rounded-2xl border border-gray-200 dark:border-[#1E293B] text-xs text-gray-500 dark:text-[#A7B4C5] leading-relaxed">
        <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1 flex items-center gap-1.5">
          <Wifi size={14} className="text-[#0785E8]" /> Transparency Note
        </p>
        Latency figures are measured from the KrishiDrive backend server to each third-party endpoint at the moment you load this page — not from your browser. When a service shows "NOT CONFIGURED", functionality gracefully degrades and the UI clearly labels data as unavailable rather than showing simulated values.
      </div>
    </div>
  )
}

