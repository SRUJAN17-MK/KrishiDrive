import React, { useState, useEffect } from 'react'
import {
  Package, Truck, MapPin, Clock, CheckCircle2,
  Navigation, Phone, ShieldCheck, AlertCircle, ArrowRight,
  Lock, KeyRound, Route as RouteIcon, ChevronDown, ChevronUp, Loader
} from 'lucide-react'
import { api } from '../services/api'
import RouteMap from '../components/RouteMap'
import toast from 'react-hot-toast'

export default function FarmerDeliveries() {
  const [trips, setTrips] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [openMapTripId, setOpenMapTripId] = useState(null)
  const [routeCache, setRouteCache] = useState({})
  const [routeLoading, setRouteLoading] = useState(false)

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

  const toggleTripMap = async (trip) => {
    if (openMapTripId === trip.id) {
      setOpenMapTripId(null)
      return
    }

    setOpenMapTripId(trip.id)
    if (routeCache[trip.id]) return

    setRouteLoading(true)
    try {
      const data = await api.ai.routeOptimization({
        pickup: trip.pickup,
        destination: trip.destination
      })
      setRouteCache((prev) => ({ ...prev, [trip.id]: data }))
    } catch (err) {
      toast.error('Unable to fetch live road route for map')
    } finally {
      setRouteLoading(false)
    }
  }

  const statusSteps = ['scheduled', 'pickup', 'loading', 'in_transit', 'completed']

  const getStepProgress = (status) => {
    const idx = statusSteps.indexOf(status)
    return idx === -1 ? 0 : idx
  }

  return (
    <div className="space-y-6 fade-in max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-[#F8FAFC]">
          Live Mandi Transit &amp; Deliveries
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-[#A7B4C5] mt-1">
          Monitor your dispatched produce in real-time with road route mapping from farm gate to market terminal.
        </p>
      </div>

      <div className="space-y-5">
        {trips.map((trip) => {
          const req = requests.find((r) => r.id === trip.request)
          const currentStep = getStepProgress(trip.status)
          const isMapOpen = openMapTripId === trip.id
          const cachedRoute = routeCache[trip.id]

          return (
            <div
              key={trip.id}
              className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-200 dark:border-[#1E293B] p-6 card-hover shadow-sm transition-colors"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-[#1E293B]">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#064FAE]/15 text-[#0785E8] flex items-center justify-center font-bold flex-shrink-0">
                    <Truck size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-gray-900 dark:text-[#F8FAFC] text-base">
                        Trip #{trip.id}: {trip.cargo || req?.crop || 'Produce'}
                      </h3>
                      <span className={`status-badge status-${trip.status}`}>
                        {trip.status?.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-[#A7B4C5] mt-1">
                      <MapPin size={13} className="text-[#0785E8]" />
                      <span>{trip.pickup}</span>
                      <span className="text-gray-400">→</span>
                      <span className="font-bold text-gray-900 dark:text-white">{trip.destination}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-[#A7B4C5] mt-2">
                      <span>Hauler ID: <strong className="text-gray-800 dark:text-gray-200">{trip.driver}</strong></span>
                      <span>•</span>
                      <span>Vehicle: {trip.vehicle}</span>
                      <span>•</span>
                      <span>Distance: {trip.distance_km} km</span>
                      {trip.eta_hours && (
                        <span>• Estimated Duration: <strong className="text-[#0785E8]">{trip.eta_hours} Hours</strong></span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-3">
                  <div className="text-left lg:text-right">
                    <div className="text-lg font-black text-[#FF9800]">
                      ₹{(trip.earnings || req?.estimated_cost || 4500).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-gray-400 dark:text-[#A7B4C5]">Total Transit Fee</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleTripMap(trip)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-[#1E293B] hover:border-[#0785E8] bg-white dark:bg-[#07172F] text-xs font-bold text-gray-700 dark:text-[#A7B4C5] shadow-sm transition"
                  >
                    <RouteIcon size={14} className="text-[#0785E8]" />
                    <span>{isMapOpen ? 'Hide Map' : 'View Route Map'}</span>
                    {isMapOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
              </div>

              {/* Collapsible Leaflet Route Map */}
              {isMapOpen && (
                <div className="pt-4 border-b border-gray-100 dark:border-[#1E293B] pb-4">
                  {routeLoading && !cachedRoute ? (
                    <div className="flex items-center justify-center p-8 gap-2 text-xs text-gray-500 dark:text-[#A7B4C5]">
                      <Loader size={16} className="animate-spin text-[#0785E8]" />
                      Loading road route map…
                    </div>
                  ) : (
                    <RouteMap
                      geometry={cachedRoute?.geometry || []}
                      alternatives={cachedRoute?.alternatives || []}
                      pickup={trip.pickup}
                      destination={trip.destination}
                      height={280}
                      label={`Trip #${trip.id}: ${trip.pickup} to ${trip.destination}`}
                    />
                  )}
                </div>
              )}

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
                              ? 'bg-[#FF9800] text-[#07172F] ring-4 ring-[#FF9800]/20 scale-110 shadow-md font-extrabold'
                              : isDone
                              ? 'bg-[#064FAE]/20 text-[#0785E8]'
                              : 'bg-gray-100 dark:bg-[#07172F] text-gray-400 dark:text-[#A7B4C5]'
                          }`}
                        >
                          {isDone ? <CheckCircle2 size={16} /> : idx + 1}
                        </div>
                        <span
                          className={`text-[11px] font-semibold mt-2 capitalize hidden sm:block ${
                            isCurrent
                              ? 'text-[#FF9800] font-bold'
                              : isDone
                              ? 'text-gray-800 dark:text-gray-200'
                              : 'text-gray-400 dark:text-[#A7B4C5]'
                          }`}
                        >
                          {step.replace('_', ' ')}
                        </span>
                      </div>
                    )
                  })}

                  {/* Progress Line */}
                  <div className="absolute top-4.5 left-4 right-4 h-1 bg-gray-200 dark:bg-[#07172F] -z-0">
                    <div
                      className="h-full bg-[#FF9800] transition-all duration-500"
                      style={{ width: `${(currentStep / (statusSteps.length - 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Delivery OTP Section — shown only when in_transit */}
              {trip.status === 'in_transit' && (
                <div className="mt-5 rounded-xl border border-[#FF9800]/40 bg-[#FF9800]/10 p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#FF9800]/20 flex items-center justify-center shrink-0">
                    <KeyRound size={18} className="text-[#FF9800]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-900 dark:text-[#F8FAFC] mb-1">
                      Delivery OTP
                    </p>
                    {trip.delivery_otp ? (
                      <>
                        <div className="inline-flex items-center gap-2 bg-white dark:bg-[#07172F] border border-[#FF9800] rounded-lg px-4 py-2 mb-2">
                          <Lock size={14} className="text-[#FF9800]" />
                          <span className="font-mono font-black text-2xl tracking-[0.3em] text-[#FF9800] select-all">
                            {trip.delivery_otp}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-[#A7B4C5] leading-relaxed">
                          Share this 4-digit PIN with your driver upon physical arrival and produce inspection.
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-gray-500 dark:text-[#A7B4C5] italic">
                        OTP will appear once driver accepts the job.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {trips.length === 0 && !loading && (
          <div className="bg-white dark:bg-[#111827] rounded-2xl p-12 text-center border border-gray-200 dark:border-[#1E293B]">
            <Package size={48} className="mx-auto text-[#0785E8]/40 mb-3" />
            <h3 className="font-bold text-gray-800 dark:text-gray-200 text-base">No active delivery transits</h3>
            <p className="text-xs text-gray-500 dark:text-[#A7B4C5] mt-1">When a driver confirms your transport dispatch, the real-time tracking will appear here.</p>
          </div>
        )}
      </div>
    </div>
  )
}
