import React, { useState } from 'react'
import { useNavigate, Link, Navigate } from 'react-router-dom'
import {
  LogIn, Sprout, Eye, EyeOff, ArrowRight, ArrowLeft,
  Lock, User, AlertCircle, CheckCircle2, Sun, Moon
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'
import { LanguageSwitcher } from '../components/VoiceControls'
import { api } from '../services/api'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { isAuthenticated, user, login } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const { t } = useLanguage()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // If already logged in, redirect straight to their dashboard
  if (isAuthenticated && user) {
    const target = user.role === 'driver' ? '/driver' : user.role === 'admin' ? '/admin' : '/farmer'
    return <Navigate to={target} replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    const trimmedUser = username.trim()
    if (!trimmedUser) {
      setErrorMsg(t('auth.username') + ' is required')
      toast.error(t('auth.username') + ' is required')
      return
    }
    if (!password) {
      setErrorMsg(t('auth.password') + ' is required')
      toast.error(t('auth.password') + ' is required')
      return
    }

    setLoading(true)
    try {
      const data = await api.auth.login({ username: trimmedUser, password })
      login(data.user, data.access_token)
      toast.success(`${t('auth.welcomeBack') || 'Welcome back'}, ${data.user.full_name || data.user.username}!`)

      if (data.user.role === 'driver') {
        navigate('/driver')
      } else if (data.user.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/farmer')
      }
    } catch (err) {
      const msg = err.message || 'Invalid username or password. Please try again.'
      setErrorMsg(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-midnight flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 text-gray-800 dark:text-gray-100 transition-colors">
      {/* Top Header: Back Button & Language/Theme controls */}
      <div className="max-w-xl mx-auto w-full flex items-center justify-between mb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-gray-900 dark:text-muted dark:hover:text-white transition min-h-[44px] px-2"
          aria-label={t('auth.backToHome') || 'Back to Home'}
        >
          <ArrowLeft size={16} />
          <span>{t('auth.backToHome') || 'Back'}</span>
        </Link>

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

      {/* Main Login Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md my-auto">
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
            {t('auth.logIn') || 'Log In'}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-muted max-w-sm mx-auto">
            {t('auth.signInSubtitle') || 'Sign in to access your farmer, transporter, or governance dashboard.'}
          </p>
        </div>

        {/* Credentials Form Box */}
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

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="login-username"
                className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5"
              >
                <User size={14} className="text-bright" />
                <span>{t('auth.username') || 'Username or Email'}</span>
              </label>
              <input
                id="login-username"
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value)
                  if (errorMsg) setErrorMsg('')
                }}
                placeholder="Enter username or email"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-midnight text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-bright text-sm transition min-h-[44px]"
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5"
              >
                <Lock size={14} className="text-bright" />
                <span>{t('auth.password') || 'Password'}</span>
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errorMsg) setErrorMsg('')
                  }}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-midnight text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-bright text-sm transition min-h-[44px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !username.trim() || !password}
              className="btn-primary w-full min-h-[48px] py-3.5 px-4 font-bold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-midnight/30 border-t-midnight rounded-full animate-spin" />
                  <span>Signing in…</span>
                </>
              ) : (
                <>
                  <LogIn size={18} className="group-hover:translate-x-0.5 transition-transform" />
                  <span>{t('auth.logIn') || 'Log In'}</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100 dark:border-white/10 text-center">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-muted">
              {t('auth.noAccount') || "Don't have an account yet?"}{' '}
              <Link
                to="/register"
                className="font-bold text-bright hover:underline inline-flex items-center gap-1 min-h-[44px] py-1"
              >
                {t('auth.createAccount') || 'Create Account'} <ArrowRight size={13} />
              </Link>
            </p>
          </div>
        </div>

        {/* Feature Badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-5 text-xs text-gray-500 dark:text-muted">
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
            <span>23 Indian Languages</span>
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
