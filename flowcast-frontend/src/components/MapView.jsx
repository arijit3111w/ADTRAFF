import React from 'react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom icons based on the reference design
const createCustomIcon = (color, text) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; color: white; border-radius: 8px; padding: 4px 8px; font-weight: bold; font-size: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); white-space: nowrap;">
             ${text}
           </div>`,
    iconSize: [40, 24],
    iconAnchor: [20, 12]
  });
};

const warningIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: #ef4444; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 0 10px rgba(239, 68, 68, 0.8);">!</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
});

const MapView = () => {
  // Center roughly on a generic intersection, mimicking the reference
  const center = [45.485, 12.185]; 

  // Dummy route data to mimic the reference image lines (blue/red)
  const routeBlue = [
    [45.483, 12.165],
    [45.484, 12.175],
    [45.485, 12.185],
    [45.486, 12.195],
    [45.487, 12.210],
  ];

  const routeRed = [
    [45.485, 12.185],
    [45.495, 12.192],
    [45.505, 12.200],
  ];

  return (
    <div className="absolute inset-0 z-0">
      <MapContainer 
        center={center} 
        zoom={14} 
        style={{ height: '100%', width: '100%', backgroundColor: '#0f172a' }}
        zoomControl={false}
      >
        {/* Dark theme tile layer using CartoDB Dark Matter */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        {/* Route Lines */}
        <Polyline positions={routeBlue} color="#3b82f6" weight={5} opacity={0.8} />
        <Polyline positions={routeRed} color="#ef4444" weight={5} opacity={0.8} />

        {/* Markers from Reference Image */}
        <Marker position={[45.485, 12.185]} icon={createCustomIcon('#ef4444', '5 min')} />
        <Marker position={[45.495, 12.192]} icon={createCustomIcon('#1e293b', '3')} />
        <Marker position={[45.486, 12.195]} icon={warningIcon} />
        <Marker position={[45.486, 12.205]} icon={createCustomIcon('#ef4444', '15 min')} />

      </MapContainer>
    </div>
  );
};

export default MapView;
