import { Banknote, TrendingDown, TrendingUp, CheckCircle, Clock, PlusCircle } from 'lucide-react'
import StatCard from '@/components/StatCard'
import { createClient } from '@/lib/supabase-server'

export default async function BudgetPage() {
  const supabase = await createClient()

  // Fetch stats and expenses
  const { data: depenses } = await supabase
    .from('depenses')
    .select('*, projets(titre)')
    .order('date_depense', { ascending: false })

  const { data: budgetData } = await supabase.from('projets').select('budget_actuel')
  
  const totalBudget = budgetData?.reduce((acc, p) => acc + Number(p.budget_actuel), 0) || 0
  const totalDepenses = depenses?.filter(d => d.validee).reduce((acc, d) => acc + Number(d.montant), 0) || 0
  const enAttente = depenses?.filter(d => !d.validee).reduce((acc, d) => acc + Number(d.montant), 0) || 0
  const restant = totalBudget - totalDepenses

  const budgetStats = [
    { label: 'Budget Total', value: `${(totalBudget / 1000000).toFixed(1)}M FCFA`, icon: Banknote, color: 'primary' as const },
    { label: 'Dépenses Validées', value: `${(totalDepenses / 1000000).toFixed(1)}M FCFA`, icon: TrendingDown, color: 'danger' as const },
    { label: 'Budget Restant', value: `${(restant / 1000000).toFixed(1)}M FCFA`, icon: TrendingUp, color: 'success' as const },
    { label: 'En attente', value: `${(enAttente / 1000000).toFixed(1)}M FCFA`, icon: Clock, color: 'warning' as const },
  ]

  return (
    <div>
      <header className="flex justify-between align-center mb-4">
        <div>
          <h1>Suivi Budgétaire</h1>
          <p>Consultez l'état des finances et gérez les dépenses des projets.</p>
        </div>
        <button className="btn btn-primary">
          <PlusCircle size={20} />
          Nouvelle dépense
        </button>
      </header>

      <div className="stat-grid">
        {budgetStats.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      <div className="card">
        <h3>Dernières dépenses</h3>
        <div className="table-container mt-4">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Projet</th>
                <th>Description</th>
                <th>Montant (FCFA)</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {depenses?.map((d) => (
                <tr key={d.id}>
                  <td>{new Date(d.date_depense).toLocaleDateString('fr-FR')}</td>
                  <td><strong>{(d.projets as any)?.titre}</strong></td>
                  <td>{d.description}</td>
                  <td style={{ fontWeight: 600 }}>{Number(d.montant).toLocaleString('fr-FR')}</td>
                  <td>
                    <span className={`badge ${d.validee ? 'badge-success' : 'badge-warning'}`}>
                      {d.validee ? 'Validée' : 'En attente'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-outline" style={{ padding: '0.4rem' }}>
                      <CheckCircle size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {(!depenses || depenses.length === 0) && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>Aucune dépense enregistrée.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
