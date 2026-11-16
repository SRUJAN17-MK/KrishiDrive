import React, { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { UserPlus, Sprout, Truck, ShieldCheck, ArrowRight, Eye, EyeOff, MapPin, Phone, Mail, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const [searchParams] = useSearchParams()
  const initialRole = searchParams.get('role') === 'driver' ? 'driver' : 'farmer'

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role: initialRole,
    village: '',
    state: 'Karnataka',
    phone: '',
    vehicle_type: 'Eicher Pro 2049 (2.5T)',
    vehicle_number: 'KA-05-MC-8821'
  })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await api.auth.register(form)
      login(data.user, data.access_token)
      toast.success(`Account created! Welcome to KrishiDrive, ${data.user.full_name || data.user.username}!`)
      navigate(form.role === 'driver' ? '/driver' : '/farmer')
    } catch (err) {
      toast.error(err.message || 'Registration failed. Please check inputs.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07172F] flex flex-col justify-center py-10 sm:px-6 lg:px-8 text-gray-800 dark:text-gray-100 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center px-4">
        <Link to="/" className="inline-flex items-center gap-3 group mb-4">
          <div className="w-12 h-12 rounded-2xl gradient-navy flex items-center justify-center text-white shadow-lg shadow-midnight-950/40 group-hover:scale-105 transition-transform">
            <Sprout size={26} className="text-amber" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5 font-black text-2xl tracking-tight text-gray-900 dark:text-white">
              <span>Krishi</span>
              <span className="text-bright">Drive</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber/20 text-amber-700 dark:text-amber-300 font-bold">3.0</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-muted">Smart Farming. Smarter Transport.</p>
          </div>
        </Link>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          Join India's Agri-Mobility Network
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-muted">
          Create an account to streamline harvest logistics or earn on return trips
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl px-4">
        <div className="bg-white dark:bg-[#111827] py-8 px-6 sm:px-10 shadow-xl rounded-3xl border border-gray-200 dark:border-[#1E293B]">
          
          {/* Role selector */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-gray-500 dark:text-muted uppercase tracking-wider mb-2">
              Select Your Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, role: 'farmer' })}
                className={`p-3.5 rounded-2xl border-2 flex items-center justify-center gap-3 transition cursor-pointer ${
                  form.role === 'farmer'
                    ? 'border-electric bg-electric/10 text-electric dark:border-bright dark:bg-electric/25 dark:text-bright font-bold shadow-xs'
                    : 'border-gray-200 dark:border-[#1E293B] text-gray-600 dark:text-muted hover:border-gray-300'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${form.role === 'farmer' ? 'bg-electric text-white' : 'bg-gray-100 dark:bg-[#07172F]'}`}>
                  <Sprout size={18} />
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold">Farmer / Producer</div>
                  <div className="text-[11px] opacity-75">Dispatch crops & book haulers</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setForm({ ...form, role: 'driver' })}
                className={`p-3.5 rounded-2xl border-2 flex items-center justify-center gap-3 transition cursor-pointer ${
                  form.role === 'driver'
                    ? 'border-amber bg-amber/10 text-amber-700 dark:border-amber dark:bg-amber-950/30 dark:text-amber-300 font-bold shadow-xs'
                    : 'border-gray-200 dark:border-[#1E293B] text-gray-600 dark:text-muted hover:border-gray-300'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${form.role === 'driver' ? 'bg-amber text-midnight' : 'bg-gray-100 dark:bg-[#07172F]'}`}>
                  <Truck size={18} />
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold">Driver / Transporter</div>
                  <div className="text-[11px] opacity-75">Accept loads & earn fair fares</div>
                </div>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="full_name"
                    required
                    value={form.full_name}
                    onChange={handleChange}
                    placeholder="e.g. Ramesh Patel"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#1E293B] bg-gray-50 dark:bg-[#07172F] text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-bright outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  required
                  value={form.username}
                  onChange={handleChange}
                  placeholder="e.g. ramesh_patel"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#1E293B] bg-gray-50 dark:bg-[#07172F] text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-bright outline-none transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="name@krishidrive.in"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#1E293B] bg-gray-50 dark:bg-[#07172F] text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-bright outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#1E293B] bg-gray-50 dark:bg-[#07172F] text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-bright outline-none transition"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Village / City / Taluk
                </label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="village"
                    value={form.village}
                    onChange={handleChange}
                    placeholder="e.g. Mandya"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#1E293B] bg-gray-50 dark:bg-[#07172F] text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-bright outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  State
                </label>
                <select
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#1E293B] bg-gray-50 dark:bg-[#07172F] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-bright outline-none transition"
                >
                  <option value="Karnataka">Karnataka</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                  <option value="Telangana">Telangana</option>
                  <option value="Madhya Pradesh">Madhya Pradesh</option>
                  <option value="Punjab">Punjab</option>
                  <option value="Gujarat">Gujarat</option>
                  <option value="Haryana">Haryana</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                </select>
              </div>
            </div>

            {/* If driver, ask for vehicle details */}
            {form.role === 'driver' && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                <div className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <Truck size={14} className="text-amber" /> Transporter Fleet Details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Vehicle Model</label>
                    <input
                      type="text"
                      name="vehicle_type"
                      value={form.vehicle_type}
                      onChange={handleChange}
                      placeholder="e.g. Tata Ace (1.5T)"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#1E293B] bg-white dark:bg-[#07172F] text-xs text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">Registration No.</label>
                    <input
                      type="text"
                      name="vehicle_number"
                      value={form.vehicle_number}
                      onChange={handleChange}
                      placeholder="e.g. KA-05-MC-8821"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#1E293B] bg-white dark:bg-[#07172F] text-xs uppercase text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  name="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="At least 6 characters"
                  className="w-full px-4 py-2.5 pr-11 rounded-xl border border-gray-200 dark:border-[#1E293B] bg-gray-50 dark:bg-[#07172F] text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-bright outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 px-4 font-bold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed group cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-midnight/30 border-t-midnight rounded-full animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  <span>Register as {form.role === 'driver' ? 'Transporter' : 'Farmer'}</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-200 dark:border-[#1E293B] text-center">
            <p className="text-sm text-gray-600 dark:text-muted">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-bright hover:underline inline-flex items-center gap-1">
                Sign in <ArrowRight size={14} />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
