'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Users, UserPlus, Mail, Shield, ShieldCheck, Eye, Trash2, Search, Filter } from 'lucide-react'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const [userRes, roleRes] = await Promise.all([
      supabase.from('profiles').select('*, roles(nom)').order('updated_at', { ascending: false }),
      supabase.from('roles').select('*')
    ])

    if (userRes.data) setUsers(userRes.data)
    if (roleRes.data) setRoles(roleRes.data)
    setLoading(false)
  }

  const filteredUsers = users.filter(u => 
    u.nom?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.prenom?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div>
      <header className="header-actions">
        <div>
          <h1>Gestion des Utilisateurs</h1>
          <p>Administration des accès et des rôles de l'équipe.</p>
        </div>
        <button className="btn btn-primary">
          <UserPlus size={20} /> Nouvel Utilisateur
        </button>
      </header>

      <div className="stat-grid mt-6">
        <div className="card flex items-center gap-4">
           <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '12px', borderRadius: '12px' }}>
              <Users size={24} />
           </div>
           <div>
              <div className="text-xs font-bold text-muted uppercase">Total</div>
              <div className="text-xl font-bold">{users.length}</div>
           </div>
        </div>
        <div className="card flex items-center gap-4">
           <div style={{ background: 'var(--success-light)', color: 'var(--success)', padding: '12px', borderRadius: '12px' }}>
              <ShieldCheck size={24} />
           </div>
           <div>
              <div className="text-xs font-bold text-muted uppercase">Actifs</div>
              <div className="text-xl font-bold">{users.filter(u => u.statut === 'actif').length}</div>
           </div>
        </div>
        <div className="card flex items-center gap-4">
           <div style={{ background: 'var(--warning-light)', color: 'var(--warning)', padding: '12px', borderRadius: '12px' }}>
              <Shield size={24} />
           </div>
           <div>
              <div className="text-xs font-bold text-muted uppercase">Admins</div>
              <div className="text-xl font-bold">{users.filter(u => u.roles?.nom === 'Administrateur').length}</div>
           </div>
        </div>
      </div>

      <div className="card mt-6" style={{ padding: 0 }}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--muted)' }} />
            <input 
              className="form-control" 
              placeholder="Rechercher un membre..." 
              style={{ paddingLeft: '2.5rem' }} 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
            <Filter size={18} /> Filtres
          </button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th className="mobile-hidden">Rôle</th>
                <th>Statut</th>
                <th className="mobile-hidden">Dernière maj</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div style={{ width: 40, height: 40, background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                        {user.nom?.[0]}{user.prenom?.[0]}
                      </div>
                      <div>
                        <div className="font-bold">{user.nom} {user.prenom}</div>
                        <div className="text-xs text-muted">ID: {user.id.substring(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="mobile-hidden">
                    <span className={`badge badge-${user.roles?.nom === 'Administrateur' ? 'danger' : 'primary'}`}>
                      {user.roles?.nom || 'Sans rôle'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                       <div style={{ width: 8, height: 8, borderRadius: '50%', background: user.statut === 'actif' ? 'var(--success)' : 'var(--danger)' }} />
                       <span className="text-sm">{user.statut === 'actif' ? 'Actif' : 'Inactif'}</span>
                    </div>
                  </td>
                  <td className="mobile-hidden text-sm text-muted">
                    {new Date(user.updated_at).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="flex gap-2">
                       <button className="btn btn-outline" style={{ padding: '0.4rem' }}><Eye size={16} /></button>
                       <button className="btn btn-outline text-danger" style={{ padding: '0.4rem' }}><Trash2 size={16} /></button>
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
