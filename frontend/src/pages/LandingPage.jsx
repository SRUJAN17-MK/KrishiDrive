import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Sprout, Truck, Brain, CloudSun, Route as RouteIcon, Store,
  ArrowRight, ShieldCheck, Cpu, WifiOff, Languages, CheckCircle2,
  AlertTriangle, Gauge, Leaf, BarChart3, Mic
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { api } from '../services/api'

function LiveEvidence() {
  const [info, setInfo] = useState(null)
  useEffect(() => {
    let active = true
    api.ai.modelInfo().then((data) => { if (active) setInfo(data) }).catch(() => {})
    return () => { active = false }
  }, [])
  const bench = info?.benchmark
  const latency = bench?.latency_ms?.inference?.avg
  const measured = bench?.methodology?.measured_runs
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-2xl font-extrabold text-white">{info?.model?.classes ?? 38}</div>
        <div className="text-[11px] text-gray-400 mt-1">PlantVillage classes</div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-2xl font-extrabold text-white">{latency ? `${latency} ms` : 'CPU'}</div>
        <div className="text-[11px] text-gray-400 mt-1">Measured inference{measured ? ` · n=${measured}` : ''}</div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-2xl font-extrabold text-white">3</div>
        <div className="text-[11px] text-gray-400 mt-1">UI languages</div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-2xl font-extrabold text-white">OSRM</div>
        <div className="text-[11px] text-gray-400 mt-1">Real road routing</div>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const { isAuthenticated, user } = useAuth()
  const { t } = useLanguage()
  const dashboardPath = user?.role === 'driver' ? '/driver' : user?.role === 'admin' ? '/admin' : '/farmer'

  const features = [
    { icon: Leaf, title: 'Crop records', body: 'Track area, expected quantity, planting and harvest dates. Run a rule-based harvest estimate with an explicit non-ML label.' },
    { icon: Brain, title: t('landing.realModel'), body: t('landing.realModelBody'), link: '/ai-lab' },
    { icon: CloudSun, title: 'Live field weather', body: 'Current conditions and a 7-day forecast from Open-Meteo. If the service is unreachable, the UI says so instead of showing a fake forecast.' },
    { icon: RouteIcon, title: 'Road-network routing', body: 'OSRM distance and geometry for route planning. A straight-line fallback is clearly marked when OSRM is unavailable.' },
    { icon: Truck, title: 'Transport booking', body: 'Create a real transport request, compare available vehicles and drivers, and track the trip from pickup to delivery.' },
    { icon: Store, title: 'Mandi prices', body: 'Agmarknet prices through data.gov.in when an API key is configured. Without a key the page shows no prices — never simulated ones.' }
  ]

  return (
    <div className="bg-slate-50 dark:bg-[#0b1411]">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0d2b21] via-[#124734] to-[#0a1c16] text-white">
        <div className="absolute inset-0 opacity-20" aria-hidden="true">
          <div className="absolute -top-24 -right-20 h-80 w-80 rounded-full bg-emerald-400 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-amber-400 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-bold text-emerald-300 mb-5">
              <ShieldCheck size={14} /> {t('landing.badge')}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08]">
              {t('landing.heroTitle')}
            </h1>
            <p className="mt-5 text-sm sm:text-base text-gray-300 leading-relaxed max-w-xl">
              {t('landing.heroBody')}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to={isAuthenticated ? dashboardPath : '/register'} className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-3 text-sm font-extrabold text-[#1b1a0e] shadow-lg shadow-amber-900/20">
                {isAuthenticated ? t('landing.openDashboard') : t('common.getStarted')} <ArrowRight size={17} />
              </Link>
              <Link to="/ai-lab" className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 px-5 py-3 text-sm font-bold text-white">
                <Brain size={17} /> {t('landing.exploreAi')}
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-gray-400">
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-400" /> No invented NPU numbers</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-400" /> No fake API data</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-400" /> Rule engines labelled</span>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/20 backdrop-blur p-5 shadow-2xl">
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-300">Measured evidence</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/20 px-2 py-1 text-[10px] font-bold text-emerald-300"><Cpu size={11} /> CPU</span>
            </div>
            <LiveEvidence />
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-white"><AlertTriangle size={14} className="text-amber-400" /> What “on-device” does not mean here</div>
              <p className="text-[11px] text-gray-400 leading-relaxed mt-1.5">
                Disease inference runs on the <strong className="text-gray-200">server CPU</strong>. No Snapdragon NPU or QNN provider has been verified for this build. The model card publishes the hardware, runtime and measured latency.
              </p>
              <Link to="/on-device-ai" className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300">Read the model card <ArrowRight size={12} /></Link>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature) => (
            <Link key={feature.title} to={feature.link || '/register'} className="group rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-5 hover:border-emerald-400 hover:shadow-md transition">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 grid place-items-center mb-3"><feature.icon size={20} /></div>
              <h2 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">{feature.title} <ArrowRight size={13} className="opacity-0 group-hover:opacity-100 transition" /></h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mt-1.5">{feature.body}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-white dark:bg-[#0f1f19] border-y border-gray-200 dark:border-[#1e362e]">
        <div className="max-w-7xl mx-auto px-4 py-14 grid lg:grid-cols-3 gap-10">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400 mb-2">How it works</p>
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">One workflow from field to mandi.</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mt-2">Each step uses a real record or a clearly labelled estimate. Nothing is dressed up as AI when it is a rule.</p>
          </div>
          <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
            {[
              { icon: Sprout, title: 'Record the crop', body: 'Farmer adds crop, area, expected quantity and dates.' },
              { icon: Brain, title: 'Check the leaf', body: 'Real MobileNetV2 ONNX inference returns top-5 classes and confidence.' },
              { icon: RouteIcon, title: 'Plan the road', body: 'OSRM route geometry, distance, duration and labelled fallback.' },
              { icon: Truck, title: 'Book and track', body: 'Request transport, compare haulers, and follow the trip status.' }
            ].map((step, index) => (
              <div key={step.title} className="rounded-2xl border border-gray-200 dark:border-[#1e362e] p-4">
                <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-700 dark:text-emerald-400"><span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 grid place-items-center">{index + 1}</span> STEP</div>
                <step.icon size={20} className="text-emerald-600 my-2" />
                <p className="text-sm font-bold text-gray-900 dark:text-white">{step.title}</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-14 grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 p-6">
          <div className="flex items-center gap-2 text-sm font-extrabold text-emerald-900 dark:text-emerald-200"><ShieldCheck size={18} /> {t('landing.honestTitle')}</div>
          <p className="text-xs text-emerald-900/80 dark:text-emerald-200/80 leading-relaxed mt-2">{t('landing.honestBody')}</p>
          <ul className="mt-3 space-y-1.5 text-[11px] text-emerald-900/80 dark:text-emerald-200/80">
            <li className="flex gap-1.5"><CheckCircle2 size={13} className="mt-0.5 shrink-0" /> Reported model accuracy is attributed to the model author, not re-measured.</li>
            <li className="flex gap-1.5"><CheckCircle2 size={13} className="mt-0.5 shrink-0" /> CPU latency is measured on this machine and published with host details.</li>
            <li className="flex gap-1.5"><CheckCircle2 size={13} className="mt-0.5 shrink-0" /> Weather, routing and mandi sources show their live/fallback/unavailable state.</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-6 grid grid-cols-2 gap-4">
          {[
            { icon: Languages, title: 'English · हिन्दी · मराठी', body: 'Core workflows, language switcher and voice input where the browser supports it.' },
            { icon: WifiOff, title: 'Offline-aware shell', body: 'Service worker caches the app shell and read-only API responses. Writes queue as pending, never as "done".' },
            { icon: Mic, title: 'Voice, honestly', body: 'Browser speech recognition and text-to-speech. Unsupported browsers get a disabled control, not a fake transcript.' },
            { icon: Gauge, title: 'Public benchmarks', body: 'Runtime, host, warm-up runs and p50/p95 latency are visible in the app.' }
          ].map((item) => (
            <div key={item.title}>
              <item.icon size={18} className="text-emerald-600 mb-2" />
              <p className="text-xs font-bold text-gray-900 dark:text-white">{item.title}</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#0d2b21] text-white">
        <div className="max-w-5xl mx-auto px-4 py-14 text-center">
          <BarChart3 size={30} className="mx-auto text-emerald-400 mb-3" />
          <h2 className="text-2xl sm:text-3xl font-extrabold">Start with a real record, not a demo prediction.</h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-2 max-w-2xl mx-auto">Create a farm account, add a crop, check a leaf, and book transport. Analysts can inspect the model card, API status and source code.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to={isAuthenticated ? dashboardPath : '/register'} className="rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-3 text-sm font-extrabold text-[#1b1a0e]">{isAuthenticated ? t('landing.openDashboard') : t('common.getStarted')}</Link>
            <Link to="/on-device-ai" className="rounded-xl border border-white/20 px-5 py-3 text-sm font-bold text-white hover:bg-white/10">{t('nav.model')}</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
