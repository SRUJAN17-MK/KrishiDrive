import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Navigation, MapPin, Clock, CheckCircle2,
  Package, IndianRupee, ShieldCheck, ArrowRight, Loader,
  KeyRound, X, Route as RouteIcon
} from 'lucide-react'
import { api } from '../services/api'
import toast from 'react-hot-toast'

// ─── OTP Modal ────────────────────────────────────────────────────────────────

function OtpModal({ tripId, onSuccess, onClose }) {
  const [otp, setOtp] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (otp.trim().length === 0) return
    setSubmitting(true)
    try {
      await api.post('/transport/complete-delivery', {
        trip_id: Number(tripId),
        delivery_otp: otp.trim()
      })
      toast.success('Delivery confirmed! Trip completed.')
      onSuccess()
    } catch (err) {
      toast.error(err.message || 'OTP verification failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white dark:bg-[#12211c] rounded-2xl border border-gray-200 dark:border-[#1e362e] p-6 w-full max-w-sm shadow-2xl mx-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <KeyRound size={18} className="text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-extrabold text-gray-900 dark:text-white text-base">Enter Delivery OTP</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
          Ask the farmer for the 4-digit PIN they received. Enter it below to confirm delivery completion.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="_ _ _ _"
            autoFocus
            className="w-full text-center font-mono font-black text-3xl tracking-[0.5em] rounded-xl border border-gray-200 dark:border-[#274a3d] bg-gray-50 dark:bg-[#162a23] px-4 py-4 text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#274a3d] text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || otp.length !== 4}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white font-bold rounded-xl text-sm transition"
            >
              {submitting ? <Loader size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
              {submitting ? 'Verifying…' : 'Confirm Delivery'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function DriverTrips() {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [otpTripId, setOtpTripId] = useState(null)

  useEffect(() => {
    fetchTrips()
  }, [])

  const fetchTrips = async () => {
    try {
      setLoading(true)
      const data = await api.trips.list()
      setTrips(data || [])
    } catch (err) {
      toast.error('Failed to load trips')
    } finally {
      setLoading(false)
    }
  }

  const nextStatus = {
    scheduled: 'pickup',
    pickup: 'loading',
    loading: 'in_transit',
    in_transit: 'completed'
  }

  const updateStatus = async (tripId, status) => {
    try {
      await api.trips.update(tripId, { status })
      toast.success(`Trip status moved to ${status.replace('_', ' ')}`)
      fetchTrips()
    } catch (err) {
      toast.error(err.message || 'Status update failed')
    }
  }

  return (
    <>
      {/* OTP Modal */}
      {otpTripId !== null && (
        <OtpModal
          tripId={otpTripId}
          onSuccess={() => { setOtpTripId(null); fetchTrips() }}
          onClose={() => setOtpTripId(null)}
        />
      )}

      <div className="space-y-6 fade-in max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
            Freight Trip Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Update trip milestones, log completed runs, and track direct driver earnings.
          </p>
        </div>

        <div className="space-y-4">
          {trips.map(trip => (
            <div
              key={trip.id}
              className="bg-white dark:bg-[#12211c] rounded-2xl border border-gray-200 dark:border-[#1e362e] p-6 card-hover shadow-sm transition-colors"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold flex-shrink-0">
                    <Navigation size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-gray-900 dark:text-white text-base">
                        Trip #{trip.id}: {trip.cargo || 'Agricultural Consignment'}
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

                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mt-2">
                      <span>Distance: <strong className="text-gray-700 dark:text-gray-300">{trip.distance_km} km</strong></span>
                      <span>•</span>
                      <span>Vehicle: {trip.vehicle}</span>
                      <span>•</span>
                      <span>Fuel: ~{trip.fuel_estimate || 45}L</span>
                      {trip.eta_hours && (
                        <span>• ETA: <strong className="text-emerald-600 dark:text-emerald-400">{trip.eta_hours}h</strong></span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 self-end lg:self-center">
                  <div className="text-right">
                    <div className="text-base font-black text-emerald-700 dark:text-emerald-400">
                      ₹{(trip.earnings || 3500).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-gray-400">Driver Realization</div>
                  </div>

                  <Link
                    to={`/driver/routes?pickup=${encodeURIComponent(trip.pickup)}&destination=${encodeURIComponent(trip.destination)}`}
                    className="px-3.5 py-2 border border-gray-200 dark:border-[#274a3d] hover:border-emerald-500 bg-white dark:bg-[#162a23] text-gray-700 dark:text-gray-200 font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm"
                  >
                    <RouteIcon size={14} className="text-emerald-600" /> Route Map
                  </Link>

                  {/* For in_transit: OTP button instead of generic advance */}
                  {trip.status === 'in_transit' ? (
                    <button
                      onClick={() => setOtpTripId(trip.id)}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow"
                    >
                      <KeyRound size={14} /> Enter OTP &amp; Complete Delivery
                    </button>
                  ) : nextStatus[trip.status] ? (
                    <button
                      onClick={() => updateStatus(trip.id, nextStatus[trip.status])}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow"
                    >
                      <CheckCircle2 size={14} /> Advance to {nextStatus[trip.status]?.replace('_', ' ')}
                    </button>
                  ) : null}

                  {trip.status === 'completed' && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 size={14} /> Completed &amp; Paid
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {trips.length === 0 && !loading && (
            <div className="bg-white dark:bg-[#12211c] rounded-2xl p-12 text-center border border-gray-200 dark:border-[#1e362e]">
              <Navigation size={48} className="mx-auto text-blue-400/40 mb-3" />
              <h3 className="font-bold text-gray-800 dark:text-gray-200 text-base">No recorded trips</h3>
              <p className="text-xs text-gray-500 mt-1">Accept an available farm request to launch a scheduled delivery.</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
