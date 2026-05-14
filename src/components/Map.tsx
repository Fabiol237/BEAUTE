'use client'

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { MapPin, Navigation, Activity, AlertTriangle } from 'lucide-react'

// Helper to zoom the map
function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap()
  useEffect(() => {
    if (center[0] && center[1]) {
      map.setView(center, zoom)
      // Force invalidateSize to fix blank maps
      setTimeout(() => {
        map.invalidateSize()
      }, 500)
    }
  }, [center, zoom, map])
  return null
}

export default function Map({ selectedProject, projects: initialProjects }: { selectedProject?: any, projects?: any[] }) {
  const [projects, setProjects] = useState<any[]>(initialProjects || [])
  const [view, setView] = useState<[number, number]>([4.0511, 9.7679])
  const supabase = createClient()

  useEffect(() => {
    if (!initialProjects) {
      async function fetchProjects() {
        try {
          const { data, error } = await supabase
            .from('projets')
            .select('*, communes(nom), types_projets(nom, couleur)')
            .not('latitude', 'is', null)
            .not('longitude', 'is', null)
          
          if (error) throw error
          if (data) setProjects(data)
        } catch (err) {
          console.error("Erreur chargement projets carte:", err)
        }
      }
      fetchProjects()
    } else {
      setProjects(initialProjects)
    }
  }, [initialProjects])

  useEffect(() => {
    if (selectedProject?.latitude && selectedProject?.longitude) {
      setView([Number(selectedProject.latitude), Number(selectedProject.longitude)])
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    })
  }

  // Si pas de projets, on centre sur Douala par défaut
  const centerPos: [number, number] = view[0] ? view : [4.0511, 9.7679]

  return (
    <div style={{ height: '650px', width: '100%', position: 'relative', background: '#f1f5f9', border: '2px solid #ddd' }}>
      {/* Barre de Diagnostic */}
      <div style={{ position: 'absolute', top: 10, left: 50, zIndex: 1002, background: 'white', padding: '5px 10px', borderRadius: 5, fontSize: '10px', border: '1px solid #ccc' }}>
        Status DB: {projects.length > 0 ? '✅ Données reçues' : '❌ Pas de données'} | 
        Projets localisés: {projects.filter(p => p.latitude && p.longitude).length}
      </div>

      {projects.length === 0 && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.8)' }}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <MapPin size={48} color="var(--muted)" style={{ marginBottom: '1rem' }} />
            <p style={{ fontWeight: 600 }}>Aucun projet géolocalisé</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Vérifiez les latitudes/longitudes en base.</p>
          </div>
        </div>
      )}

      <MapContainer 
        center={centerPos} 
        zoom={12} 
        style={{ height: '650px', width: '100%' }}
        scrollWheelZoom={true}
      >
        <ChangeView center={centerPos} zoom={selectedProject ? 15 : 12} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {projects
          .filter(p => p.latitude && p.longitude)
          .map((p) => (
            <Marker 
              key={p.id} 
              position={[Number(p.latitude), Number(p.longitude)]} 
              icon={getCustomIcon(p.types_projets?.couleur)}
            >
              <Popup minWidth={250}>
                <div style={{ padding: '0.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.5rem' }}>
                    <span className="badge badge-primary" style={{ background: p.types_projets?.couleur + '20', color: p.types_projets?.couleur }}>
                      {p.types_projets?.nom}
                    </span>
                    <span className={`badge ${p.statut === 'terminé' ? 'badge-success' : 'badge-warning'}`}>
                      {p.statut}
                    </span>
                  </div>
                  <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>{p.titre}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{p.communes?.nom}</p>
                  <div style={{ marginTop: '0.5rem', height: 4, background: '#eee', borderRadius: 2 }}>
                    <div style={{ width: `${p.avancement_physique}%`, height: '100%', background: 'var(--primary)', borderRadius: 2 }}></div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))
        }
      </MapContainer>
    </div>
  )
}
