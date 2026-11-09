import React, { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  MapPin, Layers, Trash2, Crosshair, Upload, Check,
  Maximize2, AlertCircle, Info
} from 'lucide-react'

// Fix default icon asset issues in bundled Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
})

/**
 * Calculates geodesic area of a polygon defined by [lat, lng] points.
 * Uses the spherical excess formula with Earth radius R = 6,378,137 m.
 */
function calculateGeodesicArea(coords) {
  if (!coords || coords.length < 3) return 0
  const R = 6378137 // Earth's radius in meters
  const rad = (deg) => (deg * Math.PI) / 180

  let total = 0
  const n = coords.length
  for (let i = 0; i < n; i++) {
    const p1 = coords[i]
    const p2 = coords[(i + 1) % n]
    const lam1 = rad(p1[1])
    const lam2 = rad(p2[1])
    const phi1 = rad(p1[0])
    const phi2 = rad(p2[0])
    total += (lam2 - lam1) * (2 + Math.sin(phi1) + Math.sin(phi2))
  }
  const areaM2 = Math.abs((total * R * R) / 2)
  return areaM2
}

/**
 * Extract [lat, lng] vertices from KML file string.
 */
function parseKmlCoordinates(kmlText) {
  const coordRegex = /<coordinates>([\s\S]*?)<\/coordinates>/i
  const match = coordRegex.exec(kmlText)
  if (!match) throw new Error('No <coordinates> tag found in KML file')

  const points = []
  const rawCoords = match[1].trim().split(/\s+/)
  for (const item of rawCoords) {
    if (!item.trim()) continue
    const parts = item.split(',')
    if (parts.length >= 2) {
      const lng = parseFloat(parts[0])
      const lat = parseFloat(parts[1])
      if (!isNaN(lat) && !isNaN(lng)) {
        points.push([lat, lng])
      }
    }
  }
  if (points.length < 3) {
    throw new Error('KML must contain at least 3 coordinates to form a boundary')
  }
  return points
}

/**
 * Extract [lat, lng] vertices from GeoJSON string or object.
 */
function parseGeoJsonCoordinates(geoData) {
  const data = typeof geoData === 'string' ? JSON.parse(geoData) : geoData
  let polygonCoords = null

  if (data.type === 'FeatureCollection' && data.features?.[0]) {
    const geom = data.features[0].geometry
    if (geom.type === 'Polygon') polygonCoords = geom.coordinates[0]
  } else if (data.type === 'Feature' && data.geometry?.type === 'Polygon') {
    polygonCoords = data.geometry.coordinates[0]
  } else if (data.type === 'Polygon') {
    polygonCoords = data.coordinates[0]
  }

  if (!polygonCoords || polygonCoords.length < 3) {
    throw new Error('GeoJSON must be a valid Polygon with at least 3 coordinates')
  }

  // GeoJSON is [lng, lat] -> convert to [lat, lng]
  return polygonCoords.map((pt) => [pt[1], pt[0]])
}

