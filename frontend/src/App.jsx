import React from 'react'
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Sprout, Truck, Brain, Navigation, LogOut,
  Menu, X, Home, Route as RouteIcon, Package, MessageSquare,
  Settings, BarChart3, Zap, Globe, Sun, Moon, ShieldCheck,
  UserCheck, ArrowRight, Bell
} from 'lucide-react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import { Toaster } from 'react-hot-toast'

import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import FarmerDashboard from './pages/FarmerDashboard'
import FarmerCrops from './pages/FarmerCrops'
import FarmerTransport from './pages/FarmerTransport'
import FarmerDeliveries from './pages/FarmerDeliveries'
import FarmerAssistant from './pages/FarmerAssistant'
import DriverDashboard from './pages/DriverDashboard'
import DriverJobs from './pages/DriverJobs'
import DriverRoutes from './pages/DriverRoutes'
import DriverTrips from './pages/DriverTrips'
import DriverVehicle from './pages/DriverVehicle'
import DriverAssistant from './pages/DriverAssistant'
import AILab from './pages/AILab'
import OnDeviceAI from './pages/OnDeviceAI'
import AdminDashboard from './pages/AdminDashboard'
import AboutPage from './pages/AboutPage'

const farmerNav = [
  { path: '/farmer', label: 'Overview', icon: LayoutDashboard, end: true },
  { path: '/farmer/crops', label: 'Crop Management', icon: Sprout },
  { path: '/farmer/transport', label: 'Transport Booking', icon: Truck },
  { path: '/farmer/deliveries', label: 'Live Deliveries', icon: Package },
  { path: '/farmer/assistant', label: 'Farming Assistant', icon: MessageSquare },
  { path: '/ai-lab', label: 'AI Innovation Lab', icon: Brain },
]

const driverNav = [
  { path: '/driver', label: 'Overview', icon: LayoutDashboard, end: true },
  { path: '/driver/jobs', label: 'Available Jobs', icon: Truck },
  { path: '/driver/routes', label: 'AI Route Optimizer', icon: RouteIcon },
  { path: '/driver/trips', label: 'My Trips', icon: Navigation },
  { path: '/driver/vehicle', label: 'Vehicle Profile', icon: Settings },
  { path: '/driver/assistant', label: 'Driver Assistant', icon: MessageSquare },
]

const adminNav = [
  { path: '/admin', label: 'Analytics & KPIs', icon: BarChart3, end: true },
  { path: '/ai-lab', label: 'AI Diagnostic Lab', icon: Brain },
  { path: '/on-device-ai', label: 'Snapdragon NPU', icon: Zap },
]

const publicNav = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/about', label: 'About', icon: Globe },
  { path: '/ai-lab', label: 'AI Lab', icon: Brain },
  { path: '/on-device-ai', label: 'Snapdragon AI', icon: Zap },
]

function Sidebar({ items, title, subtitle }) {
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = React.useState(false)

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2.5 bg-white dark:bg-[#12211c] text-gray-800 dark:text-gray-100 rounded-xl shadow-md border border-gray-200 dark:border-forest-800"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* BUG-04 FIXED: Desktop fixed sidebar with distinct z-index & no layout collision */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-[#12211c] border-r border-gray-200 dark:border-[#1e362e] flex flex-col transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-gray-100 dark:border-[#1e362e] flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-forest rounded-xl flex items-center justify-center text-white font-black text-lg shadow-md shadow-forest-900/20">
              🌾
            </div>
            <div>
              <div className="font-bold text-gray-900 dark:text-white text-base tracking-tight">KrishiDrive</div>
              <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">{subtitle || 'Smart Platform'}</div>
            </div>
          </NavLink>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Items */}
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
              <item.icon size={18} className="flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Card & Controls */}
        <div className="p-3 border-t border-gray-100 dark:border-[#1e362e] space-y-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-[#162a23] hover:bg-gray-100 dark:hover:bg-[#1c352c] rounded-xl transition"
          >
            <span className="flex items-center gap-2">
              {isDark ? <Moon size={14} className="text-amber-400" /> : <Sun size={14} className="text-amber-500" />}
              <span>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
            </span>
            <span className="text-[10px] uppercase font-bold text-gray-400">{isDark ? 'ON' : 'OFF'}</span>
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 dark:bg-[#162a23] rounded-xl">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?auto=format&fit=crop&w=150&q=80'}
              alt={user?.full_name}
              className="w-9 h-9 rounded-full object-cover border border-emerald-500/30"
            />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-gray-900 dark:text-white truncate">{user?.full_name || user?.username}</div>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-400 capitalize font-medium">{user?.role}</div>
            </div>
            <button
              onClick={() => {
                logout()
                navigate('/login')
              }}
              title="Logout"
              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* Hardware NPU Badge */}
        <div className="p-3 border-t border-gray-100 dark:border-[#1e362e]">
          <div className="bg-gradient-to-r from-emerald-500/10 via-forest-500/10 to-gold-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
              <Zap size={13} className="text-amber-500" /> Snapdragon X Elite NPU
            </div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">45 TOPS • On-Device AI • &lt;15ms</div>
          </div>
        </div>
      </aside>
    </>
  )
}

