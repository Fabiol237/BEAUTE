'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
// import { ArrowLeft, Save, Banknote, Tag, FileText } from 'lucide-react'
import Link from 'next/link'

export default function NouvelleDepensePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [projets, setProjets] = useState<any[]>([])

  const [formData, setFormData] = useState({
    projet_id: '',
    montant: '',
    description: '',
    validee: true
  })

  useEffect(() => {
    async function loadProjets() {
      const { data } = await supabase.from('projets').select('id, titre')
      if (data) setProjets(data)
    }
    loadProjets()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.from('depenses').insert([{
      projet_id: parseInt(formData.projet_id),
      montant: parseFloat(formData.montant),
      description: formData.description,
      validee: formData.validee
    }])

    if (error) {
      alert("Erreur lors de l'ajout : " + error.message)
    } else {
      router.push('/budget')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <header className="mb-6">
        <Link href="/budget" className="flex items-center gap-2 text-muted hover:text-primary mb-4 transition-colors">
          ←
          Retour au budget
        </Link>
        <h1>Enregistrer une Dépense</h1>
        <p>Ajoutez une facture ou un paiement lié à un projet.</p>
      </header>

      <form onSubmit={handleSubmit} className="card flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label style={{ fontWeight: 600 }}>Projet Concerné *</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: 14, fontSize: '1.1rem' }}>🏷️</span>
            <select 
              required
              value={formData.projet_id}
              onChange={e => setFormData({...formData, projet_id: e.target.value})}
              style={{ padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: 10, border: '1px solid var(--border)', outline: 'none', width: '100%' }}
            >
              <option value="">Choisir un projet</option>
              {projets.map(p => <option key={p.id} value={p.id}>{p.titre}</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label style={{ fontWeight: 600 }}>Montant de la dépense (FCFA) *</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: 14, fontSize: '1.1rem' }}>💰</span>
            <input 
              required
              type="number" 
              placeholder="0"
              value={formData.montant}
              onChange={e => setFormData({...formData, montant: e.target.value})}
              style={{ padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: 10, border: '1px solid var(--border)', outline: 'none', width: '100%' }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label style={{ fontWeight: 600 }}>Libellé / Description *</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: 14, fontSize: '1.1rem' }}>📝</span>
            <input 
              required
              type="text" 
              placeholder="ex: Facture électricité Janvier"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              style={{ padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: 10, border: '1px solid var(--border)', outline: 'none', width: '100%' }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3" style={{ background: 'var(--primary-light)', padding: '1rem', borderRadius: 10 }}>
          <input 
            type="checkbox" 
            id="validee"
            checked={formData.validee}
            onChange={e => setFormData({...formData, validee: e.target.checked})}
            style={{ width: 20, height: 20 }}
          />
          <label htmlFor="validee" style={{ fontWeight: 600, color: 'var(--primary)', cursor: 'pointer' }}>
            Marquer comme validée immédiatement
          </label>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="btn btn-primary" 
          style={{ padding: '1rem', marginTop: '1rem' }}
        >
          {loading ? 'Enregistrement...' : <>💾 Enregistrer la dépense</>}
        </button>
      </form>
    </div>
  )
}