export default function FarmMap({
  initialCoordinates = [],
  initialCenter = [20.0, 75.0], // Default center in central India
  initialZoom = 13,
  onBoundaryChange,
  readOnly = false,
  height = '480px'
}) {
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const polygonLayerRef = useRef(null)
  const markersLayerRef = useRef(null)
  const baseLayersRef = useRef({})

  const [coordinates, setCoordinates] = useState(initialCoordinates)
  const [activeLayer, setActiveLayer] = useState('satellite') // 'satellite' | 'streets'
  const [areaInfo, setAreaInfo] = useState({ acres: 0, hectares: 0, m2: 0 })
  const [isDrawing, setIsDrawing] = useState(!readOnly)
  const [statusMessage, setStatusMessage] = useState('')
  const fileInputRef = useRef(null)

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return
    if (mapInstanceRef.current) return

    const initialPos = initialCoordinates.length > 0
      ? initialCoordinates[0]
      : initialCenter

    const map = L.map(mapContainerRef.current, {
      center: initialPos,
      zoom: initialZoom,
      zoomControl: false
    })

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    // Base Layers
    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Tiles &copy; Esri &mdash; Maxar, Earthstar Geographics',
        maxZoom: 19
      }
    )

    const streetsLayer = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }
    )

    satelliteLayer.addTo(map)
    baseLayersRef.current = { satellite: satelliteLayer, streets: streetsLayer }

    // Layer groups for boundary polygon and vertex markers
    const polygonLayer = L.layerGroup().addTo(map)
    const markersLayer = L.layerGroup().addTo(map)

    polygonLayerRef.current = polygonLayer
    markersLayerRef.current = markersLayer
    mapInstanceRef.current = map

    // Fix initial grey tile bug when mounted in tabs/drawers
    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 120)

    // ResizeObserver to handle container resizes & tab switches
    let resizeObserver = null
    if (window.ResizeObserver && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize()
        }
      })
      resizeObserver.observe(mapContainerRef.current)
    }

    // Map click handler to add points when in drawing mode
    map.on('click', (e) => {
      if (readOnly) return
      const newPt = [Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6))]
      setCoordinates((prev) => [...prev, newPt])
    })

    return () => {
      clearTimeout(timer)
      if (resizeObserver) resizeObserver.disconnect()
      map.remove()
      mapInstanceRef.current = null
    }
  }, []) // run once on mount

  // Redraw Polygon & Markers whenever coordinates change
  useEffect(() => {
    if (!mapInstanceRef.current) return

    const polygonLayer = polygonLayerRef.current
    const markersLayer = markersLayerRef.current

    polygonLayer.clearLayers()
    markersLayer.clearLayers()

    if (coordinates.length === 0) {
      setAreaInfo({ acres: 0, hectares: 0, m2: 0 })
      return
    }

    // Add marker for each vertex
    coordinates.forEach((pt, index) => {
      const circleMarker = L.circleMarker(pt, {
        radius: 6,
        fillColor: '#10b981',
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.9
      })

      if (!readOnly) {
        circleMarker.bindTooltip(`Point ${index + 1}`, { permanent: false, direction: 'top' })
      }
      markersLayer.addLayer(circleMarker)
    })

    // Draw line or polygon
    if (coordinates.length >= 3) {
      const polygon = L.polygon(coordinates, {
        color: '#10b981',
        weight: 3,
        fillColor: '#34d399',
        fillOpacity: 0.35,
        dashArray: undefined
      })
      polygonLayer.addLayer(polygon)

      // Calculate real area
      const areaM2 = calculateGeodesicArea(coordinates)
      const acres = Number((areaM2 / 4046.8564224).toFixed(2))
      const hectares = Number((areaM2 / 10000).toFixed(2))

      setAreaInfo({ acres, hectares, m2: Math.round(areaM2) })

      // Calculate centroid
      const centerLat = coordinates.reduce((sum, p) => sum + p[0], 0) / coordinates.length
      const centerLng = coordinates.reduce((sum, p) => sum + p[1], 0) / coordinates.length

      if (onBoundaryChange) {
        onBoundaryChange({
          coordinates,
          areaAcres: acres,
          areaHectares: hectares,
          center: [Number(centerLat.toFixed(6)), Number(centerLng.toFixed(6))]
        })
      }
    } else if (coordinates.length === 2) {
      const polyline = L.polyline(coordinates, {
        color: '#10b981',
        weight: 2,
        dashArray: '4, 4'
      })
      polygonLayer.addLayer(polyline)
      setAreaInfo({ acres: 0, hectares: 0, m2: 0 })
    }
  }, [coordinates, readOnly, onBoundaryChange])

  // Fit bounds if initial coordinates provided
  useEffect(() => {
    if (mapInstanceRef.current && initialCoordinates && initialCoordinates.length >= 3) {
      try {
        const bounds = L.latLngBounds(initialCoordinates)
        mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] })
      } catch {
        /* ignore invalid bounds */
      }
    }
  }, [initialCoordinates])

  // Toggle Base Layer (Satellite vs OpenStreetMap)
  const toggleBaseLayer = (layerName) => {
    if (!mapInstanceRef.current) return
    const map = mapInstanceRef.current
    if (activeLayer === layerName) return

    if (layerName === 'satellite') {
      map.removeLayer(baseLayersRef.current.streets)
      map.addLayer(baseLayersRef.current.satellite)
    } else {
      map.removeLayer(baseLayersRef.current.satellite)
      map.addLayer(baseLayersRef.current.streets)
    }
    setActiveLayer(layerName)
  }

  // Geolocation: Find User Location
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setStatusMessage('Geolocation is not supported by your browser')
      return
    }

    setStatusMessage('Locating your GPS coordinates…')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setStatusMessage(`GPS Location found: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 16)
          L.circleMarker([latitude, longitude], {
            radius: 8,
            fillColor: '#3b82f6',
            color: '#fff',
            weight: 2,
            fillOpacity: 1
          }).addTo(mapInstanceRef.current).bindPopup('Your Current GPS Location').openPopup()
        }
      },
      (err) => {
        let msg = `GPS error: ${err.message}`
        if (err.code === 1) msg = 'Location permission denied. Please allow location access in your browser settings.'
        else if (err.code === 2) msg = 'Position unavailable. Check your device GPS signal.'
        else if (err.code === 3) msg = 'Location request timed out. Please retry.'
        setStatusMessage(msg)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // Clear boundary points
  const handleClear = () => {
    setCoordinates([])
    setStatusMessage('Boundary cleared. Click on the map to place boundary points.')
  }

  // Undo last point
  const handleUndo = () => {
    setCoordinates((prev) => prev.slice(0, -1))
  }

  // Handle GeoJSON / KML File Upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = event.target?.result
        if (typeof content !== 'string') return

        let parsedCoords = []
        if (file.name.endsWith('.kml') || content.includes('<kml')) {
          parsedCoords = parseKmlCoordinates(content)
        } else {
          parsedCoords = parseGeoJsonCoordinates(content)
        }

        setCoordinates(parsedCoords)
        setStatusMessage(`Imported ${parsedCoords.length} boundary points from ${file.name}`)

        if (mapInstanceRef.current && parsedCoords.length >= 3) {
          const bounds = L.latLngBounds(parsedCoords)
          mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] })
        }
      } catch (err) {
        setStatusMessage(`Import failed: ${err.message}`)
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-forest-800 shadow-md bg-white dark:bg-[#12211c]">
      {/* Map Control Header / Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white/90 dark:bg-[#12211c]/90 backdrop-blur-md border-b border-gray-200 dark:border-forest-800 z-10 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 dark:border-forest-700 overflow-hidden bg-gray-50 dark:bg-[#162a23]">
            <button
              type="button"
              onClick={() => toggleBaseLayer('satellite')}
              className={`px-3 py-1.5 font-medium transition flex items-center gap-1.5 ${
                activeLayer === 'satellite'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'text-gray-600 dark:text-gray-300 hover:text-emerald-600'
              }`}
            >
              <Layers size={13} /> Satellite (Esri)
            </button>
            <button
              type="button"
              onClick={() => toggleBaseLayer('streets')}
              className={`px-3 py-1.5 font-medium transition flex items-center gap-1.5 ${
                activeLayer === 'streets'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'text-gray-600 dark:text-gray-300 hover:text-emerald-600'
              }`}
            >
              <MapPin size={13} /> Streets (OSM)
            </button>
          </div>

          <button
            type="button"
            onClick={handleLocateMe}
            title="Locate my GPS position"
            className="p-1.5 rounded-lg border border-gray-200 dark:border-forest-700 bg-white dark:bg-[#162a23] text-gray-700 dark:text-gray-200 hover:border-emerald-500 hover:text-emerald-600 transition flex items-center gap-1"
          >
            <Crosshair size={14} /> Locate GPS
          </button>
        </div>

        {/* Boundary Tools */}
        {!readOnly && (
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".geojson,.json,.kml"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-forest-700 bg-white dark:bg-[#162a23] text-gray-700 dark:text-gray-200 hover:border-emerald-500 transition flex items-center gap-1"
            >
              <Upload size={13} /> Import GeoJSON/KML
            </button>

            {coordinates.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleUndo}
                  className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-forest-700 bg-white dark:bg-[#162a23] text-gray-700 dark:text-gray-200 hover:text-amber-600 transition"
                >
                  Undo Point
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-red-600 hover:bg-red-100 transition flex items-center gap-1"
                >
                  <Trash2 size={13} /> Clear
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Leaflet Map Div */}
      <div ref={mapContainerRef} style={{ height, width: '100%', zIndex: 1 }} />

      {/* Floating Info Overlay / Area Stats */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 dark:bg-[#12211c]/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-forest-800 shadow-lg text-xs pointer-events-auto">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Boundary Area</span>
            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {areaInfo.acres > 0 ? (
                <>
                  <span>{areaInfo.acres} Acres</span>
                  <span className="text-[11px] font-normal text-gray-500 ml-1.5">({areaInfo.hectares} Hectares)</span>
                </>
              ) : (
                <span className="text-gray-400 font-normal">Click map to set &ge; 3 boundary points</span>
              )}
            </div>
          </div>
          <div className="border-l border-gray-200 dark:border-forest-700 pl-3">
            <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Vertices</span>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
              {coordinates.length} points
            </span>
          </div>
        </div>
      </div>

      {/* Helper / Status banner */}
      {statusMessage && (
        <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 border-t border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-200 flex items-center gap-1.5">
          <Info size={13} /> {statusMessage}
        </div>
      )}
    </div>
  )
}

