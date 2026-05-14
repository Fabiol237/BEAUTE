'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ projets: 0, budget: 0, suggestions: 0 })
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: p } = await supabase.from('projets').select('id, budget_actuel')
      const { count: s } = await supabase.from('suggestions').select('*', { count: 'exact', head: true })
      
      if (p) {
        const totalBudget = p.reduce((acc, curr) => acc + Number(curr.budget_actuel || 0), 0)
        setStats({ projets: p.length, budget: totalBudget, suggestions: s || 0 })
      }
    }
    load()
  }, [])

  const cards = [
    { 
      title: 'Projets Actifs', 
      value: stats.projets, 
      color: '#007A3D', 
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg> 
    },
    { 
      title: 'Budget Engagé', 
      value: `${(stats.budget / 1000000).toFixed(1)}M`, 
      color: '#FCD116', 
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg> 
    },
    { 
      title: 'Suggestions', 
      value: stats.suggestions, 
      color: '#CE1126', 
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> 
    }
  ]

  return (
    <div className="dashboard-wrapper">
      <style jsx>{`
        .dashboard-wrapper { padding: 40px; background: #f0f4f8; min-height: 100vh; font-family: 'Outfit', sans-serif; }
        .header { margin-bottom: 40px; }
        .header h1 { font-size: 2.5rem; color: #1a365d; font-weight: 800; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; }
        .stat-card { 
          background: white; 
          padding: 30px; 
          border-radius: 24px; 
          box-shadow: 0 10px 25px rgba(0,0,0,0.05); 
          display: flex; 
          align-items: center; 
          gap: 25px; 
          transition: transform 0.3s ease;
          border: 1px solid rgba(255,255,255,0.8);
        }
        .stat-card:hover { transform: translateY(-5px); }
        .icon-box { 
          width: 70px; 
          height: 70px; 
          border-radius: 20px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          color: white; 
        }
        .info h3 { color: #64748b; font-size: 1rem; margin-bottom: 5px; font-weight: 500; }
        .info .value { font-size: 2.2rem; font-weight: 800; color: #1e293b; }
        
        .recent-section { margin-top: 50px; background: white; border-radius: 30px; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.03); }
        .btn-portal { 
          background: #007A3D; 
          color: white; 
          border: none; 
          padding: 18px 35px; 
          border-radius: 15px; 
          font-weight: 700; 
          cursor: pointer; 
          margin-top: 20px;
          box-shadow: 0 4px 15px rgba(0, 122, 61, 0.3);
        }
      `}</style>

      <div className="header">
        <h1>Plateforme de Suivi Municipal</h1>
        <p>République du Cameroun | Ministère de la Décentralisation</p>
      </div>

      <div className="grid">
        {cards.map((card, i) => (
          <div key={i} className="stat-card">
            <div className="icon-box" style={{ background: card.color }}>
              {card.icon}
            </div>
            <div className="info">
              <h3>{card.title}</h3>
              <div className="value">{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="recent-section">
        <h2 style={{ marginBottom: '15px', color: '#1e293b' }}>Bienvenue sur MuniTrack v1.0</h2>
        <p style={{ color: '#64748b', maxWidth: '600px', lineHeight: 1.6 }}>
          Cette interface vous permet de piloter l'ensemble des projets d'infrastructure de votre commune. 
          Consultez les rapports citoyens et validez l'avancement des chantiers en un clic.
        </p>
        <button className="btn-portal" onClick={() => window.location.href='/citoyens'}>
          Accéder au Portail Citoyen 🏛️
        </button>
      </div>
    </div>
  )
}
