import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Sprout, Truck, Package, TrendingUp, ArrowRight, AlertCircle,
  CloudSun, Droplets, Wind, Bell, User, Calendar, MapPin,
  CheckCircle2, Plus, Sparkles, Brain, Clock, ChevronRight, X
} from 'lucide-react'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function FarmerDashboard() {
  const { user } = useAuth()
  const [crops, setCrops] = useState([])
  const [requests, setRequests] = useState([])
  const [trips, setTrips] = useState([])
  const [weather, setWeather] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    village: user?.village || '',
    farm_size: user?.farm_size || '15 Acres'
  })

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true)
        const [cData, rData, tData, wData, nData] = await Promise.all([
          api.crops.list().catch(() => []),
          api.transport.requests().catch(() => []),
          api.trips.list().catch(() => []),
          api.weather.get(user?.village || 'Nashik').catch(() => null),
          api.notifications.list().catch(() => [])
        ])
        setCrops(cData || [])
        setRequests(rData || [])
        setTrips(tData || [])
        setWeather(wData)
        setNotifications(nData || [])
      } catch (err) {
        toast.error('Could not refresh dashboard data')
      } finally {
        setLoading(false)
      }
    }
    loadDashboardData()
  }, [user])

  const totalHarvest = crops.reduce((s, c) => s + (c.expected_qty || 0), 0)
  const readyCrops = crops.filter(c => c.status === 'ready').length
  const pendingReqs = requests.filter(r => r.status === 'pending').length
  const inTransitTrips = trips.filter(t => t.status === 'in_transit' || t.status === 'scheduled').length
  const estRevenue = crops.reduce((s, c) => s + (c.expected_qty || 0) * (c.estimated_rate_kg || 25), 0)

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    try {
      await api.auth.updateProfile(profileForm)
      toast.success('Farm profile updated successfully!')
      setShowProfileModal(false)
    } catch (err) {
      toast.error(err.message || 'Failed to update profile')
    }
  }

  return (
    <div className="space-y-6 fade-in max-w-7xl mx-auto">
      {/* Top Banner / Welcome & Weather Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#12211c] p-6 rounded-3xl border border-gray-200 dark:border-[#1e362e] shadow-sm transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
              Namaste, {user?.full_name || 'Farmer'} 🌾
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-300/40">
              Verified Farmer
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1.5">
            <MapPin size={14} className="text-emerald-600 dark:text-emerald-400" />
            {user?.village || 'Nashik'}, {user?.state || 'Maharashtra'} • {user?.farm_size || '15 Acres'} Holding
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowProfileModal(true)}
            className="px-4 py-2 text-xs font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-[#182c25] hover:bg-gray-200 dark:hover:bg-[#203a30] rounded-xl transition flex items-center gap-1.5"
          >
            <User size={15} /> Farm Profile
          </button>
          <Link
            to="/farmer/crops"
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            <Plus size={15} /> Add Crop
          </Link>
          <Link
            to="/farmer/transport"
            className="px-4 py-2 text-xs font-bold text-emerald-900 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-950/70 hover:bg-emerald-200 rounded-xl transition flex items-center gap-1.5 border border-emerald-300/50"
          >
            <Truck size={15} /> Book Hauler
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/farmer/crops"
          className="bg-white dark:bg-[#12211c] rounded-2xl p-5 border border-gray-200 dark:border-[#1e362e] card-hover block transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Total Crops</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <Sprout size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">{crops.length}</div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
            {readyCrops} Ready for Harvest
          </div>
        </Link>

        <Link
          to="/farmer/crops"
          className="bg-white dark:bg-[#12211c] rounded-2xl p-5 border border-gray-200 dark:border-[#1e362e] card-hover block transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Projected Yield</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center">
              <Package size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">
            {(totalHarvest / 1000).toFixed(1)} <span className="text-sm font-semibold text-gray-400">Tons</span>
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">
            {totalHarvest.toLocaleString()} kg Total
          </div>
        </Link>

        <Link
          to="/farmer/transport"
          className="bg-white dark:bg-[#12211c] rounded-2xl p-5 border border-gray-200 dark:border-[#1e362e] card-hover block transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Transport Dispatches</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Truck size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">{requests.length}</div>
          <div className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
            {pendingReqs} Awaiting Driver
          </div>
        </Link>

        <Link
          to="/farmer/deliveries"
          className="bg-white dark:bg-[#12211c] rounded-2xl p-5 border border-gray-200 dark:border-[#1e362e] card-hover block transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Est. Crop Value</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">
            ₹{(estRevenue / 1000).toFixed(0)} <span className="text-sm font-semibold text-gray-400">K</span>
          </div>
          <div className="text-xs text-purple-600 dark:text-purple-400 font-medium mt-1">
            APMC Mandi Wholesale
          </div>
        </Link>
      </div>

      {/* Weather & Real-time Field Conditions */}
      {weather && (
        <div className="bg-gradient-to-r from-emerald-900 via-forest-900 to-[#122b21] rounded-3xl p-6 text-white shadow-lg border border-emerald-800/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center text-amber-400">
                <CloudSun size={32} />
              </div>
              <div>
                <div className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
                  Agri-Weather & Microclimate Advisory
                </div>
                <div className="text-2xl font-extrabold flex items-center gap-2 mt-0.5">
                  {weather.temp}°C <span className="text-sm font-normal text-gray-300">• {weather.condition}</span>
                </div>
                <div className="text-xs text-gray-300 mt-1 max-w-xl">{weather.advisory}</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="bg-white/10 backdrop-blur rounded-xl p-2.5">
                <div className="text-gray-400 text-[10px]">Humidity</div>
                <div className="font-bold text-white text-sm mt-0.5 flex items-center justify-center gap-1">
                  <Droplets size={12} className="text-blue-400" /> {weather.humidity}%
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-2.5">
                <div className="text-gray-400 text-[10px]">Rain Chance</div>
                <div className="font-bold text-white text-sm mt-0.5">{weather.rain_chance}%</div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-2.5">
                <div className="text-gray-400 text-[10px]">Wind Velocity</div>
                <div className="font-bold text-white text-sm mt-0.5 flex items-center justify-center gap-1">
                  <Wind size={12} className="text-cyan-400" /> {weather.wind_kmh} km/h
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Crops, Transport & AI Suggestions */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Crops & Transport */}
        <div className="lg:col-span-8 space-y-6">
          {/* Recent Crops Card */}
          <div className="bg-white dark:bg-[#12211c] rounded-2xl border border-gray-200 dark:border-[#1e362e] p-6 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">Active Farm Crops</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Field management and maturity lifecycle</p>
              </div>
              <Link
                to="/farmer/crops"
                className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                Manage All ({crops.length}) <ChevronRight size={14} />
              </Link>
            </div>

            <div className="space-y-3">
              {crops.slice(0, 4).map(crop => (
                <div
                  key={crop.id}
                  className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-[#162a23] rounded-xl border border-gray-100 dark:border-[#1e362e] transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                      <Sprout size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white">{crop.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {crop.acreage} Acres • Expected: {crop.expected_qty?.toLocaleString()} {crop.unit}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <div className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        Harvest: {crop.expected_harvest || 'TBD'}
                      </div>
                      <div className="text-[10px] text-gray-400">Soil: {crop.soil_type || 'Loamy'}</div>
                    </div>
                    <span className={`status-badge status-${crop.status}`}>
                      {crop.status}
                    </span>
                  </div>
                </div>
              ))}

              {crops.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-xs">
                  No crops recorded. Click "Add Crop" above to begin tracking.
                </div>
              )}
            </div>
          </div>

          {/* Pending Transport Requests */}
          <div className="bg-white dark:bg-[#12211c] rounded-2xl border border-gray-200 dark:border-[#1e362e] p-6 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">Recent Transport Dispatches</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Farm-to-Mandi transit bookings</p>
              </div>
              <Link
                to="/farmer/transport"
                className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                View Dispatches ({requests.length}) <ChevronRight size={14} />
              </Link>
            </div>

            <div className="space-y-3">
              {requests.slice(0, 3).map(req => (
                <div
                  key={req.id}
                  className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-[#162a23] rounded-xl border border-gray-100 dark:border-[#1e362e] transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                      <Truck size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white">
                        {req.crop} • {req.quantity?.toLocaleString()} {req.unit}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {req.pickup} → {req.destination}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        ₹{(req.estimated_cost || 4500).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-gray-400">{req.pickup_date}</div>
                    </div>
                    <span className={`status-badge status-${req.status}`}>
                      {req.status}
                    </span>
                  </div>
                </div>
              ))}

              {requests.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-xs">
                  No transport requests created yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): AI Assistant Quick Bar & Notifications */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick AI Farming Assistant Box */}
          <div className="bg-gradient-to-br from-[#122b21] to-[#183a2d] text-white rounded-3xl p-6 shadow-md border border-emerald-800/40">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-300 mb-2">
              <Sparkles size={14} className="text-amber-400" /> Snapdragon AI Assistant
            </div>
            <h3 className="text-lg font-extrabold text-white">Ask Agronomy Copilot</h3>
            <p className="text-xs text-gray-300 mt-1 mb-4 leading-relaxed">
              Instant local guidance on optimal fertilizer ratios, harvest dates, and mandi pricing.
            </p>

            <div className="space-y-2 mb-4">
              {[
                'When should I harvest my Tomatoes?',
                'Which truck type saves the most fuel?',
                'How to prevent leaf curl in humid weather?'
              ].map((query, i) => (
                <Link
                  key={i}
                  to={`/farmer/assistant?q=${encodeURIComponent(query)}`}
                  className="block text-xs bg-white/10 hover:bg-white/20 p-2.5 rounded-xl border border-white/10 transition text-gray-200"
                >
                  "{query}"
                </Link>
              ))}
            </div>

            <Link
              to="/farmer/assistant"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition"
            >
              Open AI Chat Assistant <ArrowRight size={14} />
            </Link>
          </div>

          {/* Notifications Center */}
          <div className="bg-white dark:bg-[#12211c] rounded-2xl border border-gray-200 dark:border-[#1e362e] p-6 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-emerald-700 dark:text-emerald-400" />
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">Farm Alerts</h3>
              </div>
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                {notifications.length} New
              </span>
            </div>

            <div className="space-y-3">
              {notifications.map(n => (
                <div key={n.id} className="p-3 rounded-xl bg-gray-50 dark:bg-[#162a23] border border-gray-100 dark:border-[#1e362e]">
                  <div className="text-xs font-bold text-gray-900 dark:text-white">{n.title}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{n.message}</div>
                  <div className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                    <Clock size={11} /> {n.time}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Management Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#12211c] rounded-3xl max-w-md w-full p-6 border border-gray-200 dark:border-[#1e362e] shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">Farm Profile Management</h3>
              <button onClick={() => setShowProfileModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={profileForm.full_name}
                  onChange={e => setProfileForm({ ...profileForm, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-forest-800 dark:bg-[#162a23] dark:text-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mobile Contact</label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-forest-800 dark:bg-[#162a23] dark:text-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Village / Taluka</label>
                  <input
                    type="text"
                    value={profileForm.village}
                    onChange={e => setProfileForm({ ...profileForm, village: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-forest-800 dark:bg-[#162a23] dark:text-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Total Acreage</label>
                  <input
                    type="text"
                    value={profileForm.farm_size}
                    onChange={e => setProfileForm({ ...profileForm, farm_size: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-forest-800 dark:bg-[#162a23] dark:text-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2.5 border border-gray-200 dark:border-forest-800 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}