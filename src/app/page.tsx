import { Folder, Clock, Banknote, CheckCircle, PlusCircle, ArrowRight, Eye } from 'lucide-react'
import StatCard from '@/components/StatCard'
import DashboardCharts from '@/components/DashboardCharts'
import { createClient } from '@/lib/supabase-server'

export default async function Dashboard() {
  const supabase = await createClient()

  // Fetch stats
  const { count: totalProjets } = await supabase.from('projets').select('*', { count: 'exact', head: true })
  const { count: projetsEnCours } = await supabase.from('projets').select('*', { count: 'exact', head: true }).eq('statut', 'en_cours')
  const { count: projetsTermines } = await supabase.from('projets').select('*', { count: 'exact', head: true }).eq('statut', 'terminé')
  
  const { data: budgetData } = await supabase.from('projets').select('budget_actuel')
  const totalBudget = budgetData?.reduce((acc, p) => acc + Number(p.budget_actuel), 0) || 0

  // Fetch recent projects
  const { data: recentProjects } = await supabase
    .from('projets')
    .select('*, communes(nom)')
    .order('created_at', { ascending: false })
    .limit(5)

  const stats = [
    { label: 'Total Projets', value: totalProjets || 0, icon: Folder, color: 'primary' as const },
    { label: 'En cours', value: projetsEnCours || 0, icon: Clock, color: 'warning' as const },
    { label: 'Budget Total', value: `${(totalBudget / 1000000).toFixed(1)}M`, icon: Banknote, color: 'success' as const },
    { label: 'Terminés', value: projetsTermines || 0, icon: CheckCircle, color: 'primary' as const },
  ]

  return (
    <div>
      <header className="header-actions mb-4">
        <div>
          <h1>Tableau de bord</h1>
          <p>Bienvenue sur votre espace de gestion.</p>
        </div>
        <button className="btn btn-primary w-full-mobile">
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

      <div className="dashboard-layout">
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
                  <th className="mobile-hidden">Budget</th>
                  <th>Avancement</th>
                  <th>Statut</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentProjects?.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.titre}</strong></td>
                    <td>{(p.communes as any)?.nom}</td>
                    <td className="mobile-hidden">{(Number(p.budget_actuel) / 1000000).toFixed(1)}M</td>
                    <td>
                      <div className="flex align-center gap-2">
                        <div style={{ flex: 1, minWidth: 40, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${p.avancement_physique}%`, height: '100%', background: p.avancement_physique === 100 ? 'var(--success)' : 'var(--primary)' }} />
                        </div>
                        <span style={{ fontSize: '0.75rem' }}>{p.avancement_physique}%</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${p.statut === 'terminé' ? 'badge-success' : 'badge-warning'}`}>
                        {p.statut === 'terminé' ? 'OK' : '...'}
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
          <h3>Alertes</h3>
          <div className="mt-4">
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Aucune alerte critique.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
