'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import CitizenNavbar from '@/components/CitizenNavbar'
import Link from 'next/link'
import { Search, Filter, MapPin, Tag, Banknote, ArrowRight, XCircle } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

export default function ProjetsCitoyensPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [communes, setCommunes] = useState<any[]>([])
  const [types, setTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const searchParams = useSearchParams()
  const initialCommune = searchParams.get('commune') || ''

  const [filters, setFilters] = useState({
    q: '',
    commune: initialCommune,
    type: '',
    statut: ''
  })

  const supabase = createClient()

  useEffect(() => {
    async function loadInitialData() {
      const { data: comms } = await supabase.from('communes').select('*').order('nom')
      const { data: typs } = await supabase.from('types_projets').select('*').order('nom')
      if (comms) setCommunes(comms)
      if (typs) setTypes(typs)
    }
    loadInitialData()
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [filters.commune])

  async function fetchProjects() {
    setLoading(true)
    let query = supabase
      .from('projets')
      .select('*, communes(nom), types_projets(nom)')
      .eq('visible_public', true)
      .order('created_at', { ascending: false })

    if (filters.q) query = query.ilike('titre', `%${filters.q}%`)
    if (filters.commune) query = query.eq('commune_id', filters.commune)
    if (filters.type) query = query.eq('type_projet_id', filters.type)
    if (filters.statut) query = query.eq('statut', filters.statut)

    const { data } = await query
    if (data) setProjects(data)
    setLoading(false)
  }

  const handleReset = () => {
    setFilters({ q: '', commune: '', type: '', statut: '' })
    setTimeout(() => fetchProjects(), 10)
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
        .filters-card { background: white; border-radius: 15px; padding: 25px; box-shadow: 0 2px 10px rgba(0,0,0,0.06); margin-bottom: 30px; }
        .project-card { background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.06); transition: all 0.3s; border-left: 4px solid var(--cameroun-vert); height: 100%; }
        .project-card:hover { transform: translateY(-5px); box-shadow: 0 8px 25px rgba(0,0,0,0.12); }
        .progress-bar { height: 10px; background: #e9ecef; border-radius: 10px; overflow: hidden; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, var(--cameroun-vert), var(--cameroun-jaune)); }
        .btn-filter { background: var(--cameroun-vert); color: white; border: none; padding: 10px 30px; border-radius: 8px; font-weight: 500; cursor: pointer; }
        .btn-reset { background: var(--cameroun-rouge); color: white; border: none; padding: 10px 30px; border-radius: 8px; text-decoration: none; display: inline-flex; items-center; gap: 8px; }
        .badge-statut { padding: 6px 14px; border-radius: 20px; font-size: 0.8rem; font-weight: 500; }
        .badge-en-cours { background: rgba(0, 122, 61, 0.1); color: var(--cameroun-vert); }
        .badge-termine { background: rgba(252, 209, 22, 0.15); color: #D4A017; }
        .form-label { display: block; margin-bottom: 8px; font-weight: 600; font-size: 0.9rem; }
        .form-select, .form-control { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 8px; outline: none; }
        .form-select:focus, .form-control:focus { border-color: var(--cameroun-vert); }
      `}</style>

      <div className="container">
        <header className="mb-8">
          <h1 style={{ fontSize: '2.5rem', fontWeight: 700 }}>
            <span style={{ color: 'var(--cameroun-vert)', marginRight: '15px' }}>📋</span>
            Tous les Projets
          </h1>
          <p style={{ color: '#6c757d' }}>{projects.length} projet(s) trouvé(s)</p>
        </header>

        {/* Filtres */}
        <div className="filters-card">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Filter size={20} color="var(--cameroun-vert)" /> Filtrer les projets
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div>
              <label className="form-label">Recherche</label>
              <input 
                className="form-control" 
                placeholder="Mot-clé..." 
                value={filters.q}
                onChange={e => setFilters({...filters, q: e.target.value})}
              />
            </div>
            <div>
              <label className="form-label">Commune</label>
              <select className="form-select" value={filters.commune} onChange={e => setFilters({...filters, commune: e.target.value})}>
                <option value="">Toutes les communes</option>
                {communes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Type</label>
              <select className="form-select" value={filters.type} onChange={e => setFilters({...filters, type: e.target.value})}>
                <option value="">Tous les types</option>
                {types.map(t => <option key={t.id} value={t.id}>{t.nom}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Statut</label>
              <select className="form-select" value={filters.statut} onChange={e => setFilters({...filters, statut: e.target.value})}>
                <option value="">Tous</option>
                <option value="planifié">Planifié</option>
                <option value="en_cours">En cours</option>
                <option value="terminé">Terminé</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: '25px', display: 'flex', gap: '15px' }}>
            <button className="btn-filter" onClick={fetchProjects}>
              <Search size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Filtrer
            </button>
            <button className="btn-reset" onClick={handleReset}>
              <XCircle size={18} /> Réinitialiser
            </button>
          </div>
        </div>

        {/* Liste */}
        <div className="grid-responsive mt-6">
          {projects.map((p) => (
            <div key={p.id} className="project-card">
              <div style={{ padding: '25px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '15px' }}>{p.titre}</h3>
                <p style={{ color: '#6c757d', fontSize: '0.9rem', marginBottom: '20px', height: '3.6em', overflow: 'hidden' }}>{p.description}</p>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', color: '#6c757d', fontSize: '0.85rem', marginBottom: '20px' }}>
                  <span className="flex items-center gap-1"><MapPin size={14} /> {p.communes?.nom}</span>
                  <span className="flex items-center gap-1"><Tag size={14} /> {p.types_projets?.nom}</span>
                  <span className="flex items-center gap-1"><Banknote size={14} /> {Number(p.budget_actuel).toLocaleString()} FCFA</span>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                    <span>Avancement</span>
                    <span style={{ fontWeight: 700, color: 'var(--cameroun-vert)' }}>{p.avancement_physique}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${p.avancement_physique}%` }}></div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className={`badge-statut ${p.statut === 'terminé' ? 'badge-termine' : 'badge-en-cours'}`}>
                    {p.statut === 'terminé' ? 'Terminé' : 'En cours'}
                  </span>
                  <Link href={`/citoyens/projet/${p.id}`} style={{ background: 'var(--cameroun-vert)', color: 'white', padding: '10px 20px', borderRadius: 8, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Voir les détails <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
