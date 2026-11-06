import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Users, Sprout, Truck, TrendingUp, Search, RefreshCw,
  Check, X, Database, Cpu, CloudSun, Store, Activity, History,
  LifeBuoy, MessageSquare, Flag, CheckCircle2, RotateCcw, Send,
  Satellite, Pencil, Trash2
} from 'lucide-react'
import { api } from '../services/api'
import { PageHeader, LoadingBlock, StatCard } from '../components/ui'
import { formatINR } from '../utils/currency'
import toast from 'react-hot-toast'

const EMPTY_AUDIT_FILTERS = { actor: '', action: '', from: '', to: '', q: '' }

const AUDIT_ACTION_META = {
  create_farm: { label: 'Farm created', tone: 'emerald', icon: Sprout },
  update_farm: { label: 'Farm updated', tone: 'blue', icon: Pencil },
  delete_farm: { label: 'Farm deleted', tone: 'red', icon: Trash2 },
  satellite_analysis: { label: 'Satellite analysis', tone: 'indigo', icon: Satellite },
  mandi_recommendation: { label: 'Mandi recommendation', tone: 'amber', icon: Store },
  complete_delivery: { label: 'Delivery completed', tone: 'emerald', icon: Truck },
  create_ticket: { label: 'Ticket opened', tone: 'amber', icon: LifeBuoy },
  ticket_reply: { label: 'Ticket reply', tone: 'blue', icon: MessageSquare },
  ticket_status: { label: 'Ticket status changed', tone: 'indigo', icon: Activity },
  escalate_ticket: { label: 'Ticket escalated', tone: 'red', icon: Flag },
  deescalate_ticket: { label: 'Ticket de-escalated', tone: 'gray', icon: Flag }
}

const AUDIT_TONE_DOT = {
  emerald: 'bg-emerald-500',
  blue: 'bg-blue-500',
  indigo: 'bg-indigo-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  gray: 'bg-gray-400'
}

const TICKET_BADGE_CLASSES = {
  open: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
  resolved: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
}

const TICKET_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'escalated', label: 'Escalated' },
  { id: 'resolved', label: 'Resolved' }
]

function humanizeAction(action) {
  return String(action || 'event').replace(/_/g, ' ').replace(/^\w/, (char) => char.toUpperCase())
}

