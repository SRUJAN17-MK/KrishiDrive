import React, { Suspense, lazy, useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Sprout, Truck, Brain, Navigation, LogOut,
  Menu, X, Home, Route as RouteIcon, Package, MessageSquare,
  Settings, BarChart3, Globe, Sun, Moon, UserCheck,
  ShieldCheck, WifiOff, Cpu, Store
} from 'lucide-react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import { LanguageProvider, useLanguage } from './context/LanguageContext'
import { Toaster } from 'react-hot-toast'
import OfflineBanner from './components/OfflineBanner'
import { LanguageSwitcher } from './components/VoiceControls'

const LandingPage = lazy(() => import('./pages/LandingPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const FarmerDashboard = lazy(() => import('./pages/FarmerDashboard'))
const FarmerCrops = lazy(() => import('./pages/FarmerCrops'))
const FarmerTransport = lazy(() => import('./pages/FarmerTransport'))
const FarmerDeliveries = lazy(() => import('./pages/FarmerDeliveries'))
const FarmerAssistant = lazy(() => import('./pages/FarmerAssistant'))
const MarketPrices = lazy(() => import('./pages/MarketPrices'))
const DriverDashboard = lazy(() => import('./pages/DriverDashboard'))
const DriverJobs = lazy(() => import('./pages/DriverJobs'))
const DriverRoutes = lazy(() => import('./pages/DriverRoutes'))
const DriverTrips = lazy(() => import('./pages/DriverTrips'))
const DriverVehicle = lazy(() => import('./pages/DriverVehicle'))
const DriverAssistant = lazy(() => import('./pages/DriverAssistant'))
const AILab = lazy(() => import('./pages/AILab'))
const OnDeviceAI = lazy(() => import('./pages/OnDeviceAI'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const AboutPage = lazy(() => import('./pages/AboutPage'))

const farmerNav = [
  { path: '/farmer', key: 'nav.overview', icon: LayoutDashboard, end: true },
  { path: '/farmer/crops', key: 'nav.crops', icon: Sprout },
  { path: '/farmer/transport', key: 'nav.transport', icon: Truck },
  { path: '/farmer/deliveries', key: 'nav.deliveries', icon: Package },
  { path: '/farmer/assistant', key: 'nav.farmAssistant', icon: MessageSquare },
  { path: '/market-prices', key: 'nav.market', icon: Store },
  { path: '/ai-lab', key: 'nav.aiLab', icon: Brain }
]

const driverNav = [
  { path: '/driver', key: 'nav.overview', icon: LayoutDashboard, end: true },
  { path: '/driver/jobs', key: 'nav.jobs', icon: Truck },
  { path: '/driver/routes', key: 'nav.routes', icon: RouteIcon },
  { path: '/driver/trips', key: 'nav.trips', icon: Navigation },
  { path: '/driver/vehicle', key: 'nav.vehicle', icon: Settings },
  { path: '/driver/assistant', key: 'nav.driverAssistant', icon: MessageSquare },
  { path: '/market-prices', key: 'nav.market', icon: Store }
]

const adminNav = [
  { path: '/admin', key: 'nav.admin', icon: BarChart3, end: true },
  { path: '/ai-lab', key: 'nav.aiLab', icon: Brain },
  { path: '/on-device-ai', key: 'nav.model', icon: Cpu }
]

const publicNav = [
  { path: '/', key: 'nav.home', icon: Home, end: true },
  { path: '/about', key: 'nav.about', icon: Globe },
  { path: '/market-prices', key: 'nav.market', icon: Store },
  { path: '/ai-lab', key: 'nav.aiLab', icon: Brain },
  { path: '/on-device-ai', key: 'nav.model', icon: Cpu }
]

function RouteFallback() {
  return (
    <div className="min-h-[50vh] grid place-items-center" role="status" aria-live="polite">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Loading…</p>
      </div>
    </div>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [pathname])
  return null
}

function Sidebar({ items, subtitle }) {
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-40 p-2.5 bg-white dark:bg-[#12211c] text-gray-800 dark:text-gray-100 rounded-xl shadow-md border border-gray-200 dark:border-forest-800"
        aria-label={t('common.menu')}
      >
        <Menu size={20} />
      </button>

      {mobileOpen && (
        <button
          type="button"
          aria-label={t('common.close')}
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-[#12211c] border-r border-gray-200 dark:border-[#1e362e] flex flex-col transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        aria-label="Portal navigation"
      >
        <div className="p-4 border-b border-gray-100 dark:border-[#1e362e] flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-forest rounded-xl flex items-center justify-center text-white shadow-md shadow-forest-900/20">
              <Sprout size={22} />
            </div>
            <div>
              <div className="font-bold text-gray-900 dark:text-white text-base tracking-tight">{t('app.name')}</div>
              <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">{subtitle}</div>
            </div>
          </NavLink>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg" aria-label={t('common.close')}>
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {items.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-semibold shadow-sm border border-emerald-200/60 dark:border-emerald-800/40'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/70 dark:hover:bg-[#182c25]'
                }`
              }
            >
              <item.icon size={18} className="flex-shrink-0" aria-hidden="true" />
              <span>{t(item.key)}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100 dark:border-[#1e362e] space-y-2">
          <div className="flex items-center justify-between gap-2">
            <LanguageSwitcher compact />
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1c352c]"
              title={isDark ? t('common.light') : t('common.dark')}
              aria-label={isDark ? t('common.light') : t('common.dark')}
            >
              {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
            </button>
          </div>

          <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 dark:bg-[#162a23] rounded-xl">
            <span className="w-9 h-9 rounded-full bg-emerald-700 text-white grid place-items-center text-xs font-bold">
              {(user?.full_name || user?.username || 'K').slice(0, 1).toUpperCase()}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-gray-900 dark:text-white truncate">{user?.full_name || user?.username}</div>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-400 capitalize font-medium">{user?.role}</div>
            </div>
            <button
              onClick={() => { logout(); navigate('/login') }}
              title={t('common.logout')}
              aria-label={t('common.logout')}
              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        <div className="p-3 border-t border-gray-100 dark:border-[#1e362e]">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/70 dark:bg-emerald-950/30 p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
              <Cpu size={13} /> CPU inference
            </div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">NPU not verified · See model card</div>
          </div>
        </div>
      </aside>
    </>
  )
}

function PublicLayout({ children }) {
  const { user, logout, isAuthenticated } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const { t } = useLanguage()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0b1411] text-gray-900 dark:text-gray-100 transition-colors">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:bg-emerald-700 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg">
        Skip to content
      </a>
      <header className="glass-nav border-b border-gray-200 dark:border-[#1e362e] sticky top-0 z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <NavLink to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 gradient-forest rounded-xl flex items-center justify-center text-white shadow-md">
              <Sprout size={20} />
            </div>
            <div>
              <span className="font-extrabold text-gray-900 dark:text-white text-base sm:text-lg tracking-tight">{t('app.name')}</span>
              <span className="hidden md:inline-block ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40">Open agri-tech</span>
            </div>
          </NavLink>

          <nav className="hidden lg:flex items-center gap-1" aria-label="Public navigation">
            {publicNav.map(n => (
              <NavLink
                key={n.path}
                to={n.path}
                end={n.end}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60'
                  }`
                }
              >
                {t(n.key)}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="hidden sm:block"><LanguageSwitcher compact /></div>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#182c25] transition"
              title={isDark ? t('common.light') : t('common.dark')}
              aria-label={isDark ? t('common.light') : t('common.dark')}
            >
              {isDark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
            </button>

            {isAuthenticated && user ? (
              <div className="flex items-center gap-2 ml-1">
                <NavLink
                  to={user.role === 'driver' ? '/driver' : user.role === 'admin' ? '/admin' : '/farmer'}
                  className="px-2.5 sm:px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-sm transition inline-flex items-center gap-1.5"
                >
                  <LayoutDashboard size={15} /> <span className="hidden sm:inline">{t('common.dashboard')}</span>
                </NavLink>
                <button
                  onClick={() => { logout(); navigate('/login') }}
                  aria-label={t('common.logout')}
                  className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2 ml-1">
                <NavLink to="/login" className="hidden sm:inline-block px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl transition">
                  {t('common.signIn')}
                </NavLink>
                <NavLink to="/register" className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-sm transition">
                  {t('common.getStarted')}
                </NavLink>
              </div>
            )}
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-1">{children}</main>

      <footer className="bg-[#07120e] text-gray-400 border-t border-[#13271f] py-12">
        <div className="max-w-7xl mx-auto px-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8 text-sm">
          <div>
            <div className="flex items-center gap-2 text-white font-bold text-lg mb-3">
              <Sprout size={20} className="text-emerald-400" /> {t('app.name')}
            </div>
            <p className="text-xs text-gray-400 leading-relaxed mb-4">{t('footer.tagline')}</p>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400">
              <ShieldCheck size={13} /> {t('landing.badge')}
            </span>
          </div>

          <div>
            <div className="text-white font-semibold text-xs uppercase tracking-wider mb-3">{t('footer.product')}</div>
            <ul className="space-y-2 text-xs">
              <li><NavLink to="/farmer" className="hover:text-emerald-400 transition">{t('nav.crops')}</NavLink></li>
              <li><NavLink to="/farmer/transport" className="hover:text-emerald-400 transition">{t('nav.transport')}</NavLink></li>
              <li><NavLink to="/market-prices" className="hover:text-emerald-400 transition">{t('nav.market')}</NavLink></li>
              <li><NavLink to="/ai-lab" className="hover:text-emerald-400 transition">{t('ai.disease')}</NavLink></li>
            </ul>
          </div>

          <div>
            <div className="text-white font-semibold text-xs uppercase tracking-wider mb-3">{t('footer.data')}</div>
            <ul className="space-y-2 text-xs">
              <li><NavLink to="/on-device-ai" className="hover:text-emerald-400 transition">{t('footer.modelCard')}</NavLink></li>
              <li><NavLink to="/on-device-ai#limitations" className="hover:text-emerald-400 transition">{t('footer.limitations')}</NavLink></li>
              <li><a href="/api/health/detailed" className="hover:text-emerald-400 transition">{t('footer.apiStatus')}</a></li>
              <li><NavLink to="/about" className="hover:text-emerald-400 transition">{t('nav.about')}</NavLink></li>
            </ul>
          </div>

          <div>
            <div className="text-white font-semibold text-xs uppercase tracking-wider mb-3">{t('footer.support')}</div>
            <p className="text-xs text-gray-400 mb-2">Open-source project. Report bugs and data issues on GitHub.</p>
            <a href="https://github.com/SRUJAN17-MK/KrishiDrive" target="_blank" rel="noreferrer" className="text-sm font-bold text-white hover:text-emerald-400">github.com/SRUJAN17-MK/KrishiDrive</a>
            <p className="text-[11px] text-gray-500 mt-2">No invented phone numbers or accuracy claims.</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 pt-6 border-t border-[#13271f] flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <div>© {new Date().getFullYear()} KrishiDrive. {t('footer.rights')}</div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1"><WifiOff size={11} /> Offline-ready shell</span>
            <span className="inline-flex items-center gap-1"><Cpu size={11} /> CPU inference</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0b1411]">
        <div className="text-center" role="status" aria-live="polite">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Loading KrishiDrive…</p>
        </div>
      </div>
    )
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(user?.role)) return <Navigate to="/" replace />
  return children
}

function PortalShell({ items, subtitle, children }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b1411] transition-colors">
      <Sidebar items={items} subtitle={subtitle} />
      <main className="lg:ml-64 p-4 lg:p-8 min-h-screen transition-all">
        <Suspense fallback={<RouteFallback />}>{children}</Suspense>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <ScrollToTop />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3800,
                style: {
                  background: '#1b4332',
                  color: '#fff',
                  fontSize: '13px',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  maxWidth: '420px'
                }
              }}
            />
            <OfflineBanner />
            <Routes>
              <Route path="/" element={<PublicLayout><Suspense fallback={<RouteFallback />}><LandingPage /></Suspense></PublicLayout>} />
              <Route path="/about" element={<PublicLayout><Suspense fallback={<RouteFallback />}><AboutPage /></Suspense></PublicLayout>} />
              <Route path="/ai-lab" element={<PublicLayout><Suspense fallback={<RouteFallback />}><AILab /></Suspense></PublicLayout>} />
              <Route path="/on-device-ai" element={<PublicLayout><Suspense fallback={<RouteFallback />}><OnDeviceAI /></Suspense></PublicLayout>} />
              <Route path="/model" element={<Navigate to="/on-device-ai" replace />} />
              <Route path="/market-prices" element={<PublicLayout><Suspense fallback={<RouteFallback />}><MarketPrices /></Suspense></PublicLayout>} />
              <Route path="/login" element={<Suspense fallback={<RouteFallback />}><LoginPage /></Suspense>} />
              <Route path="/register" element={<Suspense fallback={<RouteFallback />}><RegisterPage /></Suspense>} />

              <Route path="/farmer/*" element={
                <ProtectedRoute allowedRoles={['farmer', 'admin']}>
                  <PortalShell items={farmerNav} subtitle="Farmer Portal">
                    <Routes>
                      <Route index element={<FarmerDashboard />} />
                      <Route path="crops" element={<FarmerCrops />} />
                      <Route path="transport" element={<FarmerTransport />} />
                      <Route path="deliveries" element={<FarmerDeliveries />} />
                      <Route path="assistant" element={<FarmerAssistant />} />
                    </Routes>
                  </PortalShell>
                </ProtectedRoute>
              } />

              <Route path="/driver/*" element={
                <ProtectedRoute allowedRoles={['driver', 'admin']}>
                  <PortalShell items={driverNav} subtitle="Driver Portal">
                    <Routes>
                      <Route index element={<DriverDashboard />} />
                      <Route path="jobs" element={<DriverJobs />} />
                      <Route path="routes" element={<DriverRoutes />} />
                      <Route path="trips" element={<DriverTrips />} />
                      <Route path="vehicle" element={<DriverVehicle />} />
                      <Route path="assistant" element={<DriverAssistant />} />
                    </Routes>
                  </PortalShell>
                </ProtectedRoute>
              } />

              <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <PortalShell items={adminNav} subtitle="Admin Portal">
                    <AdminDashboard />
                  </PortalShell>
                </ProtectedRoute>
              } />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </Router>
  )
}
