import React, { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { LogIn, Sprout, Truck, ShieldCheck, Eye, EyeOff, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [searchParams] = useSearchParams()
  const initialRole = searchParams.get('role') || 'farmer'
  const [username, setUsername] = useState(initialRole === 'driver' ? 'driver1' : initialRole === 'admin' ? 'admin' : 'farmer1')
  const [password, setPassword] = useState('demo123')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const demoAccounts = [
    {
      role: 'farmer',
      username: 'farmer1',
      name: 'Ramesh Patel',
      title: 'Farmer Demo',
      desc: 'Smart crop logs, AI harvest forecasting, hauler dispatch',
      icon: Sprout,
      color: 'border-emerald-500/50 hover:border-emerald-500 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400',
      badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
    },
    {
      role: 'driver',
      username: 'driver1',
      name: 'Suresh Kumar',
      title: 'Driver Demo',
      desc: 'Freight matching, green corridor GPS, ₹ earnings ledger',
      icon: Truck,
      color: 'border-amber-500/50 hover:border-amber-500 bg-amber-500/5 text-amber-700 dark:text-amber-400',
      badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
    },
    {
      role: 'admin',
      username: 'admin',
      name: 'Platform Admin',
      title: 'Admin Demo',
      desc: 'Full governance, driver KYC verification, telemetry',
      icon: ShieldCheck,
      color: 'border-indigo-500/50 hover:border-indigo-500 bg-indigo-500/5 text-indigo-700 dark:text-indigo-400',
      badge: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
    }
  ]

  const performLogin = async (u, p) => {
    setLoading(true)
    try {
      const data = await api.auth.login({ username: u, password: p })
      login(data.user, data.access_token)
      toast.success(`Welcome back, ${data.user.full_name || data.user.username}!`)
      if (data.user.role === 'driver') {
        navigate('/driver')
      } else if (data.user.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/farmer')
      }
    } catch (err) {
      toast.error(err.message || 'Authentication failed. Please verify credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    performLogin(username, password)
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-neutral-800 dark:text-neutral-100 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
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
          Sign in to your portal
        </h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Or select a ready-to-test role demo below for instant access
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4">
        {/* Quick Demo Login Cards */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {demoAccounts.map(demo => {
            const Icon = demo.icon
            const isSelected = username === demo.username
            return (
              <button
                key={demo.role}
                type="button"
                onClick={() => {
                  setUsername(demo.username)
                  setPassword('demo123')
                  performLogin(demo.username, 'demo123')
                }}
                disabled={loading}
                className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden group ${demo.color} ${
                  isSelected ? 'ring-2 ring-forest dark:ring-agri shadow-md' : 'hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-white dark:bg-neutral-800 flex items-center justify-center shadow-xs">
                    <Icon size={18} />
                  </div>
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${demo.badge}`}>
                    1-Click
                  </span>
                </div>
                <div className="font-bold text-sm text-neutral-900 dark:text-white">{demo.title}</div>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">{demo.name}</div>
              </button>
            )
          })}
        </div>

        {/* Credentials Form Box */}
        <div className="bg-white dark:bg-neutral-900 py-8 px-6 sm:px-10 shadow-xl rounded-3xl border border-neutral-200 dark:border-neutral-800">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Username or Phone
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. farmer1 or driver1"
                  className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-forest dark:focus:ring-agri text-sm transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  Password
                </label>
                <span className="text-xs text-neutral-400">Default: demo123</span>
              </div>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-forest dark:focus:ring-agri text-sm transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-forest to-agri hover:from-forest-dark hover:to-forest shadow-lg shadow-forest/20 hover:shadow-xl transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed group cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn size={18} className="group-hover:translate-x-0.5 transition-transform" />
                  <span>Sign In to KrishiDrive</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800 text-center">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Don't have an account?{' '}
              <Link to="/register" className="font-bold text-forest dark:text-agri hover:underline inline-flex items-center gap-1">
                Register free <ArrowRight size={14} />
              </Link>
            </p>
          </div>
        </div>

        {/* Feature badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={15} className="text-agri" />
            <span>Zero Brokerage</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={15} className="text-agri" />
            <span>AI Green Corridors</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={15} className="text-agri" />
            <span>Instant APMC Settlement</span>
          </div>
        </div>
      </div>
    </div>
  )
}