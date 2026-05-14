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

export default function Map({ projects = [], selectedProject = null, points = [] }: { projects?: any[], selectedProject?: any, points?: any[] }) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>Initialisation de la carte...</div>
  }

  // Position par défaut sur Douala ou sur le projet sélectionné
  const center: [number, number] = selectedProject?.latitude && selectedProject?.longitude 
    ? [Number(selectedProject.latitude), Number(selectedProject.longitude)]
    : [4.0511, 9.7679]

  return (
    <div style={{ height: '100%', width: '100%', minHeight: '500px' }}>
      <MapContainer
        center={center}
        zoom={selectedProject ? 15 : 13}
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

        {/* Projets standards */}
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

        {/* Points spécifiques (ex: suggestions) */}
        {points.map((pt: any, i: number) => (
          <Marker key={i} position={[pt.lat, pt.lng]} icon={icon}>
            <Popup>
              <div dangerouslySetInnerHTML={{ __html: pt.popup }} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
