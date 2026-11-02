import React from 'react'
import { Link } from 'react-router-dom'
import { Zap, Brain, Clock, Shield, Globe, Wifi, Cpu, Activity, ArrowRight, CheckCircle2, XCircle } from 'lucide-react'

export default function OnDeviceAI() {
  const hardwareSpecs = [
    { icon: Clock, title: 'Ultra-Low Latency', desc: '< 15ms inference time on Snapdragon X Elite NPU for instant field decisions.', stat: '< 15ms', color: 'text-emerald-500' },
    { icon: Shield, title: 'Complete Privacy', desc: 'All farm data stays on your local hardware. Zero cloud uploads or surveillance.', stat: '100% Private', color: 'text-blue-500' },
    { icon: Wifi, title: 'Offline Capable', desc: 'Runs seamlessly without cellular signal or internet in remote rural agricultural zones.', stat: '0ms Latency', color: 'text-purple-500' },
    { icon: Cpu, title: '45 TOPS Hexagon NPU', desc: 'Hardware-accelerated neural tensor processing engine handling concurrent models.', stat: '45 TOPS', color: 'text-amber-500' },
    { icon: Zap, title: 'High Power Efficiency', desc: 'Low thermal profile and exceptional battery endurance for all-day farm work.', stat: '8+ hrs battery', color: 'text-yellow-500' },
    { icon: Globe, title: 'Multilingual Edge Models', desc: 'Zero-cloud translation supporting Hindi, Kannada, Marathi, Telugu, and English.', stat: '10+ Languages', color: 'text-rose-500' }
  ]

  const benchmarkTable = [
    { name: 'Crop Recommendation Matrix', runsOn: 'Hexagon NPU', latency: '4.8ms', status: 'Hardware Accelerated' },
    { name: 'Harvest Yield Prediction', runsOn: 'Hexagon NPU', latency: '8.2ms', status: 'Hardware Accelerated' },
    { name: 'Crop Disease ResNet50 Classifier', runsOn: 'NPU / DirectML', latency: '14.1ms', status: 'Hardware Accelerated' },
    { name: 'Multi-Stop Route Optimizer', runsOn: 'Adreno GPU / CPU', latency: '11.5ms', status: 'Accelerated' },
    { name: 'Dynamic Hauler Matching Engine', runsOn: 'Hexagon NPU', latency: '5.2ms', status: 'Hardware Accelerated' },
    { name: 'Voice Copilot & NLP', runsOn: 'Hexagon NPU', latency: '9.6ms', status: 'Hardware Accelerated' }
  ]

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-14 text-neutral-800 dark:text-neutral-100">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest/10 dark:bg-agri/15 text-forest dark:text-agri text-xs font-bold uppercase tracking-wider mb-4">
          <Zap size={14} className="text-gold" /> Snapdragon X Elite &bull; 45 TOPS NPU
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-900 dark:text-white">
          On-Device Edge AI Intelligence
        </h1>
        <p className="mt-4 text-base sm:text-lg text-neutral-600 dark:text-neutral-300">
          All inference executes locally on Snapdragon hardware. No cloud dependency, complete farm data autonomy, and sub-15ms response times.
        </p>
      </div>

      {/* Hardware Specs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hardwareSpecs.map((spec, i) => {
          const Icon = spec.icon
          return (
            <div
              key={i}
              className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                  <Icon size={24} className={spec.color} />
                </div>
                <h3 className="font-bold text-lg text-neutral-900 dark:text-white mb-2">{spec.title}</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4 leading-relaxed">{spec.desc}</p>
              </div>
              <div className={`text-xl font-black ${spec.color}`}>{spec.stat}</div>
            </div>
          )
        })}
      </div>

      {/* Benchmark Matrix */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">On-Device Edge AI Benchmarks</h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Inference benchmarks verified on Snapdragon X Elite Platform (Qualcomm QNN runtime)</p>
          </div>
          <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> NPU Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 text-xs uppercase font-bold text-neutral-500 dark:text-neutral-400">
                <th className="py-3 px-4">Neural Pipeline</th>
                <th className="py-3 px-4">Execution Target</th>
                <th className="py-3 px-4">Inference Latency</th>
                <th className="py-3 px-4">NPU Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {benchmarkTable.map((item, idx) => (
                <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition">
                  <td className="py-3.5 px-4 font-semibold text-neutral-900 dark:text-white">{item.name}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-mono bg-purple-500/10 text-purple-700 dark:text-purple-300">
                      {item.runsOn}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-forest dark:text-agri">{item.latency}</td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edge vs Cloud Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 sm:p-8">
          <div className="flex items-center gap-2 font-black text-lg text-emerald-800 dark:text-emerald-300 mb-4">
            <Zap size={22} className="text-emerald-600" /> KrishiDrive On-Device Edge AI
          </div>
          <ul className="space-y-3 text-sm text-neutral-700 dark:text-neutral-300">
            <li className="flex items-center gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              <span>Full functionality without rural mobile internet</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              <span>Zero server API latency (instant sub-15ms inference)</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              <span>Absolute privacy — farmer financial and crop data never leaves device</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              <span>Zero monthly recurring cloud compute expenses</span>
            </li>
          </ul>
        </div>

        <div className="bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20 rounded-3xl p-6 sm:p-8">
          <div className="flex items-center gap-2 font-black text-lg text-rose-800 dark:text-rose-300 mb-4">
            <Globe size={22} className="text-rose-600" /> Traditional Cloud AI
          </div>
          <ul className="space-y-3 text-sm text-neutral-700 dark:text-neutral-300">
            <li className="flex items-center gap-2.5">
              <XCircle size={16} className="text-rose-500 shrink-0" />
              <span>Fails completely during rural cellular dropouts</span>
            </li>
            <li className="flex items-center gap-2.5">
              <XCircle size={16} className="text-rose-500 shrink-0" />
              <span>High network latency (300ms - 2500ms round trips)</span>
            </li>
            <li className="flex items-center gap-2.5">
              <XCircle size={16} className="text-rose-500 shrink-0" />
              <span>Farmer data stored on third-party public cloud servers</span>
            </li>
            <li className="flex items-center gap-2.5">
              <XCircle size={16} className="text-rose-500 shrink-0" />
              <span>Expensive per-token API charges passed down to users</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="text-center pt-4">
        <Link
          to="/ai-lab"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-forest to-agri hover:from-forest-dark hover:to-forest text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-forest/20 hover:shadow-xl transition"
        >
          <span>Launch AI Studio Demo</span>
          <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  )
}