function parseTimestamp(value) {
  if (!value) return null
  const raw = String(value)
  // SQLite datetime('now') stores UTC without a timezone marker.
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(raw) ? `${raw.replace(' ', 'T')}Z` : raw
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatDateTime(value) {
  const date = parseTimestamp(value)
  if (!date) return value || '—'
  return date.toLocaleString(undefined, {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

function formatDetail(value) {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'boolean') return value ? 'yes' : 'no'
  if (typeof value === 'object') return JSON.stringify(value).slice(0, 80)
  return String(value)
}

function Avatar({ user }) {
  return (
    <span className="w-8 h-8 rounded-full bg-emerald-700 text-white grid place-items-center text-[11px] font-bold shrink-0">
      {(user?.full_name || user?.username || 'U').slice(0, 1).toUpperCase()}
    </span>
  )
}

function TicketBadge({ ticket }) {
  if (ticket.escalated && ticket.status !== 'resolved') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300">
        <Flag size={9} /> Escalated
      </span>
    )
  }
  const status = ticket.status || 'open'
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${TICKET_BADGE_CLASSES[status] || TICKET_BADGE_CLASSES.open}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

function AuditEvent({ log }) {
  const meta = AUDIT_ACTION_META[log.action] || { label: humanizeAction(log.action), tone: 'gray' }
  const Icon = meta.icon || Activity
  const details = Object.entries(log.details || {})
  return (
    <li className="relative ml-4 mb-3">
      <span className={`absolute -left-[22px] top-3 grid h-5 w-5 place-items-center rounded-full text-white ring-4 ring-white dark:ring-[#0f1e19] ${AUDIT_TONE_DOT[meta.tone] || AUDIT_TONE_DOT.gray}`}>
        <Icon size={10} />
      </span>
      <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm dark:border-[#274a3d] dark:bg-[#12211c]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-900 dark:text-white">{meta.label}</span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              {log.actor || 'system'}
            </span>
          </div>
          <span className="text-[10px] text-gray-400" title={log.created_at}>{formatDateTime(log.created_at)}</span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-gray-400">
          <span className="font-mono">{log.id}</span>
          {log.ip_address && <span>IP {log.ip_address}</span>}
          <span className="font-mono">{log.action}</span>
        </div>
        {details.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {details.map(([key, value]) => (
              <span key={key} className="rounded-lg bg-gray-50 px-2 py-0.5 text-[10px] text-gray-600 dark:bg-[#162a23] dark:text-gray-300">
                <span className="text-gray-400">{key.replace(/_/g, ' ')}:</span> {formatDetail(value)}
              </span>
            ))}
          </div>
        )}
      </div>
    </li>
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

  const [auditLogs, setAuditLogs] = useState([])
  const [auditOptions, setAuditOptions] = useState({ actions: [], actors: [] })
  const [auditFilters, setAuditFilters] = useState(EMPTY_AUDIT_FILTERS)
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditLive, setAuditLive] = useState(false)

  const [tickets, setTickets] = useState([])
  const [ticketStatusFilter, setTicketStatusFilter] = useState('all')
  const [selectedTicketId, setSelectedTicketId] = useState(null)
  const [ticketDetail, setTicketDetail] = useState(null)
  const [ticketLoading, setTicketLoading] = useState(false)
  const [replyBody, setReplyBody] = useState('')
  const [ticketBusy, setTicketBusy] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    const [statsRes, usersRes, requestsRes, vehiclesRes, modelRes, auditRes, auditMetaRes, ticketsRes] = await Promise.allSettled([
      api.admin.stats(),
      api.admin.users(),
      api.transport.requests(),
      api.vehicles.list(),
      api.ai.modelInfo(),
      api.admin.auditLogs({ limit: 100 }),
      api.admin.auditFilters(),
      api.support.list()
    ])
    if (statsRes.status === 'fulfilled') setStats(statsRes.value)
    else setError(statsRes.reason?.message || 'Failed to load admin statistics')
    if (usersRes.status === 'fulfilled') setUsers(usersRes.value || [])
    if (requestsRes.status === 'fulfilled') setRequests(requestsRes.value || [])
    if (vehiclesRes.status === 'fulfilled') setVehicles(vehiclesRes.value || [])
    if (modelRes.status === 'fulfilled') setModel(modelRes.value)
    if (auditRes.status === 'fulfilled') setAuditLogs(auditRes.value || [])
    if (auditMetaRes.status === 'fulfilled') setAuditOptions(auditMetaRes.value || { actions: [], actors: [] })
    if (ticketsRes.status === 'fulfilled') setTickets(ticketsRes.value || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const loadAuditLogs = useCallback(async (filters = auditFilters) => {
    setAuditLoading(true)
    try {
      const [logs, options] = await Promise.all([
        api.admin.auditLogs({ ...filters, limit: 100 }),
        api.admin.auditFilters()
      ])
      setAuditLogs(logs || [])
      setAuditOptions(options || { actions: [], actors: [] })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setAuditLoading(false)
    }
  }, [auditFilters])

  useEffect(() => {
    if (tab !== 'audit' || !auditLive) return undefined
    const timer = setInterval(() => { loadAuditLogs() }, 15000)
    return () => clearInterval(timer)
  }, [tab, auditLive, loadAuditLogs])

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

  const filteredTickets = useMemo(() => tickets.filter((ticket) => {
    if (ticketStatusFilter === 'all') return true
    if (ticketStatusFilter === 'escalated') return ticket.escalated && ticket.status !== 'resolved'
    return ticket.status === ticketStatusFilter
  }), [tickets, ticketStatusFilter])

  const ticketCounts = useMemo(() => ({
    all: tickets.length,
    open: tickets.filter((ticket) => ticket.status === 'open').length,
    in_progress: tickets.filter((ticket) => ticket.status === 'in_progress').length,
    escalated: tickets.filter((ticket) => ticket.escalated && ticket.status !== 'resolved').length,
    resolved: tickets.filter((ticket) => ticket.status === 'resolved').length
  }), [tickets])

  const openTicket = async (id) => {
    setSelectedTicketId(id)
    setReplyBody('')
    setTicketLoading(true)
    try {
      setTicketDetail(await api.support.get(id))
    } catch (err) {
      toast.error(err.message)
      setTicketDetail(null)
    } finally {
      setTicketLoading(false)
    }
  }

  useEffect(() => {
    if (tab !== 'support') return
    if (filteredTickets.length === 0) {
      setSelectedTicketId(null)
      setTicketDetail(null)
      return
    }
    if (!selectedTicketId || !filteredTickets.some((ticket) => ticket.id === selectedTicketId)) {
      openTicket(filteredTickets[0].id)
    }
    // openTicket only touches state setters; selection should react to the filtered list only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, filteredTickets])

  const mergeTicketIntoList = (ticket) => {
    setTickets((prev) => prev.map((item) => (item.id === ticket.id
      ? {
        ...item,
        status: ticket.status,
        escalated: ticket.escalated,
        updated_at: ticket.updated_at,
        message_count: ticket.message_count
      }
      : item)))
  }

  const sendReply = async () => {
    const text = replyBody.trim()
    if (!text || !selectedTicketId) return
    setTicketBusy('reply')
    try {
      const res = await api.support.reply(selectedTicketId, text)
      setTicketDetail(res.ticket)
      mergeTicketIntoList(res.ticket)
      setReplyBody('')
      toast.success(`Reply sent to @${res.ticket.username}`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setTicketBusy('')
    }
  }

  const changeTicketStatus = async (status) => {
    if (!selectedTicketId) return
    setTicketBusy(status)
    try {
      const res = await api.support.setStatus(selectedTicketId, status)
      setTicketDetail(res.ticket)
      mergeTicketIntoList(res.ticket)
      toast.success(status === 'resolved' ? 'Ticket marked resolved' : 'Ticket reopened')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setTicketBusy('')
    }
  }

  const toggleEscalation = async () => {
    if (!selectedTicketId || !ticketDetail) return
    setTicketBusy('escalate')
    try {
      const res = await api.support.escalate(selectedTicketId, !ticketDetail.escalated)
      setTicketDetail(res.ticket)
      mergeTicketIntoList(res.ticket)
      toast.success(res.ticket.escalated ? 'Ticket escalated' : 'Escalation cleared')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setTicketBusy('')
    }
  }

  const refreshSupport = async () => {
    setTicketBusy('refresh')
    try {
      const list = await api.support.list()
      setTickets(list || [])
      if (selectedTicketId) setTicketDetail(await api.support.get(selectedTicketId))
    } catch (err) {
      toast.error(err.message)
    } finally {
      setTicketBusy('')
    }
  }

  const applyAuditFilters = (event) => {
    event.preventDefault()
    loadAuditLogs(auditFilters)
  }

  const clearAuditFilters = () => {
    setAuditFilters(EMPTY_AUDIT_FILTERS)
    loadAuditLogs(EMPTY_AUDIT_FILTERS)
  }

  const auditFiltersActive = Object.values(auditFilters).some((value) => String(value).trim() !== '')

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
          { id: 'bookings', label: 'Freight ledger', count: requests.length },
          { id: 'audit', label: 'Audit trail', count: auditLogs.length },
          { id: 'support', label: 'Support desk', count: ticketCounts.open + ticketCounts.in_progress }
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

      {tab === 'audit' && (
        <section className="rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-4">
          <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white inline-flex items-center gap-2"><History size={15} className="text-emerald-600" /> Audit trail</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">Every audited write is recorded server-side. Sensitive values such as OTPs, tokens and API keys are redacted before display.</p>
            </div>
            <div className="flex items-center gap-2">
              <label className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-[11px] font-bold ${auditLive ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'border-gray-200 bg-white text-gray-600 dark:border-[#274a3d] dark:bg-[#12211c] dark:text-gray-300'}`}>
                <input type="checkbox" checked={auditLive} onChange={(e) => setAuditLive(e.target.checked)} className="accent-emerald-700" />
                Live · 15s
              </label>
              <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                {auditLoading ? <><RefreshCw size={11} className="animate-spin" /> Refreshing</> : `${auditLogs.length} event${auditLogs.length === 1 ? '' : 's'}`}
              </span>
            </div>
          </div>

          <form onSubmit={applyAuditFilters} className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6 mb-4">
            <div className="lg:col-span-1">
              <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">User</label>
              <select value={auditFilters.actor} onChange={(e) => setAuditFilters((prev) => ({ ...prev, actor: e.target.value }))} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-2 py-2 text-xs dark:border-[#274a3d] dark:bg-[#162a23]">
                <option value="">All users</option>
                {auditOptions.actors.map((item) => <option key={item.actor} value={item.actor}>{item.actor} ({item.count})</option>)}
              </select>
            </div>
            <div className="lg:col-span-1">
              <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">Action</label>
              <select value={auditFilters.action} onChange={(e) => setAuditFilters((prev) => ({ ...prev, action: e.target.value }))} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-2 py-2 text-xs dark:border-[#274a3d] dark:bg-[#162a23]">
                <option value="">All actions</option>
                {auditOptions.actions.map((item) => <option key={item.action} value={item.action}>{humanizeAction(item.action)} ({item.count})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">From</label>
              <input type="date" value={auditFilters.from} onChange={(e) => setAuditFilters((prev) => ({ ...prev, from: e.target.value }))} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-2 py-2 text-xs dark:border-[#274a3d] dark:bg-[#162a23]" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">To</label>
              <input type="date" value={auditFilters.to} onChange={(e) => setAuditFilters((prev) => ({ ...prev, to: e.target.value }))} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-2 py-2 text-xs dark:border-[#274a3d] dark:bg-[#162a23]" />
            </div>
            <div className="lg:col-span-1">
              <label className="block text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">Search</label>
              <input value={auditFilters.q} onChange={(e) => setAuditFilters((prev) => ({ ...prev, q: e.target.value }))} placeholder="actor, action, details…" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-2 py-2 text-xs dark:border-[#274a3d] dark:bg-[#162a23]" />
            </div>
            <div className="flex items-end gap-1.5">
              <button type="submit" className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-emerald-700 px-2 py-2 text-[11px] font-bold text-white hover:bg-emerald-800">
                <Search size={12} /> Apply
              </button>
              <button type="button" onClick={clearAuditFilters} className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-2 py-2 text-[11px] font-bold text-gray-600 dark:border-[#274a3d] dark:text-gray-300" title="Clear filters">
                <RotateCcw size={12} />
              </button>
            </div>
          </form>

          {auditLogs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 py-10 text-center dark:border-[#274a3d]">
              <History className="mx-auto mb-2 text-gray-400" size={24} />
              <p className="text-xs font-bold text-gray-700 dark:text-gray-200">No audit events{auditFiltersActive ? ' match these filters' : ' yet'}</p>
              <p className="text-[11px] text-gray-500 mt-1">Farm, satellite, mandi, delivery and support actions are written here as they happen.</p>
            </div>
          ) : (
            <ol className="relative border-l border-gray-200 dark:border-[#274a3d] ml-2 max-h-[640px] overflow-y-auto pr-1">
              {auditLogs.map((log) => <AuditEvent key={log.id} log={log} />)}
            </ol>
          )}
        </section>
      )}

      {tab === 'support' && (
        <section className="grid gap-4 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
          <div className="rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white inline-flex items-center gap-2"><LifeBuoy size={15} className="text-emerald-600" /> Support desk</h2>
              <button onClick={refreshSupport} disabled={ticketBusy === 'refresh'} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1.5 text-[10px] font-bold text-gray-600 disabled:opacity-50 dark:border-[#274a3d] dark:text-gray-300">
                <RefreshCw size={11} className={ticketBusy === 'refresh' ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>
            <div className="mb-2 flex flex-wrap gap-1">
              {TICKET_FILTERS.map((filter) => (
                <button key={filter.id} onClick={() => setTicketStatusFilter(filter.id)} className={`rounded-lg px-2 py-1 text-[10px] font-bold ${ticketStatusFilter === filter.id ? 'bg-emerald-700 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'}`}>
                  {filter.label} <span className="opacity-70">{ticketCounts[filter.id]}</span>
                </button>
              ))}
            </div>
            <div className="max-h-[620px] space-y-2 overflow-y-auto pr-1">
              {filteredTickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => openTicket(ticket.id)}
                  className={`w-full rounded-xl border p-3 text-left transition ${selectedTicketId === ticket.id ? 'border-emerald-500 bg-emerald-50/70 dark:border-emerald-700 dark:bg-emerald-950/30' : 'border-gray-100 bg-gray-50 hover:border-emerald-200 dark:border-[#274a3d] dark:bg-[#162a23]'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] text-gray-400">{ticket.id}</span>
                    <TicketBadge ticket={ticket} />
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs font-bold text-gray-900 dark:text-white">{ticket.title}</p>
                  <p className="mt-0.5 text-[10px] text-gray-500">@{ticket.username} · {ticket.category} · {ticket.message_count || 0} repl{ticket.message_count === 1 ? 'y' : 'ies'}</p>
                  <p className="mt-0.5 text-[10px] text-gray-400">{formatDateTime(ticket.created_at)}</p>
                </button>
              ))}
              {filteredTickets.length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-300 py-10 text-center dark:border-[#274a3d]">
                  <LifeBuoy className="mx-auto mb-2 text-gray-400" size={22} />
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-200">No tickets in this view</p>
                  <p className="mt-1 text-[11px] text-gray-500">Farmers and drivers can raise tickets from the API; they appear here instantly.</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-4">
            {ticketLoading ? (
              <div className="flex items-center justify-center py-16 text-xs text-gray-500"><RefreshCw className="mr-2 animate-spin" size={14} /> Loading ticket…</div>
            ) : !ticketDetail ? (
              <div className="flex h-full min-h-[260px] flex-col items-center justify-center text-center">
                <MessageSquare className="mb-2 text-gray-400" size={26} />
                <p className="text-xs font-bold text-gray-700 dark:text-gray-200">Select a ticket to open the conversation</p>
                <p className="mt-1 max-w-xs text-[11px] text-gray-500">Reply, resolve, reopen or escalate. Every action is written to the audit trail.</p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-3 dark:border-[#1e362e]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10px] text-gray-400">{ticketDetail.id}</span>
                      <TicketBadge ticket={ticketDetail} />
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">{ticketDetail.category}</span>
                    </div>
                    <h3 className="mt-1 truncate text-base font-bold text-gray-900 dark:text-white">{ticketDetail.title}</h3>
                    <p className="text-[11px] text-gray-500">Opened by @{ticketDetail.username} · {formatDateTime(ticketDetail.created_at)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button onClick={toggleEscalation} disabled={ticketBusy === 'escalate'} className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-bold disabled:opacity-50 ${ticketDetail.escalated ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200' : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'}`}>
                      <Flag size={11} /> {ticketDetail.escalated ? 'Clear escalation' : 'Escalate'}
                    </button>
                    {ticketDetail.status === 'resolved' ? (
                      <button onClick={() => changeTicketStatus('open')} disabled={ticketBusy === 'open'} className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-[10px] font-bold text-white disabled:opacity-50">
                        <RotateCcw size={11} /> Reopen
                      </button>
                    ) : (
                      <button onClick={() => changeTicketStatus('resolved')} disabled={ticketBusy === 'resolved'} className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-2.5 py-1.5 text-[10px] font-bold text-white disabled:opacity-50">
                        <CheckCircle2 size={11} /> Resolve
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 max-h-[400px] space-y-3 overflow-y-auto pr-1">
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-[#274a3d] dark:bg-[#162a23]">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Original request · @{ticketDetail.username}</p>
                    <p className="mt-1 whitespace-pre-wrap text-xs text-gray-800 dark:text-gray-100">{ticketDetail.description}</p>
                  </div>
                  {(ticketDetail.messages || []).map((message) => {
                    const fromAdmin = message.author_role === 'admin'
                    return (
                      <div key={message.id} className={`flex ${fromAdmin ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs ${fromAdmin ? 'bg-emerald-700 text-white' : 'bg-gray-100 text-gray-800 dark:bg-[#1b332b] dark:text-gray-100'}`}>
                          <p className={`text-[10px] font-bold ${fromAdmin ? 'text-emerald-100' : 'text-gray-400'}`}>
                            {fromAdmin ? 'Support' : `@${message.author}`} · {formatDateTime(message.created_at)}
                          </p>
                          <p className="mt-1 whitespace-pre-wrap">{message.body}</p>
                        </div>
                      </div>
                    )
                  })}
                  {(ticketDetail.messages || []).length === 0 && (
                    <p className="py-2 text-center text-[11px] text-gray-400">No replies yet. Send the first response below.</p>
                  )}
                </div>

                {ticketDetail.status === 'resolved' ? (
                  <p className="mt-4 rounded-xl border border-dashed border-gray-300 p-3 text-[11px] text-gray-500 dark:border-[#274a3d]">
                    This ticket is resolved. Reopen it to continue the conversation.
                  </p>
                ) : (
                  <div className="mt-4">
                    <textarea
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      rows={3}
                      maxLength={2000}
                      placeholder={`Write a reply to @${ticketDetail.username}…`}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs dark:border-[#274a3d] dark:bg-[#162a23]"
                    />
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-gray-400">{replyBody.length}/2000 · replies are audit-logged</span>
                      <button onClick={sendReply} disabled={!replyBody.trim() || ticketBusy === 'reply'} className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-50">
                        {ticketBusy === 'reply' ? <RefreshCw className="animate-spin" size={12} /> : <Send size={12} />} Send reply
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
