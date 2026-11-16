import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Truck, Plus, X, MapPin, Brain, Trash2, Calendar, Clock,
  ShieldCheck, Star, AlertCircle, RefreshCw, CheckCircle2,
  Route as RouteIcon
} from 'lucide-react'
import { api, OfflineQueuedError } from '../services/api'
import { useLanguage } from '../context/LanguageContext'
import { PageHeader, LoadingBlock, EmptyState, StatusBadge } from '../components/ui'
import { formatINR } from '../utils/currency'
import toast from 'react-hot-toast'

const crops = ['Tomato', 'Wheat', 'Rice', 'Grapes', 'Onion', 'Potato', 'Corn', 'Sugarcane', 'Cotton', 'Other produce']
const vehicles = ['Truck (10-Ton)', 'Tempo (3-Ton)', 'Mini Truck (2.5-Ton)', 'Trailer (20-Ton)']

const initialForm = {
  crop: 'Tomato',
  quantity: '5000',
  unit: 'kg',
  pickup: 'Nashik, Maharashtra',
  destination: 'Vashi APMC Market, Mumbai',
  vehicle_type: 'Truck (10-Ton)',
  pickup_date: new Date().toISOString().split('T')[0],
  preferred_time: '06:00 AM'
}

const inputClass = 'w-full rounded-xl border border-gray-200 dark:border-[#1E293B] bg-gray-50 dark:bg-[#07172F] px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF9800]'

function Field({ label, children }) {
  return <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">{label}<div className="mt-1">{children}</div></label>
}

