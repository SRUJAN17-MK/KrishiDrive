import React, { useState, useEffect } from 'react'
import {
  Sprout, Plus, X, Brain, Calendar, MapPin, Package,
  Trash2, Edit3, TrendingUp, Sparkles, CheckCircle2, ChevronRight, AlertCircle
} from 'lucide-react'
import { api } from '../services/api'
import toast from 'react-hot-toast'

export default function FarmerCrops() {
  const [crops, setCrops] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCrop, setEditingCrop] = useState(null)
  const [aiResult, setAiResult] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)

  const [form, setForm] = useState({
    name: 'Tomatoes',
    location: 'Nashik, Maharashtra',
    acreage: '5',
    planting_date: new Date().toISOString().split('T')[0],
    expected_harvest: '',
    expected_qty: '8000',
    unit: 'kg',
    status: 'growing',
    soil_type: 'Loamy',
    estimated_rate_kg: '28'
  })

  useEffect(() => {
    fetchCrops()
  }, [])

  const fetchCrops = async () => {
    try {
      setLoading(true)
      const data = await api.crops.list()
      setCrops(data || [])
    } catch (err) {
      toast.error('Failed to load crop records')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleOpenAdd = () => {
    setEditingCrop(null)
    setForm({
      name: 'Tomatoes',
      location: 'Nashik, Maharashtra',
      acreage: '5',
      planting_date: new Date().toISOString().split('T')[0],
      expected_harvest: '',
      expected_qty: '8000',
      unit: 'kg',
      status: 'growing',
      soil_type: 'Loamy',
      estimated_rate_kg: '28'
    })
    setShowForm(true)
  }

  const handleOpenEdit = (crop) => {
    setEditingCrop(crop)
    setForm({
      name: crop.name,
      location: crop.location,
      acreage: String(crop.acreage),
      planting_date: crop.planting_date || '',
      expected_harvest: crop.expected_harvest || '',
      expected_qty: String(crop.expected_qty),
      unit: crop.unit || 'kg',
      status: crop.status || 'growing',
      soil_type: crop.soil_type || 'Loamy',
      estimated_rate_kg: String(crop.estimated_rate_kg || 25)
    })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...form,
        acreage: parseFloat(form.acreage) || 1,
        expected_qty: parseFloat(form.expected_qty) || 1000,
        estimated_rate_kg: parseFloat(form.estimated_rate_kg) || 25
      }

      if (editingCrop) {
        const updated = await api.crops.update(editingCrop.id, payload)
        setCrops(crops.map(c => c.id === editingCrop.id ? updated : c))
        toast.success(`Updated crop: ${updated.name}`)
      } else {
        const created = await api.crops.create(payload)
        setCrops([created, ...crops])
        toast.success(`Registered crop: ${created.name}`)
      }
      setShowForm(false)
    } catch (err) {
      toast.error(err.message || 'Operation failed')
    }
  }

  const handleDelete = async (cropId) => {
    if (!window.confirm('Are you sure you want to remove this crop record?')) return
    try {
      await api.crops.delete(cropId)
      setCrops(crops.filter(c => c.id !== cropId))
      toast.success('Crop record removed')
      if (aiResult?.crop_id === cropId) setAiResult(null)
    } catch (err) {
      toast.error(err.message || 'Failed to delete crop')
    }
  }

  const predictHarvest = async (crop) => {
    setAiLoading(true)
    setAiResult(null)
    try {
      const result = await api.ai.harvestPrediction({
        crop_name: crop.name,
        acreage: crop.acreage,
        planting_date: crop.planting_date,
        location: crop.location,
        soil_type: crop.soil_type
      })
      setAiResult({ ...result, crop_id: crop.id, original_crop: crop })
      toast.success(`AI Prediction calculated for ${crop.name}`)
    } catch (err) {
      toast.error(err.message || 'Prediction failed')
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="space-y-6 fade-in max-w-7xl mx-auto">
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
            Crop Lifecycle Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track plantings, forecast yield tonnage, and analyze market value via Snapdragon AI.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow transition flex items-center justify-center gap-2 text-sm"
        >
          <Plus size={16} /> Register New Crop
        </button>
      </div>

      {/* Add / Edit Crop Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#12211c] rounded-3xl max-w-xl w-full p-6 border border-gray-200 dark:border-[#1e362e] shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-gray-900 dark:text-white text-lg">
                {editingCrop ? 'Edit Crop Record' : 'Register New Farm Crop'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3.5">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Crop Variety</label>
                <select
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-forest-800 dark:bg-[#162a23] dark:text-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Tomatoes">Tomatoes</option>
                  <option value="Wheat">Wheat</option>
                  <option value="Rice">Rice (Paddy)</option>
                  <option value="Grapes">Grapes</option>
                  <option value="Onions">Onions</option>
                  <option value="Potatoes">Potatoes</option>
                  <option value="Cotton">Cotton</option>
                  <option value="Sugarcane">Sugarcane</option>
                  <option value="Corn">Corn / Maize</option>
                </select>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Farm / Taluka Location</label>
                <input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Nashik, Maharashtra"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-forest-800 dark:bg-[#162a23] dark:text-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Total Acreage</label>
                <input
                  name="acreage"
                  type="number"
                  step="0.5"
                  value={form.acreage}
                  onChange={handleChange}
                  required
                  placeholder="e.g. 5"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-forest-800 dark:bg-[#162a23] dark:text-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Estimated Output (kg)</label>
                <input
                  name="expected_qty"
                  type="number"
                  value={form.expected_qty}
                  onChange={handleChange}
                  required
                  placeholder="e.g. 8000"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-forest-800 dark:bg-[#162a23] dark:text-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Sowing / Planting Date</label>
                <input
                  name="planting_date"
                  type="date"
                  value={form.planting_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-forest-800 dark:bg-[#162a23] dark:text-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Expected Harvest Window</label>
                <input
                  name="expected_harvest"
                  type="date"
                  value={form.expected_harvest}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-forest-800 dark:bg-[#162a23] dark:text-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Soil Classification</label>
                <select
                  name="soil_type"
                  value={form.soil_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-forest-800 dark:bg-[#162a23] dark:text-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Loamy">Loamy Soil</option>
                  <option value="Alluvial">Alluvial Soil</option>
                  <option value="Black">Black Cotton Soil</option>
                  <option value="Red Loam">Red Loam Soil</option>
                  <option value="Clay">Clay Soil</option>
                  <option value="Sandy Loam">Sandy Loam</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Current Lifecycle Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-forest-800 dark:bg-[#162a23] dark:text-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="growing">Growing / Vegetative</option>
                  <option value="ready">Ready for Harvest</option>
                  <option value="harvested">Harvest Completed</option>
                </select>
              </div>

              <div className="col-span-2 flex gap-3 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-sm transition"
                >
                  {editingCrop ? 'Save Changes' : 'Confirm Registration'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 border border-gray-200 dark:border-forest-800 text-gray-600 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Crops Cards Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {crops.map(crop => (
          <div
            key={crop.id}
            className="bg-white dark:bg-[#12211c] rounded-2xl border border-gray-200 dark:border-[#1e362e] p-5 card-hover flex flex-col justify-between transition-colors"
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <Sprout size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-base">{crop.name}</h3>
                    <div className="text-[11px] text-gray-400">ID: {crop.id} • {crop.soil_type || 'Loamy'}</div>
                  </div>
                </div>
                <span className={`status-badge status-${crop.status}`}>
                  {crop.status}
                </span>
              </div>

              <div className="space-y-2 text-xs text-gray-600 dark:text-gray-300 my-4 bg-gray-50 dark:bg-[#162a23] p-3 rounded-xl border border-gray-100 dark:border-[#1e362e]">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 flex items-center gap-1.5"><MapPin size={13} /> Location:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{crop.location}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 flex items-center gap-1.5"><Package size={13} /> Quantity:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {crop.expected_qty?.toLocaleString()} {crop.unit} ({crop.acreage} Acres)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 flex items-center gap-1.5"><Calendar size={13} /> Harvest Window:</span>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">{crop.expected_harvest || 'Calculating...'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 flex items-center gap-1.5"><TrendingUp size={13} /> Mandi Rate:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">₹{crop.estimated_rate_kg || 25} / kg</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 dark:border-[#1e362e] flex items-center gap-2">
              <button
                onClick={() => predictHarvest(crop)}
                disabled={aiLoading}
                className="flex-1 py-2 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-950/70 border border-purple-200/50 dark:border-purple-800/40 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Brain size={14} /> {aiLoading && aiResult?.crop_id === crop.id ? 'Running NPU...' : 'AI Harvest Forecast'}
              </button>

              <button
                onClick={() => handleOpenEdit(crop)}
                title="Edit Crop"
                className="p-2 text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <Edit3 size={15} />
              </button>

              <button
                onClick={() => handleDelete(crop.id)}
                title="Delete Crop"
                className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}

        {crops.length === 0 && !loading && (
          <div className="col-span-3 bg-white dark:bg-[#12211c] rounded-2xl p-12 text-center border border-gray-200 dark:border-[#1e362e]">
            <Sprout size={48} className="mx-auto text-emerald-400 mb-3" />
            <h3 className="font-bold text-gray-800 dark:text-gray-200 text-lg">No crops planted yet</h3>
            <p className="text-xs text-gray-500 mt-1 mb-4">Register your first farm plot to activate harvest forecasts and logistics dispatch.</p>
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold shadow hover:bg-emerald-800"
            >
              Add First Crop
            </button>
          </div>
        )}
      </div>

      {/* AI Harvest Prediction Modal / Panel */}
      {aiResult && (
        <div className="bg-gradient-to-br from-white via-purple-50/20 to-white dark:from-[#12211c] dark:via-[#191e2b] dark:to-[#12211c] rounded-3xl border border-purple-300/60 dark:border-purple-800/40 p-6 shadow-xl relative transition-all">
          <div className="flex items-center justify-between pb-4 border-b border-purple-100 dark:border-purple-900/40 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                <Brain size={22} />
              </div>
              <div>
                <h3 className="font-extrabold text-gray-900 dark:text-white text-base">
                  Snapdragon On-Device Harvest Prediction: {aiResult.crop}
                </h3>
                <div className="text-xs text-purple-700 dark:text-purple-400 flex items-center gap-2 mt-0.5">
                  <span>Confidence: {(aiResult.confidence * 100).toFixed(0)}%</span>
                  <span>•</span>
                  <span>NPU Latency: {aiResult.model_info?.inference_time_ms}ms</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setAiResult(null)}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-5">
            <div className="bg-white dark:bg-[#162a23] p-4 rounded-2xl border border-purple-100 dark:border-purple-900/30">
              <div className="text-xs text-purple-600 dark:text-purple-400 font-bold uppercase">Estimated Yield</div>
              <div className="text-3xl font-black text-purple-800 dark:text-purple-200 mt-1">
                {aiResult.predicted_yield?.toLocaleString()} <span className="text-sm font-semibold">{aiResult.unit}</span>
              </div>
              <div className="text-[11px] text-gray-500 mt-1">({aiResult.yield_metric_tons} Metric Tons)</div>
            </div>

            <div className="bg-white dark:bg-[#162a23] p-4 rounded-2xl border border-purple-100 dark:border-purple-900/30">
              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase">Projected Gross Revenue</div>
              <div className="text-3xl font-black text-emerald-800 dark:text-emerald-200 mt-1">
                {aiResult.economic_forecast?.projected_gross_revenue}
              </div>
              <div className="text-[11px] text-gray-500 mt-1">Wholesale APMC: {aiResult.economic_forecast?.estimated_mandi_rate}</div>
            </div>

            <div className="bg-white dark:bg-[#162a23] p-4 rounded-2xl border border-purple-100 dark:border-purple-900/30">
              <div className="text-xs text-amber-600 dark:text-amber-400 font-bold uppercase">Transport Strategy</div>
              <div className="text-base font-bold text-gray-900 dark:text-white mt-1">
                {aiResult.transport_logistics?.recommended_vehicle}
              </div>
              <div className="text-[11px] text-gray-500 mt-1">
                {aiResult.transport_logistics?.recommended_trips} trip(s) required • Perishability: {aiResult.transport_logistics?.perishability_tier}
              </div>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="text-xs font-bold text-gray-700 dark:text-gray-300">Actionable Farm Directives:</div>
            {aiResult.recommendations?.map((r, i) => (
              <div key={i} className="text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-[#162a23] px-3.5 py-2.5 rounded-xl border border-purple-100/60 dark:border-purple-900/20 flex items-start gap-2">
                <CheckCircle2 size={15} className="text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                <span>{r}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-[11px] text-gray-400 pt-3 border-t border-purple-100 dark:border-purple-900/30">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-dot" />
              Model: {aiResult.model_info?.name} ({aiResult.model_info?.device})
            </span>
            <span className="text-purple-600 dark:text-purple-400 font-semibold">100% Privacy Preserved</span>
          </div>
        </div>
      )}
    </div>
  )
}