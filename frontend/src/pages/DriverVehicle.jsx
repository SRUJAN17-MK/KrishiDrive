import React, { useState, useEffect } from 'react'
import {
  Truck, Calendar, Shield, Wrench, AlertCircle,
  CheckCircle2, Fuel, Gauge, FileCheck
} from 'lucide-react'
import { api } from '../services/api'
import toast from 'react-hot-toast'

export default function DriverVehicle() {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadVehicles() {
      try {
        setLoading(true)
        const data = await api.vehicles.list()
        setVehicles(data || [])
      } catch (err) {
        toast.error('Failed to load vehicle details')
      } finally {
        setLoading(false)
      }
    }
    loadVehicles()
  }, [])

  return (
    <div className="space-y-6 fade-in max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-[#F8FAFC]">
          Vehicle Profile & Commercial Compliance
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-[#A7B4C5] mt-1">
          Registered fleet specifications, capacity ratings, and insurance renewal status.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {vehicles.map(v => (
          <div
            key={v.id}
            className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-200 dark:border-[#1E293B] p-6 card-hover shadow-sm transition-colors"
          >
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-[#1E293B] mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#FF9800]/15 text-[#FF9800] flex items-center justify-center font-bold">
                  <Truck size={24} />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 dark:text-white text-lg">{v.number}</h3>
                  <div className="text-xs text-gray-500 dark:text-[#A7B4C5]">{v.type} • ID: {v.id}</div>
                </div>
              </div>

              <span className={`status-badge status-${v.status}`}>
                {v.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs mb-4">
              <div className="bg-gray-50 dark:bg-[#07172F] p-3 rounded-xl border border-gray-100 dark:border-[#1E293B]">
                <div className="text-gray-400 dark:text-[#A7B4C5] text-[10px] uppercase font-bold flex items-center gap-1">
                  <Gauge size={11} className="text-[#0785E8]" /> Rated Capacity
                </div>
                <div className="text-base font-extrabold text-gray-900 dark:text-white mt-1">
                  {v.capacity?.toLocaleString()} kg
                </div>
                <div className="text-[10px] text-gray-400 dark:text-[#A7B4C5] mt-0.5">Agricultural Bulk Freight</div>
              </div>

              <div className="bg-gray-50 dark:bg-[#07172F] p-3 rounded-xl border border-gray-100 dark:border-[#1E293B]">
                <div className="text-gray-400 dark:text-[#A7B4C5] text-[10px] uppercase font-bold flex items-center gap-1">
                  <Fuel size={11} className="text-[#0785E8]" /> Fuel Type
                </div>
                <div className="text-base font-extrabold text-gray-900 dark:text-white mt-1">
                  {v.fuel_type}
                </div>
                <div className="text-[10px] text-gray-400 dark:text-[#A7B4C5] mt-0.5">Heavy Commercial Grade</div>
              </div>

              <div className="bg-gray-50 dark:bg-[#07172F] p-3 rounded-xl border border-gray-100 dark:border-[#1E293B]">
                <div className="text-gray-400 dark:text-[#A7B4C5] text-[10px] uppercase font-bold">Total Odometer</div>
                <div className="text-base font-extrabold text-gray-900 dark:text-white mt-1">
                  {v.mileage?.toLocaleString()} km
                </div>
                <div className="text-[10px] text-gray-400 dark:text-[#A7B4C5] mt-0.5">Next service in 2,500 km</div>
              </div>

              <div className="bg-gray-50 dark:bg-[#07172F] p-3 rounded-xl border border-gray-100 dark:border-[#1E293B]">
                <div className="text-gray-400 dark:text-[#A7B4C5] text-[10px] uppercase font-bold flex items-center gap-1">
                  <Wrench size={11} className="text-[#FF9800]" /> Last Service
                </div>
                <div className="text-base font-extrabold text-gray-900 dark:text-white mt-1">
                  {v.last_service || '2026-01-10'}
                </div>
                <div className="text-[10px] text-[#0785E8] font-semibold mt-0.5">Authorized Center</div>
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-[#1E293B] text-xs">
              <div className="flex items-center justify-between text-gray-600 dark:text-[#A7B4C5]">
                <span className="flex items-center gap-1.5"><Shield size={14} className="text-[#0785E8]" /> Commercial Insurance:</span>
                <span className="font-bold text-gray-900 dark:text-white">Valid until {v.insurance_valid}</span>
              </div>
              <div className="flex items-center justify-between text-gray-600 dark:text-[#A7B4C5]">
                <span className="flex items-center gap-1.5"><FileCheck size={14} className="text-[#0785E8]" /> National Highway Permit:</span>
                <span className="font-bold text-gray-900 dark:text-white">{v.permit_type || 'All India Goods'}</span>
              </div>
            </div>
          </div>
        ))}

        {vehicles.length === 0 && !loading && (
          <div className="col-span-2 bg-white dark:bg-[#111827] rounded-2xl p-12 text-center border border-gray-200 dark:border-[#1E293B]">
            <Truck size={48} className="mx-auto text-[#FF9800]/40 mb-3" />
            <h3 className="font-bold text-gray-800 dark:text-gray-200 text-base">No registered vehicle linked</h3>
            <p className="text-xs text-gray-500 dark:text-[#A7B4C5] mt-1">Please contact platform administration to assign a commercial freight vehicle.</p>
          </div>
        )}
      </div>
    </div>
  )
}