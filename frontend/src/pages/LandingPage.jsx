import React from 'react'
import { Link } from 'react-router-dom'
import {
  Sprout, Truck, Brain, Zap, Shield, Clock, MapPin, TrendingUp,
  ArrowRight, Star, Users, Package, Route, CheckCircle2,
  Calendar, Activity, ChevronRight, PhoneCall, Award
} from 'lucide-react'

const stats = [
  { value: '15,000+', label: 'Registered Farmers', sub: 'Across 12 Agricultural States' },
  { value: '6,200+', label: 'Verified Freight Drivers', sub: 'Trucks, Tempos & Trailers' },
  { value: '3,80,000+ T', label: 'Harvest Safely Delivered', sub: '22% Reduced Spoilage' },
  { value: '₹75 Cr+', label: 'Farmer Direct Realization', sub: 'Zero Middleman Commissions' },
]

const farmerFeatures = [
  {
    icon: Sprout,
    title: 'Crop Lifecycle Tracking',
    desc: 'Monitor growth duration, acreage, planting dates, and optimal harvest windows with AI reminders.'
  },
  {
    icon: Brain,
    title: 'AI Harvest & Yield Prediction',
    desc: 'Forecast yield in metric tons and gross revenue weeks before cutting using on-device Snapdragon NPU.'
  },
  {
    icon: Truck,
    title: 'Smart Fleet Matching',
    desc: 'Match load requirements with nearby available haulers, reducing empty transit and lowering rates.'
  },
  {
    icon: Package,
    title: 'Live Mandi Delivery Tracking',
    desc: 'Track farm-to-mandi transit in real time with arrival ETAs, driver updates, and digital receipts.'
  },
]

const driverFeatures = [
  {
    icon: MapPin,
    title: 'Nearby Farm Requests',
    desc: 'Discover verified farmer freight requests in your vicinity with upfront pricing and cargo specs.'
  },
  {
    icon: Route,
    title: 'AI-Optimized Green Routing',
    desc: 'Avoid congestion, save 12–15% diesel with gradient-optimized highway routing calculated locally in &lt;10ms.'
  },
  {
    icon: TrendingUp,
    title: 'Earnings & Trip Analytics',
    desc: 'Transparent revenue dashboard with per-km metrics, toll reimbursement, and instant digital payout records.'
  },
  {
    icon: Zap,
    title: 'Transit AI Copilot',
    desc: 'Voice & text assistant offering preventive maintenance reminders, fuel conservation tips, and return loads.'
  },
]

const aiServices = [
  {
    title: 'AI Crop Recommendation',
    tag: 'Agronomy Matrix',
    desc: 'Input soil type, NPK nutrients, temperature, and rainfall to discover ideal high-yielding crops.',
    link: '/ai-lab',
    metric: '96.2% Agronomic Match'
  },
  {
    title: 'AI Harvest Forecasting',
    tag: 'Yield & Schedule',
    desc: 'Accurately predicts peak harvest dates, tonnage, and market revenue for perishable produce.',
    link: '/ai-lab',
    metric: '< 10ms NPU Latency'
  },
  {
    title: 'Crop Disease Diagnostics',
    tag: 'Computer Vision',
    desc: 'Upload leaf photos to instantly diagnose blights, rusts, and spots with immediate chemical and organic cures.',
    link: '/ai-lab',
    metric: 'ResNet50 On-Device'
  },
  {
    title: 'Multi-Criteria Route Engine',
    tag: 'Logistics AI',
    desc: 'Calculates shortest, fastest, and fuel-optimal highway corridors with toll and carbon footprint metrics.',
    link: '/ai-lab',
    metric: '14L Diesel Saved / Trip'
  }
]

const testimonials = [
  {
    name: 'Ram Patel',
    role: 'Pomegranate & Tomato Grower',
    village: 'Nashik, Maharashtra',
    text: 'KrishiDrive AI solved our biggest headache during harvest season. We booked a 10-Ton truck in 4 minutes, and the AI route saved our tomatoes from sitting in highway heat. Arrived at Vashi Mandi in record time!',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?auto=format&fit=crop&w=150&q=80'
  },
  {
    name: 'Vikram Singh',
    role: 'Commercial Fleet Operator',
    village: 'Ludhiana, Punjab',
    text: 'Before KrishiDrive, 35% of my return trips from Delhi Mandi were empty. Now I get matched with local farmers on my return corridor. My monthly net income increased by ₹28,000!',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
  },
  {
    name: 'Sita Devi',
    role: 'Basmati Rice & Onion Farmer',
    village: 'Karnal, Haryana',
    text: 'The AI harvest prediction estimated my rice yield within 3% of the actual weighbridge output. I was able to negotiate directly with wholesale buyers before the crop was even bagged.',
    rating: 5,
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80'
  },
]

