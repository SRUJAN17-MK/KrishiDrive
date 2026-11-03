import React, { useId, useMemo } from 'react'
import { MapPin } from 'lucide-react'

function toPoint(coord) {
  if (Array.isArray(coord)) return { lat: Number(coord[0]), lng: Number(coord[1]) }
  if (coord && typeof coord === 'object') return { lat: Number(coord.lat), lng: Number(coord.lng ?? coord.lon) }
  return null
}

/**
 * Dependency-free SVG route map. It is intentionally simple and honest: it
 * projects real route geometry onto a flat SVG, not a geographic basemap.
 */
export default function RouteMap({ geometry = [], alternatives = [], height = 320, label = 'Route geometry' }) {
  const gradientId = useId()
  const result = useMemo(() => {
    const primary = geometry.map(toPoint).filter((p) => p && Number.isFinite(p.lat) && Number.isFinite(p.lng))
    const extra = (alternatives || [])
      .filter((alt) => alt && alt.id !== 'primary' && Array.isArray(alt.geometry))
      .slice(0, 3)
      .map((alt) => ({ id: alt.id, points: alt.geometry.map(toPoint).filter((p) => p && Number.isFinite(p.lat) && Number.isFinite(p.lng)) }))
      .filter((alt) => alt.points.length > 1)
    const all = [...primary, ...extra.flatMap((alt) => alt.points)]
    if (all.length < 2) return null
    const lats = all.map((p) => p.lat)
    const lngs = all.map((p) => p.lng)
    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)
    const latSpan = maxLat - minLat || 0.01
    const lngSpan = maxLng - minLng || 0.01
    const project = (p) => ({
      x: 40 + ((p.lng - minLng) / lngSpan) * 720,
      y: 320 - 40 - ((p.lat - minLat) / latSpan) * 240
    })
    return {
      primary: primary.map(project),
      extra: extra.map((alt) => ({ id: alt.id, points: alt.points.map(project) })),
      start: primary.length ? project(primary[0]) : null,
      end: primary.length ? project(primary[primary.length - 1]) : null
    }
  }, [geometry, alternatives])

  if (!result) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 dark:border-[#274a3d] p-8 text-center text-xs text-gray-500 dark:text-gray-400">
        Map geometry is unavailable for this route.
      </div>
    )
  }

  const path = (points) => points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-[#1e362e] bg-[#eef7f1] dark:bg-[#0d1e18]">
      <svg
        viewBox="0 0 800 320"
        width="100%"
        height={height}
        role="img"
        aria-label={`${label}: ${geometry.length} coordinates`}
        className="block"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#047857" />
            <stop offset="100%" stopColor="#65a30d" />
          </linearGradient>
          <pattern id={`grid-${gradientId}`} width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.18" />
          </pattern>
        </defs>
        <rect width="800" height="320" fill={`url(#grid-${gradientId})`} className="text-emerald-900 dark:text-emerald-300" />
        {result.extra.map((alt) => (
          <path key={alt.id} d={path(alt.points)} fill="none" stroke="#94a3b8" strokeWidth="3" strokeDasharray="7 7" strokeLinecap="round" opacity="0.75" />
        ))}
        <path d={path(result.primary)} fill="none" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        {result.start && (
          <g>
            <circle cx={result.start.x} cy={result.start.y} r="8" fill="#047857" stroke="#fff" strokeWidth="3" />
            <text x={result.start.x + 13} y={result.start.y + 4} fontSize="11" fontWeight="700" fill="currentColor" className="text-emerald-950 dark:text-emerald-100">Pickup</text>
          </g>
        )}
        {result.end && (
          <g>
            <circle cx={result.end.x} cy={result.end.y} r="8" fill="#b45309" stroke="#fff" strokeWidth="3" />
            <text x={result.end.x + 13} y={result.end.y + 4} fontSize="11" fontWeight="700" fill="currentColor" className="text-emerald-950 dark:text-emerald-100">Destination</text>
          </g>
        )}
      </svg>
      <div className="flex flex-wrap items-center gap-4 px-4 py-2.5 text-[10px] font-semibold text-gray-500 dark:text-gray-400 border-t border-gray-200/70 dark:border-[#1e362e]">
        <span className="inline-flex items-center gap-1.5"><span className="h-1 w-5 rounded bg-emerald-700" /> Primary route</span>
        {result.extra.length > 0 && <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-5 border-t-2 border-dashed border-gray-400" /> Alternatives</span>}
        <span className="inline-flex items-center gap-1.5"><MapPin size={11} /> Simplified projection, not a basemap</span>
      </div>
    </div>
  )
}
