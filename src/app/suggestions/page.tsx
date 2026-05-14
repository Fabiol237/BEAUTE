'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
// import { MessageSquare, MapPin, Clock, CheckCircle, AlertTriangle, Filter, Search, Eye } from 'lucide-react'
import dynamic from 'next/dynamic'

const Map = dynamic(() => import('@/components/Map'), { ssr: false })

import { use } from 'react'

export default function AdminSuggestionsPage({ searchParams }: { searchParams: Promise<{ commune?: string }> }) {
  const params = use(searchParams)
  const selectedCommuneId = params.commune
  
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('tous')
  const [selectedSuggestion, setSelectedSuggestion] = useState<any>(null)
  
  const supabase = createClient()

  useEffect(() => {
    fetchSuggestions()
  }, [filter, selectedCommuneId])

  async function fetchSuggestions() {
    setLoading(true)
    let query = supabase.from('suggestions').select('*, projets(titre, commune_id)').order('date_soumission', { ascending: false })
    
    if (filter !== 'tous') {
      query = query.eq('mode', filter)
    }

    if (selectedCommuneId) {
      query = query.eq('commune_id', selectedCommuneId)
    }

    const { data } = await query
    if (data) setSuggestions(data)
    setLoading(false)
  }

  async function updateStatus(id: number, status: string) {
    const { error } = await supabase.from('suggestions').update({ statut: status }).eq('id', id)
    if (!error) {
      fetchSuggestions()
      if (selectedSuggestion?.id === id) {
        setSelectedSuggestion({...selectedSuggestion, statut: status})
      }
    }
  }

  return (
    <div>
      <header className="header-actions">
        <div>
          <h1>Suggestions & Signalements</h1>
          <p>Gérez les retours et les alertes envoyés par les citoyens.</p>
        </div>
        <div className="flex gap-2">
          <button className={`btn ${filter === 'tous' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter('tous')}>Tous</button>
          <button className={`btn ${filter === 'suggestion' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter('suggestion')}>Suggestions</button>
          <button className={`btn ${filter === 'signalement' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter('signalement')}>Signalements</button>
        </div>
      </header>

      <div className="dashboard-layout mt-6">
        <div className="flex flex-col gap-6">
          {/* Map View for Signalements */}
          <div className="card" style={{ height: '400px', padding: 0, overflow: 'hidden' }}>
            <Map 
              points={suggestions
                .filter(s => s.mode === 'signalement' && s.latitude && s.longitude)
                .map(s => ({
                  lat: s.latitude,
                  lng: s.longitude,
                  popup: `<b>${s.titre}</b><br/>${s.citoyen_nom}`,
                  color: s.statut === 'traité' ? '#10b981' : '#ef4444'
                }))
              } 
            />
          </div>

          {/* List View */}
          <div className="card" style={{ padding: 0 }}>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Citoyen</th>
                    <th>Sujet</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {suggestions.map((s) => (
                    <tr key={s.id} onClick={() => setSelectedSuggestion(s)} style={{ cursor: 'pointer', background: selectedSuggestion?.id === s.id ? 'var(--primary-light)' : 'transparent' }}>
                      <td>{new Date(s.date_soumission).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge ${s.mode === 'suggestion' ? 'badge-primary' : 'badge-danger'}`} style={{ 
                          background: s.mode === 'suggestion' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: s.mode === 'suggestion' ? 'var(--primary)' : 'var(--danger)'
                        }}>
                          {s.mode === 'suggestion' ? 'Suggestion' : 'Signalement'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{s.citoyen_nom}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{s.citoyen_email}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{s.titre}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{s.projets?.titre || 'Général'}</div>
                      </td>
                      <td>
                         <span className={`badge badge-${s.statut === 'nouveau' ? 'warning' : s.statut === 'en_cours' ? 'primary' : 'success'}`}>
                           {s.statut}
                         </span>
                      </td>
                      <td>
                        <button className="btn btn-outline" style={{ padding: '0.4rem' }}>
                          👁️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Detail Sidebar */}
        <div className="card flex flex-col gap-6" style={{ height: 'fit-content', position: 'sticky', top: '2.5rem' }}>
          {selectedSuggestion ? (
            <>
              <div className="flex items-center justify-between">
                <h3 style={{ margin: 0 }}>Détails</h3>
                <span className={`badge badge-${selectedSuggestion.mode === 'suggestion' ? 'primary' : 'danger'}`}>
                  {selectedSuggestion.mode}
                </span>
              </div>

              <div style={{ padding: '1rem', background: 'var(--background)', borderRadius: 12 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>Message</div>
                <p style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>{selectedSuggestion.description}</p>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <span style={{ fontSize: '1rem' }}>📍</span>
                  <span>{selectedSuggestion.quartier || 'Non précisé'}</span>
                </div>
                {selectedSuggestion.mode === 'signalement' && (
                  <div className="flex items-center gap-2 text-sm text-danger">
                    <span style={{ fontSize: '1rem' }}>⚠️</span>
                    <span>Urgence: {selectedSuggestion.priorite || 'Normale'}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <span style={{ fontSize: '1rem' }}>⏰</span>
                  <span>Envoyé le {new Date(selectedSuggestion.date_soumission).toLocaleString()}</span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                <h4 className="mb-4">Changer le statut</h4>
                <div className="grid-responsive" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  <button className="btn btn-outline" style={{ fontSize: '0.8rem' }} onClick={() => updateStatus(selectedSuggestion.id, 'en_cours')}>En cours</button>
                  <button className="btn btn-primary" style={{ fontSize: '0.8rem' }} onClick={() => updateStatus(selectedSuggestion.id, 'traité')}>Traité</button>
                </div>
              </div>

              <button className="btn btn-outline w-full" style={{ color: 'var(--muted)' }} onClick={() => updateStatus(selectedSuggestion.id, 'archivé')}>
                Archiver
              </button>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--muted)' }}>
              <div style={{ fontSize: '3rem', opacity: 0.2, margin: '0 auto 1rem' }}>💬</div>
              <p>Sélectionnez une ligne pour voir les détails.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