export default function LandingPage() {
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative text-white py-24 lg:py-36 gradient-hero-dark overflow-hidden border-b border-[#1b3b2f]">
        {/* Subtle Decorative Background elements */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#2d6a4f_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 px-4 py-1.5 rounded-full text-xs font-semibold shadow-sm">
                <Zap size={14} className="text-amber-400" /> Powered by Qualcomm Snapdragon X Elite NPU
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.12]">
                Smart Farming.<br />
                Smarter Transport.<br />
                <span className="gradient-text-forest">Powered by Local AI.</span>
              </h1>

              <p className="text-base sm:text-lg text-gray-300 max-w-2xl font-normal leading-relaxed">
                Connect farms, harvests, and commercial freight with on-device artificial intelligence. Eliminate transit losses, optimize farm-to-mandi routes, and empower rural economies with zero cloud latency.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/register?role=farmer"
                  className="px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/30 transition transform hover:-translate-y-0.5 flex items-center gap-2 text-sm sm:text-base"
                >
                  <Sprout size={18} /> Join as a Farmer <ArrowRight size={16} />
                </Link>

                <Link
                  to="/register?role=driver"
                  className="px-6 py-3.5 bg-gray-900/80 hover:bg-gray-800 text-gray-100 font-bold rounded-xl border border-gray-700 hover:border-gray-500 transition transform hover:-translate-y-0.5 flex items-center gap-2 text-sm sm:text-base"
                >
                  <Truck size={18} className="text-emerald-400" /> Register Vehicle & Driver
                </Link>

                <Link
                  to="/ai-lab"
                  className="px-5 py-3.5 text-emerald-400 hover:text-emerald-300 font-semibold text-sm flex items-center gap-1.5 transition"
                >
                  <Brain size={16} /> Try Live AI Studio <ChevronRight size={16} />
                </Link>
              </div>

              {/* Hardware Trust Badges */}
              <div className="pt-6 border-t border-emerald-950/60 flex flex-wrap items-center gap-6 text-xs text-gray-400">
                <span className="flex items-center gap-1.5 text-gray-300">
                  <CheckCircle2 size={15} className="text-emerald-400" /> 100% On-Device Privacy
                </span>
                <span className="flex items-center gap-1.5 text-gray-300">
                  <CheckCircle2 size={15} className="text-emerald-400" /> &lt;15ms NPU Latency
                </span>
                <span className="flex items-center gap-1.5 text-gray-300">
                  <CheckCircle2 size={15} className="text-emerald-400" /> Operates Offline in Farmland
                </span>
              </div>
            </div>

            {/* Interactive Preview Card */}
            <div className="lg:col-span-5">
              <div className="bg-[#10221b]/90 backdrop-blur-xl border border-[#204435] rounded-3xl p-6 shadow-2xl relative">
                <div className="flex items-center justify-between pb-4 border-b border-[#204435]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">Live AI Engine Status</span>
                  </div>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                    Snapdragon NPU 45 TOPS
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3.5 my-5">
                  <div className="bg-[#152e24] p-3.5 rounded-2xl border border-[#265340]">
                    <div className="text-[11px] text-gray-400 mb-1">Harvest Prediction</div>
                    <div className="text-xl font-bold text-white">8,500 kg</div>
                    <div className="text-[10px] text-emerald-400 mt-0.5">Nashik Tomatoes • 94% Conf.</div>
                  </div>

                  <div className="bg-[#152e24] p-3.5 rounded-2xl border border-[#265340]">
                    <div className="text-[11px] text-gray-400 mb-1">Route Fuel Saved</div>
                    <div className="text-xl font-bold text-amber-400">14.2 Liters</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">₹1,335 Saved / Transit</div>
                  </div>

                  <div className="bg-[#152e24] p-3.5 rounded-2xl border border-[#265340]">
                    <div className="text-[11px] text-gray-400 mb-1">Transport Matched</div>
                    <div className="text-xl font-bold text-emerald-400">10-Ton Truck</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">18 km away • Driver Verified</div>
                  </div>

                  <div className="bg-[#152e24] p-3.5 rounded-2xl border border-[#265340]">
                    <div className="text-[11px] text-gray-400 mb-1">NPU Inference Time</div>
                    <div className="text-xl font-bold text-white">8.4 ms</div>
                    <div className="text-[10px] text-emerald-400 mt-0.5">Zero Cloud Lag</div>
                  </div>
                </div>

                <div className="bg-emerald-950/60 rounded-xl p-3 border border-emerald-800/40 text-xs text-emerald-200 flex items-center justify-between">
                  <span>Explore full agronomic & freight suite:</span>
                  <Link to="/ai-lab" className="font-bold underline text-white hover:text-emerald-300">Launch AI Studio →</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Ribbon */}
      <section className="py-12 bg-white dark:bg-[#10201a] border-b border-gray-200 dark:border-[#1e362e] transition-colors">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-800 dark:text-emerald-400 tracking-tight">
                  {s.value}
                </div>
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-1">{s.label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 lg:py-28 bg-slate-50 dark:bg-[#0b1411] transition-colors">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Streamlined Workflow</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mt-2">
              From Soil to Supermarket Mandi
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
              How KrishiDrive on-device AI coordinates the entire agricultural supply chain seamlessly.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Farmer Lists Produce', desc: 'Sow date, expected yield, and destination mandi recorded with a click.', icon: Sprout },
              { step: '02', title: 'On-Device AI Predicts', desc: 'Snapdragon NPU calculates exact harvest date, yield tonnage, and vehicle specs.', icon: Brain },
              { step: '03', title: 'Automated Truck Match', desc: 'Verified local haulers get dispatched with optimal capacity and fair rates.', icon: Truck },
              { step: '04', title: 'Green Route Delivery', desc: 'AI routes driver past traffic, avoiding transit spoilage and saving fuel.', icon: CheckCircle2 },
            ].map((st, i) => (
              <div key={i} className="bg-white dark:bg-[#12211c] p-6 rounded-2xl border border-gray-200 dark:border-[#1e362e] card-hover relative">
                <div className="text-3xl font-black text-emerald-700/20 dark:text-emerald-500/20 mb-3">{st.step}</div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-4">
                  <st.icon size={22} />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base mb-2">{st.title}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Services Showcase */}
      <section className="py-20 bg-white dark:bg-[#10201a] border-y border-gray-200 dark:border-[#1e362e] transition-colors">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Next-Gen Intelligence</span>
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">Built-in AI Modules</h2>
            </div>
            <Link to="/ai-lab" className="mt-4 md:mt-0 text-sm font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1">
              Explore All AI Lab Models <ArrowRight size={15} />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {aiServices.map((srv, idx) => (
              <div key={idx} className="bg-slate-50 dark:bg-[#12211c] p-6 rounded-2xl border border-gray-200 dark:border-[#1e362e] card-hover flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full">
                      {srv.tag}
                    </span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{srv.metric}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base mb-2">{srv.title}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-4">{srv.desc}</p>
                </div>
                <Link to={srv.link} className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 flex items-center gap-1">
                  Test Model <ArrowRight size={13} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Farmers */}
      <section className="py-20 lg:py-24 bg-slate-50 dark:bg-[#0b1411] transition-colors">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Tailored for Agriculture</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
                Everything Indian Farmers Need to Prosper
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Take the guesswork out of planting, harvesting, and negotiating transit. With KrishiDrive, smallholders gain enterprise-grade logistics tools.
              </p>
              <div className="pt-2">
                <Link
                  to="/register?role=farmer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold rounded-xl shadow transition"
                >
                  <Sprout size={16} /> Open Farmer Account
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
              {farmerFeatures.map((f, i) => (
                <div key={i} className="bg-white dark:bg-[#12211c] p-5 rounded-2xl border border-gray-200 dark:border-[#1e362e] card-hover">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-3">
                    <f.icon size={20} />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{f.title}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* For Drivers */}
      <section className="py-20 lg:py-24 bg-white dark:bg-[#10201a] border-t border-gray-200 dark:border-[#1e362e] transition-colors">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4 order-2 lg:order-1">
              {driverFeatures.map((f, i) => (
                <div key={i} className="bg-slate-50 dark:bg-[#12211c] p-5 rounded-2xl border border-gray-200 dark:border-[#1e362e] card-hover">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
                    <f.icon size={20} />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{f.title}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>

            <div className="lg:col-span-5 space-y-4 order-1 lg:order-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Built for Commercial Haulers</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
                Eliminate Dead Miles. Maximize Every Liter.
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Transform single-trip hauls into continuous revenue loops. Pick up return loads from agricultural mandis directly on your smartphone.
              </p>
              <div className="pt-2">
                <Link
                  to="/register?role=driver"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-xl shadow transition"
                >
                  <Truck size={16} /> Join Freight Fleet
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-slate-50 dark:bg-[#0b1411] transition-colors">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Field Stories</span>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">Trusted Across Indian Mandis</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => (
              <div key={idx} className="bg-white dark:bg-[#12211c] p-6 rounded-2xl border border-gray-200 dark:border-[#1e362e] card-hover flex flex-col justify-between">
                <div>
                  <div className="flex gap-1 text-amber-400 mb-3">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} size={15} fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-300 italic leading-relaxed mb-6">"{t.text}"</p>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-[#1e362e]">
                  <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover border border-emerald-500/30" />
                  <div>
                    <div className="text-xs font-bold text-gray-900 dark:text-white">{t.name}</div>
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">{t.role}</div>
                    <div className="text-[10px] text-gray-400">{t.village}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-20 bg-gradient-to-br from-[#122b21] via-[#183a2d] to-[#0c1f17] text-white text-center border-t border-emerald-900">
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-4 py-1.5 rounded-full text-xs font-semibold">
            <Award size={14} className="text-amber-400" /> Snapdragon AI Lab Build & Present Challenge 2026
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Ready to Revolutionize Your Harvest Logistics?
          </h2>
          <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Join thousands of progressive farmers and transport fleet operators leveraging local Qualcomm Snapdragon AI. Zero subscription fees for smallholders.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              to="/register?role=farmer"
              className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition"
            >
              Start as Farmer (Free)
            </Link>
            <Link
              to="/register?role=driver"
              className="px-6 py-3.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg transition"
            >
              Start as Driver (Free)
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}