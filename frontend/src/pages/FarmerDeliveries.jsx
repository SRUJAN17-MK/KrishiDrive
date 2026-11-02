import React, { useState, useEffect } from 'react'
import {
  Package, Truck, MapPin, Clock, CheckCircle2,
  Navigation, Phone, ShieldCheck, AlertCircle, ArrowRight
} from 'lucide-react'
import { api } from '../services/api'
import toast from 'react-hot-toast'

export default function FarmerDeliveries() {
  const [trips, setTrips] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const [tData, rData] = await Promise.all([
          api.trips.list().catch(() => []),
          api.transport.requests().catch(() => [])
        ])
        setTrips(tData || [])
        setRequests(rData || [])
      } catch (err) {
        toast.error('Failed to load active delivery trips')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const statusSteps = ['scheduled', 'pickup', 'loading', 'in_transit', 'completed']

  const getStepProgress = (status) => {
    const idx = statusSteps.indexOf(status)
    return idx === -1 ? 0 : idx
  }

  return (
    <div className="space-y-6 fade-in max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
          Live Mandi Transit & Deliveries
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
          Monitor your dispatched produce in real-time from farm gate to market terminal.
        </p>
      </div>

      <div className="space-y-5">
        {trips.map(trip => {
          const req = requests.find(r => r.id === trip.request)
          const currentStep = getStepProgress(trip.status)

          return (
            <div
              key={trip.id}
              className="bg-white dark:bg-[#12211c] rounded-2xl border border-gray-200 dark:border-[#1e362e] p-6 card-hover shadow-sm transition-colors"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-[#1e362e]">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <Truck size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-gray-900 dark:text-white text-base">
                        Trip #{trip.id}: {trip.cargo || req?.crop || 'Produce'}
                      </h3>
                      <span className={`status-badge status-${trip.status}`}>
                        {trip.status?.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 mt-1">
                      <MapPin size={13} className="text-emerald-600 dark:text-emerald-400" />
                      <span>{trip.pickup}</span>
                      <span className="text-gray-400">→</span>
                      <span className="font-bold text-gray-900 dark:text-white">{trip.destination}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-2">
                      <span>Hauler ID: <strong className="text-gray-800 dark:text-gray-200">{trip.driver}</strong></span>
                      <span>•</span>
                      <span>Vehicle: {trip.vehicle}</span>
                      <span>•</span>
                      <span>Distance: {trip.distance_km} km</span>
                      {trip.eta_hours && (
                        <span>• Estimated Duration: <strong className="text-emerald-600 dark:text-emerald-400">{trip.eta_hours} Hours</strong></span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right flex lg:flex-col items-center lg:items-end justify-between gap-2">
                  <div>
                    <div className="text-lg font-black text-emerald-700 dark:text-emerald-400">
                      ₹{(trip.earnings || req?.estimated_cost || 4500).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-gray-400">Total Transit Fee</div>
                  </div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <ShieldCheck size={14} /> Transit Insured
                  </div>
                </div>
              </div>

              {/* Progress Milestones */}
              <div className="pt-6">
                <div className="flex items-center justify-between relative">
                  {statusSteps.map((step, idx) => {
                    const isDone = idx <= currentStep
                    const isCurrent = idx === currentStep

                    return (
                      <div key={step} className="flex flex-col items-center relative z-10">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            isCurrent
                              ? 'bg-emerald-600 text-white ring-4 ring-emerald-200 dark:ring-emerald-950 scale-110 shadow-md'
                              : isDone
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                          }`}
                        >
                          {isDone ? <CheckCircle2 size={16} /> : idx + 1}
                        </div>
                        <span
                          className={`text-[11px] font-semibold mt-2 capitalize hidden sm:block ${
                            isCurrent
                              ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                              : isDone
                              ? 'text-gray-800 dark:text-gray-200'
                              : 'text-gray-400'
                          }`}
                        >
                          {step.replace('_', ' ')}
                        </span>
                      </div>
                    )
                  })}

                  {/* Progress Line */}
                  <div className="absolute top-4.5 left-4 right-4 h-1 bg-gray-200 dark:bg-gray-800 -z-0">
                    <div
                      className="h-full bg-emerald-600 transition-all duration-500"
                      style={{ width: `${(currentStep / (statusSteps.length - 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {trips.length === 0 && !loading && (
          <div className="bg-white dark:bg-[#12211c] rounded-2xl p-12 text-center border border-gray-200 dark:border-[#1e362e]">
            <Package size={48} className="mx-auto text-emerald-400/40 mb-3" />
            <h3 className="font-bold text-gray-800 dark:text-gray-200 text-base">No active delivery transits</h3>
            <p className="text-xs text-gray-500 mt-1">When a driver confirms your transport dispatch, the real-time tracking will appear here.</p>
          </div>
        )}
      </div>
    </div>
  )
}