function PublicLayout({ children }) {
  const { user, logout, isAuthenticated } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0b1411] text-gray-900 dark:text-gray-100 transition-colors">
      <header className="glass-nav border-b border-gray-200 dark:border-[#1e362e] sticky top-0 z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-forest rounded-xl flex items-center justify-center text-white font-black text-xl shadow-md">
              🌾
            </div>
            <div>
              <span className="font-extrabold text-gray-900 dark:text-white text-lg tracking-tight">KrishiDrive</span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40">AI Platform</span>
            </div>
          </NavLink>

          <nav className="flex items-center gap-1 sm:gap-2">
            {publicNav.map(n => (
              <NavLink
                key={n.path}
                to={n.path}
                end={n.path === '/'}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60'
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}

            {/* Dark Mode Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#182c25] transition"
              title="Toggle theme"
            >
              {isDark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
            </button>

            {isAuthenticated && user ? (
              <div className="flex items-center gap-2 ml-2">
                <NavLink
                  to={user.role === 'driver' ? '/driver' : user.role === 'admin' ? '/admin' : '/farmer'}
                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition flex items-center gap-1.5"
                >
                  <LayoutDashboard size={15} /> Dashboard
                </NavLink>
                <button
                  onClick={() => {
                    logout()
                    navigate('/login')
                  }}
                  className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-2">
                <NavLink
                  to="/login"
                  className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl transition"
                >
                  Sign In
                </NavLink>
                <NavLink
                  to="/register"
                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition"
                >
                  Get Started
                </NavLink>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-[#07120e] text-gray-400 border-t border-[#13271f] py-12">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-4 gap-8 mb-8 text-sm">
          <div>
            <div className="flex items-center gap-2 text-white font-bold text-lg mb-3">
              <span className="text-2xl">🌾</span> KrishiDrive AI
            </div>
            <p className="text-xs text-gray-400 leading-relaxed mb-4">
              Smart Farming. Smarter Transport. Powered by Qualcomm Snapdragon on-device intelligence. Bridging the agricultural supply chain from farm gate to market terminal.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <Zap size={14} /> Snapdragon AI Lab Challenge 2026
            </div>
          </div>

          <div>
            <div className="text-white font-semibold text-xs uppercase tracking-wider mb-3">AI Capabilities</div>
            <ul className="space-y-2 text-xs">
              <li><NavLink to="/ai-lab" className="hover:text-emerald-400 transition">AI Crop Recommendation</NavLink></li>
              <li><NavLink to="/ai-lab" className="hover:text-emerald-400 transition">AI Harvest Prediction</NavLink></li>
              <li><NavLink to="/ai-lab" className="hover:text-emerald-400 transition">Crop Disease Diagnosis</NavLink></li>
              <li><NavLink to="/ai-lab" className="hover:text-emerald-400 transition">Dynamic Route Optimizer</NavLink></li>
            </ul>
          </div>

          <div>
            <div className="text-white font-semibold text-xs uppercase tracking-wider mb-3">Portals</div>
            <ul className="space-y-2 text-xs">
              <li><NavLink to="/login?role=farmer" className="hover:text-emerald-400 transition">Farmer Portal & Crops</NavLink></li>
              <li><NavLink to="/login?role=driver" className="hover:text-emerald-400 transition">Driver Freight & Jobs</NavLink></li>
              <li><NavLink to="/login?role=admin" className="hover:text-emerald-400 transition">Administrator Control</NavLink></li>
              <li><NavLink to="/on-device-ai" className="hover:text-emerald-400 transition">Snapdragon NPU Specs</NavLink></li>
            </ul>
          </div>

          <div>
            <div className="text-white font-semibold text-xs uppercase tracking-wider mb-3">Contact & Support</div>
            <p className="text-xs text-gray-400 mb-2">Dedicated agricultural support line:</p>
            <div className="text-sm font-bold text-white mb-2">+91 1800-KRISHI-AI</div>
            <p className="text-xs text-gray-400">support@krishidrive.ai • Nashik & Ludhiana Hubs</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 pt-6 border-t border-[#13271f] flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <div>© 2026 KrishiDrive AI Platform. All rights reserved.</div>
          <div className="flex gap-4">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>APMC Integration</span>
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
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Loading KrishiDrive...</p>
        </div>
      </div>
    )
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(user?.role)) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: '#1b4332',
                color: '#fff',
                fontSize: '13px',
                borderRadius: '12px',
                padding: '12px 16px',
              },
            }}
          />
          <Routes>
            <Route path="/" element={<PublicLayout><LandingPage /></PublicLayout>} />
            <Route path="/about" element={<PublicLayout><AboutPage /></PublicLayout>} />
            <Route path="/ai-lab" element={<PublicLayout><AILab /></PublicLayout>} />
            <Route path="/on-device-ai" element={<PublicLayout><OnDeviceAI /></PublicLayout>} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Farmer Portal */}
            <Route
              path="/farmer/*"
              element={
                <ProtectedRoute allowedRoles={['farmer', 'admin']}>
                  <div className="min-h-screen bg-slate-50 dark:bg-[#0b1411] transition-colors">
                    <Sidebar items={farmerNav} subtitle="Farmer Portal" />
                    <main className="lg:ml-64 p-4 lg:p-8 min-h-screen transition-all">
                      <Routes>
                        <Route index element={<FarmerDashboard />} />
                        <Route path="crops" element={<FarmerCrops />} />
                        <Route path="transport" element={<FarmerTransport />} />
                        <Route path="deliveries" element={<FarmerDeliveries />} />
                        <Route path="assistant" element={<FarmerAssistant />} />
                      </Routes>
                    </main>
                  </div>
                </ProtectedRoute>
              }
            />

            {/* Driver Portal */}
            <Route
              path="/driver/*"
              element={
                <ProtectedRoute allowedRoles={['driver', 'admin']}>
                  <div className="min-h-screen bg-slate-50 dark:bg-[#0b1411] transition-colors">
                    <Sidebar items={driverNav} subtitle="Driver Portal" />
                    <main className="lg:ml-64 p-4 lg:p-8 min-h-screen transition-all">
                      <Routes>
                        <Route index element={<DriverDashboard />} />
                        <Route path="jobs" element={<DriverJobs />} />
                        <Route path="routes" element={<DriverRoutes />} />
                        <Route path="trips" element={<DriverTrips />} />
                        <Route path="vehicle" element={<DriverVehicle />} />
                        <Route path="assistant" element={<DriverAssistant />} />
                      </Routes>
                    </main>
                  </div>
                </ProtectedRoute>
              }
            />

            {/* Admin Portal */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <div className="min-h-screen bg-slate-50 dark:bg-[#0b1411] transition-colors">
                    <Sidebar items={adminNav} subtitle="Admin Portal" />
                    <main className="lg:ml-64 p-4 lg:p-8 min-h-screen transition-all">
                      <AdminDashboard />
                    </main>
                  </div>
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  )
}