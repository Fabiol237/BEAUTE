'use client'

import dynamic from 'next/dynamic'
import { MapPin, Info, Filter } from 'lucide-react'

// Map must be dynamic to avoid SSR issues with Leaflet
const Map = dynamic(() => import('@/components/Map'), { 
  ssr: false,
  loading: () => <div style={{ height: '600px', width: '100%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12 }}>Chargement de la carte...</div>
})

export default function CartePage() {
  return (
    <div>
      <header className="flex justify-between align-center mb-4">
        <div>
          <h1>Carte des Projets</h1>
          <p>Visualisation géographique de l'avancement des travaux sur le terrain.</p>
        </div>
        <button className="btn btn-outline">
          <Filter size={18} />
          Filtrer par commune
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '1.5rem' }}>
        <div className="card" style={{ height: '600px', padding: 0, overflow: 'hidden' }}>
          <Map />
        </div>

        <div className="card">
          <h3>Légende</h3>
          <div className="mt-4">
            <div className="flex align-center gap-2 mb-3">
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--primary)' }}></div>
              <span>En cours</span>
            </div>
            <div className="flex align-center gap-2 mb-3">
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--success)' }}></div>
              <span>Terminé</span>
            </div>
            <div className="flex align-center gap-2 mb-3">
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--warning)' }}></div>
              <span>Planifié</span>
            </div>
          </div>

          <hr style={{ margin: '1.5rem 0', border: 'none', borderTop: '1px solid var(--border)' }} />

          <div className="flex gap-2" style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
            <Info size={16} style={{ flexShrink: 0 }} />
            <p>Cliquez sur un marqueur pour afficher les détails du projet et son avancement.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
