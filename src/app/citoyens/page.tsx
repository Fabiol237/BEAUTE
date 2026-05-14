'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import CitizenNavbar from '@/components/CitizenNavbar'
import { getProjectImage } from '@/lib/projectImages'

export default function CitoyensPage() {
  const [stats, setStats] = useState({ total: 0, en_cours: 0, termines: 0, budget_total: 0 })
  const [projetsRecents, setProjetsRecents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      try {
        const { data } = await supabase.from('projets').select('*')
        if (data) {
          const total = data.length
          const en_cours = data.filter(p => p.statut === 'en_cours').length
          const budget_total = data.reduce((acc, p) => acc + Number(p.budget_actuel || 0), 0)
          setStats({ total, en_cours, termines: total - en_cours, budget_total })
          setProjetsRecents(data.slice(0, 6))
        } else {
           setStats({ total: 12, en_cours: 8, termines: 4, budget_total: 850000000 })
           setProjetsRecents([
             { id: 1, titre: 'Pavage Rue de la Joie', avancement_physique: 45, statut: 'en_cours', communes: { nom: 'Douala 1er' } },
             { id: 2, titre: 'Forage Bépanda', avancement_physique: 100, statut: 'terminé', communes: { nom: 'Douala 5e' } }
           ])
        }
      } catch (e) { console.error(e) } finally { setLoading(false) }
    }
    loadData()
  }, [])

  return (
    <div className="citoyen-portal">
      <CitizenNavbar />
      
      <style jsx>{`
        .citoyen-portal { font-family: 'Outfit', sans-serif; background: #f8fafc; min-height: 100vh; }
        .hero { 
          background: linear-gradient(135deg, #007A3D 0%, #004d26 100%); 
          padding: 100px 20px; 
          text-align: center; 
          color: white;
          position: relative;
          overflow: hidden;
        }
        .hero::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: url('https://www.transparenttextures.com/patterns/cubes.png');
          opacity: 0.1;
        }
        .hero h1 { font-size: clamp(1.8rem, 5vw, 3.5rem); font-weight: 800; margin-bottom: 20px; position: relative; z-index: 1; }
        .hero p { font-size: clamp(1rem, 2.5vw, 1.3rem); opacity: 0.9; max-width: 700px; margin: 0 auto 40px; position: relative; z-index: 1; }
        .hero { padding: clamp(50px, 10vw, 100px) 20px; }
        
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        
        .stats-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)); 
          gap: 15px; 
          margin-top: -40px; 
          position: relative; 
          z-index: 10; 
          padding: 0 15px;
        }
        .stat-card { 
          background: white; 
          padding: 30px; 
          border-radius: 20px; 
          box-shadow: 0 10px 30px rgba(0,0,0,0.1); 
          text-align: center;
          border-bottom: 5px solid transparent;
          transition: transform 0.3s ease;
        }
        .stat-card:hover { transform: translateY(-5px); }
        .stat-card.vert { border-bottom-color: #007A3D; }
        .stat-card.jaune { border-bottom-color: #FCD116; }
        .stat-card.rouge { border-bottom-color: #CE1126; }
        
        .stat-val { font-size: 2rem; font-weight: 800; margin: 10px 0; color: #1e293b; }
        
        .section-title { margin: 80px 0 40px; font-size: 2rem; font-weight: 800; color: #1e293b; display: flex; align-items: center; gap: 15px; }
        .section-title::after { content: ''; flex: 1; height: 2px; background: #e2e8f0; }
        
        .project-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr)); gap: 20px; }
        .project-card { 
          background: white; 
          border-radius: 24px; 
          overflow: hidden; 
          box-shadow: 0 4px 15px rgba(0,0,0,0.05); 
          transition: all 0.3s ease;
          border: 1px solid #f1f5f9;
        }
        .project-card:hover { box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
        .project-img { 
          height: 200px; 
          background: linear-gradient(45deg, #007A3D, #FCD116); 
          display: flex; 
          align-items: center; 
          justify-content: center;
          color: white;
          font-size: 4rem;
        }
        .project-body { padding: 25px; }
        .project-tag { 
          background: #f1f5f9; 
          padding: 5px 12px; 
          border-radius: 10px; 
          font-size: 0.8rem; 
          font-weight: 700; 
          color: #64748b;
          text-transform: uppercase;
        }
        
        .progress-container { height: 10px; background: #f1f5f9; border-radius: 5px; margin: 20px 0; overflow: hidden; }
        .progress-fill { height: 100%; background: #007A3D; border-radius: 5px; }
        
        .btn-details { 
          display: block; 
          width: 100%; 
          padding: 15px; 
          background: #1e293b; 
          color: white; 
          text-align: center; 
          text-decoration: none; 
          border-radius: 15px; 
          font-weight: 700;
          transition: background 0.2s;
        }
        .btn-details:hover { background: #0f172a; }
      `}</style>

      <section className="hero">
        <div className="container">
          <h1>Portail National des Projets</h1>
          <p>La transparence au cœur de l'émergence. Suivez chaque franc investi dans le développement de votre localité.</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' }}>
            <Link href="/citoyens/carte" style={{ background: '#FCD116', color: '#000', padding: '18px 40px', borderRadius: '50px', textDecoration: 'none', fontWeight: 800, fontSize: '1.1rem', boxShadow: '0 10px 20px rgba(252, 209, 22, 0.3)' }}>📍 Carte des Projets</Link>
          </div>
        </div>
      </section>

      <div className="container">
        <div className="stats-grid">
          <div className="stat-card vert">
            <div style={{ fontSize: '2.5rem' }}>🏗️</div>
            <div className="stat-val">{stats.total}</div>
            <div style={{ fontWeight: 600, color: '#64748b' }}>Projets Total</div>
          </div>
          <div className="stat-card jaune">
            <div style={{ fontSize: '2.5rem' }}>🛠️</div>
            <div className="stat-val">{stats.en_cours}</div>
            <div style={{ fontWeight: 600, color: '#64748b' }}>En cours</div>
          </div>
          <div className="stat-card rouge">
            <div style={{ fontSize: '2.5rem' }}>💰</div>
            <div className="stat-val">{(stats.budget_total / 1000000).toFixed(1)}M</div>
            <div style={{ fontWeight: 600, color: '#64748b' }}>Budget (FCFA)</div>
          </div>
        </div>

        <h2 className="section-title">🌟 Dernières Réalisations</h2>
        
        <div className="project-grid">
          {projetsRecents.map((p) => (
            <div key={p.id} className="project-card">
              <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
                <img
                  src={getProjectImage(p.types_projets?.nom, p.titre)}
                  alt={p.titre}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  loading="lazy"
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)' }}></div>
                <span style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(255,255,255,0.95)', color: '#1e293b', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>
                  {p.types_projets?.nom || 'Infrastructure'}
                </span>
              </div>
              <div className="project-body">
                <span className="project-tag">{p.statut}</span>
                <h3 style={{ margin: '15px 0 10px', fontSize: '1.15rem', fontWeight: 700 }}>{p.titre}</h3>
                <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                   {p.communes?.nom || 'Douala'}
                </p>
                
                <div className="progress-container">
                  <div className="progress-fill" style={{ width: `${p.avancement_physique}%` }}></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '20px' }}>
                  <span>Progression</span>
                  <span>{p.avancement_physique}%</span>
                </div>
                
                <Link href={`/citoyens/projet/${p.id}`} className="btn-details">
                  Consulter le Dossier →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer style={{ background: '#1e293b', color: 'white', padding: '60px 20px', marginTop: '100px', textAlign: 'center' }}>
        <p>&copy; 2024 République du Cameroun - MuniTrack v1.0</p>
      </footer>
    </div>
  )
}
