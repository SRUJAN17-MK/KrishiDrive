import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Truck, Navigation, IndianRupee, MapPin, ArrowRight, ShieldCheck,
  Check, X, Calendar, Route as RouteIcon, Star, Info
} from 'lucide-react'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { PageHeader, StatCard, LoadingBlock, StatusBadge } from '../components/ui'
import { formatINR } from '../utils/currency'
import toast from 'react-hot-toast'

export default function DriverDashboard() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [trips, setTrips] = useState([])
  const [jobs, setJobs] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    const [tripRes, requestRes, vehicleRes] = await Promise.allSettled([
      api.trips.list(),
      api.transport.requests(),
      api.vehicles.list()
    ])
    if (tripRes.status === 'fulfilled') setTrips(tripRes.value || [])
    else setError(tripRes.reason?.message || 'Could not load trips')
    if (requestRes.status === 'fulfilled') setJobs((requestRes.value || []).filter((request) => request.status === 'pending'))
    if (vehicleRes.status === 'fulfilled') setVehicles(vehicleRes.value || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const myVehicle = vehicles.find((vehicle) => vehicle.driver === user?.username)
  const activeTrips = trips.filter((trip) => ['scheduled', 'in_transit'].includes(trip.status))
  const completedTrips = trips.filter((trip) => trip.status === 'completed')
  const earnings = useMemo(() => completedTrips.reduce((sum, trip) => sum + Number(trip.earnings || 0), 0), [completedTrips])
  const distance = trips.reduce((sum, trip) => sum + Number(trip.distance_km || 0), 0)

  const accept = async (job) => {
    if (!myVehicle) return toast.error('Add or claim a vehicle before accepting jobs.')
    try {
      await api.transport.accept({ request_id: job.id, vehicle_id: myVehicle.id, driver_username: user.username })
      toast.success('Job accepted. A trip has been created.')
      await load()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const pass = async (job) => {
    try {
      await api.transport.reject({ request_id: job.id })
      toast.success('Job passed')
      setJobs((prev) => prev.filter((item) => item.id !== job.id))
    } catch (err) {
      toast.error(err.message)
    }
  }

  if (loading) return <LoadingBlock label="Loading driver data…" />

  return (
    <div>
      <PageHeader
        eyebrow={`${t('driver.hello')}, ${user?.full_name || user?.username || ''}`}
        title={t('driver.overview')}
        subtitle="Live jobs and trips from the database. Earnings count only completed trips; nothing is annualised or projected."
        actions={
          <>
            <Link to="/driver/jobs" className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-3 py-2 text-xs font-bold text-white"><Truck size={15} /> {t('driver.availableJobs')}</Link>
            <Link to="/driver/routes" className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-[#274a3d] bg-white dark:bg-[#12211c] px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-200"><RouteIcon size={15} /> {t('driver.routePlanner')}</Link>
          </>
        }
      />

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 mb-4">{error} <button onClick={load} className="font-bold underline">{t('common.retry')}</button></div>}

      <div className="rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-4 mb-4 flex flex-wrap items-center gap-4">
        <span className="w-11 h-11 rounded-xl bg-emerald-700 text-white grid place-items-center text-sm font-bold">{(user?.full_name || user?.username || 'D').slice(0, 1).toUpperCase()}</span>
        <div className="flex-1 min-w-[200px]">
          <p className="text-sm font-bold text-gray-900 dark:text-white">{user?.full_name || user?.username}</p>
          <p className="text-[11px] text-gray-500">
            {myVehicle ? `${myVehicle.type} · ${myVehicle.number}` : 'No vehicle linked to this account'}
            {user?.rating ? ` · ${user.rating}★` : ' · not rated'}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${user?.verified ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'}`}>
          <ShieldCheck size={12} /> {user?.verified ? t('driver.verified') : t('driver.notVerified')}
        </span>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
        <StatCard label={t('driver.availableJobs')} value={jobs.length} hint="Pending requests" icon={Truck} tone="amber" />
        <StatCard label={t('driver.activeTrips')} value={activeTrips.length} hint="Scheduled or in transit" icon={Navigation} tone="blue" />
        <StatCard label={t('driver.completedTrips')} value={completedTrips.length} hint={`${formatINR(earnings)} recorded earnings`} icon={IndianRupee} />
        <StatCard label="Logged distance" value={`${distance.toLocaleString()} km`} hint="Sum of trip distance fields" icon={MapPin} tone="indigo" />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <section className="lg:col-span-2 rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">{t('driver.availableJobs')}</h2>
            <Link to="/driver/jobs" className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">{t('common.viewAll')} ({jobs.length})</Link>
          </div>
          {jobs.length === 0 ? (
            <p className="text-xs text-gray-500 py-8 text-center">{t('driver.noJobs')}</p>
          ) : (
            <div className="space-y-3">
              {jobs.slice(0, 3).map((job) => (
                <div key={job.id} className="rounded-xl border border-gray-100 dark:border-[#274a3d] bg-gray-50 dark:bg-[#162a23] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">{job.crop} · {Number(job.quantity).toLocaleString()} {job.unit || 'kg'}</p>
                      <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-0.5">{job.pickup} → {job.destination}</p>
                      <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1"><Calendar size={11} /> {job.pickup_date || '—'} · {job.preferred_time || '—'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400">{job.estimated_cost != null ? formatINR(job.estimated_cost) : t('common.unavailable')}</p>
                      <p className="text-[9px] text-gray-400">quantity-based quote</p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-2">
                    <button onClick={() => pass(job)} className="rounded-lg bg-gray-200 dark:bg-gray-800 px-2.5 py-1.5 text-[11px] font-bold text-gray-600 dark:text-gray-300 inline-flex items-center gap-1"><X size={12} /> {t('driver.passJob')}</button>
                    <button onClick={() => accept(job)} className="rounded-lg bg-emerald-700 hover:bg-emerald-800 px-2.5 py-1.5 text-[11px] font-bold text-white inline-flex items-center gap-1"><Check size={12} /> {t('driver.acceptJob')}</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!myVehicle && <p className="mt-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-2 text-[10px] text-amber-800 dark:text-amber-300 flex gap-1.5"><Info size={12} className="shrink-0" /> Add a vehicle in your profile before accepting a job. The app will not invent a vehicle.</p>}
        </section>

        <div className="space-y-4">
          <section className="rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-5">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><Navigation size={16} className="text-blue-600" /> {t('driver.activeTrips')}</h2>
            {activeTrips.length === 0 ? <p className="text-xs text-gray-500 py-4">{t('driver.noJobs')}</p> : (
              activeTrips.slice(0, 2).map((trip) => (
                <div key={trip.id} className="rounded-xl border border-blue-100 dark:border-[#274a3d] bg-blue-50/40 dark:bg-[#152a22] p-3 mb-2">
                  <div className="flex items-center justify-between gap-2"><p className="text-[11px] font-bold">Trip {trip.id}</p><StatusBadge status={trip.status} /></div>
                  <p className="text-[11px] mt-1">{trip.pickup} → {trip.destination}</p>
                  <p className="text-[10px] text-gray-500 mt-1">{trip.distance_km ?? '—'} km · ETA {trip.eta_hours ?? '—'} h</p>
                  <Link to="/driver/trips" className="mt-2 block text-center rounded-lg bg-blue-600 hover:bg-blue-700 py-1.5 text-[11px] font-bold text-white">{t('driver.tripStatus')}</Link>
                </div>
              ))
            )}
          </section>

          <section className="rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-5">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2"><RouteIcon size={16} className="text-emerald-600" /> {t('driver.routePlanner')}</h2>
            <p className="text-[11px] text-gray-500 leading-relaxed">Real OSRM road routing with a labelled Haversine fallback. Fuel, toll and CO₂ numbers are deterministic estimates, not NPU output.</p>
            <Link to="/driver/routes" className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-3 py-2 text-xs font-bold text-white">{t('driver.getRoute')} <ArrowRight size={13} /></Link>
          </section>

          <section className="rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-5">
            <p className="text-[10px] uppercase font-bold text-gray-400">Profile signals</p>
            <p className="mt-2 text-xs flex items-center gap-1.5"><Star size={13} className="text-amber-500" /> Rating: <strong>{user?.rating ?? 'Not rated'}</strong></p>
            <p className="mt-1 text-xs">Trips completed: <strong>{user?.trips_completed ?? completedTrips.length}</strong></p>
            <p className="mt-1 text-[10px] text-gray-400">Only fields present on your account are shown; missing values are not filled with demo numbers.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
