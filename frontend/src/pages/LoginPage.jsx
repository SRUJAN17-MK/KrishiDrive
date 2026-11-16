import React, { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import {
  LogIn, Sprout, Truck, ShieldCheck, Eye, EyeOff, Sparkles,
  ArrowRight, CheckCircle2, UserCheck, Lock, User
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [searchParams] = useSearchParams()
  const initialRole = searchParams.get('role') || 'farmer'
  const [activeTab, setActiveTab] = useState(initialRole)
  const [username, setUsername] = useState(
    initialRole === 'driver' ? 'driver1' : initialRole === 'admin' ? 'admin' : 'farmer1'
  )
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
      title: 'Farmer Portal',
      desc: 'Crop records, satellite moisture & NDVI, APMC mandi rates',
      icon: Sprout,
      color: 'border-bright/40 hover:border-bright bg-blue-50/50 dark:bg-midnight-800/60 text-electric dark:text-bright',
      badge: 'bg-bright/10 text-electric dark:text-bright'
    },
    {
      role: 'driver',
      username: 'driver1',
      name: 'Suresh Kumar',
      title: 'Driver Portal',
      desc: 'Available freight, OSRM routes, Delivery OTP completion',
      icon: Truck,
      color: 'border-amber/40 hover:border-amber bg-amber-50/50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400',
      badge: 'bg-amber/10 text-amber-700 dark:text-amber-300'
    },
    {
      role: 'admin',
      username: 'admin',
      name: 'Platform Admin',
      title: 'Admin Portal',
      desc: 'System KPIs, driver KYC verification, audit timeline',
      icon: ShieldCheck,
      color: 'border-electric/40 hover:border-electric bg-blue-50/50 dark:bg-[#07172F] text-electric dark:text-bright',
      badge: 'bg-electric/10 text-electric dark:text-bright'
    }
  ]

  const handleTabChange = (role) => {
    setActiveTab(role)
    if (role === 'farmer') {
      setUsername('farmer1')
      setPassword('demo123')
    } else if (role === 'driver') {
      setUsername('driver1')
      setPassword('demo123')
    } else if (role === 'admin') {
      setUsername('admin')
      setPassword('demo123')
    } else {
      setUsername('')
      setPassword('')
    }
  }

  const performLogin = async (u, p) => {
    if (!u.trim()) {
      toast.error('Please enter your username')
      return
    }
    if (!p) {
      toast.error('Please enter your password')
      return
    }

    setLoading(true)
    try {
      const data = await api.auth.login({ username: u.trim(), password: p })
      login(data.user, data.access_token)
      toast.success(`Welcome, ${data.user.full_name || data.user.username}!`)
      if (data.user.role === 'driver') {
        navigate('/driver')
      } else if (data.user.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/farmer')
      }
    } catch (err) {
      toast.error(err.message || 'Authentication failed. Please check credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    performLogin(username, password)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07172F] flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-gray-800 dark:text-gray-100 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
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
          Sign In to KrishiDrive
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-muted">
          Choose a role demo for instant 1-click access, or enter your credentials
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4">
        {/* Quick Demo Login Cards */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {demoAccounts.map(demo => {
            const Icon = demo.icon
            const isSelected = activeTab === demo.role
            return (
              <button
                key={demo.role}
                type="button"
                onClick={() => {
                  handleTabChange(demo.role)
                  performLogin(demo.username, 'demo123')
                }}
                disabled={loading}
                className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden group ${demo.color} ${
                  isSelected ? 'ring-2 ring-bright shadow-md scale-[1.02]' : 'hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-white dark:bg-[#111827] flex items-center justify-center shadow-xs">
                    <Icon size={18} />
                  </div>
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${demo.badge}`}>
                    1-Click
                  </span>
                </div>
                <div className="font-bold text-sm text-gray-900 dark:text-white">{demo.title}</div>
                <div className="text-[11px] text-gray-500 dark:text-muted truncate mt-0.5">{demo.name}</div>
              </button>
            )
          })}
        </div>

        {/* Credentials Form Box */}
        <div className="bg-white dark:bg-[#111827] py-8 px-6 sm:px-10 shadow-xl rounded-3xl border border-gray-200 dark:border-[#1E293B]">
          {/* Role Tabs */}
          <div className="flex items-center rounded-xl bg-gray-100 dark:bg-[#07172F] p-1 mb-6 text-xs font-semibold border border-gray-200/50 dark:border-[#1E293B]">
            <button
              type="button"
              onClick={() => handleTabChange('farmer')}
              className={`flex-1 py-2 rounded-lg transition ${
                activeTab === 'farmer'
                  ? 'bg-white dark:bg-electric text-gray-900 dark:text-white shadow-xs font-bold'
                  : 'text-gray-500 hover:text-gray-900 dark:text-muted dark:hover:text-white'
              }`}
            >
              Farmer
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('driver')}
              className={`flex-1 py-2 rounded-lg transition ${
                activeTab === 'driver'
                  ? 'bg-white dark:bg-amber-600 text-gray-900 dark:text-white shadow-xs font-bold'
                  : 'text-gray-500 hover:text-gray-900 dark:text-muted dark:hover:text-white'
              }`}
            >
              Driver
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('admin')}
              className={`flex-1 py-2 rounded-lg transition ${
                activeTab === 'admin'
                  ? 'bg-white dark:bg-midnight-800 text-gray-900 dark:text-white shadow-xs font-bold'
                  : 'text-gray-500 hover:text-gray-900 dark:text-muted dark:hover:text-white'
              }`}
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('custom')}
              className={`flex-1 py-2 rounded-lg transition ${
                activeTab === 'custom'
                  ? 'bg-white dark:bg-charcoal-700 text-gray-900 dark:text-white shadow-xs font-bold'
                  : 'text-gray-500 hover:text-gray-900 dark:text-muted dark:hover:text-white'
              }`}
            >
              Custom
            </button>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                <User size={14} className="text-bright" /> Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. farmer1 or driver1"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#1E293B] bg-gray-50 dark:bg-[#07172F] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-bright text-sm transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Lock size={14} className="text-bright" /> Password
                </label>
                <span className="text-[11px] text-muted">Default for demos: demo123</span>
              </div>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 dark:border-[#1E293B] bg-gray-50 dark:bg-[#07172F] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-bright text-sm transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 px-4 font-bold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed group cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-midnight/30 border-t-midnight rounded-full animate-spin" />
                  <span>Signing in…</span>
                </>
              ) : (
                <>
                  <LogIn size={18} className="group-hover:translate-x-0.5 transition-transform" />
                  <span>Sign In as {username || 'User'}</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-[#1E293B] text-center">
            <p className="text-xs text-gray-500 dark:text-muted">
              Don't have an account yet?{' '}
              <Link to="/register" className="font-bold text-bright hover:underline inline-flex items-center gap-1">
                Register free <ArrowRight size={13} />
              </Link>
            </p>
          </div>
        </div>

        {/* Feature badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500 dark:text-muted">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={15} className="text-bright" />
            <span>Zero Brokerage</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={15} className="text-amber" />
            <span>Delivery OTP Verification</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={15} className="text-bright" />
            <span>Copernicus Satellite Telemetry</span>
          </div>
        </div>
      </div>
    </div>
  )
}
