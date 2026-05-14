// import { PlusCircle, Search, Filter, MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'

export default async function ProjetsPage({ searchParams }: { searchParams: Promise<{ commune?: string }> }) {
  const supabase = await createClient()
  const params = await searchParams
  const selectedCommuneId = params.commune

  let query = supabase
    .from('projets')
    .select('*, communes(nom), types_projets(nom)')
    .order('created_at', { ascending: false })

  if (selectedCommuneId) {
    query = query.eq('commune_id', selectedCommuneId)
  }

  const { data: projects } = await query

  return (
    <div>
      <header className="header-actions mb-6">
        <div>
          <h1>Liste des Projets</h1>
          <p>Gérez et suivez l'ensemble des chantiers.</p>
        </div>
        <Link href="/projets/nouveau" className="btn btn-primary">
          ➕ Nouveau projet
        </Link>
      </header>

      <div className="card mb-4 flex align-center gap-2" style={{ padding: '1rem' }}>
        <div className="flex align-center gap-2" style={{ flex: 1, background: 'var(--background)', padding: '0.5rem 1rem', borderRadius: 8 }}>
          <span>🔍</span>
          <input 
            type="text" 
            placeholder="Rechercher un projet..." 
            style={{ background: 'none', border: 'none', width: '100%', outline: 'none' }}
          />
        </div>
        <button className="btn btn-outline">
          🔽 Filtres
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Titre du Projet</th>
                <th>Commune</th>
                <th>Budget (FCFA)</th>
                <th>Type</th>
                <th>Avancement</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects?.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.titre}</div>
                    <small style={{ color: 'var(--muted)' }}>
                      Créé le {new Date(p.created_at).toLocaleDateString('fr-FR')}
                    </small>
                  </td>
                  <td>{(p.communes as any)?.nom}</td>
                  <td>{Number(p.budget_actuel).toLocaleString('fr-FR')}</td>
                  <td><span className="badge badge-primary">{(p.types_projets as any)?.nom}</span></td>
                  <td>
                    <div className="flex align-center gap-2">
                      <div style={{ flex: 1, minWidth: 60, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${p.avancement_physique}%`, height: '100%', background: p.avancement_physique === 100 ? 'var(--success)' : 'var(--primary)' }} />
                      </div>
                      <span>{p.avancement_physique}%</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${p.statut === 'terminé' ? 'badge-success' : 'badge-warning'}`}>
                      {p.statut === 'terminé' ? 'Terminé' : 'En cours'}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <Link href={`/projets/${p.id}`} className="btn btn-outline" style={{ padding: '0.4rem' }}>👁️</Link>
                      <Link href={`/projets/${p.id}`} className="btn btn-outline" style={{ padding: '0.4rem' }}>✏️</Link>
                    </div>
                  </td>
                </tr>
              ))}
              {(!projects || projects.length === 0) && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>Aucun projet trouvé.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
