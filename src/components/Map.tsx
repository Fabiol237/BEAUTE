'use client'

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { MapPin, Info, Navigation, Activity } from 'lucide-react'

// Helper to zoom the map
function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap()
  map.setView(center, zoom)
  return null
}

export default function Map({ selectedProject, projects: initialProjects }: { selectedProject?: any, projects?: any[] }) {
  const [projects, setProjects] = useState<any[]>(initialProjects || [])
  const [view, setView] = useState<[number, number]>([4.0511, 9.7679])
  const supabase = createClient()

  useEffect(() => {
    if (!initialProjects) {
      async function fetchProjects() {
        const { data } = await supabase
          .from('projets')
          .select('*, communes(nom), types_projets(nom, couleur)')
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)
        
        if (data) setProjects(data)
      }
      fetchProjects()
    }
  }, [initialProjects])

  useEffect(() => {
    if (selectedProject?.latitude && selectedProject?.longitude) {
      setView([selectedProject.latitude, selectedProject.longitude])
    }
  }, [selectedProject])

  const getCustomIcon = (color: string) => {
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color: ${color || '#3b82f6'};
          width: 32px;
          height: 32px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="transform: rotate(45deg); color: white;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    })
  }

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <MapContainer 
        center={view} 
        zoom={12} 
        style={{ height: '100%', width: '100%', borderRadius: 12 }}
      >
        <ChangeView center={view} zoom={14} />
        <TileLayer
          url="https://{s}.tile.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        {projects.map((p) => (
          <Marker 
            key={p.id} 
            position={[p.latitude, p.longitude]} 
            icon={getCustomIcon(p.types_projets?.couleur)}
          >
            <Popup minWidth={250}>
              <div style={{ padding: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                  <span className="badge badge-primary" style={{ background: p.types_projets?.couleur + '20', color: p.types_projets?.couleur }}>
                    {p.types_projets?.nom}
                  </span>
                  <span className={`badge ${p.statut === 'terminé' ? 'badge-success' : 'badge-warning'}`}>
                    {p.statut === 'terminé' ? 'Terminé' : 'En cours'}
                  </span>
                </div>
                
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: '#1e293b' }}>{p.titre}</h4>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                  <MapPin size={14} />
                  <span>{p.communes?.nom}</span>
                </div>

                <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: 8, margin: '1rem 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                    <span>Avancement Physique</span>
                    <strong>{p.avancement_physique}%</strong>
                  </div>
                  <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${p.avancement_physique}%`, height: '100%', background: p.types_projets?.couleur || 'var(--primary)' }}></div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}>
                  <div>
                    <span style={{ color: 'var(--muted)', display: 'block', fontSize: '0.7rem' }}>Budget</span>
                    <strong>{(Number(p.budget_actuel) / 1000000).toFixed(1)}M FCFA</strong>
                  </div>
                  <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>
                    Détails
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Floating Control Panel */}
      <div style={{ 
        position: 'absolute', top: 20, right: 20, zIndex: 1000, 
        background: 'white', padding: '0.75rem', borderRadius: 12, 
        boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)',
        width: '200px'
      }} className="mobile-hidden">
        <h5 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={16} color="var(--primary)" />
          Légende
        </h5>
        {Array.from(new Set(projects.map(p => p.types_projets?.nom))).map(type => {
          const project = projects.find(p => p.types_projets?.nom === type)
          return (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: project?.types_projets?.couleur }}></div>
              <span>{type}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
