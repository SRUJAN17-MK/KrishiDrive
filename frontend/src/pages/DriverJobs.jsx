import React, { useState, useEffect } from 'react'
import {
  Truck, MapPin, IndianRupee, Check, Filter,
  Calendar, Clock, User, Phone, ShieldCheck, X
} from 'lucide-react'
import { api } from '../services/api'
import toast from 'react-hot-toast'

export default function DriverJobs() {
  const [jobs, setJobs] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchJobsAndVehicles()
  }, [])

  const fetchJobsAndVehicles = async () => {
    try {
      setLoading(true)
      const [rData, vData] = await Promise.all([
        api.transport.requests().catch(() => []),
        api.vehicles.list().catch(() => [])
      ])
      setJobs(rData || [])
      setVehicles(vData || [])
    } catch (err) {
      toast.error('Failed to load transport jobs')
    } finally {
      setLoading(false)
    }
  }

  const acceptJob = async (job) => {
    try {
      const myVehicle = vehicles[0]
      if (!myVehicle) {
        return toast.error('No registered vehicle found on your driver account')
      }
      await api.transport.accept({
        request_id: job.id,
        vehicle_id: myVehicle.id
      })
      toast.success(`Job ${job.id} accepted! Trip generated.`)
      const updated = await api.transport.requests()
      setJobs(updated)
    } catch (err) {
      toast.error(err.message || 'Failed to accept job')
    }
  }

  const rejectJob = async (jobId) => {
    try {
      await api.transport.reject({ request_id: jobId })
      setJobs(jobs.filter(j => j.id !== jobId))
      toast.success('Job skipped')
    } catch (err) {
      toast.error('Failed to pass job')
    }
  }

  const filtered = filter === 'all' ? jobs : jobs.filter(j => j.status === filter)

  return (
    <div className="space-y-6 fade-in max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
          Available Agricultural Freight Jobs
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
          Pick up verified farmer dispatches, fill empty return routes, and earn fair freight tariffs.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'all', label: 'All Requests' },
          { id: 'pending', label: 'Available (Pending)' },
          { id: 'matched', label: 'My Assigned Jobs' },
          { id: 'delivered', label: 'Completed' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              filter === tab.id
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white dark:bg-[#12211c] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-[#1e362e] hover:bg-gray-100 dark:hover:bg-[#1c352c]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Jobs Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map(job => (
          <div
            key={job.id}
            className="bg-white dark:bg-[#12211c] rounded-2xl border border-gray-200 dark:border-[#1e362e] p-5 card-hover flex flex-col justify-between transition-colors shadow-sm"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                    <Truck size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-base">
                      {job.crop} • {job.quantity?.toLocaleString()} {job.unit}
                    </h3>
                    <div className="text-[11px] text-gray-400">Request #{job.id} • Farmer: {job.farmer_name || job.farmer}</div>
                  </div>
                </div>

                <span className={`status-badge status-${job.status}`}>
                  {job.status}
                </span>
              </div>

              <div className="bg-gray-50 dark:bg-[#162a23] p-3.5 rounded-xl border border-gray-100 dark:border-[#1e362e] space-y-2 text-xs text-gray-600 dark:text-gray-300 my-3">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span className="truncate">{job.pickup}</span>
                  <span className="text-gray-400">→</span>
                  <span className="font-bold text-gray-900 dark:text-white truncate">{job.destination}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 pt-1">
                  <span>Target Class: <strong>{job.vehicle_type || 'Truck'}</strong></span>
                  <span>Pickup: <strong>{job.pickup_date || 'Flexible'}</strong></span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 dark:border-[#1e362e] flex items-center justify-between">
              <div>
                <div className="text-base font-black text-emerald-700 dark:text-emerald-400">
                  ₹{(job.estimated_cost || Math.round(job.quantity * 0.8 + 1500)).toLocaleString()}
                </div>
                <div className="text-[10px] text-gray-400">Direct Haul Tariff</div>
              </div>

              {job.status === 'pending' ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => rejectJob(job.id)}
                    className="px-3 py-2 text-xs font-bold text-gray-500 hover:text-red-600 bg-gray-100 dark:bg-gray-800 rounded-xl transition flex items-center gap-1"
                  >
                    <X size={14} /> Pass
                  </button>
                  <button
                    onClick={() => acceptJob(job)}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow transition"
                  >
                    <Check size={14} /> Accept Job
                  </button>
                </div>
              ) : (
                <span className="text-xs text-gray-400 font-medium">Assigned to {job.driver || 'Driver'}</span>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && !loading && (
          <div className="col-span-2 bg-white dark:bg-[#12211c] rounded-2xl p-12 text-center border border-gray-200 dark:border-[#1e362e]">
            <Truck size={48} className="mx-auto text-amber-500/40 mb-3" />
            <h3 className="font-bold text-gray-800 dark:text-gray-200 text-base">No transport requests match this filter</h3>
            <p className="text-xs text-gray-500 mt-1">Check back soon as farmers post ongoing harvest dispatches.</p>
          </div>
        )}
      </div>
    </div>
  )
}