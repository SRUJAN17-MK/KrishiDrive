import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Cpu, Brain, Gauge, ShieldCheck, AlertTriangle, FileText,
  CheckCircle2, XCircle, ExternalLink, WifiOff, Database, ChevronDown
} from 'lucide-react'
import { api } from '../services/api'
import { useLanguage } from '../context/LanguageContext'
import { PageHeader, LoadingBlock, ErrorBlock, StatCard } from '../components/ui'

function ValueRow({ label, value, mono = false }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-gray-100 dark:border-[#1e362e] last:border-0">
      <dt className="text-xs text-gray-500 dark:text-gray-400 shrink-0">{label}</dt>
      <dd className={`text-xs font-semibold text-right text-gray-900 dark:text-white ${mono ? 'font-mono break-all' : ''}`}>{value ?? '—'}</dd>
    </div>
  )
}

function LatencyCard({ title, stats }) {
  if (!stats) return null
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{title}</h3>
        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">n = {stats.count}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><p className="text-[10px] text-gray-400 uppercase">Average</p><p className="text-xl font-extrabold">{stats.avg} <span className="text-xs font-semibold text-gray-400">ms</span></p></div>
        <div><p className="text-[10px] text-gray-400 uppercase">p95</p><p className="text-xl font-extrabold">{stats.p95} <span className="text-xs font-semibold text-gray-400">ms</span></p></div>
        <div><p className="text-[10px] text-gray-400 uppercase">p50</p><p className="text-sm font-bold">{stats.p50} ms</p></div>
        <div><p className="text-[10px] text-gray-400 uppercase">p99</p><p className="text-sm font-bold">{stats.p99} ms</p></div>
      </div>
    </div>
  )
}

