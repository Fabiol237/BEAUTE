'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import CitizenNavbar from '@/components/CitizenNavbar'
import { Lightbulb, AlertTriangle, CheckCircle2, User, Mail, Phone, MapPin, Tag, Clock, Send, Camera, MessageSquare } from 'lucide-react'
import dynamic from 'next/dynamic'

// Import Map dynamically to avoid SSR issues
const Map = dynamic(() => import('@/components/Map'), { ssr: false })

export default function SuggestionPage() {
  const [mode, setMode] = useState<'suggestion' | 'signalement'>('suggestion')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [projets, setProjets] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    telephone: '',
    quartier: '',
    categorie: '',
    projet_id: '',
    message: '',
    priorite_citoyen: 'basse',
    disponible_contact: false,
    // Signalement fields
    adresse_probleme: '',
    latitude: 4.0511,
    longitude: 9.7679,
    depuis_quand: '',
    a_temoins: false,
    urgence: 'normale'
  })

  const supabase = createClient()

  useEffect(() => {
    async function loadProjets() {
      const { data } = await supabase.from('projets').select('id, titre').eq('visible_public', true).order('titre')
      if (data) setProjets(data)
    }
    loadProjets()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const prefix = mode === 'signalement' ? 'Signalement' : 'Suggestion'
    const titre = `${prefix} — ${formData.nom.substring(0, 30)}`
    
    const { error } = await supabase.from('suggestions').insert([{
      mode,
      citoyen_nom: formData.nom,
      citoyen_email: formData.email,
      citoyen_telephone: formData.telephone,
      projet_id: formData.projet_id || null,
      categorie: formData.categorie,
      titre,
      description: formData.message,
      quartier: formData.quartier,
      priorite_citoyen: formData.priorite_citoyen,
      disponible_contact: formData.disponible_contact,
      adresse_probleme: formData.adresse_probleme,
      latitude: mode === 'signalement' ? formData.latitude : null,
      longitude: mode === 'signalement' ? formData.longitude : null,
      depuis_quand: formData.depuis_quand,
      a_temoins: formData.a_temoins,
      priorite: (mode === 'signalement' && formData.urgence === 'critique') ? 'haute' : formData.priorite_citoyen
    }])

    if (!error) {
      setSuccess(true)
      window.scrollTo(0, 0)
    } else {
      alert("Erreur lors de l'envoi : " + error.message)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="citoyen-portal">
        <CitizenNavbar />
        <div className="container" style={{ textAlign: 'center', padding: '100px 20px' }}>
          <div className={`success-box ${mode}`}>
             <CheckCircle2 size={80} color={mode === 'suggestion' ? '#007A3D' : '#CE1126'} style={{ margin: '0 auto 20px' }} />
             <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '20px' }}>
               {mode === 'suggestion' ? 'Merci pour votre suggestion !' : 'Signalement envoyé !'}
             </h2>
             <p style={{ maxWidth: '600px', margin: '0 auto 40px', fontSize: '1.1rem', color: '#6c757d' }}>
               Votre message a bien été reçu. Nos équipes l'examineront attentivement.
             </p>
             <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
               <button onClick={() => window.location.href = '/citoyens'} style={{ background: mode === 'suggestion' ? '#007A3D' : '#CE1126', color: 'white', padding: '15px 30px', borderRadius: '12px', fontWeight: 700, border: 'none' }}>
                 Retour à l'accueil
               </button>
               <button onClick={() => setSuccess(false)} style={{ background: '#eee', color: '#333', padding: '15px 30px', borderRadius: '12px', fontWeight: 700, border: 'none' }}>
                 Nouvelle soumission
               </button>
             </div>
          </div>
        </div>
      </div>
    )
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
        .container { max-width: 900px; margin: 40px auto; padding: 0 20px; }
        .tab-switcher { display: grid; grid-template-columns: 1fr 1fr; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); margin-bottom: 40px; }
        .tab-btn { padding: 25px; text-align: center; border: none; cursor: pointer; transition: all 0.3s; background: white; display: flex; flexDirection: column; align-items: center; gap: 8px; }
        .tab-btn.active.suggestion { background: var(--cameroun-vert); color: white; }
        .tab-btn.active.signalement { background: var(--cameroun-rouge); color: white; }
        
        .form-card { background: white; border-radius: 20px; padding: 40px; box-shadow: 0 8px 30px rgba(0,0,0,0.08); border-top: 5px solid ${mode === 'suggestion' ? 'var(--cameroun-vert)' : 'var(--cameroun-rouge)'}; }
        .section-label { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #999; margin: 30px 0 15px; border-bottom: 2px solid #f0f0f0; padding-bottom: 5px; }
        
        .form-group { margin-bottom: 20px; }
        .form-label { display: block; margin-bottom: 8px; font-weight: 600; font-size: 0.9rem; display: flex; align-items: center; gap: 8px; }
        .form-control, .form-select { width: 100%; padding: 12px 15px; border: 2px solid #eee; border-radius: 12px; outline: none; transition: border-color 0.2s; }
        .form-control:focus { border-color: ${mode === 'suggestion' ? 'var(--cameroun-vert)' : 'var(--cameroun-rouge)'}; }
        
        .toggle-card { background: #f9f9f9; padding: 15px 20px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; border: 2px solid #eee; }
        .toggle-card.active { background: ${mode === 'suggestion' ? 'rgba(0,122,61,0.05)' : 'rgba(206,17,38,0.05)'}; border-color: ${mode === 'suggestion' ? 'var(--cameroun-vert)' : 'var(--cameroun-rouge)'}; }
        
        .submit-btn { width: 100%; padding: 18px; border-radius: 15px; border: none; color: white; font-weight: 700; font-size: 1.1rem; cursor: pointer; transition: all 0.3s; background: ${mode === 'suggestion' ? 'linear-gradient(135deg, var(--cameroun-vert), #2dbd7e)' : 'linear-gradient(135deg, var(--cameroun-rouge), #e85555)'}; }
        .submit-btn:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(0,0,0,0.15); }
      `}</style>

      <div className="container">
        <div className="text-center mb-10">
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#2c3e50' }}>Participez à la vie de votre commune</h1>
          <p style={{ color: '#6c757d', fontSize: '1.1rem' }}>Votre avis et vos signalements nous aident à nous améliorer</p>
        </div>

        {/* Tabs */}
        <div className="tab-switcher">
          <button className={`tab-btn suggestion ${mode === 'suggestion' ? 'active' : ''}`} onClick={() => setMode('suggestion')}>
            <Lightbulb size={32} />
            <div style={{ fontWeight: 700 }}>Faire une suggestion</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Proposer une idée</div>
          </button>
          <button className={`tab-btn signalement ${mode === 'signalement' ? 'active' : ''}`} onClick={() => setMode('signalement')}>
            <AlertTriangle size={32} />
            <div style={{ fontWeight: 700 }}>Signaler un problème</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Nid de poule, panne, etc.</div>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="form-card">
          <div className="section-label">Vos coordonnées</div>
          <div className="grid-responsive" style={{ gap: '15px' }}>
             <div className="form-group">
               <label className="form-label"><User size={16} /> Nom complet *</label>
               <input className="form-control" placeholder="Votre nom" required value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} />
             </div>
             <div className="form-group">
               <label className="form-label"><Mail size={16} /> Adresse email *</label>
               <input className="form-control" type="email" placeholder="votre@email.com" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
             </div>
          </div>
          <div className="grid-responsive" style={{ gap: '15px' }}>
             <div className="form-group">
               <label className="form-label"><Phone size={16} /> Téléphone</label>
               <input className="form-control" placeholder="+237 XXX XXX XXX" value={formData.telephone} onChange={e => setFormData({...formData, telephone: e.target.value})} />
             </div>
             <div className="form-group">
               <label className="form-label"><MapPin size={16} /> Quartier / Zone</label>
               <input className="form-control" placeholder="Ex: Akwa, Bonanjo" value={formData.quartier} onChange={e => setFormData({...formData, quartier: e.target.value})} />
             </div>
          </div>

          <div className="section-label">{mode === 'suggestion' ? 'Votre suggestion' : 'Détails du problème'}</div>
          <div className="grid-responsive" style={{ gap: '15px' }}>
            <div className="form-group">
              <label className="form-label"><Tag size={16} /> Catégorie *</label>
              <select className="form-select" required value={formData.categorie} onChange={e => setFormData({...formData, categorie: e.target.value})}>
                <option value="">-- Choisir --</option>
                {mode === 'suggestion' ? (
                  <>
                    <option value="amelioration">Amélioration</option>
                    <option value="nouvelle_idee">Nouvelle idée</option>
                    <option value="infrastructure">Infrastructure</option>
                    <option value="environnement">Environnement</option>
                  </>
                ) : (
                  <>
                    <option value="voirie">Voirie (Nid de poule)</option>
                    <option value="eau">Eau / Assainissement</option>
                    <option value="electricite">Électricité / Éclairage</option>
                    <option value="dechets">Déchets / Propreté</option>
                  </>
                )}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label"><Clock size={16} /> {mode === 'suggestion' ? 'Projet concerné' : 'Depuis quand ?'}</label>
              {mode === 'suggestion' ? (
                <select className="form-select" value={formData.projet_id} onChange={e => setFormData({...formData, projet_id: e.target.value})}>
                  <option value="">Aucun projet spécifique</option>
                  {projets.map(p => <option key={p.id} value={p.id}>{p.titre}</option>)}
                </select>
              ) : (
                <select className="form-select" value={formData.depuis_quand} onChange={e => setFormData({...formData, depuis_quand: e.target.value})}>
                  <option value="">Choisir...</option>
                  <option value="Moins d'une semaine">Moins d'une semaine</option>
                  <option value="1 à 2 semaines">1 à 2 semaines</option>
                  <option value="Plus d'un mois">Plus d'un mois</option>
                </select>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label"><MessageSquare size={16} /> Description détaillée *</label>
            <textarea className="form-control" rows={5} placeholder="Expliquez en détail..." required value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} />
          </div>

          {mode === 'signalement' && (
            <>
              <div className="section-label">Localisation</div>
              <div className="form-group">
                <label className="form-label">Adresse exacte</label>
                <input className="form-control" placeholder="Saisissez l'adresse ou le lieu..." value={formData.adresse_probleme} onChange={e => setFormData({...formData, adresse_probleme: e.target.value})} />
              </div>
              <div style={{ height: '300px', borderRadius: '15px', overflow: 'hidden', border: '2px solid #eee', marginBottom: '20px' }}>
                <Map onLocationSelect={(lat, lng) => setFormData({...formData, latitude: lat, longitude: lng})} />
              </div>
            </>
          )}

          <div className="section-label">Options</div>
          <div className="grid-responsive" style={{ gap: '15px' }}>
            <div className={`toggle-card ${formData.disponible_contact ? 'active' : ''}`} onClick={() => setFormData({...formData, disponible_contact: !formData.disponible_contact})}>
              <div style={{ fontSize: '0.85rem' }}>
                <div style={{ fontWeight: 700 }}>Disponible pour contact</div>
                <div style={{ opacity: 0.6 }}>On peut vous rappeler ?</div>
              </div>
              <input type="checkbox" checked={formData.disponible_contact} readOnly />
            </div>
            {mode === 'signalement' ? (
              <div className={`toggle-card ${formData.a_temoins ? 'active' : ''}`} onClick={() => setFormData({...formData, a_temoins: !formData.a_temoins})}>
                <div style={{ fontSize: '0.85rem' }}>
                  <div style={{ fontWeight: 700 }}>Il y a des témoins</div>
                  <div style={{ opacity: 0.6 }}>D'autres personnes l'ont vu ?</div>
                </div>
                <input type="checkbox" checked={formData.a_temoins} readOnly />
              </div>
            ) : (
              <div className={`toggle-card ${formData.priorite_citoyen === 'haute' ? 'active' : ''}`} onClick={() => setFormData({...formData, priorite_citoyen: formData.priorite_citoyen === 'haute' ? 'basse' : 'haute'})}>
                <div style={{ fontSize: '0.85rem' }}>
                  <div style={{ fontWeight: 700 }}>Priorité Haute</div>
                  <div style={{ opacity: 0.6 }}>À traiter en urgence ?</div>
                </div>
                <input type="checkbox" checked={formData.priorite_citoyen === 'haute'} readOnly />
              </div>
            )}
          </div>

          <div style={{ marginTop: '40px' }}>
            <button className="submit-btn" disabled={loading}>
              {loading ? 'Envoi en cours...' : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <Send size={20} /> Envoyer {mode === 'suggestion' ? 'ma suggestion' : 'mon signalement'}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
