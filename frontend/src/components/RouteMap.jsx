import React, { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  MapPin, Layers, Maximize2, Minimize2, Navigation,
  RotateCcw, ShieldCheck, AlertCircle, Info, Compass
} from 'lucide-react'

// SVG Marker Creators - zero external image asset dependencies
function createPinIcon(type, number = null) {
  let bgColor = '#059669' // emerald-600
  let strokeColor = '#065f46' // emerald-800
  let label = 'P'

  if (type === 'destination') {
    bgColor = '#d97706' // amber-600
    strokeColor = '#92400e' // amber-800
    label = 'D'
  } else if (type === 'waypoint') {
    bgColor = '#2563eb' // blue-600
    strokeColor = '#1e40af' // blue-800
    label = number !== null ? String(number) : 'W'
  } else if (type === 'user') {
    bgColor = '#0284c7' // sky-600
    strokeColor = '#0369a1' // sky-700
    label = '📍'
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 42" width="32" height="42" style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.35));">
      <path d="M16 0C7.16 0 0 7.16 0 16c0 10.8 14.2 24.6 14.8 25.2.6.6 1.8.6 2.4 0C17.8 40.6 32 26.8 32 16 32 7.16 24.84 0 16 0z" fill="${bgColor}" stroke="${strokeColor}" stroke-width="1.5" />
      <circle cx="16" cy="15" r="9" fill="#ffffff" />
      <text x="16" y="19" font-size="11" font-weight="900" font-family="sans-serif" text-anchor="middle" fill="${bgColor}">${label}</text>
    </svg>
  `

  return L.divIcon({
    className: 'custom-leaflet-pin',
    html: svg,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -38]
  })
}

function toPoint(coord) {
  if (!coord) return null
  if (Array.isArray(coord) && coord.length >= 2) {
    const lat = Number(coord[0])
    const lng = Number(coord[1])
    if (Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng }
    }
  }
  if (typeof coord === 'object') {
    const lat = Number(coord.lat ?? coord.latitude)
    const lng = Number(coord.lng ?? coord.lon ?? coord.longitude)
    if (Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng }
    }
  }
  return null
}

/**
 * Interactive Leaflet-powered route map with OpenStreetMap & Satellite layers,
 * real road-network polylines, start/destination pins, waypoints, responsive auto-resizing,
 * dark-mode support, and fitBounds.
 */
export default function RouteMap({
  geometry = [],
  alternatives = [],
  waypoints = [],
  pickup = null,
  destination = null,
  height = 360,
  label = 'Road route'
}) {
  const containerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const routeLayerGroupRef = useRef(null)
  const markersLayerGroupRef = useRef(null)
  const baseLayersRef = useRef({})
  const [activeLayer, setActiveLayer] = useState('streets') // 'streets' | 'satellite'
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Normalize points
  const primaryPoints = (geometry || []).map(toPoint).filter(Boolean)
  const validWaypoints = (waypoints || []).map(toPoint).filter(Boolean)

  const parsedAlternatives = (alternatives || [])
    .filter((alt) => alt && Array.isArray(alt.geometry) && !alt.is_primary)
    .map((alt) => ({
      id: alt.id,
      distance_km: alt.distance_km,
      duration_minutes: alt.duration_minutes,
      points: alt.geometry.map(toPoint).filter(Boolean)
    }))
    .filter((alt) => alt.points.length > 1)

  // Initialize Leaflet Map
  useEffect(() => {
    if (!containerRef.current) return
    if (mapInstanceRef.current) return

    const initialCenter = primaryPoints.length > 0
      ? [primaryPoints[0].lat, primaryPoints[0].lng]
      : [20.5937, 78.9629] // Center of India

    const map = L.map(containerRef.current, {
      center: initialCenter,
      zoom: primaryPoints.length > 0 ? 11 : 5,
      zoomControl: false,
      attributionControl: true
    })

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    // Base Layers
    const streetsLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c'],
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
    })

    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri &mdash; Maxar, Earthstar Geographics'
      }
    )

    streetsLayer.addTo(map)
    baseLayersRef.current = { streets: streetsLayer, satellite: satelliteLayer }

    // Layer groups
    const routeGroup = L.layerGroup().addTo(map)
    const markersGroup = L.layerGroup().addTo(map)
    routeLayerGroupRef.current = routeGroup
    markersLayerGroupRef.current = markersGroup
    mapInstanceRef.current = map

    // Fix grey tile bug on initial render
    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 120)

    // ResizeObserver to fix blank/grey tiles when container or tab dimensions change
    let resizeObserver = null
    if (window.ResizeObserver && containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize()
        }
      })
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      clearTimeout(timer)
      if (resizeObserver) resizeObserver.disconnect()
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  // Draw Routes, Alternatives, and Markers whenever coordinates change
  useEffect(() => {
    const map = mapInstanceRef.current
    const routeGroup = routeLayerGroupRef.current
    const markersGroup = markersLayerGroupRef.current
    if (!map || !routeGroup || !markersGroup) return

    routeGroup.clearLayers()
    markersGroup.clearLayers()

    const allRoutePoints = []

    // 1. Draw Alternative Routes (dashed slate)
    parsedAlternatives.forEach((alt, idx) => {
      if (alt.points.length < 2) return
      const poly = L.polyline(alt.points.map((p) => [p.lat, p.lng]), {
        color: '#64748b',
        weight: 4,
        opacity: 0.7,
        dashArray: '8, 8',
        lineCap: 'round',
        lineJoin: 'round'
      })
      poly.bindPopup(`
        <div class="text-xs p-1">
          <strong>Alternative Route ${idx + 1}</strong>
          ${alt.distance_km ? `<div>Distance: <strong>${alt.distance_km} km</strong></div>` : ''}
          ${alt.duration_minutes ? `<div>Time: <strong>${alt.duration_minutes} min</strong></div>` : ''}
        </div>
      `)
      routeGroup.addLayer(poly)
    })

    // 2. Draw Primary Route (emerald)
    if (primaryPoints.length >= 2) {
      const latLngs = primaryPoints.map((p) => [p.lat, p.lng])
      const primaryPoly = L.polyline(latLngs, {
        color: '#059669',
        weight: 5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round'
      })
      primaryPoly.bindPopup(`
        <div class="text-xs p-1">
          <strong class="text-emerald-700">Primary Dispatch Route</strong>
          <div>${label}</div>
          <div>Waypoints: <strong>${primaryPoints.length}</strong></div>
        </div>
      `)
      routeGroup.addLayer(primaryPoly)
      latLngs.forEach((pt) => allRoutePoints.push(pt))

      // Start Marker (Pickup)
      const startPt = primaryPoints[0]
      const startMarker = L.marker([startPt.lat, startPt.lng], {
        icon: createPinIcon('pickup'),
        title: pickup || 'Pickup Location'
      })
      startMarker.bindPopup(`
        <div class="text-xs p-1">
          <div class="font-bold text-emerald-800">📦 Pickup Origin</div>
          <div class="mt-1 font-semibold">${pickup || 'Origin Gate'}</div>
          <div class="text-[10px] text-gray-500">${startPt.lat.toFixed(4)}, ${startPt.lng.toFixed(4)}</div>
        </div>
      `)
      markersGroup.addLayer(startMarker)

      // End Marker (Destination)
      const endPt = primaryPoints[primaryPoints.length - 1]
      const endMarker = L.marker([endPt.lat, endPt.lng], {
        icon: createPinIcon('destination'),
        title: destination || 'Mandi Destination'
      })
      endMarker.bindPopup(`
        <div class="text-xs p-1">
          <div class="font-bold text-amber-800">🏁 Mandi Destination</div>
          <div class="mt-1 font-semibold">${destination || 'Mandi / APMC Yard'}</div>
          <div class="text-[10px] text-gray-500">${endPt.lat.toFixed(4)}, ${endPt.lng.toFixed(4)}</div>
        </div>
      `)
      markersGroup.addLayer(endMarker)
    }

    // 3. Intermediate Waypoints
    validWaypoints.forEach((wpt, index) => {
      const marker = L.marker([wpt.lat, wpt.lng], {
        icon: createPinIcon('waypoint', index + 1),
        title: `Stop #${index + 1}`
      })
      marker.bindPopup(`
        <div class="text-xs p-1">
          <div class="font-bold text-blue-800">Stop #${index + 1}</div>
          <div class="text-[10px] text-gray-500">${wpt.lat.toFixed(4)}, ${wpt.lng.toFixed(4)}</div>
        </div>
      `)
      markersGroup.addLayer(marker)
      allRoutePoints.push([wpt.lat, wpt.lng])
    })

    // Fit map bounds if points exist
    if (allRoutePoints.length > 0) {
      try {
        const bounds = L.latLngBounds(allRoutePoints)
        map.fitBounds(bounds, { padding: [45, 45], maxZoom: 14 })
      } catch {
        /* ignore invalid bounds */
      }
    }
  }, [primaryPoints.length, parsedAlternatives.length, validWaypoints.length, label, pickup, destination])

  // Switch Base Layers
  const toggleBaseLayer = (layerName) => {
    if (!mapInstanceRef.current || activeLayer === layerName) return
    const map = mapInstanceRef.current
    if (layerName === 'satellite') {
      map.removeLayer(baseLayersRef.current.streets)
      map.addLayer(baseLayersRef.current.satellite)
    } else {
      map.removeLayer(baseLayersRef.current.satellite)
      map.addLayer(baseLayersRef.current.streets)
    }
    setActiveLayer(layerName)
  }

  // Recenter / Fit Route
  const handleFitRoute = useCallback(() => {
    const map = mapInstanceRef.current
    if (!map) return
    const allPts = primaryPoints.map((p) => [p.lat, p.lng])
    if (allPts.length > 0) {
      map.fitBounds(L.latLngBounds(allPts), { padding: [45, 45], maxZoom: 14 })
    }
  }, [primaryPoints])

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev)
    setTimeout(() => {
      if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize()
    }, 150)
  }

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border border-gray-200 dark:border-[#1e362e] bg-white dark:bg-[#12211c] shadow-sm transition-all ${
        isFullscreen ? 'fixed inset-4 z-[9999] shadow-2xl' : ''
      }`}
    >
      {/* Map Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-white/95 dark:bg-[#12211c]/95 backdrop-blur-md border-b border-gray-200 dark:border-[#1e362e] z-10 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="flex rounded-lg border border-gray-200 dark:border-[#274a3d] overflow-hidden bg-gray-50 dark:bg-[#162a23]">
            <button
              type="button"
              onClick={() => toggleBaseLayer('streets')}
              className={`px-2.5 py-1 font-semibold transition flex items-center gap-1 text-[11px] ${
                activeLayer === 'streets'
                  ? 'bg-emerald-700 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:text-emerald-600'
              }`}
            >
              <Compass size={13} /> Roads (OSM)
            </button>
            <button
              type="button"
              onClick={() => toggleBaseLayer('satellite')}
              className={`px-2.5 py-1 font-semibold transition flex items-center gap-1 text-[11px] ${
                activeLayer === 'satellite'
                  ? 'bg-emerald-700 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:text-emerald-600'
              }`}
            >
              <Layers size={13} /> Satellite
            </button>
          </div>

          <button
            type="button"
            onClick={handleFitRoute}
            title="Fit Route Bounds"
            className="p-1.5 rounded-lg border border-gray-200 dark:border-[#274a3d] bg-white dark:bg-[#162a23] text-gray-700 dark:text-gray-200 hover:border-emerald-500 hover:text-emerald-600 transition flex items-center gap-1 text-[11px]"
          >
            <RotateCcw size={13} /> Fit Route
          </button>
        </div>

        <div className="flex items-center gap-2">
          {primaryPoints.length === 0 && (
            <span className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <AlertCircle size={13} /> No route geometry
            </span>
          )}

          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Expand Map'}
            className="p-1.5 rounded-lg border border-gray-200 dark:border-[#274a3d] bg-white dark:bg-[#162a23] text-gray-700 dark:text-gray-200 hover:border-emerald-500 transition"
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* Leaflet Map Div */}
      <div
        ref={containerRef}
        style={{
          height: isFullscreen ? 'calc(100% - 85px)' : `${height}px`,
          width: '100%',
          minHeight: '260px',
          zIndex: 1
        }}
      />

      {/* Map Legend Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2 text-[11px] font-semibold text-gray-600 dark:text-gray-300 border-t border-gray-200 dark:border-[#1e362e] bg-gray-50/90 dark:bg-[#162a23]/90">
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-full bg-emerald-600" /> Primary Road Route
          </span>
          {parsedAlternatives.length > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-0.5 w-4 border-t-2 border-dashed border-gray-400" /> Alternatives ({parsedAlternatives.length})
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-600" /> Pickup
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-600" /> Destination
          </span>
        </div>
        <div className="text-[10px] text-gray-400">
          OSRM / OpenStreetMap Engine
        </div>
      </div>
    </div>
  )
}
