import { Users, UserPlus, Shield, Mail, Edit, Trash2 } from 'lucide-react'

const users = [
  { id: 1, nom: 'Système', prenom: 'Admin', email: 'admin@commune.cm', role: 'Administrateur', statut: 'actif' },
  { id: 2, nom: 'Nguele', prenom: 'Jean', email: 'j.nguele@commune.cm', role: 'Gestionnaire', statut: 'actif' },
  { id: 3, nom: 'Kamga', prenom: 'Marie', email: 'm.kamga@commune.cm', role: 'Lecteur', statut: 'suspendu' },
]

export default function UsersPage() {
  return (
    <div>
      <header className="flex justify-between align-center mb-4">
        <div>
          <h1>Gestion des Utilisateurs</h1>
          <p>Gérez les accès et les rôles des agents municipaux.</p>
        </div>
        <button className="btn btn-primary">
          <UserPlus size={20} />
          Nouvel utilisateur
        </button>
      </header>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th>Dernière connexion</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                        {u.prenom[0]}{u.nom[0]}
                      </div>
                      <div>
                        <strong>{u.prenom} {u.nom}</strong>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex align-center gap-2">
                      <Mail size={14} color="var(--muted)" />
                      {u.email}
                    </div>
                  </td>
                  <td>
                    <div className="flex align-center gap-2">
                      <Shield size={14} color="var(--primary)" />
                      {u.role}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${u.statut === 'actif' ? 'badge-success' : 'badge-danger'}`}>
                      {u.statut === 'actif' ? 'Actif' : 'Suspendu'}
                    </span>
                  </td>
                  <td>Il y a 2h</td>
                  <td>
                    <div className="flex gap-2">
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
