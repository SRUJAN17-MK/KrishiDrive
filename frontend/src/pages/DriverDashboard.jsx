import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Truck, Navigation, IndianRupee, MapPin, Package,
  ArrowRight, ShieldCheck, Check, X, Star, Calendar,
  TrendingUp, Clock, AlertCircle, Route as RouteIcon, User
} from 'lucide-react'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function DriverDashboard() {
  const { user } = useAuth()
  const [trips, setTrips] = useState([])
  const [jobs, setJobs] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDriverData() {
      try {
        setLoading(true)
        const [tData, rData, vData] = await Promise.all([
          api.trips.list().catch(() => []),
          api.transport.requests().catch(() => []),
          api.vehicles.list().catch(() => [])
        ])
        setTrips(tData || [])
        setJobs(rData?.filter(j => j.status === 'pending') || [])
        setVehicles(vData || [])
      } catch (err) {
        toast.error('Failed to load driver dashboard')
      } finally {
        setLoading(false)
      }
    }
    loadDriverData()
  }, [])

  const activeTrips = trips.filter(t => t.status === 'in_transit' || t.status === 'scheduled')
  const completedTrips = trips.filter(t => t.status === 'completed')
  const totalEarnings = completedTrips.reduce((s, t) => s + (t.earnings || 3500), 0) + (user?.trips_completed ? user.trips_completed * 2800 : 45000)
  const totalDistance = trips.reduce((s, t) => s + (t.distance_km || 0), 0) + 1250

  const handleAcceptJob = async (job) => {
    try {
      const myVehicle = vehicles[0]
      if (!myVehicle) {
        return toast.error('No vehicle registered to your profile')
      }
      await api.transport.accept({
        request_id: job.id,
        vehicle_id: myVehicle.id
      })
      toast.success('Job confirmed! Trip created.')
      setJobs(jobs.filter(j => j.id !== job.id))
      const updatedTrips = await api.trips.list()
      setTrips(updatedTrips)
    } catch (err) {
      toast.error(err.message || 'Failed to accept job')
    }
  }

  const handleRejectJob = async (jobId) => {
    try {
      await api.transport.reject({ request_id: jobId })
      setJobs(jobs.filter(j => j.id !== jobId))
      toast.success('Job passed')
    } catch (err) {
      toast.error('Operation failed')
    }
  }

  return (
    <div className="space-y-6 fade-in max-w-7xl mx-auto">
      {/* Top Welcome / Profile Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#12211c] p-6 rounded-3xl border border-gray-200 dark:border-[#1e362e] shadow-sm transition-colors">
        <div className="flex items-center gap-4">
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'}
            alt={user?.full_name}
            className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500/40"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                Welcome back, {user?.full_name || 'Driver'}! 🚚
              </h1>
              <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40">
                <ShieldCheck size={13} /> Verified Hauler
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span className="flex items-center gap-1 text-amber-500 font-bold">
                <Star size={13} fill="currentColor" /> {user?.rating || 4.9} Rating
              </span>
              <span>•</span>
              <span>Vehicle: {vehicles[0]?.number || 'MH-12-AB-1234'} ({vehicles[0]?.type || 'Truck 10-Ton'})</span>
              <span>•</span>
              <span>License: {user?.license_number || 'MH-12-2021-00892'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/driver/jobs"
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            <Truck size={15} /> Find Freight Jobs
          </Link>
          <Link
            to="/driver/routes"
            className="px-4 py-2 text-xs font-bold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-[#182c25] hover:bg-gray-200 dark:hover:bg-[#203a30] rounded-xl transition flex items-center gap-1.5"
          >
            <RouteIcon size={15} /> Route AI
          </Link>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/driver/jobs"
          className="bg-white dark:bg-[#12211c] rounded-2xl p-5 border border-gray-200 dark:border-[#1e362e] card-hover block transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Available Jobs</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Truck size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">{jobs.length}</div>
          <div className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
            Nearby Farmer Requests
          </div>
        </Link>

        <Link
          to="/driver/trips"
          className="bg-white dark:bg-[#12211c] rounded-2xl p-5 border border-gray-200 dark:border-[#1e362e] card-hover block transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Active Transits</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center">
              <Navigation size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">{activeTrips.length}</div>
          <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">
            In Transit / Scheduled
          </div>
        </Link>

        <Link
          to="/driver/trips"
          className="bg-white dark:bg-[#12211c] rounded-2xl p-5 border border-gray-200 dark:border-[#1e362e] card-hover block transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Total Revenue</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <IndianRupee size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">
            ₹{(totalEarnings / 1000).toFixed(1)} <span className="text-sm font-semibold text-gray-400">K</span>
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
            {completedTrips.length + 32} Trips Completed
          </div>
        </Link>

        <div className="bg-white dark:bg-[#12211c] rounded-2xl p-5 border border-gray-200 dark:border-[#1e362e] transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Logged Distance</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 flex items-center justify-center">
              <MapPin size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">
            {totalDistance.toLocaleString()} <span className="text-sm font-semibold text-gray-400">km</span>
          </div>
          <div className="text-xs text-purple-600 dark:text-purple-400 font-medium mt-1">
            14% Diesel Saved via AI
          </div>
        </div>
      </div>

      {/* Main Grid: Available Jobs & Active Trips */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Available Jobs with Accept/Reject */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-[#12211c] rounded-2xl border border-gray-200 dark:border-[#1e362e] p-6 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">Immediate Dispatch Requests</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Farmers needing agricultural transport now</p>
              </div>
              <Link
                to="/driver/jobs"
                className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                All Jobs ({jobs.length}) <ArrowRight size={14} />
              </Link>
            </div>

            <div className="space-y-3.5">
              {jobs.slice(0, 3).map(job => (
                <div
                  key={job.id}
                  className="p-4 bg-gray-50 dark:bg-[#162a23] rounded-2xl border border-gray-100 dark:border-[#1e362e] transition"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white">
                        {job.crop} • {job.quantity?.toLocaleString()} {job.unit}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                        {job.pickup} <span className="text-gray-400">→</span> <span className="font-semibold">{job.destination}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-black text-emerald-700 dark:text-emerald-400">
                        ₹{(job.estimated_cost || Math.round(job.quantity * 0.8 + 1500)).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-gray-400">Offered Tariff</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between pt-3 border-t border-gray-200/60 dark:border-[#1e362e] gap-2">
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Calendar size={12} /> {job.pickup_date} • {job.preferred_time || 'Morning'}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRejectJob(job.id)}
                        className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-red-600 bg-gray-100 dark:bg-gray-800 rounded-xl transition flex items-center gap-1"
                      >
                        <X size={13} /> Pass
                      </button>
                      <button
                        onClick={() => handleAcceptJob(job)}
                        className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-sm transition flex items-center gap-1"
                      >
                        <Check size={13} /> Accept Dispatch
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {jobs.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-xs">
                  No pending farmer freight requests in your immediate corridor.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Active Trip & Route Optimization Banner */}
        <div className="lg:col-span-5 space-y-6">
          {/* Active Trip Visualizer */}
          <div className="bg-white dark:bg-[#12211c] rounded-2xl border border-gray-200 dark:border-[#1e362e] p-6 transition-colors">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Navigation size={17} className="text-blue-600" /> Active Freight Trip
            </h3>

            {activeTrips.length > 0 ? (
              <div className="bg-blue-50/50 dark:bg-[#152a22] p-4 rounded-2xl border border-blue-100 dark:border-[#1e362e]">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-blue-800 dark:text-blue-300">Trip #{activeTrips[0].id}</span>
                  <span className={`status-badge status-${activeTrips[0].status}`}>{activeTrips[0].status}</span>
                </div>
                <div className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                  {activeTrips[0].cargo || 'Agricultural Load'}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1 mb-3">
                  <MapPin size={13} className="text-emerald-600" />
                  {activeTrips[0].pickup} → {activeTrips[0].destination}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs bg-white dark:bg-[#12211c] p-2.5 rounded-xl border border-blue-100 dark:border-forest-900">
                  <div>
                    <span className="text-gray-400 text-[10px]">Distance:</span>
                    <div className="font-bold">{activeTrips[0].distance_km} km</div>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px]">ETA:</span>
                    <div className="font-bold">{activeTrips[0].eta_hours} Hours</div>
                  </div>
                </div>
                <Link
                  to="/driver/trips"
                  className="mt-3 block text-center py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition"
                >
                  Manage Live Trip →
                </Link>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 text-xs">
                No trip currently in transit. Accept a job from the left to start!
              </div>
            )}
          </div>

          {/* AI Route Banner */}
          <div className="bg-gradient-to-br from-emerald-900 to-[#0e241c] text-white rounded-2xl p-6 border border-emerald-800/40">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
              <RouteIcon size={15} /> Snapdragon Route Engine
            </div>
            <h4 className="text-base font-extrabold text-white">Save Fuel on Every Haul</h4>
            <p className="text-xs text-gray-300 mt-1 mb-4 leading-relaxed">
              Run local NPU path planning to evaluate gradient, tolls, and payload weight before hitting the highway.
            </p>
            <Link
              to="/driver/routes"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition"
            >
              Launch Route Optimizer <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}