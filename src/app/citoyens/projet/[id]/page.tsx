'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import CitizenNavbar from '@/components/CitizenNavbar'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { MapPin, Tag, FileText, BarChart3, Info, MessageSquare, ArrowLeft, Camera, User } from 'lucide-react'

export default function ProjetDetailCitoyenPage() {
  const { id } = useParams()
  const [projet, setProjet] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadProjet() {
      const { data, error } = await supabase
        .from('projets')
        .select('*, communes(nom), types_projets(nom)')
        .eq('id', id)
        .eq('visible_public', true)
        .single()
      
      if (data) setProjet(data)
      setLoading(false)
    }
    if (id) loadProjet()
  }, [id])

  if (loading) return <div className="loading">Chargement...</div>
  if (!projet) return <div className="error">Projet non trouvé.</div>

  const formatDate = (date: string) => {
    if (!date) return 'Non définie'
    return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  return (
    <div className="citoyen-portal">
      <CitizenNavbar />
      
      <style jsx>{`
        .citoyen-portal {
          --cameroun-vert: #007A3D;
          --cameroun-jaune: #FCD116;
          --cameroun-rouge: #CE1126;
          --bg-light: #F8F9FA;
          --text-dark: #2C3E50;
          font-family: 'Poppins', sans-serif;
          background-color: var(--bg-light);
          min-height: 100vh;
        }
        .container { max-width: 1200px; margin: 40px auto; padding: 0 20px; }
        .project-header { background: white; border-radius: 20px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); margin-bottom: 30px; border-left: 6px solid var(--cameroun-vert); }
        .project-title { font-size: 2.5rem; font-weight: 700; color: var(--text-dark); margin-bottom: 20px; }
        .card-custom { background: white; border-radius: 15px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.06); margin-bottom: 30px; }
        .card-title { font-size: 1.5rem; font-weight: 600; color: var(--text-dark); margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
        .progress-large { height: 30px; border-radius: 15px; background-color: #E9ECEF; margin: 20px 0; overflow: hidden; }
        .progress-bar-large { height: 100%; background: linear-gradient(90deg, var(--cameroun-vert), var(--cameroun-jaune)); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; }
        .stat-item { text-align: center; padding: 20px; background: var(--bg-light); border-radius: 12px; border-left: 4px solid var(--cameroun-vert); }
        .stat-value { font-size: 1.8rem; font-weight: 700; color: var(--cameroun-vert); }
        .btn-suggestion { background: linear-gradient(135deg, var(--cameroun-vert), var(--cameroun-jaune)); color: white; border: none; padding: 15px 40px; border-radius: 12px; font-weight: 600; text-decoration: none; display: inline-block; transition: transform 0.3s ease; }
        .meta-item { display: flex; align-items: center; gap: 10px; padding: 12px 0; border-bottom: 1px solid #eee; }
        .meta-item:last-child { border-bottom: none; }
        .loading, .error { text-align: center; padding: 100px; font-size: 1.2rem; }
      `}</style>

      <div className="container">
        {/* Breadcrumb */}
        <nav style={{ marginBottom: '20px', fontSize: '0.9rem' }}>
          <Link href="/citoyens" style={{ color: 'var(--cameroun-vert)' }}>Accueil</Link> / 
          <Link href="/citoyens/projets" style={{ color: 'var(--cameroun-vert)', marginLeft: '8px' }}>Projets</Link> / 
          <span style={{ marginLeft: '8px', color: '#6c757d' }}>{projet.titre}</span>
        </nav>
        
        {/* En-tête */}
        <div className="project-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ flex: 1, minWidth: '300px' }}>
              <h1 className="project-title">{projet.titre}</h1>
              <div className="meta-item"><MapPin size={20} color="var(--cameroun-vert)" /> <strong>Commune :</strong> {projet.communes?.nom}</div>
              <div className="meta-item"><Tag size={20} color="var(--cameroun-vert)" /> <strong>Type :</strong> {projet.types_projets?.nom}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ 
                padding: '12px 30px', 
                borderRadius: '50px', 
                color: 'white', 
                fontWeight: 600,
                background: projet.statut === 'terminé' ? 'var(--cameroun-jaune)' : 'var(--cameroun-vert)'
              }}>
                {projet.statut === 'terminé' ? 'Terminé' : 'En cours'}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '30px', gridAutoFlow: 'dense' }}>
          {/* Mobile priority hack */}
          <div className="main-col" style={{ gridColumn: 'span 1' }}>
            {/* Description */}
            <div className="card-custom">
              <h2 className="card-title"><FileText size={24} color="var(--cameroun-vert)" /> Description du projet</h2>
              <p style={{ lineHeight: 1.8, textAlign: 'justify', color: '#444' }}>{projet.description || 'Aucune description disponible.'}</p>
            </div>

            {/* Avancement */}
            <div className="card-custom">
              <h2 className="card-title"><BarChart3 size={24} color="var(--cameroun-vert)" /> Avancement du projet</h2>
              <div className="progress-large">
                <div className="progress-bar-large" style={{ width: `${projet.avancement_physique}%` }}>
                  {projet.avancement_physique}%
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginTop: '20px' }}>
                <div className="stat-item">
                  <div className="stat-value">{projet.avancement_physique}%</div>
                  <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>Avancement physique</div>
                </div>
                <div className="stat-item">
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--cameroun-vert)' }}>{formatDate(projet.date_debut)}</div>
                  <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>Date de début</div>
                </div>
                <div className="stat-item">
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--cameroun-vert)' }}>{formatDate(projet.date_fin_prevue)}</div>
                  <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>Date de fin prévue</div>
                </div>
              </div>
            </div>
          </div>

          <div className="sidebar-col" style={{ gridColumn: 'span 1' }}>
            {/* Infos clés */}
            <div className="card-custom">
              <h3 className="card-title"><Info size={22} color="var(--cameroun-vert)" /> Informations clés</h3>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ fontSize: '0.85rem', color: '#6c757d', fontWeight: 600 }}>Budget Alloué</label>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--cameroun-vert)' }}>{Number(projet.budget_actuel).toLocaleString()} FCFA</div>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ fontSize: '0.85rem', color: '#6c757d', fontWeight: 600 }}>Statut</label>
                <div style={{ fontWeight: 600 }}>{projet.statut === 'terminé' ? 'Terminé' : 'En cours'}</div>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ fontSize: '0.85rem', color: '#6c757d', fontWeight: 600 }}>Dernière mise à jour</label>
                <div>{formatDate(projet.updated_at || projet.created_at)}</div>
              </div>
            </div>

            {/* CTA */}
            <div className="card-custom text-center" style={{ background: 'rgba(0, 122, 61, 0.05)', textAlign: 'center' }}>
              <MessageSquare size={48} color="var(--cameroun-vert)" style={{ margin: '0 auto 15px' }} />
              <h4>Une suggestion ?</h4>
              <p style={{ fontSize: '0.9rem', color: '#6c757d', marginBottom: '20px' }}>Partagez votre avis sur ce projet</p>
              <Link href={`/citoyens/suggestion?projet=${projet.id}`} className="btn-suggestion">
                Faire une suggestion
              </Link>
            </div>
          </div>
        </div>
      </div>

      <footer style={{ background: '#2c3e50', color: 'white', padding: '40px 20px', textAlign: 'center', marginTop: '60px' }}>
        <p>&copy; 2024 Communes Urbaines du Littoral - Cameroun</p>
      </footer>

      <style jsx global>{`
        @media (max-width: 992px) {
          .container > div { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
