import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Brain, Sprout, Truck, Route as RouteIcon, Upload, ArrowRight,
  ShieldCheck, CheckCircle2, AlertTriangle, Info, Leaf, Cpu,
  RefreshCw, IndianRupee, CalendarDays, MapPin, Gauge, FileWarning
} from 'lucide-react'
import { api, OfflineQueuedError } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { PageHeader, ErrorBlock } from '../components/ui'
import RouteMap from '../components/RouteMap'
import { SpeakButton } from '../components/VoiceControls'
import toast from 'react-hot-toast'

const modules = [
  { id: 'disease', icon: Leaf, titleKey: 'ai.disease', descKey: 'ai.diseaseDesc', badge: 'ai.realModel' },
  { id: 'crop_rec', icon: Sprout, titleKey: 'ai.cropRec', descKey: 'ai.cropRecDesc', badge: 'ai.ruleEngine' },
  { id: 'harvest', icon: Brain, titleKey: 'ai.harvest', descKey: 'ai.harvestDesc', badge: 'ai.ruleEngine' },
  { id: 'route', icon: RouteIcon, titleKey: 'ai.route', descKey: 'ai.routeDesc', badge: 'OSRM' },
  { id: 'matching', icon: Truck, titleKey: 'ai.matching', descKey: 'ai.matchingDesc', badge: 'ai.ruleEngine' }
]

function Field({ label, children, hint }) {
  return (
    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">
      {label}
      <div className="mt-1">{children}</div>
      {hint && <span className="block mt-1 text-[10px] font-normal text-gray-400">{hint}</span>}
    </label>
  )
}

const inputClass = 'w-full rounded-xl border border-gray-200 dark:border-[#274a3d] bg-gray-50 dark:bg-[#162a23] px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500'