export default function FarmerTransport() {
  const { t } = useLanguage()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [filter, setFilter] = useState('all')
  const [matchResult, setMatchResult] = useState(null)
  const [matchLoading, setMatchLoading] = useState(false)
  const [activeReq, setActiveReq] = useState(null)
  const [bookingKey, setBookingKey] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      setRequests(await api.transport.requests())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      const created = await api.transport.create({ ...form, quantity: Number(form.quantity) })
      setRequests((prev) => [created, ...prev])
      setShowForm(false)
      setForm(initialForm)
      toast.success('Transport request created')
    } catch (err) {
      if (err instanceof OfflineQueuedError) {
        toast.success(t('common.offlineQueued'))
        setShowForm(false)
      } else {
        toast.error(err.message)
      }
    } finally {
      setSaving(false)
    }
  }

  const remove = async (request) => {
    if (!window.confirm(`Cancel the ${request.crop} request?`)) return
    try {
      await api.transport.delete(request.id)
      setRequests((prev) => prev.filter((item) => item.id !== request.id))
      toast.success('Request cancelled')
    } catch (err) {
      toast.error(err.message)
    }
  }

  const findMatches = async (request) => {
    setActiveReq(request)
    setMatchResult(null)
    setMatchLoading(true)
    try {
      const result = await api.ai.transportMatching({
        crop_type: request.crop,
        quantity: request.quantity,
        pickup: request.pickup,
        destination: request.destination
      })
      setMatchResult(result)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setMatchLoading(false)
    }
  }

  const book = async (match) => {
    if (!match.driver) return
    const key = match.vehicle.id
    setBookingKey(key)
    try {
      await api.transport.accept({
        request_id: activeReq.id,
        vehicle_id: match.vehicle.id,
        driver_username: match.driver.username
      })
      toast.success('Hauler booked and trip scheduled')
      setMatchResult(null)
      setActiveReq(null)
      await load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBookingKey('')
    }
  }

  const filtered = filter === 'all' ? requests : requests.filter((request) => request.status === filter)

  return (
    <div>
      <PageHeader
        eyebrow="Dispatch"
        title={t('nav.transport')}
        subtitle="Book a real transport request, then compare available haulers. Matching is deterministic scoring, not AI inference."
        actions={<button onClick={() => setShowForm(true)} className="btn-primary inline-flex items-center gap-2 text-xs py-2 px-4"><Plus size={15} /> New request</button>}
      />

      <div className="flex flex-wrap gap-2 mb-5">
        {[
          { id: 'all', label: 'All' },
          { id: 'pending', label: t('status.pending') },
          { id: 'matched', label: t('status.matched') },
          { id: 'in_transit', label: t('status.in_transit') },
          { id: 'delivered', label: t('status.delivered') }
        ].map((tab) => (
          <button key={tab.id} onClick={() => setFilter(tab.id)} className={`rounded-xl px-3 py-1.5 text-xs font-bold border transition ${filter === tab.id ? 'bg-[#FF9800] text-[#07172F] border-[#FF9800] shadow-sm' : 'bg-white dark:bg-[#111827] border-gray-200 dark:border-[#1E293B] text-gray-600 dark:text-[#A7B4C5] hover:border-[#0785E8]'}`}>{tab.label}</button>
        ))}
      </div>

      {loading && <LoadingBlock />}
      {error && <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-4 text-xs text-red-700 dark:text-red-400 mb-4">{error} <button onClick={load} className="font-bold underline">{t('common.retry')}</button></div>}

      {!loading && filtered.length === 0 && (
        <EmptyState title={t('farmer.noRequests')} body="Create a request with pickup, destination and quantity. No fake hauler availability is shown." action={<button onClick={() => setShowForm(true)} className="btn-primary inline-flex items-center gap-2 text-xs py-2 px-3"><Plus size={14} /> New request</button>} />
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        {filtered.map((request) => (
          <article key={request.id} className="rounded-2xl border border-gray-200 dark:border-[#1E293B] bg-white dark:bg-[#111827] p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-extrabold text-gray-900 dark:text-[#F8FAFC]">{request.crop}</h2>
                  <span className="text-[10px] text-gray-400 dark:text-[#A7B4C5]">{request.id}</span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-[#A7B4C5] mt-1 flex items-start gap-1"><MapPin size={12} className="mt-0.5 shrink-0 text-[#0785E8]" /> {request.pickup} → {request.destination}</p>
              </div>
              <StatusBadge status={request.status} />
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3 text-[11px]">
              <div className="rounded-lg bg-gray-50 dark:bg-[#07172F] p-2 border border-gray-100 dark:border-[#1E293B]/50"><span className="text-gray-400 dark:text-[#A7B4C5]">Quantity</span><p className="font-bold text-gray-900 dark:text-white">{Number(request.quantity).toLocaleString()} {request.unit || 'kg'}</p></div>
              <div className="rounded-lg bg-gray-50 dark:bg-[#07172F] p-2 border border-gray-100 dark:border-[#1E293B]/50"><span className="text-gray-400 dark:text-[#A7B4C5]">Pickup date</span><p className="font-bold text-gray-900 dark:text-white">{request.pickup_date || '—'}</p></div>
              <div className="rounded-lg bg-gray-50 dark:bg-[#07172F] p-2 border border-gray-100 dark:border-[#1E293B]/50"><span className="text-gray-400 dark:text-[#A7B4C5]">Est. cost</span><p className="font-bold text-[#FF9800]">{request.estimated_cost != null ? formatINR(request.estimated_cost) : t('common.unavailable')}</p></div>
            </div>
            <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-[#1E293B]">
              <div className="flex items-center gap-2">
                {request.status === 'pending' && (
                  <button onClick={() => findMatches(request)} disabled={matchLoading && activeReq?.id === request.id} className="inline-flex items-center gap-1.5 rounded-lg bg-[#064FAE]/15 text-[#064FAE] dark:text-[#0785E8] hover:bg-[#064FAE]/25 px-2.5 py-1.5 text-[11px] font-bold disabled:opacity-50">
                    {matchLoading && activeReq?.id === request.id ? <RefreshCw size={13} className="animate-spin" /> : <Brain size={13} />} {t('farmer.findTrucks')}
                  </button>
                )}
                <Link
                  to={`/driver/routes?pickup=${encodeURIComponent(request.pickup)}&destination=${encodeURIComponent(request.destination)}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-[#1E293B] px-2 py-1.5 text-[11px] font-semibold text-gray-600 dark:text-[#A7B4C5] hover:border-[#0785E8] hover:text-[#0785E8] transition"
                  title="View Route Map"
                >
                  <RouteIcon size={12} className="text-[#0785E8]" /> Route
                </Link>
                {request.driver && <span className="text-[10px] text-gray-500 dark:text-[#A7B4C5] inline-flex items-center gap-1"><Truck size={12} className="text-[#0785E8]" /> {request.driver}</span>}
              </div>
              <button onClick={() => remove(request)} aria-label={`Cancel ${request.id}`} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg"><Trash2 size={14} /></button>
            </div>
            <p className="text-[9px] text-gray-400 dark:text-[#A7B4C5] mt-2">Cost is a quote formula based on quantity, not a live freight rate. Confirm with the driver.</p>
          </article>
        ))}
      </div>

      {activeReq && (
        <section className="mt-6 rounded-2xl border border-gray-200 dark:border-[#1E293B] bg-white dark:bg-[#111827] p-5">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="text-sm font-bold flex items-center gap-2 text-gray-900 dark:text-[#F8FAFC]"><Brain size={16} className="text-[#0785E8]" /> {t('farmer.matches')} · {activeReq.crop}</h2>
            <button onClick={() => { setActiveReq(null); setMatchResult(null) }} className="p-1.5 text-gray-400 hover:text-white" aria-label={t('common.close')}><X size={16} /></button>
          </div>
          {matchLoading && <LoadingBlock label="Scoring available vehicles…" />}
          {matchResult && (
            <>
              <div className="flex flex-wrap gap-2 text-[10px] text-gray-500 dark:text-[#A7B4C5] mb-3">
                <span>Base distance: {matchResult.estimated_base_distance_km ?? '—'} km</span>
                <span>·</span>
                <span>{matchResult.distance_note}</span>
              </div>
              {matchResult.matches.length === 0 && <p className="text-xs text-gray-500 dark:text-[#A7B4C5]">{t('farmer.noMatches')}</p>}
              <div className="grid md:grid-cols-2 gap-3">
                {matchResult.matches.map((match) => (
                  <div key={match.vehicle.id} className="rounded-xl border border-gray-200 dark:border-[#1E293B] bg-gray-50/50 dark:bg-[#07172F]/50 p-3">
                    <div className="flex justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold flex items-center gap-1.5 text-gray-900 dark:text-white"><Truck size={14} className="text-[#0785E8]" /> {match.vehicle.type} · {match.vehicle.number}</p>
                        <p className="text-[10px] text-gray-500 dark:text-[#A7B4C5] mt-0.5">{match.driver ? `${match.driver.full_name} · ${match.driver.rating || 'N/A'}★ · ${match.driver.trips_completed || 0} trips` : 'No assigned driver'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-extrabold text-[#FF9800]">{match.match_score}<span className="text-[10px] text-gray-400 dark:text-[#A7B4C5]">/99</span></p>
                        <p className="text-[10px] font-semibold text-gray-900 dark:text-white">{match.estimated_cost_formatted}</p>
                      </div>
                    </div>
                    <ul className="mt-2 space-y-0.5 text-[10px] text-gray-600 dark:text-[#A7B4C5]">
                      {match.reasons.map((reason) => <li key={reason}>• {reason}</li>)}
                    </ul>
                    {match.driver?.verified && <p className="mt-1 text-[10px] text-[#0785E8] inline-flex items-center gap-1"><ShieldCheck size={11} /> Driver verified</p>}
                    <button
                      onClick={() => book(match)}
                      disabled={!match.driver || bookingKey === match.vehicle.id}
                      className="mt-2 w-full btn-primary disabled:opacity-40 py-1.5 text-[11px] inline-flex items-center justify-center gap-1.5"
                    >
                      {bookingKey === match.vehicle.id ? <RefreshCw size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} {match.driver ? t('farmer.confirmBooking') : 'Driver required'}
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 dark:text-[#A7B4C5] mt-3">{matchResult.engine_info.note} Scores are indicative and not a safety certification.</p>
            </>
          )}
        </section>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm grid place-items-center p-4 overflow-y-auto" role="dialog" aria-modal="true" aria-label="New transport request">
          <form onSubmit={submit} className="w-full max-w-xl rounded-2xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#1E293B] p-5 shadow-2xl my-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-900 dark:text-[#F8FAFC]">{t('farmer.bookTransport')}</h2>
              <button type="button" onClick={() => setShowForm(false)} aria-label={t('common.close')} className="p-1.5 text-gray-400 hover:text-white"><X size={17} /></button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label={t('common.crop')}><select className={inputClass} value={form.crop} onChange={(e) => setForm({ ...form, crop: e.target.value })}>{crops.map((crop) => <option key={crop}>{crop}</option>)}</select></Field>
              <Field label={`${t('common.quantity')} (kg)`}><input required type="number" min="1" className={inputClass} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></Field>
              <Field label={t('farmer.pickup')}><input required maxLength={120} className={inputClass} value={form.pickup} onChange={(e) => setForm({ ...form, pickup: e.target.value })} /></Field>
              <Field label={t('farmer.destination')}><input required maxLength={120} className={inputClass} value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} /></Field>
              <Field label={t('farmer.vehicleType')}><select className={inputClass} value={form.vehicle_type} onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })}>{vehicles.map((vehicle) => <option key={vehicle}>{vehicle}</option>)}</select></Field>
              <Field label={t('farmer.pickupDate')}><input type="date" className={inputClass} value={form.pickup_date} onChange={(e) => setForm({ ...form, pickup_date: e.target.value })} /></Field>
            </div>
            <p className="mt-3 text-[10px] text-gray-400 dark:text-[#A7B4C5] flex gap-1.5"><AlertCircle size={12} className="shrink-0 mt-0.5" /> Estimated cost is a quantity-based quote, not a live freight rate. A driver must accept before a trip exists.</p>
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-gray-200 dark:border-[#1E293B] px-4 py-2 text-xs font-semibold text-gray-700 dark:text-[#A7B4C5] hover:bg-gray-100 dark:hover:bg-[#1E293B]">{t('common.cancel')}</button>
              <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50 px-4 py-2 text-xs">{saving ? t('common.loading') : t('common.submit')}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
