'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import CitizenNavbar from '@/components/CitizenNavbar'
import Link from 'next/link'
import { getProjectImage } from '@/lib/projectImages'

export default function ListeProjetsCitoyen() {
  const [projets, setProjets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtre, setFiltre] = useState('')
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase.from('projets').select('*, communes(nom), types_projets(nom, couleur)')
        if (data && data.length > 0) {
          setProjets(data)
        } else {
          setProjets([
            { id: 1, titre: 'Pavage Rue de la Joie', communes: { nom: 'Douala 1er' }, types_projets: { nom: 'Voirie', couleur: '#3b82f6' }, avancement_physique: 50, statut: 'en_cours' },
            { id: 2, titre: 'Construction École Publique', communes: { nom: 'Yaoundé 1er' }, types_projets: { nom: 'Éducation', couleur: '#10b981' }, avancement_physique: 100, statut: 'terminé' },
            { id: 3, titre: 'Forage Eau Potable Bépanda', communes: { nom: 'Douala 5e' }, types_projets: { nom: 'Eau et Énergie', couleur: '#0ea5e9' }, avancement_physique: 75, statut: 'en_cours' },
            { id: 4, titre: 'Centre de Santé Makepe', communes: { nom: 'Douala 3e' }, types_projets: { nom: 'Santé', couleur: '#ef4444' }, avancement_physique: 30, statut: 'en_cours' },
            { id: 5, titre: 'Marché Municipal Akwa', communes: { nom: 'Douala 1er' }, types_projets: { nom: 'Marché', couleur: '#f59e0b' }, avancement_physique: 85, statut: 'en_cours' },
            { id: 6, titre: 'Stade de Proximité Logbessou', communes: { nom: 'Douala 3e' }, types_projets: { nom: 'Sport', couleur: '#8b5cf6' }, avancement_physique: 60, statut: 'en_cours' },
          ])
        }
      } catch (e) { console.error(e) } finally { setLoading(false) }
    }
    load()
  }, [])

  const projetsFiltres = projets.filter(p =>
    p.titre?.toLowerCase().includes(filtre.toLowerCase()) ||
    p.communes?.nom?.toLowerCase().includes(filtre.toLowerCase()) ||
    p.types_projets?.nom?.toLowerCase().includes(filtre.toLowerCase())
  )

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', fontFamily: 'Outfit, sans-serif' }}>
      <CitizenNavbar />

      {/* Page Header */}
      <div style={{ background: 'linear-gradient(135deg, #1e293b, #334155)', color: 'white', padding: 'clamp(30px, 6vw, 60px) 20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, margin: '0 0 10px', color: 'white' }}>
            🏗️ Répertoire des Projets
          </h1>
          <p style={{ color: '#94a3b8', marginBottom: '25px', fontSize: 'clamp(0.9rem, 2vw, 1.1rem)' }}>
            {projets.length} projets financés dans les communes du Littoral
          </p>
          {/* Barre de recherche */}
          <div style={{ display: 'flex', background: 'white', borderRadius: '14px', overflow: 'hidden', maxWidth: '500px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
            <span style={{ padding: '14px 18px', fontSize: '1.1rem' }}>🔍</span>
            <input
              type="text"
              placeholder="Rechercher par nom, commune, type..."
              value={filtre}
              onChange={e => setFiltre(e.target.value)}
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: '0.95rem', color: '#1e293b', background: 'transparent', paddingRight: '15px' }}
            />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 15px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px', color: '#64748b' }}>⏳ Chargement des projets...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: '25px' }}>
            {projetsFiltres.map(p => {
              const imageUrl = getProjectImage(p.types_projets?.nom, p.titre)
              const couleur = p.types_projets?.couleur || '#3b82f6'
              return (
                <div key={p.id} style={{
                  background: 'white',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  border: '1px solid #e2e8f0',
                }}>
                  {/* Image */}
                  <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
                    <img
                      src={imageUrl}
                      alt={p.titre}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                      onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                      onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
                      loading="lazy"
                    />
                    {/* Badge type sur l'image */}
                    <div style={{
                      position: 'absolute', top: '15px', left: '15px',
                      background: couleur, color: 'white',
                      padding: '5px 12px', borderRadius: '20px',
                      fontSize: '0.78rem', fontWeight: 700, backdropFilter: 'blur(4px)',
                    }}>
                      {p.types_projets?.nom}
                    </div>
                    {/* Badge statut */}
                    <div style={{
                      position: 'absolute', top: '15px', right: '15px',
                      background: p.statut === 'terminé' ? 'rgba(16,185,129,0.9)' : 'rgba(245,158,11,0.9)',
                      color: 'white', padding: '5px 10px', borderRadius: '20px',
                      fontSize: '0.78rem', fontWeight: 700,
                    }}>
                      {p.statut === 'terminé' ? '✅ Terminé' : '🔧 En cours'}
                    </div>
                  </div>

                  <div style={{ padding: '22px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '8px', color: '#1e293b', lineHeight: 1.3 }}>
                      {p.titre}
                    </h3>
                    <p style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', marginBottom: '18px', fontSize: '0.9rem' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                      {p.communes?.nom}
                    </p>

                    {/* Barre de progression */}
                    <div style={{ marginBottom: '18px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                        <span style={{ color: '#64748b' }}>Avancement</span>
                        <span style={{ color: couleur }}>{p.avancement_physique}%</span>
                      </div>
                      <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{ width: `${p.avancement_physique}%`, height: '100%', background: `linear-gradient(90deg, ${couleur}, ${couleur}cc)`, borderRadius: '10px', transition: 'width 0.8s ease' }}></div>
                      </div>
                    </div>

                    <Link href={`/citoyens/projet/${p.id}`} style={{
                      display: 'block', textAlign: 'center',
                      background: '#1e293b', color: 'white',
                      padding: '13px', borderRadius: '12px',
                      textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem',
                    }}>
                      Consulter le dossier →
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!loading && projetsFiltres.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px', color: '#64748b' }}>
            <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🔍</div>
            <p>Aucun projet ne correspond à votre recherche.</p>
          </div>
        )}
      </div>

      <footer style={{ background: '#1e293b', color: 'white', padding: '40px 20px', textAlign: 'center', marginTop: '60px', fontSize: '0.85rem', opacity: 0.8 }}>
        © 2024 République du Cameroun — MuniTrack v1.0
      </footer>
    </div>
  )
}