function ConfidenceBar({ value }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0))
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] mb-1">
        <span className="text-gray-500 dark:text-gray-400">Confidence</span>
        <span className="font-bold text-gray-900 dark:text-white">{pct.toFixed(1)}%</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 dark:bg-[#162a23] overflow-hidden">
        <div className={`h-full rounded-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 55 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function Disclaimer({ children }) {
  return (
    <p className="mt-3 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 p-3 text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
      {children}
    </p>
  )
}

function CropResult({ result }) {
  const top = result.top_recommendation
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">Top recommendation</p>
            <h3 className="text-xl font-extrabold text-emerald-950 dark:text-emerald-100">{top.crop_name}</h3>
            <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80">{top.season} · {top.suitable_soils.join(', ')}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">{top.match_score}<span className="text-sm">/99</span></p>
            <p className="text-[10px] text-gray-500">rule score</p>
          </div>
        </div>
        <p className="text-xs text-emerald-900/80 dark:text-emerald-200/80 mt-2">{top.rationale}</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        {result.recommended_crops.slice(0, 6).map((crop) => (
          <div key={crop.crop_name} className="rounded-xl border border-gray-200 dark:border-[#1e362e] p-3">
            <div className="flex justify-between text-xs font-bold"><span>{crop.crop_name}</span><span className="text-emerald-700 dark:text-emerald-400">{crop.match_score}</span></div>
            <p className="text-[10px] text-gray-500 mt-1">Yield {crop.expected_yield_per_acre}/acre · {crop.market_rate_per_kg}/kg</p>
          </div>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 gap-3 text-[11px]">
        {Object.entries(result.soil_analysis).map(([key, value]) => (
          <div key={key} className="rounded-xl bg-gray-50 dark:bg-[#162a23] p-3"><span className="text-gray-400 capitalize">{key.replaceAll('_', ' ')}</span><p className="font-semibold text-gray-900 dark:text-white">{value}</p></div>
        ))}
      </div>
      <Disclaimer>{result.engine_info.note} Execution: {result.engine_info.execution_environment}, {result.engine_info.execution_time_ms} ms.</Disclaimer>
    </div>
  )
}

function HarvestResult({ result }) {
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-gray-200 dark:border-[#1e362e] p-3"><p className="text-[10px] text-gray-400 uppercase">Estimated yield</p><p className="text-xl font-extrabold">{result.predicted_yield.toLocaleString()} kg</p></div>
        <div className="rounded-xl border border-gray-200 dark:border-[#1e362e] p-3"><p className="text-[10px] text-gray-400 uppercase">Harvest window</p><p className="text-xs font-bold mt-1">{result.harvest_schedule.earliest_harvest_date} → {result.harvest_schedule.harvest_window_close}</p></div>
        <div className="rounded-xl border border-gray-200 dark:border-[#1e362e] p-3"><p className="text-[10px] text-gray-400 uppercase">Growth duration</p><p className="text-xl font-extrabold">{result.harvest_schedule.growth_duration_days} days</p></div>
      </div>
      <div className="rounded-xl border border-gray-200 dark:border-[#1e362e] p-3 text-xs space-y-1.5">
        <p className="flex justify-between"><span className="text-gray-500">Indicative rate</span><span className="font-semibold text-right">{result.economic_forecast.reference_mandi_rate}</span></p>
        <p className="flex justify-between"><span className="text-gray-500">Gross revenue</span><span className="font-semibold text-right">{result.economic_forecast.projected_gross_revenue}</span></p>
        <p className="flex justify-between"><span className="text-gray-500">Net profit estimate</span><span className="font-semibold text-right">{result.economic_forecast.estimated_net_profit}</span></p>
        <p className="flex justify-between"><span className="text-gray-500">Transport</span><span className="font-semibold text-right">{result.transport_logistics.recommended_vehicle} · {result.transport_logistics.perishability_tier} perishability</span></p>
      </div>
      <Disclaimer>{result.engine_info.note}</Disclaimer>
    </div>
  )
}

function DiseaseResult({ result }) {
  const p = result.prediction
  const g = result.agronomic_guidance
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-200 dark:border-[#1e362e] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">ONNX model output</p>
            <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">{p.label}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{p.crop} · {p.condition} {p.is_healthy ? '· healthy' : ''}</p>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${p.is_healthy ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'}`}>{p.is_healthy ? 'Healthy' : 'Disease detected'}</span>
        </div>
        <div className="mt-3"><ConfidenceBar value={p.confidence_percent} /></div>
        <p className="text-[10px] text-gray-400 mt-2">Inference {result.latency_ms} ms · {result.model.execution_provider_actual || 'cpu'} · {result.model.architecture}</p>
      </div>

      {result.crop_mismatch && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-3 text-xs text-amber-800 dark:text-amber-300 flex gap-2">
          <FileWarning size={16} className="shrink-0" /> {result.crop_mismatch_note}
        </div>
      )}

      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Top 5 predictions</h4>
        <div className="space-y-1.5">
          {result.top_predictions.map((item) => (
            <div key={item.class_index} className="flex items-center gap-3">
              <span className="w-44 truncate text-[11px] text-gray-700 dark:text-gray-300">{item.label}</span>
              <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-[#162a23] overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${Math.max(1, item.confidence_percent)}%` }} /></div>
              <span className="w-12 text-right text-[10px] tabular-nums text-gray-500">{item.confidence_percent.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-gray-50 dark:bg-[#162a23] p-3 text-[11px] space-y-1.5">
        <p><span className="font-bold">Pathogen:</span> {g.pathogen || '—'}</p>
        <p><span className="font-bold">Symptoms:</span> {g.symptoms}</p>
        <p><span className="font-bold">Chemical:</span> {g.chemical}</p>
        <p><span className="font-bold">Organic:</span> {g.organic}</p>
        <p><span className="font-bold">Urgency:</span> {g.urgency}</p>
        <p className="text-gray-500">{g.note}</p>
      </div>
      <Disclaimer>{result.model.note} A lab or agronomist confirmation is required before spraying.</Disclaimer>
    </div>
  )
}

function RouteResult({ result }) {
  return (
    <div className="space-y-4">
      <RouteMap
        geometry={result.geometry}
        alternatives={result.alternatives}
        pickup={result.pickup}
        destination={result.destination}
        label={`${result.pickup} to ${result.destination}`}
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <div className="rounded-xl border border-gray-200 dark:border-[#1e362e] p-3"><p className="text-[10px] text-gray-400 uppercase">Distance</p><p className="text-lg font-extrabold">{result.route.distance_km} km</p></div>
        <div className="rounded-xl border border-gray-200 dark:border-[#1e362e] p-3"><p className="text-[10px] text-gray-400 uppercase">Time</p><p className="text-lg font-extrabold">{result.route.estimated_time_hours} h</p></div>
        <div className="rounded-xl border border-gray-200 dark:border-[#1e362e] p-3"><p className="text-[10px] text-gray-400 uppercase">Fuel estimate</p><p className="text-lg font-extrabold">{result.route.fuel_liters_estimate} L</p></div>
        <div className="rounded-xl border border-gray-200 dark:border-[#1e362e] p-3"><p className="text-[10px] text-gray-400 uppercase">Tolls estimate</p><p className="text-lg font-extrabold">{result.route.estimated_tolls_inr}</p></div>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-[11px]">
        <span className={`rounded-full px-2.5 py-1 font-bold ${result.route_source === 'osrm' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'}`}>{result.data_source}</span>
        {result.is_estimate && <span className="text-amber-700 dark:text-amber-300">Estimate, not a road-network route.</span>}
      </div>
      {result.warning && <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-3 text-xs text-amber-800 dark:text-amber-300">{result.warning}</div>}
      <div className="text-[11px] text-gray-500 space-y-1">
        {result.alternatives.length > 1 ? result.alternatives.map((alt, i) => (
          <p key={alt.id}>{alt.is_primary ? 'Primary' : `Alternative ${i}`}: {alt.distance_km} km · {alt.duration_minutes} min</p>
        )) : <p>Only one route returned by the routing service.</p>}
      </div>
      <Disclaimer>{result.engine_info.note}</Disclaimer>
    </div>
  )
}

function MatchingResult({ result }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
        <span>Base distance: {result.estimated_base_distance_km ?? '—'} km</span>
        <span>·</span>
        <span>{result.distance_note}</span>
      </div>
      {result.matches.length === 0 && <p className="text-sm text-gray-500">No vehicles are currently available.</p>}
      {result.matches.map((match) => (
        <div key={match.vehicle.id} className="rounded-xl border border-gray-200 dark:border-[#1e362e] p-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{match.vehicle.type} · {match.vehicle.number}</p>
              <p className="text-[11px] text-gray-500">{match.driver ? `${match.driver.full_name} · ${match.driver.rating || 'N/A'}★ · ${match.driver.trips_completed || 0} trips` : 'No assigned driver'}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400">{match.match_score}<span className="text-[10px] text-gray-400">/99</span></p>
              {match.estimated_cost != null && <p className="text-[11px] font-semibold">{match.estimated_cost_formatted}</p>}
            </div>
          </div>
          <ul className="mt-2 space-y-0.5 text-[11px] text-gray-600 dark:text-gray-300">
            {match.reasons.map((reason) => <li key={reason}>• {reason}</li>)}
          </ul>
          {!match.driver && <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">Cannot be booked until a driver is assigned.</p>}
        </div>
      ))}
      <p className="text-[11px] text-gray-500">{result.engine_info.note}</p>
      <Link to="/farmer/transport" className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-4 py-2 text-xs font-bold text-white">Book a real transport request <ArrowRight size={14} /></Link>
    </div>
  )
}

export default function AILab() {
  const { isAuthenticated } = useAuth()
  const { t } = useLanguage()
  const [active, setActive] = useState('disease')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState({})
  const [leafFile, setLeafFile] = useState(null)
  const [leafPreview, setLeafPreview] = useState('')
  const fileRef = useRef(null)

  const [forms, setForms] = useState({
    crop_rec: { soil_type: 'Black', nitrogen: 280, phosphorus: 24, potassium: 320, ph: 7.2, temperature: 29, humidity: 65, rainfall: 750 },
    harvest: { crop_name: 'Tomato', acreage: 5, planting_date: new Date().toISOString().split('T')[0], soil_type: 'Black', location: 'Nashik' },
    disease: { crop_type: 'Tomato' },
    route: { pickup: 'Nashik, Maharashtra', destination: 'Vashi APMC Market, Mumbai', vehicle_type: 'Truck (10-Ton)', load: 5000 },
    matching: { crop_type: 'Tomato', quantity: 2500, pickup: 'Nashik, Maharashtra', destination: 'Vashi APMC Market, Mumbai' }
  })

  useEffect(() => {
    if (!leafFile) { setLeafPreview(''); return undefined }
    const url = URL.createObjectURL(leafFile)
    setLeafPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [leafFile])

  const update = (module, key, value) => setForms((prev) => ({ ...prev, [module]: { ...prev[module], [key]: value } }))
  const current = forms[active]

  const run = async (event) => {
    if (event) event.preventDefault()
    if (!isAuthenticated) return
    setLoading(true)
    setError('')
    try {
      let data
      if (active === 'crop_rec') data = await api.ai.cropRecommendation(current)
      if (active === 'harvest') data = await api.ai.harvestPrediction(current)
      if (active === 'route') data = await api.ai.routeOptimization({ ...current, load: Number(current.load) })
      if (active === 'matching') data = await api.ai.transportMatching({ ...current, quantity: Number(current.quantity) })
      if (active === 'disease') {
        if (!leafFile) throw new Error('Choose a clear leaf photo first.')
        data = await api.ai.cropDiseaseDetection(leafFile, current.crop_type)
      }
      setResults((prev) => ({ ...prev, [active]: data }))
    } catch (err) {
      if (err instanceof OfflineQueuedError) {
        toast.success(t('common.offlineQueued'))
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const result = results[active]
  const activeModule = modules.find((m) => m.id === active)

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <PageHeader
        eyebrow="Transparent AI"
        title={t('ai.title')}
        subtitle={t('ai.subtitle')}
        actions={<Link to="/on-device-ai" className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 dark:border-emerald-800 px-4 py-2 text-xs font-bold text-emerald-800 dark:text-emerald-300"><Cpu size={15} /> {t('nav.model')}</Link>}
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2 mb-6">
        {modules.map((module) => (
          <button
            key={module.id}
            onClick={() => { setActive(module.id); setError('') }}
            className={`text-left rounded-2xl border p-3 transition ${active === module.id ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 shadow-sm' : 'border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] hover:border-emerald-300'}`}
            aria-pressed={active === module.id}
          >
            <div className="flex items-center justify-between">
              <module.icon size={18} className={active === module.id ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-500'} />
              <span className={`text-[9px] font-bold uppercase tracking-wide rounded-full px-1.5 py-0.5 ${module.id === 'disease' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>{module.id === 'disease' ? 'ML' : module.badge === 'OSRM' ? 'LIVE' : 'RULES'}</span>
            </div>
            <p className="text-xs font-bold mt-2 text-gray-900 dark:text-white">{t(module.titleKey)}</p>
            <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">{t(module.descKey)}</p>
          </button>
        ))}
      </div>

      {!isAuthenticated && (
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 p-4 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-emerald-900 dark:text-emerald-200">Sign in to run authenticated analyses. No results are simulated for anonymous users.</p>
          <Link to="/login" className="rounded-xl bg-emerald-700 hover:bg-emerald-800 px-4 py-2 text-xs font-bold text-white text-center">Sign in</Link>
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-6">
        <form onSubmit={run} className="lg:col-span-2 rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-5 h-fit">
          <div className="flex items-center gap-2 mb-3">
            <activeModule.icon size={18} className="text-emerald-600" />
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">{t(activeModule.titleKey)}</h2>
          </div>

          {active === 'crop_rec' && (
            <div className="space-y-3">
              <Field label="Soil type"><select className={inputClass} value={current.soil_type} onChange={(e) => update(active, 'soil_type', e.target.value)}><option>Black</option><option>Loamy</option><option>Clay</option><option>Sandy</option><option>Red</option><option>Alluvial</option></select></Field>
              <div className="grid grid-cols-3 gap-2">
                <Field label="N (kg/ha)"><input type="number" className={inputClass} value={current.nitrogen} onChange={(e) => update(active, 'nitrogen', e.target.value)} /></Field>
                <Field label="P (kg/ha)"><input type="number" className={inputClass} value={current.phosphorus} onChange={(e) => update(active, 'phosphorus', e.target.value)} /></Field>
                <Field label="K (kg/ha)"><input type="number" className={inputClass} value={current.potassium} onChange={(e) => update(active, 'potassium', e.target.value)} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label="pH"><input type="number" step="0.1" className={inputClass} value={current.ph} onChange={(e) => update(active, 'ph', e.target.value)} /></Field>
                <Field label="Temperature (°C)"><input type="number" className={inputClass} value={current.temperature} onChange={(e) => update(active, 'temperature', e.target.value)} /></Field>
                <Field label="Humidity (%)"><input type="number" className={inputClass} value={current.humidity} onChange={(e) => update(active, 'humidity', e.target.value)} /></Field>
                <Field label="Rainfall (mm)"><input type="number" className={inputClass} value={current.rainfall} onChange={(e) => update(active, 'rainfall', e.target.value)} /></Field>
              </div>
            </div>
          )}

          {active === 'harvest' && (
            <div className="space-y-3">
              <Field label="Crop"><input className={inputClass} value={current.crop_name} onChange={(e) => update(active, 'crop_name', e.target.value)} /></Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Area (acres)"><input type="number" step="0.1" className={inputClass} value={current.acreage} onChange={(e) => update(active, 'acreage', e.target.value)} /></Field>
                <Field label="Planting date"><input type="date" className={inputClass} value={current.planting_date} onChange={(e) => update(active, 'planting_date', e.target.value)} /></Field>
              </div>
              <Field label="Location"><input className={inputClass} value={current.location} onChange={(e) => update(active, 'location', e.target.value)} /></Field>
              <Field label="Soil type"><input className={inputClass} value={current.soil_type} onChange={(e) => update(active, 'soil_type', e.target.value)} /></Field>
            </div>
          )}

          {active === 'disease' && (
            <div className="space-y-3">
              <Field label="Declared crop">
                <select className={inputClass} value={current.crop_type} onChange={(e) => update(active, 'crop_type', e.target.value)}>
                  <option>Tomato</option><option>Potato</option><option>Pepper</option><option>Apple</option><option>Grape</option><option>Corn</option>
                </select>
              </Field>
              <div className="rounded-2xl border-2 border-dashed border-gray-300 dark:border-[#274a3d] p-4 text-center">
                {leafPreview ? (
                  <img src={leafPreview} alt="Selected leaf preview" className="mx-auto max-h-48 rounded-xl object-contain" />
                ) : (
                  <div className="py-6 text-gray-400"><Upload size={28} className="mx-auto mb-2" /><p className="text-xs">JPG, PNG or WEBP · max 10 MB</p></div>
                )}
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => setLeafFile(e.target.files?.[0] || null)} />
                <button type="button" onClick={() => fileRef.current?.click()} className="mt-3 rounded-xl border border-gray-200 dark:border-[#274a3d] px-3 py-1.5 text-xs font-semibold">{leafFile ? 'Choose another photo' : t('farmer.uploadLeaf')}</button>
              </div>
              <p className="text-[10px] text-gray-400 flex gap-1.5"><Info size={12} className="shrink-0 mt-0.5" /> The image is sent to the server, classified, and deleted. Inference runs on server CPU.</p>
            </div>
          )}

          {active === 'route' && (
            <div className="space-y-3">
              <Field label={t('farmer.pickup')}><div className="flex gap-2"><input className={inputClass} value={current.pickup} onChange={(e) => update(active, 'pickup', e.target.value)} /><MapPin size={16} className="mt-2 text-gray-400 shrink-0" /></div></Field>
              <Field label={t('farmer.destination')}><input className={inputClass} value={current.destination} onChange={(e) => update(active, 'destination', e.target.value)} /></Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label={t('farmer.vehicleType')}><select className={inputClass} value={current.vehicle_type} onChange={(e) => update(active, 'vehicle_type', e.target.value)}><option>Truck (10-Ton)</option><option>Tempo (3-Ton)</option><option>Mini Truck (2.5-Ton)</option><option>Trailer (20-Ton)</option></select></Field>
                <Field label="Load (kg)"><input type="number" className={inputClass} value={current.load} onChange={(e) => update(active, 'load', e.target.value)} /></Field>
              </div>
            </div>
          )}

          {active === 'matching' && (
            <div className="space-y-3">
              <Field label="Crop"><input className={inputClass} value={current.crop_type} onChange={(e) => update(active, 'crop_type', e.target.value)} /></Field>
              <Field label="Quantity (kg)"><input type="number" className={inputClass} value={current.quantity} onChange={(e) => update(active, 'quantity', e.target.value)} /></Field>
              <Field label={t('farmer.pickup')}><input className={inputClass} value={current.pickup} onChange={(e) => update(active, 'pickup', e.target.value)} /></Field>
              <Field label={t('farmer.destination')}><input className={inputClass} value={current.destination} onChange={(e) => update(active, 'destination', e.target.value)} /></Field>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !isAuthenticated || (active === 'disease' && !leafFile)}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold px-4 py-2.5 disabled:opacity-40"
          >
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <ArrowRight size={16} />} {t('ai.run')}
          </button>
        </form>

        <div className="lg:col-span-3 rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-5">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">{t('ai.results')}</h2>
            {result && <SpeakButton text={JSON.stringify(result).slice(0, 800)} />}
          </div>
          {error && <ErrorBlock message={error} />}
          {!error && !result && (
            <div className="py-16 text-center text-gray-400">
              <activeModule.icon size={32} className="mx-auto mb-2" />
              <p className="text-xs">Results appear here after a successful run. No placeholder predictions.</p>
            </div>
          )}
          {!error && result && active === 'crop_rec' && <CropResult result={result} />}
          {!error && result && active === 'harvest' && <HarvestResult result={result} />}
          {!error && result && active === 'disease' && <DiseaseResult result={result} />}
          {!error && result && active === 'route' && <RouteResult result={result} />}
          {!error && result && active === 'matching' && <MatchingResult result={result} />}
        </div>
      </div>

      {active === 'disease' && (
        <div className="mt-5 flex flex-wrap gap-3 text-[11px] text-gray-500">
          <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-600" /> Real ONNX model</span>
          <span className="inline-flex items-center gap-1.5"><ShieldCheck size={13} className="text-emerald-600" /> Image deleted after inference</span>
          <span className="inline-flex items-center gap-1.5"><Gauge size={13} className="text-emerald-600" /> CPU latency measured, not advertised</span>
        </div>
      )}
    </div>
  )
}
