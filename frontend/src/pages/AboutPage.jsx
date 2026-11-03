import React from 'react'
import { Link } from 'react-router-dom'
import {
  Brain, Sprout, Truck, ShieldCheck, ArrowRight, Cpu, CloudSun,
  Store, Route as RouteIcon, Database, AlertTriangle, HeartHandshake
} from 'lucide-react'

export default function AboutPage() {
  const pillars = [
    {
      icon: Sprout,
      title: 'Farmer-first records',
      body: 'Crops, transport requests and deliveries are stored in a transactional SQLite database. Farmers see their own data; drivers see jobs and trips; admins see aggregate operations.'
    },
    {
      icon: Brain,
      title: 'One real ML model',
      body: 'Leaf disease classification is the only machine-learning inference in the product: a verified MobileNetV2 ONNX model with 38 PlantVillage classes, running on the server CPU.'
    },
    {
      icon: ShieldCheck,
      title: 'Disclosed limits',
      body: 'The model card publishes the author-reported accuracy, measured CPU latency, hardware, class list, licence and failure modes. The UI never invents a benchmark.'
    }
  ]

  const stack = [
    { icon: Database, title: 'Data layer', body: 'SQLite with WAL mode, foreign keys, schema migrations and transactional writes. Legacy JSON is imported once, with backups retained.' },
    { icon: Cpu, title: 'Inference', body: 'onnxruntime-node + sharp. Float32 MobileNetV2, 224×224 input, softmax top-5. NPU/QNN is not claimed without hardware verification.' },
    { icon: CloudSun, title: 'Weather', body: 'Open-Meteo current conditions and 7-day forecast, cached for 10 minutes. Missing or failed responses are shown as unavailable.' },
    { icon: RouteIcon, title: 'Routing', body: 'OSRM public demo server for real road distance, duration and geometry. Haversine × 1.28 fallback is explicitly labelled as an estimate.' },
    { icon: Store, title: 'Mandi prices', body: 'Agmarknet via data.gov.in, requiring AGMARKNET_API_KEY. No key means no prices are displayed — there is no simulated fallback.' },
    { icon: Truck, title: 'Operations', body: 'Transport matching and harvest/crop scores are deterministic rule engines. They are labelled “rule engine”, not AI.' }
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
      <header className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 dark:bg-emerald-950/50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 mb-4">
          <HeartHandshake size={14} /> Mission & architecture
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          Honest software for the farm-to-mandi journey.
        </h1>
        <p className="mt-4 text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
          KrishiDrive connects crop records, disease diagnosis, weather, road routing and transport booking. It is built so a farmer, driver or reviewer can tell the difference between a live API reading, a measured model benchmark, a deterministic rule, and an unavailable service.
        </p>
      </header>

      <section className="grid md:grid-cols-3 gap-4">
        {pillars.map((pillar) => (
          <article key={pillar.title} className="rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-6">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 grid place-items-center mb-4"><pillar.icon size={22} /></div>
            <h2 className="text-base font-extrabold text-gray-900 dark:text-white">{pillar.title}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mt-2">{pillar.body}</p>
          </article>
        ))}
      </section>

      <section className="rounded-3xl bg-gradient-to-br from-[#0d2b21] via-[#124734] to-[#0a1c16] p-6 sm:p-9 text-white">
        <div className="max-w-2xl mb-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-300">System map</p>
          <h2 className="text-2xl font-extrabold mt-1">React PWA → Express API → SQLite + live services</h2>
          <p className="text-xs text-gray-300 mt-2">The service worker caches the shell and read-only responses. Disease inference, writes and authenticated reads require the backend.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {stack.map((item) => (
            <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <item.icon size={18} className="text-emerald-300 mb-2" />
              <p className="text-xs font-bold text-white">{item.title}</p>
              <p className="text-[11px] text-gray-400 leading-relaxed mt-1">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 p-6">
          <div className="flex items-center gap-2 text-sm font-extrabold text-amber-900 dark:text-amber-200"><AlertTriangle size={17} /> What this project does not claim</div>
          <ul className="mt-3 space-y-2 text-xs text-amber-900/80 dark:text-amber-200/80 list-disc pl-4">
            <li>No Snapdragon NPU, Qualcomm Hexagon or QNN acceleration has been verified. The measured benchmark is CPU inference.</li>
            <li>The 95.41% model accuracy is the model author's evaluation, not a KrishiDrive field trial.</li>
            <li>Transport matching, crop recommendation, harvest estimates and the assistants are rule engines, not language or recommendation models.</li>
            <li>Mandi prices require an external API key. Weather and routing can fail; the UI shows that failure rather than inventing data.</li>
            <li>Demo seed accounts are for local development only and are disabled when SEED_DEMO_DATA=false in production.</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-6">
          <div className="flex items-center gap-2 text-sm font-extrabold text-gray-900 dark:text-white"><ShieldCheck size={17} className="text-emerald-600" /> Open to inspection</div>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mt-2">
            The repository includes the model attribution, benchmark JSON, API tests, environment template, Docker setup and deployment notes. If a claim is not supported by code or measured data, it does not belong in the product.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Link to="/on-device-ai" className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-3 py-2 text-xs font-bold text-white">Model card <ArrowRight size={13} /></Link>
            <a href="/api/health/detailed" className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-[#274a3d] px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-200">API status</a>
            <a href="https://github.com/SRUJAN17-MK/KrishiDrive" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-[#274a3d] px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-200">Source code</a>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-6 text-center">
        <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">Start with a real record.</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">No synthetic demo prediction is shown to logged-in users.</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Link to="/register?role=farmer" className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-4 py-2.5 text-xs font-bold text-white"><Sprout size={15} /> Join as farmer</Link>
          <Link to="/register?role=driver" className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2.5 text-xs font-extrabold text-[#1b1a0e]"><Truck size={15} /> Join as driver</Link>
          <Link to="/ai-lab" className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-[#274a3d] px-4 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-200"><Brain size={15} /> AI Lab</Link>
        </div>
      </section>
    </div>
  )
}
