import React, { useEffect, useMemo, useState } from 'react'
import {
  Users, Sprout, Truck, TrendingUp, Search, RefreshCw, ShieldCheck,
  Check, X, Database, Cpu, CloudSun, Store, Activity
} from 'lucide-react'
import { api } from '../services/api'
import { PageHeader, LoadingBlock, StatCard } from '../components/ui'
import { formatINR } from '../utils/currency'
import toast from 'react-hot-toast'

function Avatar({ user }) {
  return (
    <span className="w-8 h-8 rounded-full bg-emerald-700 text-white grid place-items-center text-[11px] font-bold shrink-0">
      {(user?.full_name || user?.username || 'U').slice(0, 1).toUpperCase()}
    </span>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [requests, setRequests] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [model, setModel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [tab, setTab] = useState('users')

  const load = async () => {
    setLoading(true)
    setError('')
    const [statsRes, usersRes, requestsRes, vehiclesRes, modelRes] = await Promise.allSettled([
      api.admin.stats(),
      api.admin.users(),
      api.transport.requests(),
      api.vehicles.list(),
      api.ai.modelInfo()
    ])
    if (statsRes.status === 'fulfilled') setStats(statsRes.value)
    else setError(statsRes.reason?.message || 'Failed to load admin statistics')
    if (usersRes.status === 'fulfilled') setUsers(usersRes.value || [])
    if (requestsRes.status === 'fulfilled') setRequests(requestsRes.value || [])
    if (vehiclesRes.status === 'fulfilled') setVehicles(vehiclesRes.value || [])
    if (modelRes.status === 'fulfilled') setModel(modelRes.value)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const verify = async (username, current) => {
    try {
      await api.admin.verifyDriver(username, !current)
      toast.success(`Verification ${current ? 'revoked' : 'approved'} for ${username}`)
      await load()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const filteredUsers = useMemo(() => users.filter((user) => {
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    const needle = searchTerm.toLowerCase()
    const matchesSearch = !needle
      || user.full_name?.toLowerCase().includes(needle)
      || user.username?.toLowerCase().includes(needle)
      || user.email?.toLowerCase().includes(needle)
      || user.village?.toLowerCase().includes(needle)
    return matchesRole && matchesSearch
  }), [users, roleFilter, searchTerm])

  const drivers = users.filter((user) => user.role === 'driver')
  const vehicleByDriver = useMemo(() => {
    const map = new Map()
    vehicles.forEach((vehicle) => { if (vehicle.driver) map.set(vehicle.driver, vehicle) })
    return map
  }, [vehicles])

  if (loading) return <LoadingBlock label="Loading admin data…" />

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Platform analytics & governance"
        subtitle="Counts come from the SQLite database. Revenue is the sum of completed trip earnings, not a projected or fabricated figure."
        actions={<button onClick={load} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-[#274a3d] bg-white dark:bg-[#12211c] px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-200"><RefreshCw size={14} /> Refresh</button>}
      />

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 mb-4">{error}</div>}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
        <StatCard label="Total users" value={stats?.total_users ?? users.length} hint={`${stats?.farmers ?? '—'} farmers · ${stats?.drivers ?? '—'} drivers`} icon={Users} tone="blue" />
        <StatCard label="Crops registered" value={stats?.total_crops ?? '—'} hint={`${stats?.active_crops ?? '—'} active`} icon={Sprout} />
        <StatCard label="Transport requests" value={stats?.total_requests ?? '—'} hint={`${stats?.pending_requests ?? '—'} pending · ${stats?.matched_requests ?? '—'} matched`} icon={Truck} tone="amber" />
        <StatCard label="Completed-trip revenue" value={stats?.revenue?.formatted_total ?? '—'} hint={`${stats?.completed_trips ?? '—'} completed trips · ${stats?.revenue?.month || ''}`} icon={TrendingUp} tone="indigo" />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <div className="rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-900 dark:text-white"><Database size={15} className="text-emerald-600" /> Database</div>
          <p className="text-[11px] text-gray-500 mt-1">{stats?.platform_health?.database || 'SQLite'}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-900 dark:text-white"><Cpu size={15} className="text-emerald-600" /> Disease model</div>
          <p className="text-[11px] text-gray-500 mt-1">
            {model?.model?.available ? `${model.model.architecture} · ${model.runtime?.execution_provider || 'cpu'}` : 'Not loaded'}
            {model?.benchmark?.latency_ms?.inference?.avg ? ` · ${model.benchmark.latency_ms.inference.avg} ms avg (CPU)` : ''}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-900 dark:text-white"><Store size={15} className="text-emerald-600" /> External services</div>
          <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1"><CloudSun size={11} /> Open-Meteo weather · OSRM routes</p>
          <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1"><Store size={11} /> Mandi: {stats?.platform_health?.market_prices || 'not configured'}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 dark:border-[#1e362e] pb-3 mb-4">
        {[
          { id: 'users', label: 'User directory', count: users.length },
          { id: 'verification', label: 'Driver verification', count: drivers.length },
          { id: 'bookings', label: 'Freight ledger', count: requests.length }
        ].map((item) => (
          <button key={item.id} onClick={() => setTab(item.id)} className={`rounded-xl px-3 py-2 text-xs font-bold inline-flex items-center gap-2 ${tab === item.id ? 'bg-emerald-700 text-white' : 'bg-white dark:bg-[#12211c] border border-gray-200 dark:border-[#1e362e] text-gray-600 dark:text-gray-300'}`}>
            {item.label} <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${tab === item.id ? 'bg-emerald-900' : 'bg-gray-100 dark:bg-gray-800'}`}>{item.count}</span>
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <section className="rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search name, username, email, village…" className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 dark:border-[#274a3d] bg-gray-50 dark:bg-[#162a23] text-xs" />
            </div>
            <div className="flex gap-1">
              {['all', 'farmer', 'driver', 'admin'].map((role) => (
                <button key={role} onClick={() => setRoleFilter(role)} className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold capitalize ${roleFilter === role ? 'bg-emerald-700 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>{role}</button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-gray-100 dark:border-[#1e362e] text-gray-400 text-left"><th className="py-2.5 px-3">Profile</th><th className="py-2.5 px-3">Role</th><th className="py-2.5 px-3">Contact</th><th className="py-2.5 px-3">Region</th><th className="py-2.5 px-3">Joined</th></tr></thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#1e362e]">
                {filteredUsers.map((user) => (
                  <tr key={user.username}>
                    <td className="py-2.5 px-3"><div className="flex items-center gap-2"><Avatar user={user} /><div><div className="font-bold text-gray-900 dark:text-white">{user.full_name}</div><div className="text-[10px] text-gray-400">@{user.username}</div></div></div></td>
                    <td className="py-2.5 px-3"><span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[10px] font-bold uppercase">{user.role}</span></td>
                    <td className="py-2.5 px-3 text-gray-600 dark:text-gray-300">{user.email}<div className="text-[10px] text-gray-400">{user.phone || '—'}</div></td>
                    <td className="py-2.5 px-3 text-gray-600 dark:text-gray-300">{user.village || '—'}{user.state ? `, ${user.state}` : ''}</td>
                    <td className="py-2.5 px-3 text-gray-400">{user.created_at ? String(user.created_at).slice(0, 10) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && <p className="text-center text-xs text-gray-500 py-6">No users match this filter.</p>}
          </div>
        </section>
      )}

      {tab === 'verification' && (
        <section className="rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-4">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Driver verification</h2>
          <p className="text-[11px] text-gray-500 mb-4">This only toggles the verified flag on the account. The app does not upload or validate licence documents, so no document-audit claim is made.</p>
          <div className="grid md:grid-cols-2 gap-3">
            {drivers.map((driver) => {
              const vehicle = vehicleByDriver.get(driver.username)
              return (
                <div key={driver.username} className="rounded-xl border border-gray-100 dark:border-[#274a3d] bg-gray-50 dark:bg-[#162a23] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2"><Avatar user={driver} /><div><p className="text-xs font-bold">{driver.full_name}</p><p className="text-[10px] text-gray-400">@{driver.username} · {driver.phone || 'no phone'}</p></div></div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${driver.verified ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'}`}>{driver.verified ? 'Verified' : 'Pending'}</span>
                  </div>
                  <div className="mt-2 text-[11px] text-gray-600 dark:text-gray-300 space-y-0.5">
                    <p>Vehicle: <strong>{vehicle ? `${vehicle.type} · ${vehicle.number}` : 'Not assigned'}</strong></p>
                    <p>Rating: <strong>{driver.rating ?? 'Not rated'}</strong></p>
                    <p>Completed trips: <strong>{driver.trips_completed ?? 'Not recorded'}</strong></p>
                  </div>
                  <button onClick={() => verify(driver.username, driver.verified)} className={`mt-2 w-full rounded-lg py-1.5 text-[11px] font-bold inline-flex items-center justify-center gap-1 ${driver.verified ? 'bg-red-50 text-red-700 dark:bg-red-950/40' : 'bg-emerald-700 text-white'}`}>
                    {driver.verified ? <X size={12} /> : <Check size={12} />} {driver.verified ? 'Revoke verification' : 'Approve driver'}
                  </button>
                </div>
              )
            })}
            {drivers.length === 0 && <p className="text-xs text-gray-500">No driver accounts yet.</p>}
          </div>
        </section>
      )}

      {tab === 'bookings' && (
        <section className="rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-4">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Freight request ledger</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-gray-100 dark:border-[#1e362e] text-gray-400 text-left"><th className="py-2.5 px-3">Request</th><th className="py-2.5 px-3">Farmer</th><th className="py-2.5 px-3">Cargo</th><th className="py-2.5 px-3">Corridor</th><th className="py-2.5 px-3">Quote</th><th className="py-2.5 px-3">Status</th></tr></thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#1e362e]">
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td className="py-2.5 px-3 font-mono text-[10px]">{request.id}</td>
                    <td className="py-2.5 px-3">{request.farmer}</td>
                    <td className="py-2.5 px-3">{request.crop} · {Number(request.quantity).toLocaleString()} {request.unit || 'kg'}</td>
                    <td className="py-2.5 px-3 text-gray-500">{request.pickup} → {request.destination}</td>
                    <td className="py-2.5 px-3 font-semibold">{request.estimated_cost != null ? formatINR(request.estimated_cost) : '—'}</td>
                    <td className="py-2.5 px-3"><span className={`status-badge status-${request.status}`}>{request.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {requests.length === 0 && <p className="text-center text-xs text-gray-500 py-6">No transport requests yet.</p>}
          </div>
        </section>
      )}
    </div>
  )
}
