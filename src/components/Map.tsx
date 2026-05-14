'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

// Fix for Leaflet marker icons in Next.js
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

export default function Map() {
  const [projects, setProjects] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    async function fetchProjects() {
      const { data } = await supabase
        .from('projets')
        .select('*, communes(nom)')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
      
      if (data) setProjects(data)
    }
    fetchProjects()
  }, [])

  return (
    <MapContainer center={[4.0511, 9.7679]} zoom={12} style={{ height: '100%', width: '100%', borderRadius: 12 }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {projects.map((p) => (
        <Marker key={p.id} position={[p.latitude, p.longitude]} icon={icon}>
          <Popup>
            <div style={{ minWidth: 150 }}>
              <strong style={{ fontSize: '1rem' }}>{p.titre}</strong>
              <p style={{ margin: '0.5rem 0', color: 'var(--muted)' }}>{p.communes?.nom}</p>
              <span className={`badge ${p.statut === 'terminé' ? 'badge-success' : 'badge-warning'}`}>
                {p.statut === 'terminé' ? 'Terminé' : 'En cours'}
              </span>
              <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                Avancement : <strong>{p.avancement_physique}%</strong>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
