import React, { useState } from 'react'
import {
  Brain, Sprout, Truck, Route, FileText, Upload,
  Zap, ArrowRight, ShieldCheck, CheckCircle2, AlertTriangle,
  Activity, Thermometer, Droplets, CloudRain, Sparkles,
  Info, Leaf, Clock, IndianRupee, RefreshCw
} from 'lucide-react'
import { api } from '../services/api'
import toast from 'react-hot-toast'

const modules = [
  { id: 'crop_rec', icon: Sprout, title: 'AI Crop Recommendation', desc: 'NPK & Soil-to-Crop Agronomic Match' },
  { id: 'harvest', icon: Brain, title: 'AI Harvest Forecasting', desc: 'Predict Yield Tonnage & Picking Window' },
  { id: 'disease', icon: Leaf, title: 'Crop Disease Diagnostics', desc: 'Leaf Photo Computer Vision Analysis' },
  { id: 'route', icon: Route, title: 'AI Route Optimization', desc: 'Fuel & Highway Corridor Optimization' },
  { id: 'matching', icon: Truck, title: 'Smart Hauler Matching', desc: 'Multi-Factor Freight Dispatch' }
]

export default function AILab() {
  const [activeModule, setActiveModule] = useState('crop_rec')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  // Forms state
  const [cropRecForm, setCropRecForm] = useState({
    soil_type: 'Loamy',
    nitrogen: '120',
    phosphorus: '55',
    potassium: '45',
    temperature: '26',
    humidity: '65',
    rainfall: '750',
    ph: '6.8'
  })

  const [harvestForm, setHarvestForm] = useState({
    crop_name: 'Tomatoes',
    acreage: '5',
    planting_date: '2026-01-10',
    location: 'Nashik, Maharashtra',
    soil_type: 'Loamy'
  })

  const [diseaseForm, setDiseaseForm] = useState({
    crop_type: 'Tomato',
    file: null,
    previewUrl: null
  })

  const [routeForm, setRouteForm] = useState({
    pickup: 'Nashik, Maharashtra',
    destination: 'Vashi APMC Market, Mumbai',
    vehicle_type: 'Truck (10-Ton)',
    load: '5000'
  })

  const [matchForm, setMatchForm] = useState({
    crop_type: 'Tomatoes',
    quantity: '5000',
    pickup: 'Nashik, Maharashtra',
    destination: 'Vashi APMC Market, Mumbai'
  })

  const handleFileChange = (e) => {
    const f = e.target.files?.[0]
    if (f) {
      setDiseaseForm({
        ...diseaseForm,
        file: f,
        previewUrl: URL.createObjectURL(f)
      })
    }
  }

  const runAnalysis = async () => {
    setLoading(true)
    setResult(null)

    try {
      let res
      if (activeModule === 'crop_rec') {
        res = await api.ai.cropRecommendation(cropRecForm)
      } else if (activeModule === 'harvest') {
        res = await api.ai.harvestPrediction(harvestForm)
      } else if (activeModule === 'disease') {
        res = await api.ai.cropDiseaseDetection(diseaseForm.file, diseaseForm.crop_type)
      } else if (activeModule === 'route') {
        res = await api.ai.routeOptimization(routeForm)
      } else if (activeModule === 'matching') {
        res = await api.ai.transportMatching(matchForm)
      }
      setResult(res)
      toast.success('On-device NPU inference completed!')
    } catch (err) {
      toast.error(err.message || 'AI processing encountered an error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-6 fade-in">
      {/* Title & Snapdragon NPU Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40 px-4 py-1.5 rounded-full text-xs font-semibold">
          <Zap size={14} className="text-amber-500" /> Snapdragon X Elite NPU Lab • 45 TOPS Local Acceleration
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
          KrishiDrive AI Innovation Lab
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Experience genuine on-device machine learning and agronomic intelligence. Zero cloud transmission, zero latency, 100% data privacy for agricultural operations.
        </p>
      </div>

      {/* Module Selector Tabs */}
      <div className="flex gap-2.5 overflow-x-auto pb-2 justify-start sm:justify-center">
        {modules.map(m => (
          <button
            key={m.id}
            onClick={() => {
              setActiveModule(m.id)
              setResult(null)
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeModule === m.id
                ? 'bg-emerald-700 text-white shadow-md shadow-emerald-900/20 scale-[1.02]'
                : 'bg-white dark:bg-[#12211c] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-[#1e362e] hover:bg-gray-100 dark:hover:bg-[#1c352c]'
            }`}
          >
            <m.icon size={16} /> {m.title}
          </button>
        ))}
      </div>

      {/* Interactive Testing Sandbox Grid */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left Parameter Panel (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#12211c] rounded-3xl border border-gray-200 dark:border-[#1e362e] p-6 shadow-sm transition-colors">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-[#1e362e] mb-5">
            <h2 className="font-extrabold text-gray-900 dark:text-white text-base flex items-center gap-2">
              <Sparkles size={18} className="text-emerald-600 dark:text-emerald-400" />
              Configure Test Parameters
            </h2>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              {modules.find(m => m.id === activeModule)?.desc}
            </span>
          </div>

          {/* Form 1: AI Crop Recommendation */}
          {activeModule === 'crop_rec' && (
            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-600 dark:text-gray-300 mb-1">Soil Type</label>
                  <select
                    value={cropRecForm.soil_type}
                    onChange={e => setCropRecForm({ ...cropRecForm, soil_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-forest-800 dark:bg-[#162a23] dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <option value="Loamy">Loamy Soil</option>
                    <option value="Alluvial">Alluvial Soil</option>
                    <option value="Black">Black Cotton Soil</option>
                    <option value="Clay">Clay Soil</option>
                    <option value="Sandy Loam">Sandy Loam</option>
                    <option value="Red Loam">Red Loam Soil</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-600 dark:text-gray-300 mb-1">Soil pH (3.5 - 9.0)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={cropRecForm.ph}
                    onChange={e => setCropRecForm({ ...cropRecForm, ph: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-forest-800 dark:bg-[#162a23] dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-gray-600 dark:text-gray-300 mb-1">Nitrogen (N)</label>
                  <input
                    type="number"
                    value={cropRecForm.nitrogen}
                    onChange={e => setCropRecForm({ ...cropRecForm, nitrogen: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-forest-800 dark:bg-[#162a23] dark:text-white rounded-xl outline-none"
                    placeholder="kg/ha"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-600 dark:text-gray-300 mb-1">Phosphorus (P)</label>
                  <input
                    type="number"
                    value={cropRecForm.phosphorus}
                    onChange={e => setCropRecForm({ ...cropRecForm, phosphorus: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-forest-800 dark:bg-[#162a23] dark:text-white rounded-xl outline-none"
                    placeholder="kg/ha"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-600 dark:text-gray-300 mb-1">Potassium (K)</label>
                  <input
                    type="number"
                    value={cropRecForm.potassium}
                    onChange={e => setCropRecForm({ ...cropRecForm, potassium: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-forest-800 dark:bg-[#162a23] dark:text-white rounded-xl outline-none"
                    placeholder="kg/ha"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-gray-600 dark:text-gray-300 mb-1">Avg Temp (°C)</label>
                  <input
                    type="number"
                    value={cropRecForm.temperature}
                    onChange={e => setCropRecForm({ ...cropRecForm, temperature: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-forest-800 dark:bg-[#162a23] dark:text-white rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-600 dark:text-gray-300 mb-1">Humidity (%)</label>
                  <input
                    type="number"
                    value={cropRecForm.humidity}
                    onChange={e => setCropRecForm({ ...cropRecForm, humidity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-forest-800 dark:bg-[#162a23] dark:text-white rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-600 dark:text-gray-300 mb-1">Annual Rain (mm)</label>
                  <input
                    type="number"
                    value={cropRecForm.rainfall}
                    onChange={e => setCropRecForm({ ...cropRecForm, rainfall: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-forest-800 dark:bg-[#162a23] dark:text-white rounded-xl outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Form 2: AI Harvest Prediction */}
          {activeModule === 'harvest' && (
            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-gray-600 dark:text-gray-300 mb-1">Crop Type</label>
                <select
                  value={harvestForm.crop_name}
                  onChange={e => setHarvestForm({ ...harvestForm, crop_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-forest-800 dark:bg-[#162a23] dark:text-white rounded-xl outline-none"
                >
                  <option value="Tomatoes">Tomatoes (Hybrid)</option>
                  <option value="Wheat">Wheat (Grain)</option>
                  <option value="Rice">Rice (Paddy)</option>
                  <option value="Grapes">Grapes (Table)</option>
                  <option value="Onions">Onions (Red)</option>
                  <option value="Potatoes">Potatoes (Table)</option>
                  <option value="Cotton">Cotton (Boll)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-600 dark:text-gray-300 mb-1">Acreage</label>
                  <input
                    type="number"
                    step="0.5"
                    value={harvestForm.acreage}
                    onChange={e => setHarvestForm({ ...harvestForm, acreage: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-forest-800 dark:bg-[#162a23] dark:text-white rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-600 dark:text-gray-300 mb-1">Planting Date</label>
                  <input
                    type="date"
                    value={harvestForm.planting_date}
                    onChange={e => setHarvestForm({ ...harvestForm, planting_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-forest-800 dark:bg-[#162a23] dark:text-white rounded-xl outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-600 dark:text-gray-300 mb-1">Farm Region</label>
                <input
                  value={harvestForm.location}
                  onChange={e => setHarvestForm({ ...harvestForm, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-forest-800 dark:bg-[#162a23] dark:text-white rounded-xl outline-none"
                />
              </div>
            </div>
          )}

          {/* Form 3: Crop Disease Diagnostics */}
          {activeModule === 'disease' && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-600 dark:text-gray-300 mb-1">Select Crop Category</label>
                <select
                  value={diseaseForm.crop_type}
                  onChange={e => setDiseaseForm({ ...diseaseForm, crop_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-forest-800 dark:bg-[#162a23] dark:text-white rounded-xl outline-none"
                >
                  <option value="Tomato">Tomato Leaves</option>
                  <option value="Rice">Rice (Paddy) Foliage</option>
                  <option value="Wheat">Wheat Leaf & Stem</option>
                  <option value="General">General Vegetable Crop</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-600 dark:text-gray-300 mb-2">Upload Diseased Leaf Photo</label>
                <label className="border-2 border-dashed border-emerald-500/40 dark:border-emerald-600/30 rounded-2xl p-6 text-center block cursor-pointer hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {diseaseForm.previewUrl ? (
                    <div className="space-y-2">
                      <img
                        src={diseaseForm.previewUrl}
                        alt="Leaf preview"
                        className="w-32 h-32 object-cover rounded-xl mx-auto border-2 border-emerald-500 shadow-md"
                      />
                      <p className="text-emerald-700 dark:text-emerald-400 font-bold text-xs">{diseaseForm.file?.name}</p>
                      <p className="text-[10px] text-gray-400">Click to choose a different photo</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="mx-auto text-emerald-600 dark:text-emerald-400 mb-2" size={28} />
                      <p className="font-bold text-gray-700 dark:text-gray-200 text-xs">Click or drag & drop leaf image</p>
                      <p className="text-[10px] text-gray-400 mt-1">Supports JPG, PNG up to 15MB • ResNet50 On-Device</p>
                    </>
                  )}
                </label>
              </div>
            </div>
          )}

          {/* Form 4: Route Optimization */}
          {activeModule === 'route' && (
            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-gray-600 dark:text-gray-300 mb-1">Origin Farm / City</label>
                <input
                  value={routeForm.pickup}
                  onChange={e => setRouteForm({ ...routeForm, pickup: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-forest-800 dark:bg-[#162a23] dark:text-white rounded-xl outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-600 dark:text-gray-300 mb-1">Destination Mandi</label>
                <input
                  value={routeForm.destination}
                  onChange={e => setRouteForm({ ...routeForm, destination: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-forest-800 dark:bg-[#162a23] dark:text-white rounded-xl outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-600 dark:text-gray-300 mb-1">Vehicle Type</label>
                  <select
                    value={routeForm.vehicle_type}
                    onChange={e => setRouteForm({ ...routeForm, vehicle_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-forest-800 dark:bg-[#162a23] dark:text-white rounded-xl outline-none"
                  >
                    <option value="Truck (10-Ton)">Truck (10-Ton)</option>
                    <option value="Tempo (3-Ton)">Tempo (3-Ton)</option>
                    <option value="Heavy Trailer (20-Ton)">Heavy Trailer (20-Ton)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-600 dark:text-gray-300 mb-1">Payload (kg)</label>
                  <input
                    type="number"
                    value={routeForm.load}
                    onChange={e => setRouteForm({ ...routeForm, load: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-forest-800 dark:bg-[#162a23] dark:text-white rounded-xl outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Form 5: Transport Matching */}
          {activeModule === 'matching' && (
            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-600 dark:text-gray-300 mb-1">Crop Type</label>
                  <input
                    value={matchForm.crop_type}
                    onChange={e => setMatchForm({ ...matchForm, crop_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-forest-800 dark:bg-[#162a23] dark:text-white rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-600 dark:text-gray-300 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={matchForm.quantity}
                    onChange={e => setMatchForm({ ...matchForm, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-forest-800 dark:bg-[#162a23] dark:text-white rounded-xl outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-gray-600 dark:text-gray-300 mb-1">Pickup Farm</label>
                <input
                  value={matchForm.pickup}
                  onChange={e => setMatchForm({ ...matchForm, pickup: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-forest-800 dark:bg-[#162a23] dark:text-white rounded-xl outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-600 dark:text-gray-300 mb-1">Destination Mandi</label>
                <input
                  value={matchForm.destination}
                  onChange={e => setMatchForm({ ...matchForm, destination: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-forest-800 dark:bg-[#162a23] dark:text-white rounded-xl outline-none"
                />
              </div>
            </div>
          )}

          {/* Run Button */}
          <div className="pt-5 mt-4 border-t border-gray-100 dark:border-[#1e362e]">
            <button
              onClick={runAnalysis}
              disabled={loading}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-2xl shadow-md transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              <Zap size={16} className="text-amber-400" />
              {loading ? 'Executing on Snapdragon NPU...' : 'Run On-Device Analysis'}
            </button>
          </div>
        </div>

        {/* Right Results Panel (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#12211c] rounded-3xl border border-gray-200 dark:border-[#1e362e] p-6 shadow-sm transition-colors min-h-[500px]">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-[#1e362e] mb-5">
            <h2 className="font-extrabold text-gray-900 dark:text-white text-base flex items-center gap-2">
              <Activity size={18} className="text-emerald-600 dark:text-emerald-400" />
              NPU Inference Results
            </h2>
            {result?.model_info && (
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-300/40">
                {result.model_info.inference_time_ms} ms Latency
              </span>
            )}
          </div>

          {result ? (
            <div className="space-y-4 fade-in">
              {/* Result 1: AI Crop Recommendation */}
              {activeModule === 'crop_rec' && (
                <div className="space-y-4">
                  <div className="bg-emerald-50/60 dark:bg-[#162a23] p-4 rounded-2xl border border-emerald-200 dark:border-forest-800">
                    <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">
                      Top Agronomic Match: {result.top_recommendation?.crop_name}
                    </div>
                    <div className="text-3xl font-black text-emerald-900 dark:text-emerald-200 mt-1">
                      {result.top_recommendation?.match_score}% Match Score
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300 mt-2 leading-relaxed">
                      {result.top_recommendation?.rationale}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                      Ranked Crop Viability Matrix
                    </h4>
                    {result.recommended_crops?.map((c, i) => (
                      <div
                        key={i}
                        className="p-3.5 bg-gray-50 dark:bg-[#162a23] rounded-xl border border-gray-100 dark:border-[#1e362e] flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white text-sm">{c.crop_name}</div>
                          <div className="text-gray-500 dark:text-gray-400 mt-0.5">
                            Season: {c.season} • Est. Yield: {c.expected_yield_per_acre} / acre
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black text-emerald-700 dark:text-emerald-400">{c.match_score}%</div>
                          <div className="text-[10px] text-gray-400">Gross: {c.estimated_gross_revenue_per_acre}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Result 2: AI Harvest Prediction */}
              {activeModule === 'harvest' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-purple-50 dark:bg-purple-950/40 p-4 rounded-2xl border border-purple-200 dark:border-purple-800/40">
                      <div className="text-[11px] text-purple-700 dark:text-purple-300 font-bold uppercase">Predicted Harvest Yield</div>
                      <div className="text-2xl font-black text-purple-900 dark:text-purple-200 mt-1">
                        {result.predicted_yield?.toLocaleString()} kg
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5">{result.yield_metric_tons} Metric Tons</div>
                    </div>

                    <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/40">
                      <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-bold uppercase">Estimated Gross Return</div>
                      <div className="text-2xl font-black text-emerald-900 dark:text-emerald-200 mt-1">
                        {result.economic_forecast?.projected_gross_revenue}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5">Wholesale Rate: {result.economic_forecast?.estimated_mandi_rate}</div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-[#162a23] p-4 rounded-2xl border border-gray-100 dark:border-[#1e362e] space-y-2 text-xs">
                    <div className="font-bold text-gray-900 dark:text-white">Harvest Timeline Window:</div>
                    <div className="grid grid-cols-3 gap-2 text-center text-gray-700 dark:text-gray-300 pt-1">
                      <div className="bg-white dark:bg-[#12211c] p-2 rounded-xl border border-gray-100 dark:border-forest-900">
                        <div className="text-[10px] text-gray-400">Earliest Pick</div>
                        <div className="font-bold">{result.harvest_schedule?.earliest_harvest_date}</div>
                      </div>
                      <div className="bg-white dark:bg-[#12211c] p-2 rounded-xl border border-emerald-500">
                        <div className="text-[10px] text-emerald-600 font-bold">Peak Maturity</div>
                        <div className="font-bold text-emerald-700 dark:text-emerald-400">{result.harvest_schedule?.peak_harvest_date}</div>
                      </div>
                      <div className="bg-white dark:bg-[#12211c] p-2 rounded-xl border border-gray-100 dark:border-forest-900">
                        <div className="text-[10px] text-gray-400">Window Closes</div>
                        <div className="font-bold">{result.harvest_schedule?.harvest_window_close}</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
                    <div className="font-bold text-gray-900 dark:text-white">Logistics Recommendation:</div>
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/40">
                      Reserve <strong>{result.transport_logistics?.recommended_trips} trip(s) of {result.transport_logistics?.recommended_vehicle}</strong>. Perishability tier: <strong>{result.transport_logistics?.perishability_tier}</strong>.
                    </div>
                  </div>
                </div>
              )}

              {/* Result 3: Crop Disease Diagnostics */}
              {activeModule === 'disease' && (
                <div className="space-y-4">
                  <div className="p-5 bg-red-50/60 dark:bg-red-950/30 rounded-2xl border border-red-200 dark:border-red-900/40">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-red-700 dark:text-red-300 uppercase">Diagnosis Identified</span>
                      <span className="text-xs font-extrabold text-red-800 dark:text-red-200 bg-red-100 dark:bg-red-900/60 px-2.5 py-0.5 rounded-full">
                        {(result.confidence_score * 100).toFixed(0)}% Confidence
                      </span>
                    </div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white mt-1">{result.diagnosis}</div>
                    <div className="text-xs text-red-600 dark:text-red-400 font-medium mt-0.5">Pathogen: {result.pathogen}</div>
                    <div className="text-xs text-gray-700 dark:text-gray-300 mt-2">{result.clinical_symptoms}</div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800/40">
                      <div className="font-bold text-emerald-800 dark:text-emerald-300 mb-1">Chemical Treatment:</div>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{result.treatment_protocol?.chemical_intervention}</p>
                    </div>

                    <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800/40">
                      <div className="font-bold text-amber-800 dark:text-amber-300 mb-1">Organic & Cultural Remedy:</div>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{result.treatment_protocol?.organic_and_cultural}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Result 4: Route Optimization */}
              {activeModule === 'route' && (
                <div className="space-y-4">
                  <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Potential Freight Savings</div>
                      <div className="text-xl font-black text-emerald-900 dark:text-emerald-200 mt-0.5">
                        {result.savings?.cost_saved_inr} • {result.savings?.fuel_saved_liters} Liters Diesel
                      </div>
                    </div>
                    <span className="text-xs font-bold bg-emerald-700 text-white px-3 py-1 rounded-xl">
                      {result.savings?.time_saved_min} min saved
                    </span>
                  </div>

                  <div className="space-y-3">
                    {result.routes?.map((r, i) => (
                      <div
                        key={i}
                        className={`p-4 rounded-2xl border text-xs transition ${
                          i === 0
                            ? 'bg-emerald-50/40 dark:bg-[#162a23] border-emerald-500 shadow-sm'
                            : 'bg-gray-50 dark:bg-[#162a23] border-gray-100 dark:border-[#1e362e]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-gray-900 dark:text-white text-sm">{r.name}</span>
                          <span className="font-bold text-emerald-700 dark:text-emerald-400">Score: {r.ai_score}/100</span>
                        </div>
                        <div className="text-gray-500 dark:text-gray-400 mb-2">{r.highlight}</div>
                        <div className="flex flex-wrap items-center gap-4 text-gray-700 dark:text-gray-300 font-semibold">
                          <span>{r.distance_km} km</span>
                          <span>•</span>
                          <span>{r.time_hours} Hours</span>
                          <span>•</span>
                          <span className="text-amber-600">{r.fuel_liters}L Fuel</span>
                          <span>•</span>
                          <span>Tolls: {r.tolls}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Result 5: Transport Matching */}
              {activeModule === 'matching' && (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                    Ranked Freight Haulers ({result.matches?.length || 0})
                  </div>
                  {result.matches?.map((m, i) => (
                    <div
                      key={i}
                      className="p-4 bg-gray-50 dark:bg-[#162a23] rounded-2xl border border-gray-100 dark:border-[#1e362e] flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                          <span>{m.driver?.full_name}</span>
                          <span className="text-[10px] text-amber-500 font-bold">★ {m.driver?.rating}</span>
                        </div>
                        <div className="text-gray-500 dark:text-gray-400 mt-0.5">
                          {m.vehicle?.type} ({m.vehicle?.capacity?.toLocaleString()} kg) • {m.distance_to_pickup_km} km away
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                          {m.estimated_cost_formatted}
                        </div>
                        <div className="text-[10px] text-gray-400">Match: {m.match_score}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* NPU Model Information Footer */}
              <div className="pt-4 border-t border-gray-100 dark:border-[#1e362e] text-[11px] text-gray-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-dot" />
                  Engine: {result.model_info?.name}
                </span>
                <span>{result.model_info?.device}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-24 text-gray-400 space-y-3">
              <Brain size={48} className="mx-auto text-emerald-500/30" />
              <h3 className="font-bold text-gray-700 dark:text-gray-300 text-base">Awaiting Parameter Execution</h3>
              <p className="text-xs max-w-sm mx-auto text-gray-400">
                Adjust parameters on the left and click "Run On-Device Analysis" to execute real agronomic and transport heuristics locally.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}