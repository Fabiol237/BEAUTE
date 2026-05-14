import { PlusCircle, Search, Filter, MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react'

const projects = [
  { id: 1, titre: 'Construction Hôpital de District', commune: 'Douala 1er', budget: '150 000 000', type: 'Santé', avancement: 65, statut: 'en_cours' },
  { id: 2, titre: 'Réhabilitation Route Principale', commune: 'Douala 2e', budget: '250 000 000', type: 'Infrastructure', avancement: 40, statut: 'en_cours' },
  { id: 3, titre: 'Éclairage Public Boulevard', commune: 'Douala 3e', budget: '45 000 000', type: 'Énergie', avancement: 100, statut: 'terminé' },
  { id: 4, titre: 'Nouveau Marché Municipal', commune: 'Douala 5e', budget: '120 000 000', type: 'Commerce', avancement: 10, statut: 'en_cours' },
]

export default function ProjetsPage() {
  return (
    <div>
      <header className="flex justify-between align-center mb-4">
        <div>
          <h1>Liste des Projets</h1>
          <p>Gérez et suivez l'ensemble des projets municipaux en temps réel.</p>
        </div>
        <button className="btn btn-primary">
          <PlusCircle size={20} />
          Nouveau projet
        </button>
      </header>

      <div className="card mb-4 flex align-center gap-2" style={{ padding: '1rem' }}>
        <div className="flex align-center gap-2" style={{ flex: 1, background: 'var(--background)', padding: '0.5rem 1rem', borderRadius: 8 }}>
          <Search size={18} color="var(--muted)" />
          <input 
            type="text" 
            placeholder="Rechercher un projet..." 
            style={{ background: 'none', border: 'none', width: '100%', outline: 'none' }}
          />
        </div>
        <button className="btn btn-outline">
          <Filter size={18} />
          Filtres
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
              {projects.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.titre}</div>
                    <small style={{ color: 'var(--muted)' }}>Créé le 12/05/2024</small>
                  </td>
                  <td>{p.commune}</td>
                  <td>{p.budget}</td>
                  <td><span className="badge badge-primary">{p.type}</span></td>
                  <td>
                    <div className="flex align-center gap-2">
                      <div style={{ flex: 1, minWidth: 60, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${p.avancement}%`, height: '100%', background: p.avancement === 100 ? 'var(--success)' : 'var(--primary)' }} />
                      </div>
                      <span>{p.avancement}%</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${p.statut === 'terminé' ? 'badge-success' : 'badge-warning'}`}>
                      {p.statut === 'terminé' ? 'Terminé' : 'En cours'}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-outline" style={{ padding: '0.4rem' }}><Eye size={16} /></button>
                      <button className="btn btn-outline" style={{ padding: '0.4rem' }}><Edit size={16} /></button>
                      <button className="btn btn-outline" style={{ padding: '0.4rem', color: 'var(--danger)' }}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
