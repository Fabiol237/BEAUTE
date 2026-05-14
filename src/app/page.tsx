import { Folder, Clock, Banknote, CheckCircle, PlusCircle, ArrowRight, Eye } from 'lucide-react'
import StatCard from '@/components/StatCard'
import DashboardCharts from '@/components/DashboardCharts'

// Mock data for initial presentation
const stats = [
  { label: 'Total Projets', value: 24, icon: Folder, color: 'primary' as const },
  { label: 'En cours', value: 12, icon: Clock, color: 'warning' as const },
  { label: 'Budget Total', value: '850M FCFA', icon: Banknote, color: 'success' as const },
  { label: 'Terminés', value: 8, icon: CheckCircle, color: 'primary' as const },
]

const recentProjects = [
  { id: 1, titre: 'Construction Hôpital', commune: 'Douala 1er', budget: '150M', avancement: 65, statut: 'en_cours' },
  { id: 2, titre: 'Réhabilitation Route', commune: 'Douala 2e', budget: '250M', avancement: 40, statut: 'en_cours' },
  { id: 3, titre: 'Éclairage Public', commune: 'Douala 3e', budget: '45M', avancement: 100, statut: 'terminé' },
]

export default function Dashboard() {
  return (
    <div>
      <header className="flex justify-between align-center mb-4">
        <div>
          <h1>Tableau de bord</h1>
          <p>Bienvenue sur votre espace de gestion des projets municipaux.</p>
        </div>
        <button className="btn btn-primary">
          <PlusCircle size={20} />
          Nouveau projet
        </button>
      </header>

      <div className="stat-grid">
        {stats.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      <DashboardCharts />

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginTop: '2rem' }}>
        <div className="card">
          <div className="flex justify-between align-center mb-4">
            <h3>Derniers projets</h3>
            <button className="btn btn-outline" style={{ fontSize: '0.875rem' }}>
              Voir tout <ArrowRight size={16} />
            </button>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Projet</th>
                  <th>Commune</th>
                  <th>Budget</th>
                  <th>Avancement</th>
                  <th>Statut</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentProjects.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.titre}</strong></td>
                    <td>{p.commune}</td>
                    <td>{p.budget}</td>
                    <td>
                      <div className="flex align-center gap-2">
                        <div style={{ flex: 1, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
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
                      <button className="btn btn-outline" style={{ padding: '0.4rem' }}>
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid var(--warning)' }}>
          <h3>Alertes & Retards</h3>
          <div className="mt-4">
            {[1, 2].map((i) => (
              <div key={i} style={{ padding: '1rem 0', borderBottom: i === 1 ? '1px solid var(--border)' : 'none' }}>
                <div className="flex justify-between align-center">
                  <strong>Réhabilitation Axe Sud</strong>
                  <span className="badge badge-danger">Retard 12j</span>
                </div>
                <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>Commune de Douala 4e</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
