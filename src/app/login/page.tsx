'use client'

import { useState } from 'react'
import { FolderKanban, Lock, Mail, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000
    }}>
      <div className="card" style={{ width: '100%', maxWidth: 400, padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            background: 'var(--primary)', 
            width: 48, 
            height: 48, 
            borderRadius: 12, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: 'white',
            margin: '0 auto 1rem'
          }}>
            <FolderKanban size={28} />
          </div>
          <h2 style={{ marginBottom: '0.25rem' }}>Connexion</h2>
          <p>Suivi de Projets Municipaux</p>
        </div>

        <form onSubmit={(e) => e.preventDefault()}>
          <div className="mb-4">
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Email
            </label>
            <div className="flex align-center gap-2" style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '0.75rem 1rem' }}>
              <Mail size={18} color="var(--muted)" />
              <input 
                type="email" 
                placeholder="nom@commune.cm" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ border: 'none', outline: 'none', width: '100%' }}
              />
            </div>
          </div>

          <div className="mb-4">
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Mot de passe
            </label>
            <div className="flex align-center gap-2" style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '0.75rem 1rem' }}>
              <Lock size={18} color="var(--muted)" />
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ border: 'none', outline: 'none', width: '100%' }}
              />
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }}>
            Se connecter
            <ArrowRight size={18} />
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.875rem', marginTop: '1.5rem' }}>
          Mot de passe oublié ? <span style={{ color: 'var(--primary)', cursor: 'pointer' }}>Contactez l'administrateur</span>
        </p>
      </div>
    </div>
  )
}
