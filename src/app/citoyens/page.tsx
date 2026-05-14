'use client'

import dynamic from 'next/dynamic'
import { MapPin, Info, Search, Activity, FolderKanban } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

const Map = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => <div style={{ height: '500px', width: '100%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12 }}>Chargement de la carte...</div>
})

export default function CitoyensPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const supabase = createClient()

  useEffect(() => {
    async function fetchProjects() {
      const { data } = await supabase
        .from('projets')
        .select('*, communes(nom), types_projets(nom, couleur)')
        .eq('visible_public', true)
      
      if (data) setProjects(data)
    }
    fetchProjects()
  }, [])

  const filteredProjects = projects.filter(p => 
    p.titre.toLowerCase().includes(search.toLowerCase()) ||
    p.communes?.nom.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      {/* Public Header */}
      <nav style={{ background: 'white', padding: '1rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="flex items-center gap-2">
          <div style={{ background: 'var(--primary)', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <FolderKanban size={20} />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.25rem' }}>MuniTrack Publique</span>
        </div>
        <div className="mobile-hidden" style={{ fontSize: '0.875rem', color: 'var(--muted)', fontWeight: 500 }}>
          Portail de Transparence Municipale
        </div>
      </nav>

      <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <header className="mb-8 text-center">
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Suivez les Projets de votre Commune</h1>
          <p style={{ maxWidth: '700px', margin: '0 auto', fontSize: '1.1rem' }}>
            Consultez en temps réel l'avancement des chantiers financés par vos impôts. La transparence pour une meilleure gestion.
          </p>
        </header>

        <div className="card mb-8" style={{ padding: '1.5rem' }}>
          <div className="flex align-center gap-2" style={{ background: '#f1f5f9', padding: '0.75rem 1.25rem', borderRadius: 12 }}>
            <Search size={20} color="var(--muted)" />
            <input 
              type="text" 
              placeholder="Rechercher un chantier près de chez vous..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', background: 'none', outline: 'none', width: '100%', fontSize: '1rem' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
          <div className="card" style={{ height: '500px', padding: 0, overflow: 'hidden' }}>
            <Map projects={filteredProjects} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {filteredProjects.map((p) => (
              <div key={p.id} className="card hover-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <span className="badge badge-primary" style={{ background: p.types_projets?.couleur + '20', color: p.types_projets?.couleur }}>
                    {p.types_projets?.nom}
                  </span>
                  <span className={`badge ${p.statut === 'terminé' ? 'badge-success' : 'badge-warning'}`}>
                    {p.avancement_physique}%
                  </span>
                </div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{p.titre}</h3>
                <div className="flex align-center gap-2 mb-4" style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
                  <MapPin size={16} />
                  {p.communes?.nom}
                </div>
                
                <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden', marginBottom: '1.5rem' }}>
                  <div style={{ width: `${p.avancement_physique}%`, height: '100%', background: 'var(--primary)', borderRadius: 4 }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Dernière mise à jour : 12/05/2024</span>
                  <button className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>Détails</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer style={{ marginTop: '4rem', padding: '2rem', textAlign: 'center', borderTop: '1px solid var(--border)', color: 'var(--muted)', fontSize: '0.875rem' }}>
        &copy; 2024 Ville de Douala - Portail de Transparence
      </footer>
    </div>
  )
}
