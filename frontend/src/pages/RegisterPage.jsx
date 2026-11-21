import React, { useState } from 'react'
import { useNavigate, Link, Navigate } from 'react-router-dom'
import {
  UserPlus, Sprout, Truck, ArrowRight, ArrowLeft, Eye, EyeOff,
  MapPin, Phone, Mail, User, Lock, AlertCircle, CheckCircle2,
  Sun, Moon, Shield
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'
import { LanguageSwitcher } from '../components/VoiceControls'
import { api } from '../services/api'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const { isAuthenticated, user, login } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const { t } = useLanguage()
  const navigate = useNavigate()

  // If already authenticated, redirect straight to their dashboard
  if (isAuthenticated && user) {
    const target = user.role === 'driver' ? '/driver' : user.role === 'admin' ? '/admin' : '/farmer'
    return <Navigate to={target} replace />
  }

  const [step, setStep] = useState(1) // Step 1: Role, Step 2: Details
  const [role, setRole] = useState('farmer') // 'farmer' | 'driver' (Admin is never offered)

  const [form, setForm] = useState({
    full_name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    village: '',
    state: 'Maharashtra',
    vehicle_type: 'Tempo (3-Ton)',
    vehicle_capacity: '3000'
  })

  const [termsAgreed, setTermsAgreed] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    if (errorMsg) setErrorMsg('')
  }

  const handleStep1Continue = () => {
    if (!role || (role !== 'farmer' && role !== 'driver')) {
      setErrorMsg('Please select a role to continue')
      return
    }
    setErrorMsg('')
    setStep(2)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    // Client-side validations
    if (!form.full_name.trim()) {
      setErrorMsg('Full name is required')
      return
    }
    const trimmedUsername = form.username.trim()
    if (!trimmedUsername) {
      setErrorMsg('Username is required')
      return
    }
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(trimmedUsername)) {
      setErrorMsg('Username must be 3-30 alphanumeric characters (letters, numbers, underscores)')
      return
    }
    if (!form.email.trim()) {
      setErrorMsg('Valid email is required')
      return
    }
    if (!form.password || form.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters')
      return
    }
    if (form.password !== form.confirm_password) {
      setErrorMsg(t('auth.passwordsDoNotMatch') || 'Passwords do not match')
      return
    }
    if (!termsAgreed) {
      setErrorMsg(t('auth.termsRequired') || 'Please accept the Terms of Service and Privacy Policy')
      return
    }

    setLoading(true)
    try {
      const payload = {
        username: trimmedUsername,
        email: form.email.trim(),
        password: form.password,
        full_name: form.full_name.trim(),
        role: role,
        village: form.village.trim(),
        state: form.state,
        phone: form.phone.trim()
      }

      // If driver, pass vehicle details as well
      if (role === 'driver') {
        payload.vehicle_type = form.vehicle_type
        payload.vehicle_capacity = form.vehicle_capacity
      }

      const data = await api.auth.register(payload)
      login(data.user, data.access_token)
      toast.success(`Account created! Welcome to KrishiDrive, ${data.user.full_name || data.user.username}!`)
      navigate(role === 'driver' ? '/driver' : '/farmer')
    } catch (err) {
      const msg = err.message || 'Registration failed. Please review your details.'
      setErrorMsg(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-midnight flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 text-gray-800 dark:text-gray-100 transition-colors">
      {/* Top Navigation Bar */}
      <div className="max-w-xl mx-auto w-full flex items-center justify-between mb-4">
        {step === 1 ? (
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-gray-900 dark:text-muted dark:hover:text-white transition min-h-[44px] px-2"
          >
            <ArrowLeft size={16} />
            <span>{t('auth.backToHome') || 'Back to Home'}</span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => { setStep(1); setErrorMsg('') }}
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-gray-900 dark:text-muted dark:hover:text-white transition min-h-[44px] px-2 cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>{t('auth.changeRole') || 'Change Role'}</span>
          </button>
        )}

        <div className="flex items-center gap-2">
          <LanguageSwitcher compact />
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2.5 rounded-xl text-gray-500 hover:text-gray-900 dark:text-muted dark:hover:text-white hover:bg-gray-100 dark:hover:bg-midnight-800 transition min-w-[44px] min-h-[44px] flex items-center justify-center"
            title={isDark ? t('common.light') : t('common.dark')}
            aria-label={isDark ? t('common.light') : t('common.dark')}
          >
            {isDark ? <Sun size={17} className="text-amber" /> : <Moon size={17} />}
          </button>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl my-auto">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-3 group mb-3">
            <div className="w-12 h-12 rounded-2xl bg-midnight-800 border border-white/10 flex items-center justify-center text-white shadow-lg shadow-midnight-950/40 group-hover:scale-105 transition-transform">
              <Sprout size={26} className="text-amber" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5 font-black text-2xl tracking-tight text-gray-900 dark:text-white">
                <span>Krishi</span>
                <span className="text-bright">Drive</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber/20 text-amber font-bold">3.0</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-muted">Smart Farming. Smarter Transport.</p>
            </div>
          </Link>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            {step === 1
              ? (t('auth.step1Title') || 'Select Your Role')
              : (t('auth.step2Title') || 'Enter Account Details')}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-muted max-w-md mx-auto">
            {step === 1
              ? (t('auth.step1Subtitle') || 'Choose how you will participate in the KrishiDrive network')
              : (role === 'farmer'
                  ? 'Join farmers dispatching crops and booking haulers with fair rates'
                  : 'Join transporters accepting freight loads and optimizing routes')}
          </p>

          {/* Stepper indicator */}
          <div className="flex items-center justify-center gap-2 mt-4 text-xs font-semibold">
            <span className={`px-3 py-1 rounded-full flex items-center gap-1.5 ${step === 1 ? 'bg-amber text-midnight font-bold' : 'bg-gray-200 dark:bg-charcoal text-gray-600 dark:text-muted'}`}>
              <span>1</span> {t('auth.step1Title') || 'Role'}
            </span>
            <span className="text-gray-400">&rarr;</span>
            <span className={`px-3 py-1 rounded-full flex items-center gap-1.5 ${step === 2 ? 'bg-amber text-midnight font-bold' : 'bg-gray-200 dark:bg-charcoal text-gray-600 dark:text-muted'}`}>
              <span>2</span> {t('auth.step2Title') || 'Details'}
            </span>
          </div>
        </div>

        {/* Card Box */}
        <div className="bg-white dark:bg-charcoal py-8 px-6 sm:px-10 shadow-xl rounded-3xl border border-gray-200 dark:border-white/10">
          {errorMsg && (
            <div
              role="alert"
              aria-live="polite"
              className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-start gap-2.5"
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: CHOOSE ROLE */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Farmer Option Card */}
                <button
                  type="button"
                  onClick={() => setRole('farmer')}
                  className={`p-5 rounded-2xl border-2 text-left transition cursor-pointer flex flex-col justify-between min-h-[160px] ${
                    role === 'farmer'
                      ? 'border-bright bg-blue-50/80 dark:bg-electric/20 ring-2 ring-bright/30'
                      : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 bg-gray-50/50 dark:bg-midnight/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 rounded-xl bg-electric text-white flex items-center justify-center shadow-md">
                      <Sprout size={24} />
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${role === 'farmer' ? 'bg-bright/20 text-electric dark:text-bright' : 'bg-gray-200 dark:bg-charcoal text-gray-500 dark:text-muted'}`}>
                      {role === 'farmer' ? 'Selected' : 'Select'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                      {t('auth.farmerRoleTitle') || "I'm a Farmer"}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-muted mt-1 leading-relaxed">
                      {t('auth.farmerRoleDesc') || 'Sell harvest, check mandi prices, map satellite plots, and book transport.'}
                    </p>
                  </div>
                </button>

                {/* Transporter / Driver Option Card */}
                <button
                  type="button"
                  onClick={() => setRole('driver')}
                  className={`p-5 rounded-2xl border-2 text-left transition cursor-pointer flex flex-col justify-between min-h-[160px] ${
                    role === 'driver'
                      ? 'border-amber bg-amber-50/80 dark:bg-amber-950/30 ring-2 ring-amber/30'
                      : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 bg-gray-50/50 dark:bg-midnight/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 rounded-xl bg-amber text-midnight flex items-center justify-center shadow-md">
                      <Truck size={24} />
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${role === 'driver' ? 'bg-amber/20 text-amber' : 'bg-gray-200 dark:bg-charcoal text-gray-500 dark:text-muted'}`}>
                      {role === 'driver' ? 'Selected' : 'Select'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                      {t('auth.driverRoleTitle') || "I'm a Transporter / Driver"}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-muted mt-1 leading-relaxed">
                      {t('auth.driverRoleDesc') || 'Find agricultural freight jobs, optimize routes, and earn fair fares.'}
                    </p>
                  </div>
                </button>
              </div>

              <button
                type="button"
                onClick={handleStep1Continue}
                className="btn-primary w-full min-h-[48px] py-3.5 px-4 font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer mt-6"
              >
                <span>{t('auth.nextStep') || 'Next: Enter Details'}</span>
                <ArrowRight size={18} />
              </button>
            </div>
          )}

          {/* STEP 2: ACCOUNT DETAILS FORM */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Selected Role Pill Banner */}
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-midnight border border-gray-200 dark:border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {role === 'farmer' ? (
                    <Sprout size={18} className="text-bright" />
                  ) : (
                    <Truck size={18} className="text-amber" />
                  )}
                  <span className="text-xs font-bold text-gray-900 dark:text-white">
                    Registering as {role === 'farmer' ? 'Farmer / Producer' : 'Transporter / Driver'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-bold text-bright hover:underline"
                >
                  Change
                </button>
              </div>

              {/* Personal Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="reg-fullname" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t('auth.fullName') || 'Full Name'} *
                  </label>
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="reg-fullname"
                      type="text"
                      name="full_name"
                      required
                      value={form.full_name}
                      onChange={handleChange}
                      placeholder="e.g. Ramesh Patel"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-midnight text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-bright outline-none transition min-h-[44px]"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-username" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t('auth.username') || 'Username'} *
                  </label>
                  <input
                    id="reg-username"
                    type="text"
                    name="username"
                    required
                    value={form.username}
                    onChange={handleChange}
                    placeholder="3-30 chars (letters/numbers/_)"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-midnight text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-bright outline-none transition min-h-[44px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="reg-email" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t('auth.email') || 'Email'} *
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="reg-email"
                      type="email"
                      name="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      placeholder="name@example.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-midnight text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-bright outline-none transition min-h-[44px]"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-phone" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t('auth.phone') || 'Mobile Phone'}
                  </label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="reg-phone"
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="10-digit mobile number"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-midnight text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-bright outline-none transition min-h-[44px]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="reg-village" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t('auth.village') || 'Village / City'}
                  </label>
                  <div className="relative">
                    <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="reg-village"
                      type="text"
                      name="village"
                      value={form.village}
                      onChange={handleChange}
                      placeholder="e.g. Nashik, Mandya"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-midnight text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-bright outline-none transition min-h-[44px]"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-state" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t('auth.state') || 'State'}
                  </label>
                  <select
                    id="reg-state"
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-midnight text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-bright outline-none transition min-h-[44px]"
                  >
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Gujarat">Gujarat</option>
                    <option value="Punjab">Punjab</option>
                    <option value="Haryana">Haryana</option>
                    <option value="Madhya Pradesh">Madhya Pradesh</option>
                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                    <option value="Telangana">Telangana</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Rajasthan">Rajasthan</option>
                    <option value="West Bengal">West Bengal</option>
                  </select>
                </div>
              </div>

              {/* Driver-Specific Fleet Fields */}
              {role === 'driver' && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                  <div className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                    <Truck size={15} className="text-amber" /> Vehicle & Fleet Specifications
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="reg-vehicle-type" className="block text-xs text-gray-700 dark:text-gray-300 mb-1">
                        {t('auth.vehicleType') || 'Vehicle Model'}
                      </label>
                      <select
                        id="reg-vehicle-type"
                        name="vehicle_type"
                        value={form.vehicle_type}
                        onChange={handleChange}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-midnight text-xs text-gray-900 dark:text-white min-h-[44px]"
                      >
                        <option value="Mini Truck / Pickup (1.5-Ton)">Mini Truck / Pickup (1.5-Ton)</option>
                        <option value="Tempo (3-Ton)">Tempo (3-Ton)</option>
                        <option value="Medium Truck (6-Ton)">Medium Truck (6-Ton)</option>
                        <option value="Heavy Truck (10-Ton)">Heavy Truck (10-Ton)</option>
                        <option value="Trailer (20-Ton)">Trailer (20-Ton)</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="reg-vehicle-cap" className="block text-xs text-gray-700 dark:text-gray-300 mb-1">
                        {t('auth.vehicleCapacity') || 'Payload Capacity (kg)'}
                      </label>
                      <input
                        id="reg-vehicle-cap"
                        type="number"
                        name="vehicle_capacity"
                        value={form.vehicle_capacity}
                        onChange={handleChange}
                        placeholder="e.g. 3000"
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-midnight text-xs text-gray-900 dark:text-white min-h-[44px]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Password Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="reg-password" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t('auth.password') || 'Password'} *
                  </label>
                  <div className="relative">
                    <input
                      id="reg-password"
                      type={showPw ? 'text' : 'password'}
                      name="password"
                      required
                      minLength={6}
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Min 6 characters"
                      className="w-full px-4 py-2.5 pr-11 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-midnight text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-bright outline-none transition min-h-[44px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg"
                      aria-label={showPw ? 'Hide password' : 'Show password'}
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-confirm-pw" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t('auth.confirmPassword') || 'Confirm Password'} *
                  </label>
                  <div className="relative">
                    <input
                      id="reg-confirm-pw"
                      type={showConfirmPw ? 'text' : 'password'}
                      name="confirm_password"
                      required
                      minLength={6}
                      value={form.confirm_password}
                      onChange={handleChange}
                      placeholder="Repeat password"
                      className="w-full px-4 py-2.5 pr-11 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-midnight text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-bright outline-none transition min-h-[44px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw(!showConfirmPw)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg"
                      aria-label={showConfirmPw ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-3 cursor-pointer text-xs text-gray-600 dark:text-muted">
                  <input
                    type="checkbox"
                    checked={termsAgreed}
                    onChange={(e) => {
                      setTermsAgreed(e.target.checked)
                      if (errorMsg) setErrorMsg('')
                    }}
                    className="mt-0.5 w-4 h-4 rounded border-gray-300 text-amber focus:ring-amber"
                  />
                  <span>
                    {t('auth.termsAgree') || 'I agree to the'}{' '}
                    <Link to="/terms" target="_blank" className="text-bright hover:underline font-semibold">Terms of Service</Link>{' '}
                    and{' '}
                    <Link to="/privacy" target="_blank" className="text-bright hover:underline font-semibold">Privacy Policy</Link>.
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !termsAgreed}
                className="btn-primary w-full min-h-[48px] py-3.5 px-4 font-bold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer mt-4"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-midnight/30 border-t-midnight rounded-full animate-spin" />
                    <span>Creating Account…</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />
                    <span>Register as {role === 'driver' ? 'Transporter' : 'Farmer'}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Bottom Link to Login */}
          <div className="mt-6 pt-5 border-t border-gray-100 dark:border-white/10 text-center">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-muted">
              {t('auth.haveAccount') || 'Already have an account?'}{' '}
              <Link to="/login" className="font-bold text-bright hover:underline inline-flex items-center gap-1 min-h-[44px] py-1">
                {t('auth.logIn') || 'Sign In'} <ArrowRight size={13} />
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Footer copyright */}
      <div className="text-center text-[11px] text-gray-400 dark:text-muted mt-8">
        © {new Date().getFullYear()} KrishiDrive. All rights reserved.
      </div>
    </div>
  )
}
