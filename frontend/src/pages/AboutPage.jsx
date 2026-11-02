import React from 'react'
import { Link } from 'react-router-dom'
import { Brain, Target, Users, Globe, Zap, ArrowRight, Sprout, Truck, ShieldCheck, HeartHandshake } from 'lucide-react'

export default function AboutPage() {
  const problemsAndSolutions = [
    {
      icon: Target,
      title: 'Post-Harvest Loss Crisis',
      desc: 'Indian farmers lose up to 25% of perishable crop value due to fragmented hauler networks, delayed APMC dispatches, and speculative brokerage.',
      badge: 'The Challenge'
    },
    {
      icon: Brain,
      title: 'Snapdragon NPU Edge AI',
      desc: 'KrishiDrive deploys quantized neural networks locally on edge hardware, running real-time crop disease diagnosis, yield forecast, and multi-stop logistics offline.',
      badge: 'The Solution'
    },
    {
      icon: Globe,
      title: 'Farmer-Driver Fair Prosperity',
      desc: 'Direct APMC rate transparency, automated empty-return load matching for transporters, and zero middleman markups create resilient rural logistics.',
      badge: 'The Impact'
    }
  ]

  const workflowSteps = [
    { icon: Sprout, label: 'Farmer Lists Harvest', desc: 'NPK-verified crop logging' },
    { icon: Brain, label: 'AI Dispatches Hauler', desc: 'Proximity & payload matching' },
    { icon: Zap, label: 'Green Corridor Route', desc: 'Real-time road & toll optimization' },
    { icon: Truck, label: 'APMC Delivery', desc: 'Instant milestone settlement' }
  ]

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-16 text-neutral-800 dark:text-neutral-100">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest/10 dark:bg-agri/15 text-forest dark:text-agri text-xs font-bold uppercase tracking-wider mb-4">
          <HeartHandshake size={14} /> Mission & Architecture
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-900 dark:text-white">
          Empowering Indian Agriculture Through <span className="text-forest dark:text-agri">Intelligent Transport</span>
        </h1>
        <p className="mt-4 text-base sm:text-lg text-neutral-600 dark:text-neutral-300">
          KrishiDrive bridges the critical gap between rural farm gates and urban Mandis using edge AI, fair tariffs, and green transport corridors.
        </p>
      </div>

      {/* 3 Pillars */}
      <div className="grid md:grid-cols-3 gap-8">
        {problemsAndSolutions.map((item, i) => {
          const Icon = item.icon
          return (
            <div
              key={i}
              className="bg-white dark:bg-neutral-900 rounded-3xl p-8 border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 bg-forest/10 dark:bg-agri/15 rounded-2xl flex items-center justify-center text-forest dark:text-agri">
                    <Icon size={24} />
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                    {item.badge}
                  </span>
                </div>
                <h3 className="font-extrabold text-xl text-neutral-900 dark:text-white mb-3">
                  {item.title}
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Architecture Flow */}
      <div className="bg-gradient-to-br from-neutral-900 via-forest-dark to-neutral-900 rounded-3xl p-8 lg:p-12 text-white shadow-xl">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">End-to-End Agri-Logistics Pipeline</h2>
          <p className="text-sm text-neutral-300">
            From the farmer's field to the APMC auction yard in hours, powered by edge compute
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {workflowSteps.map((step, idx) => {
            const StepIcon = step.icon
            return (
              <div key={idx} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 text-center flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-gold to-agri flex items-center justify-center text-neutral-900 font-bold mb-4 shadow-lg">
                  <StepIcon size={26} />
                </div>
                <div className="text-xs uppercase font-bold tracking-wider text-gold-light mb-1">Step 0{idx + 1}</div>
                <div className="font-bold text-base text-white mb-1">{step.label}</div>
                <div className="text-xs text-neutral-300">{step.desc}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* CTA Box */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 sm:p-12 border border-neutral-200 dark:border-neutral-800 text-center shadow-sm">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white mb-4">
          Ready to Modernize Your Harvest Logistics?
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto mb-8 text-sm">
          Whether you are a grower looking to transport perishable yield or a commercial driver seeking return loads, KrishiDrive AI is free to join.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/register?role=farmer"
            className="inline-flex items-center gap-2 bg-forest hover:bg-forest-dark text-white px-6 py-3.5 rounded-2xl font-bold shadow-md hover:shadow-lg transition cursor-pointer"
          >
            <Sprout size={18} /> Join as Farmer
          </Link>
          <Link
            to="/register?role=driver"
            className="inline-flex items-center gap-2 bg-agri hover:bg-forest text-white px-6 py-3.5 rounded-2xl font-bold shadow-md hover:shadow-lg transition cursor-pointer"
          >
            <Truck size={18} /> Join as Transporter
          </Link>
          <Link
            to="/ai-lab"
            className="inline-flex items-center gap-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white px-6 py-3.5 rounded-2xl font-bold transition cursor-pointer"
          >
            <Brain size={18} /> Explore AI Lab
          </Link>
        </div>
      </div>
    </div>
  )
}