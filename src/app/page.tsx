import { Folder, Clock, Banknote, CheckCircle, PlusCircle, ArrowRight, Eye } from 'lucide-react'
import StatCard from '@/components/StatCard'
import DashboardCharts from '@/components/DashboardCharts'
import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'

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
    { label: 'Terminés', value: projetsTermines || 0, icon: CheckCircle, color: 'success' as const },
  ]

  return (
    <div>
      <header className="header-actions mb-6">
        <div>
          <h1>Tableau de Bord</h1>
          <p>Supervision des projets de la commune.</p>
        </div>
        <Link href="/projets/nouveau" className="btn btn-primary">
          <PlusCircle size={20} />
          Nouveau Projet
        </Link>
      </header>

      <div className="stat-grid">
        {stats.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      <DashboardCharts />

      <div className="dashboard-layout mt-6">
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 gap-4">
            <h3 style={{ margin: 0 }}>Derniers Projets</h3>
            <Link href="/projets" className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', width: 'auto' }}>
              Voir tout <ArrowRight size={16} />
            </Link>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Projet</th>
                  <th>Commune</th>
                  <th className="mobile-hidden">Budget</th>
                  <th>Progrès</th>
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
                      <div className="flex items-center gap-3">
                        <div style={{ flex: 1, minWidth: 60, height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${p.avancement_physique}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), #60a5fa)', borderRadius: 4 }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{p.avancement_physique}%</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${p.statut === 'terminé' ? 'badge-success' : 'badge-warning'}`}>
                        {p.statut === 'terminé' ? 'Terminé' : 'En cours'}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-outline" style={{ padding: '0.5rem', borderRadius: 10 }}>
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ background: 'linear-gradient(180deg, #ffffff, #f8fafc)', borderLeft: '4px solid var(--warning)' }}>
          <h3 className="mb-4">Alertes Récentes</h3>
          <div className="flex flex-col gap-4">
            <div style={{ padding: '1rem', borderRadius: 12, background: 'var(--warning-light)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--warning)', textTransform: 'uppercase' }}>Retard</span>
              <p style={{ color: '#92400e', fontWeight: 600, marginTop: '4px', fontSize: '0.9rem' }}>Route de Bépanda : +15 jours</p>
            </div>
            <div style={{ padding: '1rem', borderRadius: 12, background: 'var(--danger-light)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--danger)', textTransform: 'uppercase' }}>Budget</span>
              <p style={{ color: '#991b1b', fontWeight: 600, marginTop: '4px', fontSize: '0.9rem' }}>Hôpital : Dépassement 5%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
