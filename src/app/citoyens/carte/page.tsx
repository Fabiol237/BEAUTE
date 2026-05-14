'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import CitizenNavbar from '@/components/CitizenNavbar'
import dynamic from 'next/dynamic'
import Link from 'next/link'

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div style={{ height: '100%', minHeight: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f0f4f8', gap: 12 }}>
      <div style={{ width: 40, height: 40, border: '4px solid #e2e8f0', borderTopColor: '#007A3D', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: '#64748b', margin: 0 }}>Chargement de la carte...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
})

const FALLBACK = [
  { id: 1, titre: 'Hôpital District de Douala', latitude: 4.0511, longitude: 9.7679, statut: 'en_cours', communes: { nom: 'Douala 1er' }, types_projets: { nom: 'Santé', couleur: '#ef4444' } },
  { id: 2, titre: 'Route Bonamoussadi', latitude: 4.0780, longitude: 9.7420, statut: 'terminé', communes: { nom: 'Douala 5e' }, types_projets: { nom: 'Voirie', couleur: '#3b82f6' } },
  { id: 3, titre: 'École Publique Bépanda', latitude: 4.0650, longitude: 9.7520, statut: 'en_cours', communes: { nom: 'Douala 5e' }, types_projets: { nom: 'Éducation', couleur: '#10b981' } },
  { id: 4, titre: 'Forage Eau Potable Akwa', latitude: 4.0400, longitude: 9.7050, statut: 'en_cours', communes: { nom: 'Douala 1er' }, types_projets: { nom: 'Eau', couleur: '#0ea5e9' } },
]

export default function CarteCitoyennePage() {
  const [projets, setProjets] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [filtre, setFiltre] = useState<string>('tous')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('projets').select('*, communes(nom), types_projets(nom, couleur)')
      setProjets(data?.filter(p => p.latitude && p.longitude).length ? data.filter(p => p.latitude && p.longitude) : FALLBACK)
    }
    load()
  }, [])

  const filtres = ['tous', 'en_cours', 'terminé']
  const projetsFiltres = projets.filter(p => filtre === 'tous' || p.statut === filtre)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#f0f4f8', fontFamily: 'Outfit, sans-serif', overflow: 'hidden' }}>
      <CitizenNavbar />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {/* ── SIDEBAR ── */}
        <aside style={{
          width: 'clamp(260px, 30vw, 340px)',
          background: 'white',
          borderRight: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          flexShrink: 0,
          // Mobile: drawer par-dessus la carte
          position: 'absolute' as any,
          top: 0, left: 0, bottom: 0,
          zIndex: 50,
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease',
          boxShadow: sidebarOpen ? '4px 0 20px rgba(0,0,0,0.15)' : 'none',
        }}
          className="carte-sidebar"
        >
          {/* Header sidebar */}
          <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#1e293b' }}>
                📍 {projetsFiltres.length} Projets
              </h2>
              <button onClick={() => setSidebarOpen(false)} className="carte-close-btn" style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: '1rem' }}>✕</button>
            </div>
            {/* Filtres */}
            <div style={{ display: 'flex', gap: 6 }}>
              {filtres.map(f => (
                <button key={f} onClick={() => setFiltre(f)} style={{
                  flex: 1, padding: '6px 4px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: filtre === f ? '#007A3D' : '#f1f5f9',
                  color: filtre === f ? 'white' : '#64748b',
                  fontSize: '0.75rem', fontWeight: 700,
                }}>
                  {f === 'tous' ? 'Tous' : f === 'en_cours' ? '🔧 En cours' : '✅ Terminé'}
                </button>
              ))}
            </div>
          </div>

          {/* Liste projets */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
            {projetsFiltres.map(p => (
              <button key={p.id} onClick={() => { setSelected(p); setSidebarOpen(false) }} style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '12px 14px', borderRadius: 14, marginBottom: 8, border: 'none', cursor: 'pointer',
                background: selected?.id === p.id ? '#f0fdf4' : 'transparent',
                borderLeft: `4px solid ${selected?.id === p.id ? '#007A3D' : 'transparent'}`,
                transition: 'all 0.15s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem', lineHeight: 1.3 }}>{p.titre}</div>
                  <span style={{ flexShrink: 0, width: 10, height: 10, borderRadius: '50%', background: p.statut === 'terminé' ? '#10b981' : '#f59e0b', marginTop: 4, display: 'block' }} />
                </div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 4 }}>📍 {p.communes?.nom}</div>
                <div style={{ marginTop: 6, height: 4, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ width: `${p.avancement_physique || 50}%`, height: '100%', background: p.types_projets?.couleur || '#007A3D', borderRadius: 99 }} />
                </div>
              </button>
            ))}
          </div>

          {/* Footer sidebar */}
          {selected && (
            <div style={{ padding: '14px 16px', borderTop: '1px solid #f1f5f9', background: '#f8fafc' }}>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1e293b', marginBottom: 8 }}>{selected.titre}</div>
              <Link href={`/citoyens/projet/${selected.id}`} style={{
                display: 'block', textAlign: 'center',
                background: '#007A3D', color: 'white', padding: '10px', borderRadius: 10,
                textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem',
              }}>
                Voir le dossier →
              </Link>
            </div>
          )}
        </aside>

        {/* Overlay mobile pour fermer sidebar */}
        {sidebarOpen && (
          <div onClick={() => setSidebarOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 49 }} className="carte-overlay" />
        )}

        {/* ── CARTE ── */}
        <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
          <Map projects={projetsFiltres} />

          {/* Bouton flottant mobile — ouvrir la liste */}
          <button onClick={() => setSidebarOpen(true)} className="carte-fab" style={{
            position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            background: '#007A3D', color: 'white', border: 'none', borderRadius: 30,
            padding: '12px 24px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(0,122,61,0.4)', display: 'none',
            alignItems: 'center', gap: 8, zIndex: 40,
          }}>
            📋 {projetsFiltres.length} projets
          </button>

          {/* Popup projet sélectionné sur desktop */}
          {selected && (
            <div className="carte-popup" style={{
              position: 'absolute', bottom: 24, right: 24,
              background: 'white', borderRadius: 18, padding: '18px 20px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.15)', maxWidth: 280, zIndex: 40,
            }}>
              <button onClick={() => setSelected(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#94a3b8' }}>✕</button>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1e293b', marginBottom: 6 }}>{selected.titre}</div>
              <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: 12 }}>📍 {selected.communes?.nom}</div>
              <Link href={`/citoyens/projet/${selected.id}`} style={{ display: 'block', textAlign: 'center', background: '#007A3D', color: 'white', padding: '10px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem' }}>
                Voir le dossier →
              </Link>
            </div>
          )}
        </div>
      </div>

      <style>{`
        /* Desktop : sidebar toujours visible */
        @media (min-width: 768px) {
          .carte-sidebar {
            position: relative !important;
            transform: none !important;
            box-shadow: none !important;
            transition: none !important;
          }
          .carte-close-btn { display: none !important; }
          .carte-overlay { display: none !important; }
          .carte-fab { display: none !important; }
        }
        /* Mobile : sidebar en drawer, FAB visible */
        @media (max-width: 767px) {
          .carte-fab { display: flex !important; }
          .carte-popup { display: none !important; }
        }
      `}</style>
    </div>
  )
}
