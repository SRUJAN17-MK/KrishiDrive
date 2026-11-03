import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Sprout, Plus, X, Brain, Calendar, MapPin, Package,
  Trash2, Edit3, TrendingUp, CheckCircle2, AlertCircle, Leaf, ArrowRight
} from 'lucide-react'
import { api } from '../services/api'
import { useLanguage } from '../context/LanguageContext'
import { PageHeader, LoadingBlock, EmptyState, StatusBadge } from '../components/ui'
import { formatINR } from '../utils/currency'
import toast from 'react-hot-toast'

const emptyForm = {
  name: 'Tomato',
  location: 'Nashik, Maharashtra',
  acreage: '5',
  planting_date: new Date().toISOString().split('T')[0],
  expected_harvest: '',
  expected_qty: '8000',
  unit: 'kg',
  status: 'growing',
  soil_type: 'Black',
  estimated_rate_kg: '28'
}

function Field({ label, children }) {
  return (
    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  )
}

const inputClass = 'w-full rounded-xl border border-gray-200 dark:border-[#274a3d] bg-gray-50 dark:bg-[#162a23] px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500'

export default function FarmerCrops() {
  const { t } = useLanguage()
  const [crops, setCrops] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState(null)
  const [aiError, setAiError] = useState('')
  const [form, setForm] = useState(emptyForm)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      setCrops(await api.crops.list())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const totals = useMemo(() => ({
    acreage: crops.reduce((sum, crop) => sum + Number(crop.acreage || 0), 0),
    quantity: crops.reduce((sum, crop) => sum + Number(crop.expected_qty || 0), 0),
    value: crops.reduce((sum, crop) => sum + Number(crop.expected_qty || 0) * Number(crop.estimated_rate_kg || 0), 0)
  }), [crops])

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowForm(true) }
  const openEdit = (crop) => {
    setEditing(crop)
    setForm({
      name: crop.name || '',
      location: crop.location || '',
      acreage: String(crop.acreage ?? ''),
      planting_date: crop.planting_date || '',
      expected_harvest: crop.expected_harvest || '',
      expected_qty: String(crop.expected_qty ?? ''),
      unit: crop.unit || 'kg',
      status: crop.status || 'growing',
      soil_type: crop.soil_type || 'Loamy',
      estimated_rate_kg: String(crop.estimated_rate_kg ?? '')
    })
    setShowForm(true)
  }

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    const payload = {
      ...form,
      acreage: Number(form.acreage),
      expected_qty: Number(form.expected_qty),
      estimated_rate_kg: Number(form.estimated_rate_kg || 0)
    }
    try {
      if (editing) await api.crops.update(editing.id, payload)
      else await api.crops.create(payload)
      toast.success(editing ? 'Crop updated' : 'Crop added')
      setShowForm(false)
      await load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (crop) => {
    if (!window.confirm(`Delete ${crop.name}? This cannot be undone.`)) return
    try {
      await api.crops.delete(crop.id)
      toast.success('Crop deleted')
      await load()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const runForecast = async (crop) => {
    setAiLoading(true)
    setAiResult(null)
    setAiError('')
    try {
      const result = await api.ai.harvestPrediction({
        crop_name: crop.name,
        acreage: crop.acreage,
        planting_date: crop.planting_date,
        soil_type: crop.soil_type,
        location: crop.location
      })
      setAiResult(result)
    } catch (err) {
      setAiError(err.message)
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Crop records"
        title={t('nav.crops')}
        subtitle="Track area, expected quantity and harvest dates. Values are your own records plus an explicitly rule-based estimate."
        actions={
          <>
            <Link to="/ai-lab" className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 dark:border-emerald-800 px-3 py-2 text-xs font-bold text-emerald-800 dark:text-emerald-300"><Leaf size={15} /> {t('farmer.diseaseDetect')}</Link>
            <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-3 py-2 text-xs font-bold text-white"><Plus size={15} /> {t('farmer.addCrop')}</button>
          </>
        }
      />

      <div className="grid sm:grid-cols-3 gap-3 mb-5">
        <div className="rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-4"><p className="text-[10px] uppercase font-bold text-gray-400">Crops</p><p className="text-2xl font-extrabold">{crops.length}</p></div>
        <div className="rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-4"><p className="text-[10px] uppercase font-bold text-gray-400">Total area</p><p className="text-2xl font-extrabold">{totals.acreage.toFixed(1)} <span className="text-xs text-gray-400">{t('common.acre')}</span></p></div>
        <div className="rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-4"><p className="text-[10px] uppercase font-bold text-gray-400">Indicative value</p><p className="text-2xl font-extrabold">{formatINR(totals.value)}</p><p className="text-[10px] text-gray-400">your saved rate × expected quantity</p></div>
      </div>

      {loading && <LoadingBlock />}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 mb-4">{error} <button onClick={load} className="font-bold underline">{t('common.retry')}</button></div>}

      {!loading && crops.length === 0 && (
        <EmptyState title={t('farmer.noCrops')} action={<button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-bold text-white"><Plus size={14} /> {t('farmer.addCrop')}</button>} />
      )}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {crops.map((crop) => (
          <article key={crop.id} className="rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-base font-extrabold text-gray-900 dark:text-white">{crop.name}</h2>
                <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5"><MapPin size={11} /> {crop.location || '—'}</p>
              </div>
              <StatusBadge status={crop.status} />
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3 text-[11px]">
              <div className="rounded-lg bg-gray-50 dark:bg-[#162a23] p-2"><span className="text-gray-400">Area</span><p className="font-bold">{crop.acreage} {t('common.acre')}</p></div>
              <div className="rounded-lg bg-gray-50 dark:bg-[#162a23] p-2"><span className="text-gray-400">Expected</span><p className="font-bold">{Number(crop.expected_qty).toLocaleString()} {crop.unit}</p></div>
              <div className="rounded-lg bg-gray-50 dark:bg-[#162a23] p-2"><span className="text-gray-400">Planted</span><p className="font-bold">{crop.planting_date || '—'}</p></div>
              <div className="rounded-lg bg-gray-50 dark:bg-[#162a23] p-2"><span className="text-gray-400">Rate</span><p className="font-bold">{formatINR(crop.estimated_rate_kg)}{crop.unit ? `/${crop.unit}` : ''}</p></div>
            </div>
            <div className="flex items-center gap-1.5 mt-3">
              <button onClick={() => runForecast(crop)} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 px-2 py-1.5 text-[11px] font-bold"><TrendingUp size={13} /> {t('farmer.forecast')}</button>
              <button onClick={() => openEdit(crop)} aria-label={`Edit ${crop.name}`} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"><Edit3 size={14} /></button>
              <button onClick={() => remove(crop)} aria-label={`Delete ${crop.name}`} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"><Trash2 size={14} /></button>
            </div>
          </article>
        ))}
      </div>

      {(aiLoading || aiResult || aiError) && (
        <section className="mt-6 rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold flex items-center gap-2"><Brain size={16} className="text-emerald-600" /> {t('farmer.forecastTitle')}</h2>
            <button onClick={() => { setAiResult(null); setAiError('') }} aria-label={t('common.close')} className="p-1.5 text-gray-400"><X size={16} /></button>
          </div>
          {aiLoading && <LoadingBlock label="Estimating with rule-based agronomy…" />}
          {aiError && <p className="mt-3 text-xs text-red-600 flex gap-2"><AlertCircle size={14} /> {aiError}</p>}
          {aiResult && (
            <div className="mt-3 space-y-3">
              <div className="grid sm:grid-cols-3 gap-2">
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-3"><p className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">Estimated yield</p><p className="text-xl font-extrabold">{aiResult.predicted_yield.toLocaleString()} kg</p></div>
                <div className="rounded-xl bg-gray-50 dark:bg-[#162a23] p-3"><p className="text-[10px] uppercase font-bold text-gray-400">Harvest window</p><p className="text-xs font-bold">{aiResult.harvest_schedule.earliest_harvest_date} → {aiResult.harvest_schedule.harvest_window_close}</p></div>
                <div className="rounded-xl bg-gray-50 dark:bg-[#162a23] p-3"><p className="text-[10px] uppercase font-bold text-gray-400">Recommended vehicle</p><p className="text-xs font-bold">{aiResult.transport_logistics.recommended_vehicle}</p></div>
              </div>
              <div className="rounded-xl border border-gray-100 dark:border-[#274a3d] p-3 text-xs space-y-1">
                <p className="flex justify-between gap-3"><span className="text-gray-500">Gross revenue estimate</span><span className="font-semibold text-right">{aiResult.economic_forecast.projected_gross_revenue}</span></p>
                <p className="flex justify-between gap-3"><span className="text-gray-500">Net profit estimate</span><span className="font-semibold text-right">{aiResult.economic_forecast.estimated_net_profit}</span></p>
                <p className="flex justify-between gap-3"><span className="text-gray-500">Indicative rate</span><span className="font-semibold text-right">{aiResult.economic_forecast.reference_mandi_rate}</span></p>
              </div>
              <p className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 p-3 text-[11px] text-amber-800 dark:text-amber-300 flex gap-2"><AlertCircle size={14} className="shrink-0" /> {t('farmer.forecastNote')} {aiResult.engine_info.note}</p>
            </div>
          )}
        </section>
      )}

      <div className="mt-5 rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2"><Leaf size={15} /> Sick plant? The ONNX model checks tomato, potato and pepper leaves.</p>
        <Link to="/ai-lab" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">Open leaf check <ArrowRight size={13} /></Link>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm grid place-items-center p-4 overflow-y-auto" role="dialog" aria-modal="true" aria-label={editing ? 'Edit crop' : 'Add crop'}>
          <form onSubmit={save} className="w-full max-w-2xl rounded-2xl bg-white dark:bg-[#12211c] p-5 shadow-2xl my-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold">{editing ? `Edit ${editing.name}` : t('farmer.addCrop')}</h2>
              <button type="button" onClick={() => setShowForm(false)} aria-label={t('common.close')} className="p-1.5 rounded-lg text-gray-400"><X size={17} /></button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label={t('farmer.cropName')}><input required maxLength={100} className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
              <Field label={t('common.location')}><input className={inputClass} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></Field>
              <Field label={t('farmer.acreage')}><input required type="number" min="0.01" step="0.01" className={inputClass} value={form.acreage} onChange={(e) => setForm({ ...form, acreage: e.target.value })} /></Field>
              <Field label={t('farmer.expectedQty')}><input required type="number" min="1" className={inputClass} value={form.expected_qty} onChange={(e) => setForm({ ...form, expected_qty: e.target.value })} /></Field>
              <Field label={t('farmer.plantingDate')}><input type="date" className={inputClass} value={form.planting_date} onChange={(e) => setForm({ ...form, planting_date: e.target.value })} /></Field>
              <Field label={t('farmer.expectedHarvest')}><input type="date" className={inputClass} value={form.expected_harvest} onChange={(e) => setForm({ ...form, expected_harvest: e.target.value })} /></Field>
              <Field label={t('farmer.soilType')}><select className={inputClass} value={form.soil_type} onChange={(e) => setForm({ ...form, soil_type: e.target.value })}><option>Black</option><option>Loamy</option><option>Clay</option><option>Sandy</option><option>Red</option><option>Alluvial</option></select></Field>
              <Field label={t('farmer.indicativeRate')}><input type="number" min="0" step="0.1" className={inputClass} value={form.estimated_rate_kg} onChange={(e) => setForm({ ...form, estimated_rate_kg: e.target.value })} /></Field>
              <Field label={t('common.status')}><select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="growing">Growing</option><option value="ready">Ready</option><option value="harvested">Harvested</option><option value="failed">Failed</option></select></Field>
              <Field label={t('common.quantity') + ' unit'}><select className={inputClass} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}><option value="kg">kg</option><option value="quintal">quintal</option><option value="ton">ton</option></select></Field>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-gray-200 dark:border-[#274a3d] px-4 py-2 text-xs font-semibold">{t('common.cancel')}</button>
              <button type="submit" disabled={saving} className="rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 px-4 py-2 text-xs font-bold text-white inline-flex items-center gap-2">{saving ? t('common.loading') : <><CheckCircle2 size={14} /> {t('common.save')}</>}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