export default function OnDeviceAI() {
  const { t } = useLanguage()
  const [info, setInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showClasses, setShowClasses] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      setInfo(await api.ai.modelInfo())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) return <div className="max-w-6xl mx-auto px-4 py-10"><LoadingBlock /></div>
  if (error) return <div className="max-w-6xl mx-auto px-4 py-10"><ErrorBlock message={error} onRetry={load} /></div>

  const model = info?.model || {}
  const runtime = info?.runtime || {}
  const bench = info?.benchmark
  const classes = model.class_labels || []

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <PageHeader
        eyebrow="Model card · measured evidence"
        title={t('model.title')}
        subtitle={t('model.subtitle')}
        actions={<Link to="/ai-lab" className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-4 py-2 text-xs font-bold text-white"><Brain size={15} /> {t('ai.title')}</Link>}
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label={t('model.status')} value={model.available ? t('model.available') : t('model.unavailable')} icon={model.available ? CheckCircle2 : XCircle} tone={model.available ? 'emerald' : 'amber'} />
        <StatCard label={t('ai.provider')} value="CPU" hint={runtime.npu_verified ? 'NPU verified' : t('ai.npuNotVerified')} icon={Cpu} tone="blue" />
        <StatCard label={t('ai.classes')} value={model.classes ?? '—'} hint={model.dataset} icon={Database} tone="indigo" />
        <StatCard label={t('ai.measuredRuns')} value={bench?.methodology?.measured_runs ?? '—'} hint={bench ? `${bench.methodology.warmup_runs} warm-up runs` : t('common.unavailable')} icon={Gauge} tone="amber" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <section className="rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-5">
          <div className="flex items-center gap-2 mb-3">
            <Brain size={18} className="text-emerald-600" />
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">{t('ai.modelInfo')}</h2>
          </div>
          <dl>
            <ValueRow label="Name" value={model.name} />
            <ValueRow label={t('ai.architecture')} value={model.architecture} />
            <ValueRow label={t('ai.classes')} value={model.classes} />
            <ValueRow label={t('ai.inputSize')} value={model.input?.shape ? `${model.input.shape.join(' × ')} (${model.input.dtype})` : '—'} />
            <ValueRow label={t('ai.runtime')} value={`${runtime.runtime || 'onnxruntime-node'} ${runtime.runtime_version || ''}`} />
            <ValueRow label={t('ai.provider')} value={`${runtime.execution_provider || 'cpu'}${runtime.npu_verified ? '' : ' (no NPU verified)'}`} />
            <ValueRow label="Model size" value={model.bytes ? `${(model.bytes / 1024 / 1024).toFixed(2)} MB` : '—'} />
            <ValueRow label="SHA-256" value={model.sha256} mono />
            <ValueRow label="Reported accuracy" value={model.reported_accuracy || model.reported_accuracy === '' ? model.reported_accuracy : 'Not reported'} />
          </dl>
          <p className="mt-3 text-[11px] leading-relaxed text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl p-3">
            The 95.41% figure is the model author&apos;s evaluation, not a KrishiDrive measurement. This app only claims the latency it measured.
          </p>
        </section>

        <section className="rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-amber-500" />
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">{t('model.npuTitle')}</h2>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{t('model.npuBody')}</p>
          <div className="mt-4 rounded-xl bg-gray-50 dark:bg-[#162a23] p-3">
            <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Execution providers reported by the runtime</p>
            <p className="text-xs font-mono text-gray-700 dark:text-gray-200">{Array.isArray(runtime.providers) && runtime.providers.length ? runtime.providers.join(', ') : 'cpu'}</p>
            <p className="text-[10px] text-gray-400 mt-1">Availability ≠ verified acceleration. Only the CPU provider was benchmarked here.</p>
          </div>
          <div className="mt-4 rounded-xl border border-gray-100 dark:border-[#274a3d] p-3">
            <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">{t('ai.cpuHost')}</p>
            <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">{bench?.host?.cpu?.trim() || 'Not recorded on this deployment'}</p>
            <p className="text-[10px] text-gray-500 mt-1">
              {bench ? `${bench.host.platform}/${bench.host.arch} · ${bench.host.logical_cores} logical cores · Node ${bench.host.node_version}` : 'Run npm run benchmark:model on the deployment host.'}
            </p>
          </div>
        </section>
      </div>

      <section className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Gauge size={18} className="text-emerald-600" />
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">{t('ai.benchmark')}</h2>
          {bench?.generated_at && <span className="text-[10px] text-gray-400">Measured {new Date(bench.generated_at).toLocaleString()}</span>}
        </div>
        {bench ? (
          <>
            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <LatencyCard title={`${t('ai.inferenceLatency')} (session.run only)`} stats={bench.latency_ms?.inference} />
              <LatencyCard title={`${t('ai.endToEnd')} (decode + resize + inference)`} stats={bench.latency_ms?.end_to_end} />
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">{t('model.methodTitle')}</h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{bench.methodology.note}</p>
              <div className="grid sm:grid-cols-3 gap-3 mt-3 text-[11px]">
                <div><span className="text-gray-400">Images</span><p className="font-semibold">{bench.methodology.images.join(', ')}</p></div>
                <div><span className="text-gray-400">Warm-up / measured</span><p className="font-semibold">{bench.methodology.warmup_runs} / {bench.methodology.measured_runs}</p></div>
                <div><span className="text-gray-400">Runtime</span><p className="font-semibold">{bench.runtime.runtime} {bench.runtime.runtime_version}</p></div>
              </div>
              <p className="text-[10px] text-gray-400 mt-3">Re-run on your own hardware: <code className="bg-gray-100 dark:bg-[#162a23] px-1.5 py-0.5 rounded">cd backend &amp;&amp; npm run benchmark:model</code>. Do not compare these numbers with NPU marketing figures.</p>
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-300 dark:border-[#274a3d] p-6 text-center text-xs text-gray-500">No benchmark file is installed on this deployment.</div>
        )}
      </section>

      <div className="grid lg:grid-cols-2 gap-6">
        <section id="limitations" className="rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-5">
          <div className="flex items-center gap-2 mb-2"><ShieldCheck size={18} className="text-emerald-600" /><h2 className="text-sm font-bold">{t('model.limitationsTitle')}</h2></div>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{t('model.limitationsBody')}</p>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-gray-500"><WifiOff size={13} /><span>{t('model.offlineTitle')}</span></div>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mt-1">{t('model.offlineBody')}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 px-2.5 py-1 text-[10px] font-bold">38 classes</span>
            <span className="rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 px-2.5 py-1 text-[10px] font-bold">224 × 224 float32</span>
            <span className="rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 px-2.5 py-1 text-[10px] font-bold">CPU only</span>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] p-5">
          <div className="flex items-center gap-2 mb-2"><FileText size={18} className="text-emerald-600" /><h2 className="text-sm font-bold">{t('model.licenceTitle')}</h2></div>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{model.license}</p>
          <dl className="mt-3">
            <ValueRow label="Dataset" value={model.dataset} />
            <ValueRow label="Base model" value={model.base_model} />
          </dl>
          <a href={model.source} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline">
            Hugging Face model card <ExternalLink size={12} />
          </a>
          <button
            onClick={() => setShowClasses((value) => !value)}
            className="mt-4 w-full flex items-center justify-between rounded-xl border border-gray-200 dark:border-[#274a3d] px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200"
            aria-expanded={showClasses}
          >
            <span>View all {classes.length} class labels</span>
            <ChevronDown size={15} className={`transition ${showClasses ? 'rotate-180' : ''}`} />
          </button>
          {showClasses && (
            <div className="mt-2 max-h-64 overflow-y-auto rounded-xl bg-gray-50 dark:bg-[#162a23] p-3">
              <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-gray-600 dark:text-gray-300">
                {classes.map((label) => <li key={label}>• {label}</li>)}
              </ul>
            </div>
          )}
        </section>
      </div>

      <p className="text-center text-[11px] text-gray-400 mt-8">
        Machine-readable data: <a href="/api/ai/disease-model" className="underline hover:text-emerald-600">/api/ai/disease-model</a> · <a href="/api/ai/disease-model/benchmark" className="underline hover:text-emerald-600">/api/ai/disease-model/benchmark</a>
      </p>
    </div>
  )
}
