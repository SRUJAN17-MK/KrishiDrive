import React, { useState } from 'react'
import {
  Route as RouteIcon, MapPin, Clock, Fuel, Zap, ArrowRight,
  TrendingUp, Leaf, DollarSign, ShieldCheck, CheckCircle2
} from 'lucide-react'
import { api } from '../services/api'
import toast from 'react-hot-toast'

export default function DriverRoutes() {
  const [form, setForm] = useState({
    pickup: 'Nashik, Maharashtra',
    destination: 'Vashi APMC Market, Mumbai',
    vehicle_type: 'Truck (10-Ton)',
    load: '5000'
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const commonHubs = [
    { from: 'Nashik, Maharashtra', to: 'Vashi APMC Market, Mumbai' },
    { from: 'Ludhiana, Punjab', to: 'Azadpur Mandi, Delhi' },
    { from: 'Nashik, Maharashtra', to: 'Gultekdi Market Yard, Pune' },
    { from: 'Nagpur, Maharashtra', to: 'Bhopal Mandi, Madhya Pradesh' }
  ]

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSelectQuickHub = (hub) => {
    setForm({ ...form, pickup: hub.from, destination: hub.to })
  }

  const optimize = async (e) => {
    if (e) e.preventDefault()
    setLoading(true)
    setResult(null)
    try {
      const res = await api.ai.routeOptimization(form)
      setResult(res)
      toast.success('Route optimized using Snapdragon NPU!')
    } catch (err) {
      toast.error(err.message || 'Optimization failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 fade-in max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
          AI Agricultural Route Optimizer
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
          Calculate gradient-optimized highway paths to minimize diesel burn and transit vibration damage.
        </p>
      </div>

      {/* Quick Corridor Buttons */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {commonHubs.map((hub, i) => (
          <button
            key={i}
            onClick={() => handleSelectQuickHub(hub)}
            className="text-xs whitespace-nowrap px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#12211c] border border-gray-200 dark:border-[#1e362e] hover:border-emerald-500 text-gray-700 dark:text-gray-300 font-medium transition"
          >
            {hub.from.split(',')[0]} → {hub.to.split(',')[0]}
          </button>
        ))}
      </div>

      {/* Input Form Card */}
      <div className="bg-white dark:bg-[#12211c] rounded-2xl border border-gray-200 dark:border-[#1e362e] p-6 shadow-sm transition-colors">
        <form onSubmit={optimize} className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Pickup Farm / City</label>
            <input
              name="pickup"
              value={form.pickup}
              onChange={handleChange}
              required
              placeholder="e.g. Nashik, Maharashtra"
              className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-forest-800 dark:bg-[#162a23] dark:text-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Destination Mandi</label>
            <input
              name="destination"
              value={form.destination}
              onChange={handleChange}
              required
              placeholder="e.g. Vashi APMC, Mumbai"
              className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-forest-800 dark:bg-[#162a23] dark:text-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Vehicle Class</label>
            <select
              name="vehicle_type"
              value={form.vehicle_type}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-forest-800 dark:bg-[#162a23] dark:text-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Truck (10-Ton)">Truck (10-Ton)</option>
              <option value="Tempo (3-Ton)">Tempo (3-Ton)</option>
              <option value="Mini Truck (2.5-Ton)">Mini Truck (2.5-Ton)</option>
              <option value="Heavy Trailer (20-Ton)">Heavy Trailer (20-Ton)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Payload Weight (kg)</label>
            <input
              name="load"
              type="number"
              value={form.load}
              onChange={handleChange}
              placeholder="e.g. 5000"
              className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-forest-800 dark:bg-[#162a23] dark:text-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="md:col-span-2 lg:col-span-4 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 disabled:opacity-50 shadow"
            >
              <Zap size={16} className="text-amber-400" />
              {loading ? 'Evaluating Highway Matrix...' : 'Run Route Optimization'}
            </button>
          </div>
        </form>
      </div>

      {/* Results View */}
      {result && (
        <div className="space-y-6">
          {/* Savings Highlight Ribbon */}
          {result.savings && (
            <div className="bg-gradient-to-r from-emerald-900 via-forest-900 to-[#122b21] rounded-3xl p-6 text-white border border-emerald-800/40 shadow-md">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
                <TrendingUp size={15} /> Snapdragon AI Optimization Savings
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mt-3">
                <div className="bg-white/10 backdrop-blur rounded-2xl p-3">
                  <div className="text-[11px] text-gray-300">Fuel Saved</div>
                  <div className="text-2xl font-black text-amber-400 mt-0.5">{result.savings.fuel_saved_liters} L</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-2xl p-3">
                  <div className="text-[11px] text-gray-300">Net Cost Savings</div>
                  <div className="text-2xl font-black text-emerald-400 mt-0.5">{result.savings.cost_saved_inr}</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-2xl p-3">
                  <div className="text-[11px] text-gray-300">Time Saved</div>
                  <div className="text-2xl font-black text-white mt-0.5">{result.savings.time_saved_min} min</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-2xl p-3">
                  <div className="text-[11px] text-gray-300">CO2 Reduction</div>
                  <div className="text-2xl font-black text-cyan-300 mt-0.5">{result.savings.co2_reduction_kg} kg</div>
                </div>
              </div>
            </div>
          )}

          {/* Route Comparison Cards */}
          <div className="grid md:grid-cols-3 gap-5">
            {result.routes?.map((route, i) => (
              <div
                key={i}
                className={`bg-white dark:bg-[#12211c] rounded-2xl p-6 border card-hover flex flex-col justify-between transition-colors ${
                  i === 0
                    ? 'border-emerald-600 dark:border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                    : 'border-gray-200 dark:border-[#1e362e]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    {i === 0 ? (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40">
                        AI Recommended
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-gray-400">Alternative Path</span>
                    )}
                    <span className="text-xs font-black text-gray-700 dark:text-gray-300">Score: {route.ai_score}/100</span>
                  </div>

                  <h3 className="font-extrabold text-gray-900 dark:text-white text-base mb-1">{route.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{route.highlight}</p>

                  <div className="space-y-2.5 text-xs bg-gray-50 dark:bg-[#162a23] p-4 rounded-xl border border-gray-100 dark:border-[#1e362e] text-gray-600 dark:text-gray-300">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 flex items-center gap-1.5"><MapPin size={13} /> Distance:</span>
                      <strong className="text-gray-900 dark:text-white">{route.distance_km} km</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 flex items-center gap-1.5"><Clock size={13} /> Travel Time:</span>
                      <strong className="text-gray-900 dark:text-white">{route.time_hours} Hours</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 flex items-center gap-1.5"><Fuel size={13} /> Fuel Needed:</span>
                      <strong className="text-amber-600 dark:text-amber-400">{route.fuel_liters} Liters</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Estimated Tolls:</span>
                      <strong className="text-gray-900 dark:text-white">{route.tolls}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 flex items-center gap-1.5"><Leaf size={13} /> Carbon:</span>
                      <strong className="text-emerald-600 dark:text-emerald-400">{route.co2_kg} kg CO2</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-[#1e362e] text-[11px] text-gray-400">
                  Surface: {route.road_quality}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400 pt-2">
            <span>Model: {result.model_info?.name} ({result.model_info?.device})</span>
            <span>Algorithm: {result.model_info?.algorithm} • {result.model_info?.inference_time_ms}ms</span>
          </div>
        </div>
      )}
    </div>
  )
}