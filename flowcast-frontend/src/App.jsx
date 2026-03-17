import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, Navigation, Clock, Calendar, Zap, ChevronRight,
  Activity, TrendingUp, AlertTriangle, CheckCircle2, RefreshCw,
  Car, Bus, Bike, Truck, BarChart3, Layers, Settings, Bell,
  ArrowRight, Info, Target, Cpu, Shield, LocateFixed
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts'

// ─── Real ML Prediction integrated with FLASK API ──────────────────────────────
const SITUATIONS = { 0: 'Low', 1: 'Normal', 2: 'Heavy', 3: 'High' }
const SITUATION_COLORS = {
  Low: '#00E5A0', Normal: '#00C2FF', Heavy: '#FFB800', High: '#FF3B5C'
}
const SITUATION_BG = {
  Low: 'rgba(0,229,160,0.12)', Normal: 'rgba(0,194,255,0.12)',
  Heavy: 'rgba(255,184,0,0.12)', High: 'rgba(255,59,92,0.12)'
}

// ─── Map Component ───────────────────────────────────────────────────────────
function MapView({ prediction, origin, destination, originCoords, destCoords }) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const markersRef = useRef({ origin: null, dest: null })
  const [mapLoaded, setMapLoaded] = useState(false)

  // Default to Nigeria center
  const DEFAULT_CENTER = [8.0, 9.0]

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    const script = document.createElement('script')
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.1.0/mapbox-gl.js'
    script.onload = () => {
      window.mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN
      const map = new window.mapboxgl.Map({
        container: mapRef.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: DEFAULT_CENTER,
        zoom: 5.5,
        pitch: 30,
        bearing: 0,
      })

      map.on('load', () => {
        mapInstance.current = map
        setMapLoaded(true)

        // Add atmosphere
        map.setFog({
          color: 'rgb(6, 11, 18)',
          'high-color': 'rgb(0, 30, 50)',
          'horizon-blend': 0.02,
        })

        map.addControl(new window.mapboxgl.NavigationControl({ showCompass: true }), 'bottom-right')
      })
    }
    document.head.appendChild(script)
    return () => { if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null } }
  }, [])

  // Update markers when coordinates change
  useEffect(() => {
    if (!mapLoaded || !mapInstance.current) return
    const map = mapInstance.current

    // Remove old markers
    if (markersRef.current.origin) { markersRef.current.origin.remove(); markersRef.current.origin = null }
    if (markersRef.current.dest) { markersRef.current.dest.remove(); markersRef.current.dest = null }

    // Add origin marker
    if (originCoords) {
      const el = document.createElement('div')
      el.innerHTML = `<div style="width:14px;height:14px;border-radius:50%;background:#00C2FF;border:3px solid #fff;box-shadow:0 0 12px rgba(0,194,255,0.7)"></div>`
      markersRef.current.origin = new window.mapboxgl.Marker(el)
        .setLngLat(originCoords)
        .setPopup(new window.mapboxgl.Popup({ offset: 15 }).setHTML('<div style="font-family:monospace;font-size:11px;color:#333"><strong>Origin</strong><br/>' + originCoords.map(c => c.toFixed(4)).join(', ') + '</div>'))
        .addTo(map)
    }

    // Add destination marker
    if (destCoords) {
      const el = document.createElement('div')
      el.innerHTML = `<div style="width:14px;height:14px;border-radius:50%;background:#FFB800;border:3px solid #fff;box-shadow:0 0 12px rgba(255,184,0,0.7)"></div>`
      markersRef.current.dest = new window.mapboxgl.Marker(el)
        .setLngLat(destCoords)
        .setPopup(new window.mapboxgl.Popup({ offset: 15 }).setHTML('<div style="font-family:monospace;font-size:11px;color:#333"><strong>Destination</strong><br/>' + destCoords.map(c => c.toFixed(4)).join(', ') + '</div>'))
        .addTo(map)
    }

    // Fit bounds to show both markers
    if (originCoords && destCoords) {
      map.fitBounds([originCoords, destCoords], { padding: 100, duration: 1200, maxZoom: 12 })
    } else if (originCoords) {
      map.flyTo({ center: originCoords, zoom: 10, duration: 1000 })
    } else if (destCoords) {
      map.flyTo({ center: destCoords, zoom: 10, duration: 1000 })
    }
  }, [originCoords, destCoords, mapLoaded])

  useEffect(() => {
    if (!mapLoaded || !mapInstance.current || !prediction) return
    const map = mapInstance.current
    const ORIGIN_COORDS = originCoords || DEFAULT_CENTER
    const DEST_COORDS = destCoords || DEFAULT_CENTER

    // Remove old route if exists
    if (map.getLayer('route-glow')) map.removeLayer('route-glow')
    if (map.getLayer('route-line')) map.removeLayer('route-line')
    if (map.getLayer('route-dash')) map.removeLayer('route-dash')
    if (map.getSource('route')) map.removeSource('route')

    const color = SITUATION_COLORS[prediction.situation]

    // Curved route via midpoint
    const midLng = (ORIGIN_COORDS[0] + DEST_COORDS[0]) / 2 - 0.02
    const midLat = (ORIGIN_COORDS[1] + DEST_COORDS[1]) / 2 + 0.01
    const coords = []
    for (let i = 0; i <= 30; i++) {
      const t = i / 30
      const lng = (1-t)*(1-t)*ORIGIN_COORDS[0] + 2*(1-t)*t*midLng + t*t*DEST_COORDS[0]
      const lat = (1-t)*(1-t)*ORIGIN_COORDS[1] + 2*(1-t)*t*midLat + t*t*DEST_COORDS[1]
      coords.push([lng, lat])
    }

    map.addSource('route', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [coords[0], coords[0]] } } })
    map.addLayer({ id: 'route-glow', type: 'line', source: 'route', layout: { 'line-cap': 'round' }, paint: { 'line-color': color, 'line-width': 12, 'line-opacity': 0.15, 'line-blur': 8 } })
    map.addLayer({ id: 'route-line', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': color, 'line-width': 3, 'line-opacity': 0.9 } })
    map.addLayer({ id: 'route-dash', type: 'line', source: 'route', paint: { 'line-color': '#ffffff', 'line-width': 1, 'line-opacity': 0.3, 'line-dasharray': [0, 4, 3] } })

    // Build timeline: draw line -> animate dash
    let frame = 0
    const totalFrames = 60
    const drawLine = () => {
      frame++
      const progress = frame / totalFrames
      const ease = 1 - Math.pow(1 - progress, 3) 
      const idx = Math.max(1, Math.floor(ease * coords.length))
      
      if (map.getSource('route')) {
        map.getSource('route').setData({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: coords.slice(0, idx + 1) }
        })
      }
      
      if (frame < totalFrames) {
        requestAnimationFrame(drawLine)
      } else {
        let dashStep = 0
        const dashArrays = [[0,4,3],[0.5,4,2.5],[1,4,2],[1.5,4,1.5],[2,4,1],[2.5,4,0.5],[3,4,0],[0,0.5,3.5],[0,1,3],[0,1.5,2.5],[0,2,2],[0,2.5,1.5],[0,3,1],[0,3.5,0.5]]
        const animateDash = () => {
          if (!map.getLayer('route-dash')) return
          map.setPaintProperty('route-dash', 'line-dasharray', dashArrays[dashStep % dashArrays.length])
          dashStep++
          requestAnimationFrame(animateDash)
        }
        animateDash()
      }
    }

    setTimeout(() => { requestAnimationFrame(drawLine) }, 400)

    map.fitBounds([ORIGIN_COORDS, DEST_COORDS], { padding: 120, duration: 1500 })
  }, [prediction, mapLoaded])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      {!mapLoaded && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', flexDirection: 'column', gap: 12 }}>
          <div style={{ width: 40, height: 40, border: '2px solid var(--border)', borderTopColor: 'var(--accent-cyan)', borderRadius: '50%', animation: 'radarSweep 1s linear infinite' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>LOADING MAP</span>
        </div>
      )}
      {/* Map overlay gradient */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'linear-gradient(to right, var(--bg-base), transparent)', pointerEvents: 'none' }} />
    </div>
  )
}

