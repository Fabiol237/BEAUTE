'use client'

import { MapContainer, TileLayer, Marker, Popup, LayersControl } from 'react-leaflet'
import L from 'leaflet'
import { useState, useEffect } from 'react'

// Fix pour les icônes Leaflet par défaut dans Next.js
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})

export default function Map({ projects = [] }: { projects?: any[] }) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>Initialisation de la carte...</div>
  }

  // Position par défaut sur Douala
  const defaultCenter: [number, number] = [4.0511, 9.7679]

  return (
    <div style={{ height: '100%', width: '100%', minHeight: '500px' }}>
      <MapContainer
        center={defaultCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Plan standard">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Vue satellite">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            />
          </LayersControl.BaseLayer>
        </LayersControl>
        {projects.filter(p => p.latitude && p.longitude).map((p) => (
          <Marker
            key={p.id}
            position={[Number(p.latitude), Number(p.longitude)]}
            icon={icon}
          >
            <Popup>
              <strong>{p.titre}</strong><br />
              {p.communes?.nom}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
