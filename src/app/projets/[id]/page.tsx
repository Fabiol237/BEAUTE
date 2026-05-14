'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
// No external icon library - using text/emoji icons
import Link from 'next/link'

export default function AdminProjetDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()
  
  const [activeTab, setActiveTab] = useState('general')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [communes, setCommunes] = useState<any[]>([])
  const [types, setTypes] = useState<any[]>([])
  
  const [formData, setFormData] = useState<any>({
    titre: '',
    description: '',
    commune_id: '',
    type_projet_id: '',
    budget_actuel: 0,
    budget_deja_utilise: 0,
    avancement_physique: 0,
    statut: 'en_cours',
    priorite: 'normale',
    date_debut: '',
    date_fin_prevue: '',
    latitude: '',
    longitude: '',
    entreprise_executante: '',
    visible_public: true
  })

  useEffect(() => {
    async function loadData() {
      const [projRes, commRes, typeRes] = await Promise.all([
        supabase.from('projets').select('*').eq('id', id).single(),
        supabase.from('communes').select('*'),
        supabase.from('types_projets').select('*')
      ])

      if (projRes.data) {
        setFormData({
          ...projRes.data,
          latitude: projRes.data.latitude || '',
          longitude: projRes.data.longitude || '',
          date_debut: projRes.data.date_debut || '',
          date_fin_prevue: projRes.data.date_fin_prevue || ''
        })
      }
      if (commRes.data) setCommunes(commRes.data)
      if (typeRes.data) setTypes(typeRes.data)
      setLoading(false)
    }
    if (id) loadData()
  }, [id])

  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('projets')
      .update({
        ...formData,
        budget_actuel: parseFloat(formData.budget_actuel),
        budget_deja_utilise: parseFloat(formData.budget_deja_utilise),
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      })
      .eq('id', id)

    if (!error) {
      alert('Projet mis à jour avec succès !')
      router.refresh()
    } else {
      alert('Erreur: ' + error.message)
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) return
    const { error } = await supabase.from('projets').delete().eq('id', id)
    if (!error) router.push('/projets')
  }

  if (loading) return <div className="p-10 text-center">Chargement...</div>

  return (
    <div className="max-w-5xl mx-auto">
      <header className="header-actions mb-8">
        <div>
          <Link href="/projets" className="flex items-center gap-2 text-muted hover:text-primary mb-2 transition-colors">
            ← Retour
          </Link>
          <h1>{formData.titre}</h1>
          <p>Gestion administrative et suivi technique</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-outline text-danger" onClick={handleDelete}>🗑️ Supprimer</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Enregistrement...' : '💾 Enregistrer'}
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-border overflow-x-auto pb-1">
        {[
          { id: 'general', label: '📋 Général' },
          { id: 'budget', label: '💰 Budget' },
          { id: 'planning', label: '📅 Planning' },
          { id: 'suivi', label: '📊 Suivi & Public' },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 font-semibold transition-all whitespace-nowrap ${activeTab === tab.id ? 'border-b-2 border-primary text-primary' : 'text-muted'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {activeTab === 'general' && (
            <div className="card flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="font-bold">Titre du Projet</label>
                <input className="form-control" value={formData.titre} onChange={e => setFormData({...formData, titre: e.target.value})} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-bold">Description</label>
                <textarea className="form-control" rows={6} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="grid-responsive">
                <div className="flex flex-col gap-2">
                  <label className="font-bold">Commune</label>
                  <select className="form-select" value={formData.commune_id} onChange={e => setFormData({...formData, commune_id: e.target.value})}>
                    {communes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-bold">Type</label>
                  <select className="form-select" value={formData.type_projet_id} onChange={e => setFormData({...formData, type_projet_id: e.target.value})}>
                    {types.map(t => <option key={t.id} value={t.id}>{t.nom}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'budget' && (
            <div className="card flex flex-col gap-6">
              <div className="grid-responsive">
                <div className="flex flex-col gap-2">
                  <label className="font-bold">Budget Alloué (FCFA)</label>
                  <input type="number" className="form-control" value={formData.budget_actuel} onChange={e => setFormData({...formData, budget_actuel: e.target.value})} />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-bold">Dépenses Réelles (FCFA)</label>
                  <input type="number" className="form-control" value={formData.budget_deja_utilise} onChange={e => setFormData({...formData, budget_deja_utilise: e.target.value})} />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-bold">Entreprise Exécutante</label>
                <input className="form-control" value={formData.entreprise_executante} onChange={e => setFormData({...formData, entreprise_executante: e.target.value})} />
              </div>
            </div>
          )}

          {activeTab === 'planning' && (
            <div className="card flex flex-col gap-6">
              <div className="grid-responsive">
                <div className="flex flex-col gap-2">
                  <label className="font-bold">Date de début</label>
                  <input type="date" className="form-control" value={formData.date_debut} onChange={e => setFormData({...formData, date_debut: e.target.value})} />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-bold">Fin prévue</label>
                  <input type="date" className="form-control" value={formData.date_fin_prevue} onChange={e => setFormData({...formData, date_fin_prevue: e.target.value})} />
                </div>
              </div>
              <div className="card" style={{ background: 'var(--primary-light)', border: '1px dashed var(--primary)' }}>
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: '1.5rem' }}>ℹ️</span>
                  <div>
                    <div className="font-bold">Calcul de durée</div>
                    <div className="text-sm">Le projet est prévu sur une durée de {Math.round((new Date(formData.date_fin_prevue).getTime() - new Date(formData.date_debut).getTime()) / (1000 * 3600 * 24)) || 0} jours.</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'suivi' && (
            <div className="card flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="font-bold">Avancement Physique ({formData.avancement_physique}%)</label>
                <input type="range" min="0" max="100" step="5" className="w-full" value={formData.avancement_physique} onChange={e => setFormData({...formData, avancement_physique: parseInt(e.target.value)})} />
                <div className="progress" style={{ height: 10 }}>
                   <div style={{ width: `${formData.avancement_physique}%`, background: 'var(--primary)', height: '100%', borderRadius: 10 }} />
                </div>
              </div>
              <div className="grid-responsive">
                <div className="flex flex-col gap-2">
                  <label className="font-bold">Statut Administratif</label>
                  <select className="form-select" value={formData.statut} onChange={e => setFormData({...formData, statut: e.target.value})}>
                    <option value="planifié">Planifié</option>
                    <option value="en_cours">En cours</option>
                    <option value="suspendu">Suspendu</option>
                    <option value="terminé">Terminé</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                   <label className="font-bold">Visibilité Publique</label>
                   <div className="flex items-center gap-2 h-full">
                     <input type="checkbox" id="public" checked={formData.visible_public} onChange={e => setFormData({...formData, visible_public: e.target.checked})} style={{ width: 20, height: 20 }} />
                     <label htmlFor="public">Visible par les citoyens</label>
                   </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Sidebar Info Card */}
        <div className="flex flex-col gap-6">
          <div className="card">
            <h3 className="mb-4">Géolocalisation</h3>
            <div className="flex flex-col gap-4">
               <div className="flex flex-col gap-1">
                 <label className="text-xs font-bold text-muted uppercase">Latitude</label>
                 <input className="form-control" value={formData.latitude} onChange={e => setFormData({...formData, latitude: e.target.value})} />
               </div>
               <div className="flex flex-col gap-1">
                 <label className="text-xs font-bold text-muted uppercase">Longitude</label>
                 <input className="form-control" value={formData.longitude} onChange={e => setFormData({...formData, longitude: e.target.value})} />
               </div>
               <div style={{ height: 200, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
                 {/* Map would go here */}
               </div>
            </div>
          </div>

          <div className="card" style={{ background: 'var(--warning-light)', borderLeft: '4px solid var(--warning)' }}>
            <div className="flex gap-3">
              <span style={{ fontSize: '1.5rem' }}>⚠️</span>
              <div>
                <div className="font-bold text-sm">Contrôle de conformité</div>
                <p className="text-xs text-muted mt-1">Assurez-vous que les photos de chantier sont à jour avant de valider le franchissement d'un jalon.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
