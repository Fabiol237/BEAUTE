'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import CitizenNavbar from '@/components/CitizenNavbar'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { getProjectImage } from '@/lib/projectImages'

export default function ProjetDetailCitoyenPage() {
  const params = useParams()
  const id = params?.id
  const [projet, setProjet] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadProjet() {
      try {
        const { data } = await supabase
          .from('projets')
          .select('*, communes(nom), types_projets(nom, couleur)')
          .eq('id', id)
          .single()
        setProjet(data || getFallback())
      } catch {
        setProjet(getFallback())
      } finally {
        setLoading(false)
      }
    }
    function getFallback() {
      return {
        id,
        titre: 'Réhabilitation École Publique de Bépanda',
        description: 'Ce projet comprend la rénovation complète des salles de classe, la construction de nouveaux sanitaires, l\'électrification du bâtiment principal et l\'aménagement d\'une cour de récréation sécurisée pour les élèves.',
        budget_actuel: 45000000,
        budget_deja_utilise: 28000000,
        avancement_physique: 62,
        statut: 'en_cours',
        priorite: 'haute',
        entreprise_executante: 'SCTPB Construction Cameroun',
        date_debut: '2024-01-15',
        date_fin_prevue: '2024-08-30',
        communes: { nom: 'Douala 5e' },
        types_projets: { nom: 'Éducation', couleur: '#10b981' },
      }
    }
    if (id) loadProjet()
  }, [id])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Outfit, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, border: '4px solid #e2e8f0', borderTopColor: '#007A3D', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }}></div>
        <p style={{ color: '#64748b' }}>Chargement du dossier...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )

  if (!projet) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem' }}>❌</div>
        <p>Projet introuvable.</p>
        <Link href="/citoyens/projets" style={{ color: '#007A3D' }}>← Retour</Link>
      </div>
    </div>
  )

  const couleur = projet.types_projets?.couleur || '#007A3D'
  const imageUrl = getProjectImage(projet.types_projets?.nom, projet.titre)
  const budgetPct = projet.budget_actuel > 0 ? Math.round((projet.budget_deja_utilise / projet.budget_actuel) * 100) : 0

  const fmt = (n: number) => Number(n).toLocaleString('fr-FR') + ' FCFA'
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh', fontFamily: 'Outfit, sans-serif' }}>
      <CitizenNavbar />

      {/* ── HERO IMAGE ── */}
      <div style={{ position: 'relative', height: 'clamp(200px, 35vw, 380px)', overflow: 'hidden' }}>
        <img src={imageUrl} alt={projet.titre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)' }} />

        {/* Breadcrumb */}
        <div style={{ position: 'absolute', top: 16, left: 16, right: 16, display: 'flex', gap: 6, flexWrap: 'wrap', fontSize: '0.8rem' }}>
          <Link href="/citoyens" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>Accueil</Link>
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>/</span>
          <Link href="/citoyens/projets" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>Projets</Link>
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>/</span>
          <span style={{ color: 'white', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60vw' }}>{projet.titre}</span>
        </div>

        {/* Title block overlay */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 'clamp(16px, 4vw, 32px)' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            <span style={{ background: couleur, color: 'white', padding: '4px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700 }}>
              {projet.types_projets?.nom}
            </span>
            <span style={{ background: projet.statut === 'terminé' ? '#10b981' : '#f59e0b', color: 'white', padding: '4px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700 }}>
              {projet.statut === 'terminé' ? '✅ Terminé' : '🔧 En cours'}
            </span>
            {projet.priorite === 'haute' && (
              <span style={{ background: '#ef4444', color: 'white', padding: '4px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700 }}>
                🔴 Priorité haute
              </span>
            )}
          </div>
          <h1 style={{ color: 'white', fontSize: 'clamp(1.2rem, 4vw, 2rem)', fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
            {projet.titre}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', margin: '8px 0 0', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {projet.communes?.nom}
          </p>
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(16px, 4vw, 32px) clamp(12px, 4vw, 20px)' }}>

        {/* Avancement global — barre proéminente */}
        <div style={{ background: 'white', borderRadius: 20, padding: 'clamp(20px, 4vw, 32px)', marginBottom: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            <span style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>Avancement physique</span>
            <span style={{ fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', fontWeight: 900, color: couleur, lineHeight: 1 }}>
              {projet.avancement_physique}%
            </span>
          </div>
          <div style={{ height: 18, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ width: `${projet.avancement_physique}%`, height: '100%', background: `linear-gradient(90deg, ${couleur}, ${couleur}99)`, borderRadius: 99, transition: 'width 1s ease' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>
            <span>0%</span><span>50%</span><span>100%</span>
          </div>
        </div>

        {/* Grid principale — 1 col mobile, 2 col desktop */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 20 }}>

          {/* ── COLONNE GAUCHE ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Description */}
            <div style={{ background: 'white', borderRadius: 20, padding: 'clamp(20px, 4vw, 30px)', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 14, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ background: couleur + '22', color: couleur, borderRadius: 10, padding: '4px 10px', fontSize: '0.85rem' }}>📋</span>
                Description
              </h2>
              <p style={{ lineHeight: 1.8, color: '#475569', fontSize: '0.95rem' }}>{projet.description}</p>
            </div>

            {/* Planning */}
            <div style={{ background: 'white', borderRadius: 20, padding: 'clamp(20px, 4vw, 30px)', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 16, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ background: '#eff6ff', color: '#3b82f6', borderRadius: 10, padding: '4px 10px', fontSize: '0.85rem' }}>📅</span>
                Planning
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Début des travaux', value: fmtDate(projet.date_debut), icon: '🚀' },
                  { label: 'Fin prévue', value: fmtDate(projet.date_fin_prevue), icon: '🏁' },
                  { label: 'Entreprise', value: projet.entreprise_executante || 'Non renseigné', icon: '🏢' },
                  { label: 'Priorité', value: projet.priorite || 'Normale', icon: '⚡' },
                ].map((item, i) => (
                  <div key={i} style={{ background: '#f8fafc', borderRadius: 14, padding: '14px 16px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{item.icon} {item.label}</div>
                    <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem', wordBreak: 'break-word' }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── COLONNE DROITE ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Budget */}
            <div style={{ background: 'white', borderRadius: 20, padding: 'clamp(20px, 4vw, 30px)', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 16, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ background: '#ecfdf5', color: '#10b981', borderRadius: 10, padding: '4px 10px', fontSize: '0.85rem' }}>💰</span>
                Suivi Budgétaire
              </h2>

              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.85rem', fontWeight: 700 }}>
                  <span style={{ color: '#64748b' }}>Dépenses / Budget</span>
                  <span style={{ color: budgetPct > 80 ? '#ef4444' : '#10b981' }}>{budgetPct}%</span>
                </div>
                <div style={{ height: 10, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(budgetPct, 100)}%`, height: '100%', background: budgetPct > 80 ? '#ef4444' : '#10b981', borderRadius: 99 }} />
                </div>
              </div>

              {[
                { label: 'Budget alloué', value: fmt(projet.budget_actuel), bg: '#f0fdf4', color: '#16a34a' },
                { label: 'Montant utilisé', value: fmt(projet.budget_deja_utilise || 0), bg: '#fff7ed', color: '#ea580c' },
                { label: 'Solde restant', value: fmt(projet.budget_actuel - (projet.budget_deja_utilise || 0)), bg: '#eff6ff', color: '#2563eb' },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: row.bg, borderRadius: 12, marginBottom: 8 }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>{row.label}</span>
                  <span style={{ fontWeight: 800, color: row.color, fontSize: '0.9rem' }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* CTA Suggestion */}
            <div style={{ background: `linear-gradient(135deg, #007A3D, #004d26)`, borderRadius: 20, padding: 'clamp(20px, 4vw, 30px)', color: 'white', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>💡</div>
              <h3 style={{ fontWeight: 800, marginBottom: 10, fontSize: '1.1rem', color: 'white' }}>Votre avis compte</h3>
              <p style={{ opacity: 0.85, marginBottom: 20, fontSize: '0.9rem', lineHeight: 1.6 }}>
                Signalez un problème ou faites une proposition d'amélioration directement à la mairie.
              </p>
              <Link
                href={`/citoyens/suggestion?projet=${projet.id}`}
                style={{ display: 'block', background: '#FCD116', color: '#000', padding: '14px 20px', borderRadius: 14, textDecoration: 'none', fontWeight: 800, fontSize: '1rem' }}
              >
                Envoyer une suggestion →
              </Link>
            </div>
          </div>
        </div>
      </div>

      <footer style={{ background: '#1e293b', color: 'rgba(255,255,255,0.6)', padding: '30px 20px', textAlign: 'center', marginTop: 60, fontSize: '0.85rem' }}>
        © 2024 République du Cameroun — MuniTrack v1.0
      </footer>
    </div>
  )
}