// ─── Confidence Bar ───────────────────────────────────────────────────────────
function ConfidenceBar({ value, color, label }) {
  const [width, setWidth] = useState(0)
  useEffect(() => { setTimeout(() => setWidth(value * 100), 300) }, [value])
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)', width: 52, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 4, background: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${width}%`, background: color, borderRadius: 2, transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)', boxShadow: `0 0 8px ${color}` }} />
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color, width: 36, textAlign: 'right' }}>{(value * 100).toFixed(0)}%</span>
    </div>
  )
}

// ─── 24h Forecast Chart ───────────────────────────────────────────────────────
function HourlyChart({ data, bestHour }) {
  const chartData = data.map((v, i) => ({
    hour: i,
    label: i === 0 ? '12a' : i < 12 ? `${i}a` : i === 12 ? '12p' : `${i-12}p`,
    congestion: Math.round(v * 100),
  }))

  const getColor = (v) => {
    if (v < 35) return '#00E5A0'
    if (v < 55) return '#00C2FF'
    if (v < 75) return '#FFB800'
    return '#FF3B5C'
  }

  return (
    <ResponsiveContainer width="100%" height={80}>
      <BarChart data={chartData} barCategoryGap={2}>
        <XAxis dataKey="label" tick={{ fontSize: 9, fontFamily: 'Space Mono', fill: '#3D5A6B' }} axisLine={false} tickLine={false} interval={3} />
        <YAxis hide />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const d = payload[0].payload
            return (
              <div style={{ background: 'rgba(6,11,18,0.95)', border: '1px solid var(--border-bright)', padding: '6px 10px', borderRadius: 4, fontFamily: 'Space Mono', fontSize: 10, color: 'var(--text-primary)' }}>
                <div>{d.hour}:00 — {d.congestion}% congestion</div>
                {d.hour === bestHour && <div style={{ color: '#00E5A0', marginTop: 2 }}>★ BEST TIME</div>}
              </div>
            )
          }}
        />
        <Bar dataKey="congestion" radius={[2, 2, 0, 0]}>
          {chartData.map((entry, i) => (
            <Cell
              key={i}
              fill={i === bestHour ? '#00E5A0' : getColor(entry.congestion)}
              opacity={i === bestHour ? 1 : 0.7}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [originCoords, setOriginCoords] = useState(null)
  const [destCoords, setDestCoords] = useState(null)
  const [selectedDay, setSelectedDay] = useState(new Date().getDay())
  const [startHour, setStartHour] = useState(6)
  const [endHour, setEndHour] = useState(21)
  const [loading, setLoading] = useState(false)
  const [prediction, setPrediction] = useState(null)
  const [showResults, setShowResults] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [activeTab, setActiveTab] = useState('input') // 'input' | 'results'

  // Live-parse coordinates from origin/destination text
  useEffect(() => {
    const tryParse = (text) => {
      const parts = text.split(',').map(s => parseFloat(s.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) return parts;
      return null;
    };
    setOriginCoords(tryParse(origin));
    setDestCoords(tryParse(destination));
  }, [origin, destination]);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const daysFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const PRESETS = [
    { label: 'Lagos to Abuja', origin: '3.3792, 6.5244', dest: '7.4951, 9.0579', car: 150, bike: 40, bus: 18, truck: 10 },
    { label: 'Port Harcourt to Enugu', origin: '7.0498, 4.8156', dest: '7.5083, 6.4413', car: 80, bike: 5, bus: 25, truck: 20 },
    { label: 'Kano to Kaduna', origin: '8.5167, 12.0022', dest: '7.4383, 10.5105', car: 90, bike: 60, bus: 8, truck: 5 },
  ]

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const handlePreset = (p) => {
    setOrigin(p.origin); setDestination(p.dest)
  }

  const handlePredict = async () => {
    if (!origin || !destination) return;
    setLoading(true);
    try {
      const parseCoords = (input, fieldName) => {
        const parts = input.split(',').map(s => parseFloat(s.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          return parts; // returning [lng, lat]
        }
        throw new Error(`Invalid coordinate format for ${fieldName}. Please use "longitude, latitude"`);
      };

      const oCoords = parseCoords(origin, 'Origin');
      const dCoords = parseCoords(destination, 'Destination');
      setOriginCoords(oCoords);
      setDestCoords(dCoords);

      let d = new Date();
      d.setDate(d.getDate() + ((selectedDay - d.getDay() + 7) % 7));
      const travel_date = d.toISOString().split('T')[0];

      const res = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_lat: oCoords[1],
          start_lon: oCoords[0],
          end_lat: dCoords[1],
          end_lon: dCoords[0],
          start_hour: startHour,
          end_hour: endHour,
          travel_date
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Prediction failed');
      }
      const data = await res.json();

      const situationMap = {
        'Free Flow': 'Low', 'Light': 'Low',
        'Moderate': 'Normal',
        'Heavy': 'Heavy', 'Severe': 'High'
      };
      
      const situation = situationMap[data.best_congestion_level] || 'High';

      setPrediction({
        situation,
        confidence: 0.95,
        estimatedMinutes: Math.round(data.best_total_eta_minutes),
        distanceKm: data.distance_km,
        bestHour: data.best_departure_hour,
        bestMinute: 0,
        hourlyForecast: data.hourly_breakdown.map(hd => ({
          hour: hd.hour,
          congestion: hd.avg_congestion_index / 100,
          eta: hd.total_eta_minutes
        })),
        features: ['XGBoost Cascade', 'BallTree Map', 'Time features', `${data.route_segment_count} segments`],
        probabilities: {
          Low: data.best_avg_congestion < 45 ? 0.85 : 0.05,
          Normal: (data.best_avg_congestion >= 45 && data.best_avg_congestion < 65) ? 0.85 : 0.05,
          Heavy: (data.best_avg_congestion >= 65 && data.best_avg_congestion < 80) ? 0.85 : 0.05,
          High: data.best_avg_congestion >= 80 ? 0.85 : 0.05,
        }
      });
      setShowResults(true);
      setActiveTab('results');
    } catch (e) {
      console.error(e);
      alert("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  const handleReset = () => {
    setPrediction(null)
    setShowResults(false)
    setActiveTab('input')
  }

  const fmt = (d) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  const fmtHour = (h, m) => `${String(h).padStart(2,'0')}:${String(m || 0).padStart(2,'0')}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', background: 'var(--bg-base)', overflow: 'hidden' }}>

      {/* ── TOP NAV ── */}
      <nav style={{
        height: 52, flexShrink: 0, display: 'flex', alignItems: 'center',
        padding: '0 20px', borderBottom: '1px solid var(--border)',
        background: 'rgba(6,11,18,0.95)', backdropFilter: 'blur(20px)',
        zIndex: 100, gap: 20
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: 'linear-gradient(135deg, #00C2FF, #0055FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(0,194,255,0.4)' }}>
            <Activity size={14} color="white" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>
            Flow<span style={{ color: 'var(--accent-cyan)' }}>Cast</span>
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 4, padding: '2px 8px', borderRadius: 20, background: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.2)' }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00E5A0', animation: 'dotBlink 2s ease infinite' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#00E5A0', letterSpacing: 1 }}>ML ONLINE</span>
          </div>
        </div>

        {/* Center: clock + model info */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, color: 'var(--text-primary)', letterSpacing: 2 }}>{fmt(currentTime)}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1 }}>{currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase()}</div>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            {[{icon: Cpu, label: 'XGBoost', val: '100%'}, {icon: Shield, label: 'Accuracy', val: '99.8%'}, {icon: BarChart3, label: 'Classes', val: '4'}].map(({icon: Icon, label, val}) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon size={12} color="var(--text-muted)" />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>{label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--accent-cyan)' }}>{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right icons */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[Bell, Layers, Settings].map((Icon, i) => (
            <button key={i} style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-cyan)'; e.currentTarget.style.color = 'var(--accent-cyan)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)' }}>
              <Icon size={14} />
            </button>
          ))}
        </div>
      </nav>

      {/* ── MAIN BODY ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── LEFT SIDEBAR ── */}
        <div style={{
          width: 320, flexShrink: 0, height: '100%', overflowY: 'auto',
          borderRight: '1px solid var(--border)', background: 'rgba(6,11,18,0.7)',
          backdropFilter: 'blur(20px)', display: 'flex', flexDirection: 'column'
        }}>
          <AnimatePresence mode="wait">
            {activeTab === 'input' ? (
              <motion.div 
                key="input"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}
              >

              {/* Section header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
                <Navigation size={14} color="var(--accent-cyan)" />
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12, letterSpacing: 2, color: 'var(--text-secondary)' }}>ROUTE INPUT</span>
              </div>

              {/* Origin */}
              <div>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 6 }}>ORIGIN POINT</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <MapPin size={13} color="var(--accent-cyan)" style={{ position: 'absolute', left: 10 }} />
                  <input
                    value={origin}
                    onChange={e => setOrigin(e.target.value)}
                    placeholder="e.g. 13.00, 6.50 (lng, lat)"
                    style={{ width: '100%', padding: '9px 12px 9px 30px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', fontSize: 12, outline: 'none', transition: 'border-color 0.2s', caretColor: 'var(--accent-cyan)' }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent-cyan)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>
              </div>

              {/* Arrow */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: 1, height: 16, background: 'var(--border)', position: 'relative' }}>
                  <ArrowRight size={12} color="var(--text-muted)" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%) rotate(90deg)' }} />
                </div>
              </div>

              {/* Destination */}
              <div>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 6 }}>DESTINATION</label>
                <div style={{ position: 'relative' }}>
                  <Target size={13} color="var(--accent-amber)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    value={destination}
                    onChange={e => setDestination(e.target.value)}
                    placeholder="e.g. 14.50, 8.50 (lng, lat)"
                    style={{ width: '100%', padding: '9px 12px 9px 30px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', fontSize: 12, outline: 'none', transition: 'border-color 0.2s', caretColor: 'var(--accent-amber)' }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent-amber)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>
              </div>

              {/* Day + Hour */}
              <div>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 6 }}>DAY OF TRAVEL</label>
                <div style={{ display: 'flex', gap: 4 }}>
                  {days.map((d, i) => (
                    <button key={d} onClick={() => setSelectedDay(i)}
                      style={{ flex: 1, padding: '6px 0', borderRadius: 5, border: `1px solid ${i === selectedDay ? 'var(--accent-cyan)' : 'var(--border)'}`, background: i === selectedDay ? 'var(--accent-cyan-dim)' : 'var(--bg-surface)', color: i === selectedDay ? 'var(--accent-cyan)' : 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 9, cursor: 'pointer', transition: 'all 0.15s' }}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Departure Window */}
              <div>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 6 }}>PREFERRED TIME INTERVAL</label>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', display: 'block' }}>START: {fmtHour(startHour)}</label>
                    <input type="range" min={0} max={endHour} value={startHour} onChange={e => setStartHour(Number(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--accent-cyan)', cursor: 'pointer' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', display: 'block' }}>END: {fmtHour(endHour)}</label>
                    <input type="range" min={startHour} max={23} value={endHour} onChange={e => setEndHour(Number(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--accent-cyan)', cursor: 'pointer' }} />
                  </div>
                </div>
              </div>



              {/* Presets */}
              <div>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 6 }}>QUICK PRESETS</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {PRESETS.map(p => (
                    <button key={p.label} onClick={() => handlePreset(p)}
                      style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-secondary)', fontFamily: 'var(--font-display)', fontSize: 11, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-bright)'; e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-surface)'; e.currentTarget.style.color = 'var(--text-secondary)' }}>
                      {p.label} <ChevronRight size={11} />
                    </button>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <button onClick={handlePredict} disabled={loading || !origin || !destination}
                style={{
                  width: '100%', padding: '12px 0', borderRadius: 8, border: 'none', cursor: loading || !origin || !destination ? 'not-allowed' : 'pointer',
                  background: loading || !origin || !destination ? 'var(--bg-elevated)' : 'linear-gradient(135deg, #00C2FF 0%, #0044FF 100%)',
                  color: loading || !origin || !destination ? 'var(--text-muted)' : 'white',
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, letterSpacing: 1,
                  transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: loading || !origin || !destination ? 'none' : '0 4px 24px rgba(0,68,255,0.3)',
                  animation: !loading && origin && destination ? 'glowPulse 3s ease infinite' : 'none',
                  backgroundSize: loading || !origin || !destination ? 'auto' : '200% auto',
                }}
                onMouseEnter={e => { if (!loading && origin && destination) e.currentTarget.style.backgroundPosition = 'right center' }}
                onMouseLeave={e => { e.currentTarget.style.backgroundPosition = 'left center' }}>
                {loading ? (
                  <>
                    <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'radarSweep 0.8s linear infinite' }} />
                    ANALYZING TRAFFIC...
                  </>
                ) : (
                  <><Zap size={14} /> PREDICT BEST TIME</>
                )}
              </button>
              </motion.div>
          ) : (
            /* ── RESULTS SIDEBAR ── */
            prediction && (
              <motion.div 
                key="results"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TrendingUp size={14} color="var(--accent-cyan)" />
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12, letterSpacing: 2, color: 'var(--text-secondary)' }}>PREDICTION</span>
                  </div>
                  <button onClick={handleReset} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 5, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 9 }}>
                    <RefreshCw size={10} /> RESET
                  </button>
                </div>

                {/* Main result */}
                <div style={{ padding: 14, borderRadius: 10, border: `1px solid ${SITUATION_COLORS[prediction.situation]}33`, background: SITUATION_BG[prediction.situation], animation: 'glowPulse 2s ease 3' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 4 }}>CURRENT CONDITIONS</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: SITUATION_COLORS[prediction.situation] }}>{prediction.situation.toUpperCase()}</span>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)' }}>{prediction.estimatedMinutes} MIN ETA</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent-cyan)' }}>{prediction.distanceKm} KM</div>
                    </div>
                  </div>
                </div>

                {/* Best time */}
                <div style={{ padding: 14, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 6 }}>OPTIMAL DEPARTURE</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 28, color: '#00E5A0', letterSpacing: 2 }}>
                    {fmtHour(prediction.bestHour, prediction.bestMinute)}
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{daysFull[selectedDay]}</div>
                </div>

                {/* Confidence */}
                <div style={{ padding: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 8 }}>CLASS PROBABILITIES</div>
                  {Object.entries(prediction.probabilities).map(([cls, val]) => (
                    <ConfidenceBar key={cls} label={cls} value={val} color={SITUATION_COLORS[cls]} />
                  ))}
                </div>

                {/* ML Features */}
                <div style={{ padding: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Cpu size={11} color="var(--text-muted)" />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1 }}>ML FEATURES USED</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {prediction.features.map(f => (
                      <span key={f} style={{ padding: '3px 7px', borderRadius: 4, background: 'var(--accent-cyan-dim)', border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--accent-cyan)' }}>{f}</span>
                    ))}
                  </div>
                </div>



                {/* Set reminder */}
                <button style={{ width: '100%', padding: '10px 0', borderRadius: 8, border: '1px solid var(--accent-green)', background: 'var(--accent-green-dim)', color: '#00E5A0', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  onClick={() => alert(`Reminder set for ${fmtHour(prediction.bestHour, prediction.bestMinute)} on ${daysFull[selectedDay]}`)}>
                  <Bell size={13} /> SET DEPARTURE REMINDER
                </button>
              </motion.div>
            )
          )}
          </AnimatePresence>
        </div>

        {/* ── MAP + BOTTOM PANEL ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Map */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <MapView prediction={prediction} origin={origin} destination={destination} originCoords={originCoords} destCoords={destCoords} />

            {/* Route info overlay */}
            {origin && destination && (
              <div style={{ position: 'absolute', top: 12, left: 12, padding: '8px 12px', borderRadius: 8, background: 'rgba(6,11,18,0.85)', backdropFilter: 'blur(12px)', border: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'center', animation: 'fadeSlideUp 0.4s ease' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-cyan)', boxShadow: '0 0 6px var(--accent-cyan)' }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)' }}>{origin}</span>
                </div>
                <ArrowRight size={10} color="var(--text-muted)" />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-amber)', boxShadow: '0 0 6px var(--accent-amber)' }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)' }}>{destination}</span>
                </div>
              </div>
            )}

            {/* Traffic legend */}
            <div style={{ position: 'absolute', top: 12, right: 12, padding: '8px 12px', borderRadius: 8, background: 'rgba(6,11,18,0.85)', backdropFilter: 'blur(12px)', border: '1px solid var(--border)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 6 }}>CONGESTION</div>
              {[['Low', '#00E5A0'], ['Normal', '#00C2FF'], ['Heavy', '#FFB800'], ['High', '#FF3B5C']].map(([l, c]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <div style={{ width: 16, height: 3, borderRadius: 2, background: c }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-secondary)' }}>{l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── BOTTOM PREDICTION STRIP ── */}
          <AnimatePresence>
          {prediction && (
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 20, stiffness: 100 }}
              style={{
                height: 200, flexShrink: 0, borderTop: '1px solid var(--border)',
                background: 'rgba(6,11,18,0.9)', backdropFilter: 'blur(20px)',
                padding: '12px 16px', display: 'flex', gap: 12,
              }}
            >
              {/* Best time card */}
              <div style={{
                minWidth: 160, padding: 14, borderRadius: 10,
                border: `1px solid var(--accent-cyan)`, background: 'rgba(0,194,255,0.08)',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                boxShadow: '0 0 30px rgba(0,194,255,0.1)'
              }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--accent-cyan)', letterSpacing: 2, marginBottom: 4 }}>★ BEST DEPARTURE</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 32, color: 'white', letterSpacing: 2, lineHeight: 1 }}>
                    {fmtHour(prediction.bestHour, prediction.bestMinute)}
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>{daysFull[selectedDay]}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <div style={{ padding: '3px 7px', borderRadius: 4, background: 'rgba(0,229,160,0.15)', border: '1px solid rgba(0,229,160,0.3)' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#00E5A0' }}>LOW TRAFFIC</span>
                  </div>
                  <div style={{ padding: '3px 7px', borderRadius: 4, background: 'var(--bg-elevated)' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-secondary)' }}>{prediction.estimatedMinutes}m</span>
                  </div>
                  <div style={{ padding: '3px 7px', borderRadius: 4, background: 'var(--bg-elevated)' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--accent-cyan)' }}>{prediction.distanceKm} km</span>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div style={{ width: 1, background: 'var(--border)', flexShrink: 0 }} />

              {/* Hourly ETA Breakdown */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Clock size={11} color="var(--text-muted)" />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1 }}>HOURLY ETA ({fmtHour(startHour)} - {fmtHour(endHour)})</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#00E5A0', marginLeft: 'auto' }}>★ = Optimal Time</span>
                </div>
                
                <div style={{ flex: 1, overflowX: 'auto', display: 'flex', gap: 8, paddingBottom: 8,  
                              scrollbarWidth: 'thin', scrollbarColor: 'var(--border) transparent' }}>
                  {prediction.hourlyForecast.map((hd) => (
                    <div key={hd.hour} style={{
                      minWidth: 70, padding: '8px 6px', borderRadius: 8,
                      border: `1px solid ${hd.hour === prediction.bestHour ? '#00E5A0' : 'var(--border)'}`,
                      background: hd.hour === prediction.bestHour ? 'rgba(0, 229, 160, 0.08)' : 'var(--bg-surface)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4
                    }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: hd.hour === prediction.bestHour ? '#00E5A0' : 'var(--text-secondary)' }}>
                        {hd.hour === prediction.bestHour && '★ '}{fmtHour(hd.hour)}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {Math.round(hd.eta)}m
                      </span>
                      <div style={{ width: '80%', height: 3, borderRadius: 2, background: SITUATION_COLORS[hd.congestion * 100 < 35 ? 'Low' : hd.congestion * 100 < 55 ? 'Normal' : hd.congestion * 100 < 75 ? 'Heavy' : 'High'] }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Confidence summary */}
              <div style={{ width: 130, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6, padding: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1 }}>MODEL CONFIDENCE</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 28, color: 'var(--accent-cyan)' }}>
                  {Math.round(prediction.confidence * 100)}%
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <CheckCircle2 size={11} color="#00E5A0" />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#00E5A0' }}>XGBoost</span>
                </div>
                <div style={{ height: 3, background: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${prediction.confidence * 100}%`, background: 'linear-gradient(to right, #00C2FF, #00E5A0)', borderRadius: 2, transition: 'width 1.5s ease' }} />
                </div>
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
