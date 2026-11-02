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
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col justify-center py-10 sm:px-6 lg:px-8 text-neutral-800 dark:text-neutral-100 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center px-4">
        <Link to="/" className="inline-flex items-center gap-3 group mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-forest to-agri flex items-center justify-center text-white shadow-lg shadow-forest/20 group-hover:scale-105 transition-transform">
            <Sprout size={26} className="text-gold-light" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5 font-black text-2xl tracking-tight text-neutral-900 dark:text-white">
              <span>Krishi</span>
              <span className="text-agri">Drive</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gold/15 text-gold-dark dark:text-gold-light font-bold">AI</span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Smart Farming. Smarter Transport.</p>
          </div>
        </Link>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
          Join India's Agri-Mobility Network
        </h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Create an account to streamline harvest logistics or earn on return trips
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl px-4">
        <div className="bg-white dark:bg-neutral-900 py-8 px-6 sm:px-10 shadow-xl rounded-3xl border border-neutral-200 dark:border-neutral-800">
          
          {/* Role selector */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
              Select Your Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, role: 'farmer' })}
                className={`p-3.5 rounded-2xl border-2 flex items-center justify-center gap-3 transition cursor-pointer ${
                  form.role === 'farmer'
                    ? 'border-forest bg-forest/5 text-forest dark:border-agri dark:bg-agri/10 dark:text-agri font-bold shadow-xs'
                    : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${form.role === 'farmer' ? 'bg-forest text-white' : 'bg-neutral-100 dark:bg-neutral-800'}`}>
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
                    ? 'border-amber-500 bg-amber-500/5 text-amber-700 dark:border-amber-400 dark:bg-amber-400/10 dark:text-amber-300 font-bold shadow-xs'
                    : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${form.role === 'driver' ? 'bg-amber-500 text-white' : 'bg-neutral-100 dark:bg-neutral-800'}`}>
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
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    name="full_name"
                    required
                    value={form.full_name}
                    onChange={handleChange}
                    placeholder="e.g. Ramesh Patel"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 text-sm focus:ring-2 focus:ring-forest dark:focus:ring-agri outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  required
                  value={form.username}
                  onChange={handleChange}
                  placeholder="e.g. ramesh_patel"
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 text-sm focus:ring-2 focus:ring-forest dark:focus:ring-agri outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="name@krishidrive.in"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 text-sm focus:ring-2 focus:ring-forest dark:focus:ring-agri outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 text-sm focus:ring-2 focus:ring-forest dark:focus:ring-agri outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Village / City / Taluk
                </label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    name="village"
                    value={form.village}
                    onChange={handleChange}
                    placeholder="e.g. Mandya"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 text-sm focus:ring-2 focus:ring-forest dark:focus:ring-agri outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  State
                </label>
                <select
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-forest dark:focus:ring-agri outline-none"
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
                  <Truck size={14} /> Transporter Fleet Details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-neutral-700 dark:text-neutral-300 mb-1">Vehicle Model</label>
                    <input
                      type="text"
                      name="vehicle_type"
                      value={form.vehicle_type}
                      onChange={handleChange}
                      placeholder="e.g. Tata Ace (1.5T)"
                      className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-700 dark:text-neutral-300 mb-1">Registration No.</label>
                    <input
                      type="text"
                      name="vehicle_number"
                      value={form.vehicle_number}
                      onChange={handleChange}
                      placeholder="e.g. KA-05-MC-8821"
                      className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs uppercase"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
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
                  className="w-full px-4 py-2.5 pr-11 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 text-sm focus:ring-2 focus:ring-forest dark:focus:ring-agri outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-forest to-agri hover:from-forest-dark hover:to-forest shadow-lg shadow-forest/20 hover:shadow-xl transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed group cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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

          <div className="mt-6 pt-5 border-t border-neutral-200 dark:border-neutral-800 text-center">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-forest dark:text-agri hover:underline inline-flex items-center gap-1">
                Sign in <ArrowRight size={14} />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}