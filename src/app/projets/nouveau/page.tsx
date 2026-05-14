'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { ArrowLeft, Save, MapPin, Banknote, Calendar } from 'lucide-react'
import Link from 'next/link'

export default function NouveauProjetPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [communes, setCommunes] = useState<any[]>([])
  const [types, setTypes] = useState<any[]>([])

  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    budget_actuel: '',
    commune_id: '',
    type_projet_id: '',
    latitude: '',
    longitude: '',
    statut: 'en_cours',
    avancement_physique: 0
  })

  useEffect(() => {
    async function loadData() {
      const { data: comms } = await supabase.from('communes').select('*')
      const { data: typs } = await supabase.from('types_projets').select('*')
      if (comms) setCommunes(comms)
      if (typs) setTypes(typs)
    }
    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.from('projets').insert([{
      ...formData,
      budget_actuel: parseFloat(formData.budget_actuel),
      commune_id: parseInt(formData.commune_id),
      type_projet_id: parseInt(formData.type_projet_id),
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
    }])

    if (error) {
      alert("Erreur lors de l'ajout : " + error.message)
    } else {
      router.push('/projets')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <header className="mb-6">
        <Link href="/projets" className="flex items-center gap-2 text-muted hover:text-primary mb-4 transition-colors">
          <ArrowLeft size={20} />
          Retour aux projets
        </Link>
        <h1>Créer un Nouveau Projet</h1>
        <p>Remplissez les informations pour lancer le suivi du chantier.</p>
      </header>

      <form onSubmit={handleSubmit} className="card flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label style={{ fontWeight: 600 }}>Titre du Projet *</label>
          <input 
            required
            type="text" 
            placeholder="ex: Construction d'un forage à Bépanda"
            value={formData.titre}
            onChange={e => setFormData({...formData, titre: e.target.value})}
            style={{ padding: '0.75rem', borderRadius: 10, border: '1px solid var(--border)', outline: 'none' }}
          />
        </div>

        <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          <div className="flex flex-col gap-2">
            <label style={{ fontWeight: 600 }}>Commune *</label>
            <select 
              required
              value={formData.commune_id}
              onChange={e => setFormData({...formData, commune_id: e.target.value})}
              style={{ padding: '0.75rem', borderRadius: 10, border: '1px solid var(--border)', outline: 'none' }}
            >
              <option value="">Sélectionner une commune</option>
              {communes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label style={{ fontWeight: 600 }}>Type de Projet *</label>
            <select 
              required
              value={formData.type_projet_id}
              onChange={e => setFormData({...formData, type_projet_id: e.target.value})}
              style={{ padding: '0.75rem', borderRadius: 10, border: '1px solid var(--border)', outline: 'none' }}
            >
              <option value="">Sélectionner un type</option>
              {types.map(t => <option key={t.id} value={t.id}>{t.nom}</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label style={{ fontWeight: 600 }}>Budget Alloué (FCFA) *</label>
          <div style={{ position: 'relative' }}>
            <Banknote size={18} style={{ position: 'absolute', left: 12, top: 14, color: 'var(--muted)' }} />
            <input 
              required
              type="number" 
              placeholder="0"
              value={formData.budget_actuel}
              onChange={e => setFormData({...formData, budget_actuel: e.target.value})}
              style={{ padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: 10, border: '1px solid var(--border)', outline: 'none', width: '100%' }}
            />
          </div>
        </div>

        <div className="card" style={{ background: '#f8fafc', border: '1px dashed var(--border)' }}>
          <h4 className="flex items-center gap-2 mb-4"><MapPin size={18} /> Géolocalisation (Optionnel)</h4>
          <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="flex flex-col gap-2">
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Latitude</label>
              <input 
                type="text" placeholder="ex: 4.0511"
                value={formData.latitude}
                onChange={e => setFormData({...formData, latitude: e.target.value})}
                style={{ padding: '0.6rem', borderRadius: 8, border: '1px solid var(--border)' }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Longitude</label>
              <input 
                type="text" placeholder="ex: 9.7679"
                value={formData.longitude}
                onChange={e => setFormData({...formData, longitude: e.target.value})}
                style={{ padding: '0.6rem', borderRadius: 8, border: '1px solid var(--border)' }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label style={{ fontWeight: 600 }}>Description</label>
          <textarea 
            rows={4}
            placeholder="Détails du projet..."
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
            style={{ padding: '0.75rem', borderRadius: 10, border: '1px solid var(--border)', outline: 'none', fontFamily: 'inherit' }}
          ></textarea>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="btn btn-primary" 
          style={{ padding: '1rem', marginTop: '1rem' }}
        >
          {loading ? 'Enregistrement...' : <><Save size={20} /> Créer le projet</>}
        </button>
      </form>
    </div>
  )
}
