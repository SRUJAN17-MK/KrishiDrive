import React, { useState, useEffect } from 'react'
import {
  Truck, Plus, X, MapPin, Brain, Filter, Check,
  Calendar, Clock, Trash2, ShieldCheck, Star, ArrowRight,
  TrendingUp, AlertCircle
} from 'lucide-react'
import { api } from '../services/api'
import toast from 'react-hot-toast'

export default function FarmerTransport() {
  const [requests, setRequests] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [matchResult, setMatchResult] = useState(null)
  const [matchLoading, setMatchLoading] = useState(false)
  const [activeReqId, setActiveReqId] = useState(null)
  const [filter, setFilter] = useState('all')

  const [form, setForm] = useState({
    crop: 'Tomatoes',
    quantity: '5000',
    unit: 'kg',
    pickup: 'Nashik, Maharashtra',
    destination: 'Vashi APMC Market, Mumbai',
    vehicle_type: 'Truck (10-Ton)',
    pickup_date: new Date().toISOString().split('T')[0],
    preferred_time: '06:00 AM'
  })

  const crops = ['Tomatoes', 'Wheat', 'Rice', 'Grapes', 'Onions', 'Potatoes', 'Corn', 'Sugarcane', 'Cotton', 'Produce']
  const vehicles = ['Truck (10-Ton)', 'Tempo (3-Ton)', 'Mini Truck (2.5-Ton)', 'Heavy Trailer (20-Ton)']

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      const data = await api.transport.requests()
      setRequests(data || [])
    } catch (err) {
      toast.error('Failed to load transport dispatches')
    }
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const tr = await api.transport.create({
        ...form,
        quantity: parseFloat(form.quantity) || 1000
      })
      setRequests([tr, ...requests])
      setShowForm(false)
      toast.success('Transport dispatch request registered!')
    } catch (err) {
      toast.error(err.message || 'Creation failed')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Cancel this transport request?')) return
    try {
      await api.transport.delete(id)
      setRequests(requests.filter(r => r.id !== id))
      toast.success('Transport request cancelled')
      if (activeReqId === id) setMatchResult(null)
    } catch (err) {
      toast.error(err.message || 'Failed to cancel request')
    }
  }

  const matchDrivers = async (req) => {
    setActiveReqId(req.id)
    setMatchLoading(true)
    setMatchResult(null)
    try {
      const result = await api.ai.transportMatching({
        crop_type: req.crop,
        quantity: req.quantity,
        pickup: req.pickup,
        destination: req.destination
      })
      setMatchResult({ ...result, request: req })
      toast.success(`Matched ${result.matches?.length || 0} local haulers`)
    } catch (err) {
      toast.error(err.message || 'Matching failed')
    } finally {
      setMatchLoading(false)
    }
  }

  // BUG-01 FIXED: Passing matched driver_username so driver is assigned properly
  const bookMatchedDriver = async (requestId, vehicleId, driverUsername) => {
    try {
      await api.transport.accept({
        request_id: requestId,
        vehicle_id: vehicleId,
        driver_username: driverUsername
      })
      const updated = await api.transport.requests()
      setRequests(updated)
      setMatchResult(null)
      toast.success('Transport confirmed! Hauler notified and trip scheduled.')
    } catch (err) {
      toast.error(err.message || 'Booking failed')
    }
  }

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter)

  return (
    <div className="space-y-6 fade-in max-w-7xl mx-auto">
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
            Smart Transport Booking
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Dispatch your harvest directly to wholesale mandis with AI-matched verified haulers.
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow transition flex items-center justify-center gap-2 text-sm"
        >
          <Plus size={16} /> New Freight Request
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'all', label: 'All Dispatches' },
          { id: 'pending', label: 'Pending Match' },
          { id: 'matched', label: 'Hauler Assigned' },
          { id: 'delivered', label: 'Delivered' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              filter === tab.id
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-white dark:bg-[#12211c] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-[#1e362e] hover:bg-gray-100 dark:hover:bg-[#1c352c]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#12211c] rounded-3xl max-w-xl w-full p-6 border border-gray-200 dark:border-[#1e362e] shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-gray-900 dark:text-white text-lg">
                Create Agricultural Transport Request
              </h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3.5">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Crop / Commodity</label>
                <select
                  name="crop"
                  value={form.crop}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-forest-800 dark:bg-[#162a23] dark:text-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {crops.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Quantity (kg)</label>
                <input
                  name="quantity"
                  type="number"
                  value={form.quantity}
                  onChange={handleChange}
                  required
                  placeholder="e.g. 5000"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-forest-800 dark:bg-[#162a23] dark:text-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Farm Pickup Location</label>
                <input
                  name="pickup"
                  value={form.pickup}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Farm Gate, Nashik, Maharashtra"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-forest-800 dark:bg-[#162a23] dark:text-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Destination Mandi / Market</label>
                <input
                  name="destination"
                  value={form.destination}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Vashi APMC Terminal, Mumbai"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-forest-800 dark:bg-[#162a23] dark:text-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Preferred Vehicle Class</label>
                <select
                  name="vehicle_type"
                  value={form.vehicle_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-forest-800 dark:bg-[#162a23] dark:text-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {vehicles.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Loading Date</label>
                <input
                  name="pickup_date"
                  type="date"
                  value={form.pickup_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-forest-800 dark:bg-[#162a23] dark:text-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="col-span-2 flex gap-3 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-sm transition"
                >
                  Submit Freight Request
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 border border-gray-200 dark:border-forest-800 text-gray-600 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispatches List */}
      <div className="space-y-4">
        {filtered.map(req => (
          <div
            key={req.id}
            className="bg-white dark:bg-[#12211c] rounded-2xl border border-gray-200 dark:border-[#1e362e] p-5 card-hover transition-colors"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                  <Truck size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 dark:text-white text-base">
                      {req.crop} • {req.quantity?.toLocaleString()} {req.unit}
                    </h3>
                    <span className="text-[11px] text-gray-400">({req.id})</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 mt-1">
                    <MapPin size={13} className="text-emerald-600 dark:text-emerald-400" />
                    <span>{req.pickup}</span>
                    <span className="text-gray-400">→</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{req.destination}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-400 mt-2">
                    <span className="flex items-center gap-1"><Calendar size={11} /> {req.pickup_date}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Clock size={11} /> {req.preferred_time || 'Morning'}</span>
                    <span>•</span>
                    <span>Vehicle: {req.vehicle_type}</span>
                    {req.driver && (
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                        • Assigned Driver: {req.driver}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end lg:self-center">
                <div className="text-right">
                  <div className="text-sm font-extrabold text-emerald-800 dark:text-emerald-300">
                    ₹{(req.estimated_cost || 4500).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-gray-400">Estimated Tariff</div>
                </div>

                <span className={`status-badge status-${req.status}`}>
                  {req.status}
                </span>

                {req.status === 'pending' && (
                  <button
                    onClick={() => matchDrivers(req)}
                    disabled={matchLoading}
                    className="px-3 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    <Brain size={14} /> {matchLoading && activeReqId === req.id ? 'Finding...' : 'AI Match'}
                  </button>
                )}

                {req.status === 'pending' && (
                  <button
                    onClick={() => handleDelete(req.id)}
                    title="Cancel Dispatch"
                    className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="bg-white dark:bg-[#12211c] rounded-2xl p-12 text-center border border-gray-200 dark:border-[#1e362e]">
            <Truck size={48} className="mx-auto text-amber-500/40 mb-3" />
            <h3 className="font-bold text-gray-800 dark:text-gray-200 text-base">No transport dispatches found</h3>
            <p className="text-xs text-gray-500 mt-1">Book your first hauler to transport harvested crops to APMC terminals.</p>
          </div>
        )}
      </div>

      {/* AI Matched Drivers Panel */}
      {matchResult && (
        <div className="bg-gradient-to-br from-white via-purple-50/20 to-white dark:from-[#12211c] dark:via-[#191e2b] dark:to-[#12211c] rounded-3xl border border-purple-300/60 dark:border-purple-800/40 p-6 shadow-xl relative transition-all">
          <div className="flex items-center justify-between pb-4 border-b border-purple-100 dark:border-purple-900/40 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                <Brain size={22} />
              </div>
              <div>
                <h3 className="font-extrabold text-gray-900 dark:text-white text-base">
                  AI-Ranked Verified Haulers for Request #{matchResult.request?.id}
                </h3>
                <div className="text-xs text-purple-700 dark:text-purple-400 mt-0.5">
                  Algorithm: Multi-Criteria Hauler Scoring (Capacity, Proximity, Safety Rating)
                </div>
              </div>
            </div>
            <button
              onClick={() => setMatchResult(null)}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-3.5">
            {matchResult.matches?.map((m, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white dark:bg-[#162a23] rounded-2xl border border-purple-100 dark:border-purple-900/40 shadow-sm"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-black text-base flex-shrink-0">
                    {m.driver?.full_name?.[0] || 'D'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 dark:text-white text-sm">{m.driver?.full_name}</span>
                      <span className="flex items-center gap-1 text-[11px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-full">
                        <Star size={11} fill="currentColor" /> {m.driver?.rating}
                      </span>
                      {m.driver?.verified && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                          <ShieldCheck size={13} /> Verified
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {m.vehicle?.type} • Reg: {m.vehicle?.number} • Capacity: {m.vehicle?.capacity?.toLocaleString()} kg
                    </div>

                    <div className="text-[11px] text-purple-700 dark:text-purple-400 font-medium mt-1">
                      {m.distance_to_pickup_km} km away from your farm gate
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-center">
                  <div className="text-right">
                    <div className="text-base font-black text-emerald-700 dark:text-emerald-400">
                      {m.estimated_cost_formatted}
                    </div>
                    <div className="text-[10px] text-gray-400">AI Match: {m.match_score}%</div>
                  </div>

                  <button
                    onClick={() => bookMatchedDriver(matchResult.request.id, m.vehicle.id, m.driver.username)}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow transition"
                  >
                    <Check size={14} /> Confirm Hauler
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-purple-100 dark:border-purple-900/40 flex items-center justify-between text-[11px] text-gray-400">
            <span>Powered by Snapdragon NPU Multi-Criteria Engine</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Inference: {matchResult.model_info?.inference_time_ms}ms</span>
          </div>
        </div>
      )}
    </div>
  )
}