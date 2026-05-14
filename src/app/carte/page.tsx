'use client'

import dynamic from 'next/dynamic'
import { MapPin, Info, Filter } from 'lucide-react'

// Map must be dynamic to avoid SSR issues with Leaflet
const Map = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => <div style={{ height: '400px', width: '100%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12 }}>Chargement...</div>
})

export default function CartePage() {
  return (
    <div>
      <header className="header-actions mb-4">
        <div>
          <h1>Carte des Projets</h1>
          <p>Visualisation géographique de l'avancement.</p>
        </div>
        <button className="btn btn-outline w-full-mobile">
          <Filter size={18} />
          Filtrer
        </button>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="card" style={{ height: '400px', padding: 0, overflow: 'hidden' }}>
          <Map />
        </div>

        <div className="card">
          <h3>Légende</h3>
          <div className="flex gap-4 mt-2">
            <div className="flex align-center gap-2">
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--primary)' }}></div>
              <span style={{ fontSize: '0.875rem' }}>En cours</span>
            </div>
            <div className="flex align-center gap-2">
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--success)' }}></div>
              <span style={{ fontSize: '0.875rem' }}>Terminé</span>
            </div>
          </div>

          <hr style={{ margin: '1rem 0', border: 'none', borderTop: '1px solid var(--border)' }} />

          <div className="flex gap-2" style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>
            <Info size={14} style={{ flexShrink: 0 }} />
            <p>Cliquez sur un marqueur pour afficher les détails du projet.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
