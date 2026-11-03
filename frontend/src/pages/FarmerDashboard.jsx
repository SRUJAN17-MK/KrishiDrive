import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Sprout, Truck, Package, TrendingUp, ArrowRight, CloudSun, Droplets, Wind,
  Calendar, MapPin, Plus, Sparkles, Brain, X, User, Bell, Store, RefreshCw
} from 'lucide-react'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import OfflineBanner from '../components/OfflineBanner'
import { PageHeader, StatCard, LoadingBlock, EmptyState, StatusBadge } from '../components/ui'
import { formatINR } from '../utils/currency'
import toast from 'react-hot-toast'

function weatherIcon(condition) {
  const text = (condition || '').toLowerCase()
  if (text.includes('rain') || text.includes('drizzle') || text.includes('thunder')) return Droplets
  if (text.includes('wind')) return Wind
  return CloudSun
}

export default function FarmerDashboard() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [crops, setCrops] = useState([])
  const [requests, setRequests] = useState([])
  const [notifications, setNotifications] = useState([])
  const [weather, setWeather] = useState(null)
  const [weatherError, setWeatherError] = useState('')
  const [loading, setLoading] = useState(true)
  const [showProfile, setShowProfile] = useState(false)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    village: user?.village || '',
    state: user?.state || ''
  })

  const location = user?.village || user?.state || 'Nashik'

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      const [cropRes, requestRes, notificationRes, weatherRes] = await Promise.allSettled([
        api.crops.list(),
        api.transport.requests(),
        api.notifications.list(),
        api.weather.get(location)
      ])
      if (!active) return
      if (cropRes.status === 'fulfilled') setCrops(cropRes.value || [])
      if (requestRes.status === 'fulfilled') setRequests(requestRes.value || [])
      if (notificationRes.status === 'fulfilled') setNotifications(notificationRes.value || [])
      if (weatherRes.status === 'fulfilled') { setWeather(weatherRes.value); setWeatherError('') }
      else setWeatherError(weatherRes.reason?.message || 'Live weather unavailable')
      setLoading(false)
    }
    load()
    return () => { active = false }
  }, [location])

  const activeCrops = crops.filter((crop) => ['growing', 'ready'].includes(crop.status))
  const pending = requests.filter((request) => request.status === 'pending')
  const inTransit = requests.filter((request) => ['matched', 'in_transit'].includes(request.status))
  const indicativeValue = useMemo(
    () => activeCrops.reduce((sum, crop) => sum + (Number(crop.expected_qty) || 0) * (Number(crop.estimated_rate_kg) || 0), 0),
    [activeCrops]
  )

  const saveProfile = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      await api.auth.updateProfile(profile)
      toast.success(t('farmer.profileSaved'))
      setShowProfile(false)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const WeatherIcon = weatherIcon(weather?.current?.condition?.text)

  if (loading) return <LoadingBlock label={t('common.loading')} />

  return (
    <div>
      <PageHeader
        eyebrow={`${t('farmer.hello')}, ${user?.full_name || user?.username || ''}`}
        title={t('farmer.overview')}
        subtitle={`${new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })} · ${location}`}
        actions={
          <>
            <button onClick={() => setShowProfile(true)} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-[#274a3d] bg-white dark:bg-[#12211c] px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200"><User size={15} /> {t('common.profile')}</button>
            <Link to="/farmer/crops" className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-3 py-2 text-xs font-bold text-white"><Plus size={15} /> {t('farmer.addCrop')}</Link>
          </>
        }
      />

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
        <StatCard label={t('farmer.activeCrops')} value={activeCrops.length} hint={`${crops.length} total`} icon={Sprout} />
        <StatCard label={t('farmer.pendingTransport')} value={pending.length} hint={t('farmer.bookTransport')} icon={Truck} tone="amber" />
        <StatCard label={t('farmer.inTransit')} value={inTransit.length} hint="matched or in transit" icon={Package} tone="blue" />
        <StatCard label={t('farmer.expectedRevenue')} value={formatINR(indicativeValue)} hint="Indicative value from your saved rate, not a mandi quote" icon={TrendingUp} tone="indigo" />
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mb-5">
        <section className="lg:col-span-2 rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-5" aria-live="polite">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2"><WeatherIcon size={17} className="text-amber-500" /> {t('farmer.weather')}</h2>
            {weather?.source && <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">{weather.source} {weather.cached ? '· cached' : '· live'}</span>}
          </div>

          {weather?.available === false || weatherError ? (
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-4">
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">{t('farmer.weatherUnavailable')}</p>
              <p className="text-[10px] text-amber-700/70 dark:text-amber-400/70 mt-1">{weatherError}</p>
              <button onClick={() => api.weather.get(location).then((data) => { setWeather(data); setWeatherError('') }).catch((err) => setWeatherError(err.message))} className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-900 dark:text-amber-200"><RefreshCw size={12} /> {t('common.retry')}</button>
            </div>
          ) : weather ? (
            <>
              <div className="flex flex-wrap items-end gap-6">
                <div>
                  <p className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">{weather.current?.temperature_c ?? '—'}°C</p>
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">{weather.current?.condition?.text}</p>
                  <p className="text-[10px] text-gray-400">Feels like {weather.current?.feels_like_c ?? '—'}°C · {weather.location?.name}</p>
                </div>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div><p className="text-[10px] text-gray-400 uppercase">Humidity</p><p className="font-bold">{weather.current?.humidity_percent ?? '—'}%</p></div>
                  <div><p className="text-[10px] text-gray-400 uppercase">Rain</p><p className="font-bold">{weather.current?.rainfall_mm ?? 0} mm</p></div>
                  <div><p className="text-[10px] text-gray-400 uppercase">Wind</p><p className="font-bold">{weather.current?.wind_kmh ?? '—'} km/h</p></div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(weather.forecast || []).slice(0, 4).map((day) => (
                  <div key={day.date} className="rounded-xl bg-gray-50 dark:bg-[#162a23] p-2.5 text-center">
                    <p className="text-[10px] font-semibold text-gray-500">{new Date(`${day.date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short' })}</p>
                    <p className="text-xs font-bold mt-1">{Math.round(day.temp_max_c)}° / {Math.round(day.temp_min_c)}°</p>
                    <p className="text-[9px] text-gray-400 truncate">{day.condition?.text}</p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-3">Fetched {weather.fetched_at ? new Date(weather.fetched_at).toLocaleString() : 'just now'} · Open-Meteo forecast. Not a field sensor reading.</p>
            </>
          ) : null}
        </section>

        <section className="rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-5">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><Sparkles size={16} className="text-emerald-600" /> {t('farmer.quickActions')}</h2>
          <div className="space-y-2">
            {[
              { to: '/farmer/crops', icon: Sprout, label: t('farmer.addCrop') },
              { to: '/farmer/transport', icon: Truck, label: t('farmer.bookTransport') },
              { to: '/market-prices', icon: Store, label: t('farmer.checkPrices') },
              { to: '/ai-lab', icon: Brain, label: t('farmer.diseaseDetect') },
              { to: '/farmer/assistant', icon: Sparkles, label: t('farmer.askAssistant') }
            ].map((action) => (
              <Link key={action.to} to={action.to} className="flex items-center gap-3 rounded-xl border border-gray-100 dark:border-[#274a3d] px-3 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
                <action.icon size={16} className="text-emerald-600" /> {action.label} <ArrowRight size={13} className="ml-auto text-gray-400" />
              </Link>
            ))}
          </div>
        </section>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <section className="lg:col-span-2 rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">{t('farmer.recentCrops')}</h2>
            <Link to="/farmer/crops" className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">{t('common.viewAll')}</Link>
          </div>
          {crops.length === 0 ? (
            <EmptyState title={t('farmer.noCrops')} action={<Link to="/farmer/crops" className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-bold text-white"><Plus size={14} /> {t('farmer.addCrop')}</Link>} />
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-[#1e362e]">
              {crops.slice(0, 5).map((crop) => (
                <div key={crop.id} className="py-2.5 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 grid place-items-center"><Sprout size={15} className="text-emerald-600" /></span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{crop.name}</p>
                    <p className="text-[10px] text-gray-500 flex items-center gap-1"><MapPin size={10} /> {crop.location || '—'} · {crop.acreage} {t('common.acre')}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={crop.status} />
                    <p className="text-[10px] text-gray-400 mt-1">{Number(crop.expected_qty).toLocaleString()} kg</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="space-y-5">
          <section className="rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">{t('farmer.recentRequests')}</h2>
              <Link to="/farmer/transport" className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">{t('common.viewAll')}</Link>
            </div>
            {requests.length === 0 ? <p className="text-xs text-gray-500">{t('farmer.noRequests')}</p> : (
              <div className="space-y-2">
                {requests.slice(0, 3).map((request) => (
                  <div key={request.id} className="rounded-xl bg-gray-50 dark:bg-[#162a23] p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold truncate">{request.crop} · {Number(request.quantity).toLocaleString()} kg</p>
                      <StatusBadge status={request.status} />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1 truncate">{request.pickup} → {request.destination}</p>
                    <div className="flex justify-between mt-1 text-[10px]">
                      <span className="text-gray-400">{request.pickup_date || '—'}</span>
                      <span className="font-semibold">{request.estimated_cost != null ? formatINR(request.estimated_cost) : t('common.unavailable')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-5">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><Bell size={15} className="text-amber-500" /> {t('farmer.notifications')}</h2>
            {notifications.length === 0 ? <p className="text-xs text-gray-500">No actionable notifications.</p> : (
              <div className="space-y-2">
                {notifications.map((item) => (
                  <div key={item.id} className="rounded-xl border border-gray-100 dark:border-[#274a3d] p-2.5">
                    <p className="text-[11px] font-bold text-gray-800 dark:text-gray-100">{item.title}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{item.message}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {showProfile && (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm grid place-items-center p-4" role="dialog" aria-modal="true" aria-label={t('common.profile')}>
          <form onSubmit={saveProfile} className="w-full max-w-md rounded-2xl bg-white dark:bg-[#12211c] p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">{t('common.profile')}</h2>
              <button type="button" onClick={() => setShowProfile(false)} aria-label={t('common.close')} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"><X size={17} /></button>
            </div>
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">{t('auth.fullName')}<input value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} className="mt-1 w-full rounded-xl border border-gray-200 dark:border-[#274a3d] bg-gray-50 dark:bg-[#162a23] px-3 py-2 text-sm" /></label>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">{t('auth.phone')}<input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="mt-1 w-full rounded-xl border border-gray-200 dark:border-[#274a3d] bg-gray-50 dark:bg-[#162a23] px-3 py-2 text-sm" /></label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">{t('auth.village')}<input value={profile.village} onChange={(e) => setProfile({ ...profile, village: e.target.value })} className="mt-1 w-full rounded-xl border border-gray-200 dark:border-[#274a3d] bg-gray-50 dark:bg-[#162a23] px-3 py-2 text-sm" /></label>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">{t('auth.state')}<input value={profile.state} onChange={(e) => setProfile({ ...profile, state: e.target.value })} className="mt-1 w-full rounded-xl border border-gray-200 dark:border-[#274a3d] bg-gray-50 dark:bg-[#162a23] px-3 py-2 text-sm" /></label>
              </div>
            </div>
            <button type="submit" disabled={saving} className="mt-4 w-full rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 py-2.5 text-xs font-bold text-white">{saving ? t('common.loading') : t('common.save')}</button>
          </form>
        </div>
      )}
      <OfflineBanner />
    </div>
  )
}
