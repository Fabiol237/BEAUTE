'use client'

import dynamic from 'next/dynamic'
import { MapPin, Info, Filter, Search, Navigation } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

// Map must be dynamic to avoid SSR issues with Leaflet
const Map = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => <div style={{ height: '600px', width: '100%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12 }}>Chargement de la carte...</div>
})

export default function CartePage() {
  const [projects, setProjects] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    async function fetchProjects() {
      const { data } = await supabase
        .from('projets')
        .select('*, communes(nom), types_projets(nom, couleur)')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
      
      if (data) setProjects(data)
    }
    fetchProjects()
  }, [])

  const filteredProjects = projects.filter(p => 
    p.titre.toLowerCase().includes(search.toLowerCase()) ||
    p.communes?.nom.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <header className="header-actions mb-4">
        <div>
          <h1>Carte Interactive</h1>
          <p>Localisation et suivi temps réel des chantiers municipaux.</p>
        </div>
        <div className="flex align-center gap-2 w-full-mobile">
          <div className="flex align-center gap-2" style={{ background: 'white', padding: '0.625rem 1rem', borderRadius: 8, border: '1px solid var(--border)', flex: 1 }}>
            <Search size={18} color="var(--muted)" />
            <input 
              type="text" 
              placeholder="Rechercher un projet ou une commune..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.875rem' }}
            />
          </div>
        </div>
      </header>

      <div className="dashboard-layout">
        <div className="card" style={{ height: '650px', padding: 0, overflow: 'hidden', position: 'relative' }}>
          <Map selectedProject={selectedProject} projects={filteredProjects} />
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '650px' }}>
          <h3 className="mb-4">Projets localisés ({filteredProjects.length})</h3>
          
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
            {filteredProjects.map((p) => (
              <div 
                key={p.id} 
                onClick={() => setSelectedProject(p)}
                style={{ 
                  padding: '1rem', 
                  borderRadius: 10, 
                  border: '1px solid var(--border)', 
                  marginBottom: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: selectedProject?.id === p.id ? 'var(--primary-light)' : 'white',
                  borderColor: selectedProject?.id === p.id ? 'var(--primary)' : 'var(--border)'
                }}
                className="hover-card"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: p.types_projets?.couleur }}>
                    {p.types_projets?.nom}
                  </span>
                  <span className={`badge ${p.statut === 'terminé' ? 'badge-success' : 'badge-warning'}`}>
                    {p.avancement_physique}%
                  </span>
                </div>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>{p.titre}</h4>
                <div className="flex align-center gap-1" style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                  <MapPin size={12} />
                  {p.communes?.nom}
                </div>
              </div>
            ))}
            {filteredProjects.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
                Aucun projet trouvé.
              </div>
            )}
          </div>

          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--primary-light)', borderRadius: 10, border: '1px solid var(--primary-hover)' }}>
            <div className="flex gap-2" style={{ color: 'var(--primary)', fontSize: '0.8rem' }}>
              <Navigation size={16} />
              <p>Cliquez sur un projet pour le centrer sur la carte.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
