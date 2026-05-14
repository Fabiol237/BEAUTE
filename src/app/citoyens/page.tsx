'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { Search, MapPin, Tag, ArrowRight, Folder, Hammer, CheckCircle, Banknote, ChatBubble } from 'lucide-react'

export default function CitoyensPage() {
  const [stats, setStats] = useState({ total: 0, en_cours: 0, termines: 0, budget_total: 0 })
  const [projetsRecents, setProjetsRecents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      // Stats
      const { count: total } = await supabase.from('projets').select('*', { count: 'exact', head: true }).eq('visible_public', true)
      const { count: en_cours } = await supabase.from('projets').select('*', { count: 'exact', head: true }).eq('visible_public', true).eq('statut', 'en_cours')
      const { count: termines } = await supabase.from('projets').select('*', { count: 'exact', head: true }).eq('visible_public', true).eq('statut', 'terminé')
      
      const { data: budgetData } = await supabase.from('projets').select('budget_actuel').eq('visible_public', true)
      const budget_total = budgetData?.reduce((acc, p) => acc + Number(p.budget_actuel), 0) || 0

      setStats({ total: total || 0, en_cours: en_cours || 0, termines: termines || 0, budget_total })

      // Projets récents
      const { data: projects } = await supabase
        .from('projets')
        .select('*, types_projets(nom), communes(nom)')
        .eq('visible_public', true)
        .order('created_at', { ascending: false })
        .limit(6)
      
      if (projects) setProjetsRecents(projects)
      setLoading(false)
    }
    loadData()
  }, [])

  return (
    <div className="citoyen-portal">
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
        
        .hero-section {
          background-image: url('/assets/images/hero-bg.jpg');
          background-size: cover;
          background-position: center;
          padding: 100px 0 80px;
          position: relative;
          color: white;
          text-align: center;
        }
        
        .hero-section::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(135deg, rgba(0, 122, 61, 0.8) 0%, rgba(206, 17, 38, 0.75) 50%, rgba(252, 209, 22, 0.7) 100%);
          z-index: 1;
        }
        
        .hero-content { position: relative; z-index: 2; max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        
        .hero-title { font-size: 3rem; font-weight: 700; margin-bottom: 1rem; display: flex; align-items: center; justify-content: center; gap: 15px; }
        .hero-title img { height: 60px; background: white; padding: 8px; border-radius: 12px; }
        
        .search-box {
          background: white;
          border-radius: 50px;
          padding: 8px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          max-width: 600px;
          margin: 30px auto 0;
          display: flex;
        }
        
        .search-box input { border: none; padding: 12px 20px; flex: 1; border-radius: 50px; outline: none; color: #333; }
        .search-box button { background: var(--cameroun-vert); color: white; border-radius: 50px; padding: 12px 30px; border: none; font-weight: 600; display: flex; items-center; gap: 8px; }

        .stats-section { margin-top: -40px; position: relative; z-index: 10; max-width: 1200px; margin-left: auto; margin-right: auto; padding: 0 20px; }
        .stat-card { background: white; border-radius: 15px; padding: 25px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border-left: 4px solid var(--cameroun-vert); transition: transform 0.3s; }
        .stat-card:hover { transform: translateY(-5px); }
        .stat-card.jaune { border-left-color: var(--cameroun-jaune); }
        .stat-card.rouge { border-left-color: var(--cameroun-rouge); }
        
        .stat-icon { width: 50px; height: 50px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin-bottom: 10px; }
        .vert .stat-icon { background: rgba(0, 122, 61, 0.1); color: var(--cameroun-vert); }
        .jaune .stat-icon { background: rgba(252, 209, 22, 0.15); color: #D4A017; }
        .rouge .stat-icon { background: rgba(206, 17, 38, 0.1); color: var(--cameroun-rouge); }
        
        .stat-value { font-size: 1.8rem; font-weight: 700; }
        .stat-label { color: #6c757d; font-size: 0.9rem; }

        .project-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 30px; margin-top: 40px; }
        .project-card { background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.06); transition: all 0.3s; }
        .project-card:hover { transform: translateY(-5px); box-shadow: 0 8px 25px rgba(0,0,0,0.12); }
        
        .project-image { height: 200px; background: linear-gradient(135deg, var(--cameroun-vert), var(--cameroun-jaune)); display: flex; align-items: center; justify-content: center; position: relative; }
        .project-image img.logo-bg { height: 40px; background: white; padding: 5px; border-radius: 8px; }
        
        .project-body { padding: 20px; }
        .project-title { font-size: 1.1rem; font-weight: 600; margin-bottom: 10px; height: 3.2em; overflow: hidden; }
        .project-meta { display: flex; gap: 15px; color: #6c757d; font-size: 0.85rem; margin-bottom: 15px; }
        
        .progress-bar-container { height: 8px; background: #e9ecef; border-radius: 10px; margin-bottom: 15px; overflow: hidden; }
        .progress-bar-fill { height: 100%; background: linear-gradient(90deg, var(--cameroun-vert), var(--cameroun-jaune)); border-radius: 10px; }
        
        .badge-custom { padding: 5px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 500; }
        .badge-en-cours { background: rgba(0, 122, 61, 0.1); color: var(--cameroun-vert); }
        .badge-termine { background: rgba(252, 209, 22, 0.15); color: #D4A017; }
        
        .btn-cameroun { background: var(--cameroun-vert); color: white; padding: 8px 20px; border-radius: 8px; font-weight: 500; display: flex; align-items: center; gap: 5px; }
        .btn-outline-cameroun { border: 2px solid var(--cameroun-vert); color: var(--cameroun-vert); padding: 8px 20px; border-radius: 8px; font-weight: 600; }

        .cta-section { 
          margin: 80px auto; 
          max-width: 1200px; 
          padding: 60px; 
          border-radius: 20px; 
          text-align: center; 
          color: white;
          background: linear-gradient(135deg, rgba(0, 122, 61, 0.9), rgba(252, 209, 22, 0.9)), url('https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=1200&h=400&fit=crop') center/cover;
          box-shadow: 0 10px 40px rgba(0, 122, 61, 0.3);
        }
        
        .footer { background: #2c3e50; color: white; padding: 60px 20px 30px; margin-top: 80px; }
        .footer-content { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 40px; }
        .footer h5 { color: var(--cameroun-jaune); margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
        .footer h5 img { height: 30px; background: white; padding: 4px; border-radius: 5px; }
        .footer ul { list-style: none; padding: 0; }
        .footer ul li { margin-bottom: 10px; }
        .footer a { color: var(--cameroun-jaune); text-decoration: none; }
      `}</style>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            <img src="/assets/images/logo.png" alt="Logo" />
            Projets Municipaux
          </h1>
          <p style={{ fontSize: '1.3rem', fontWeight: 300, opacity: 0.95 }}>Communes Urbaines du Littoral - Cameroun</p>
          <p style={{ marginTop: '1rem', fontSize: '1.1rem', opacity: 0.9 }}>Suivez en temps réel les projets de développement de votre commune</p>
          
          <div className="search-box">
            <input type="text" placeholder="Rechercher un projet, une commune..." />
            <button><Search size={18} /> Rechercher</button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div className="stat-card vert">
            <div className="stat-icon"><Folder size={24} /></div>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Projets totaux</div>
          </div>
          <div className="stat-card jaune">
            <div className="stat-icon"><Hammer size={24} /></div>
            <div className="stat-value">{stats.en_cours}</div>
            <div className="stat-label">En cours</div>
          </div>
          <div className="stat-card rouge">
            <div className="stat-icon"><CheckCircle size={24} /></div>
            <div className="stat-value">{stats.termines}</div>
            <div className="stat-label">Terminés</div>
          </div>
          <div className="stat-card vert">
            <div className="stat-icon"><Banknote size={24} /></div>
            <div className="stat-value">{(stats.budget_total / 1000000).toFixed(1)}M</div>
            <div className="stat-label">Budget total (milliards FCFA)</div>
          </div>
        </div>
      </section>

      {/* Projets Récents */}
      <section style={{ maxWidth: '1200px', margin: '80px auto 0', padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, position: 'relative', display: 'inline-block' }}>
              Projets Récents
              <div style={{ position: 'absolute', bottom: -5, left: 0, width: 60, height: 3, background: 'linear-gradient(90deg, var(--cameroun-vert), var(--cameroun-jaune))', borderRadius: 2 }}></div>
            </h2>
            <p style={{ marginTop: '10px' }}>Découvrez les derniers projets lancés dans votre région</p>
          </div>
          <Link href="/citoyens/projets" className="btn-outline-cameroun mobile-hidden">
            Voir tous les projets <ArrowRight size={18} style={{ marginLeft: 8, verticalAlign: 'middle' }} />
          </Link>
        </div>

        <div className="project-grid">
          {projetsRecents.map((p) => (
            <div key={p.id} className="project-card">
              <div className="project-image">
                <img src="/assets/images/logo.png" alt="Logo" className="logo-bg" />
              </div>
              <div className="project-body">
                <h3 className="project-title">{p.titre}</h3>
                <div className="project-meta">
                  <span className="flex items-center gap-1"><MapPin size={14} /> {p.communes?.nom}</span>
                  <span className="flex items-center gap-1"><Tag size={14} /> {p.types_projets?.nom}</span>
                </div>
                <div className="progress-section">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                    <span style={{ color: '#6c757d' }}>Avancement</span>
                    <span style={{ fontWeight: 700 }}>{p.avancement_physique}%</span>
                  </div>
                  <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: `${p.avancement_physique}%` }}></div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className={`badge-custom ${p.statut === 'terminé' ? 'badge-termine' : 'badge-en-cours'}`}>
                    {p.statut === 'terminé' ? 'Terminé' : 'En cours'}
                  </span>
                  <Link href={`/citoyens/projet/${p.id}`} className="btn-cameroun">
                    Détails <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '15px' }}>Une suggestion ? Un commentaire ?</h2>
        <p style={{ fontSize: '1.2rem', opacity: 0.95, marginBottom: '30px' }}>Votre avis compte ! Partagez vos idées pour améliorer les projets de votre commune.</p>
        <Link href="/citoyens/suggestion" style={{ background: 'white', color: 'var(--cameroun-vert)', padding: '15px 40px', borderRadius: '50px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
          <ChatBubble size={20} /> Faire une suggestion
        </Link>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div>
            <h5><img src="/assets/images/logo.png" alt="Logo" /> Portail Citoyen</h5>
            <p style={{ opacity: 0.8 }}>Système de suivi des projets municipaux<br/>Communes Urbaines du Littoral - Cameroun</p>
          </div>
          <div>
            <h6 style={{ fontWeight: 700, marginBottom: '20px' }}>Liens rapides</h6>
            <ul>
              <li><Link href="/citoyens">Accueil</Link></li>
              <li><Link href="/citoyens/projets">Tous les projets</Link></li>
              <li><Link href="/citoyens/suggestion">Faire une suggestion</Link></li>
            </ul>
          </div>
          <div>
            <h6 style={{ fontWeight: 700, marginBottom: '20px' }}>Contact</h6>
            <ul style={{ opacity: 0.8 }}>
              <li>contact@commune-littoral.cm</li>
              <li>+237 XXX XXX XXX</li>
            </ul>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '0.8rem', opacity: 0.6 }}>
          &copy; 2024 Communes Urbaines du Littoral. Tous droits réservés.
        </div>
      </footer>
    </div>
  )
}
