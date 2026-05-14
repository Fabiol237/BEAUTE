'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError("Identifiants incorrects. Utilisez le Mode Démo pour la présentation.")
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  const handleDemoMode = () => {
    router.push('/')
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #007A3D 0%, #003d1e 60%, #CE1126 100%)',
      fontFamily: 'Outfit, sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: 460, padding: '20px' }}>
        
        {/* Carte principale */}
        <div style={{ background: 'white', borderRadius: 28, padding: '50px 45px', boxShadow: '0 30px 80px rgba(0,0,0,0.3)' }}>
          
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ width: 70, height: 70, background: 'linear-gradient(135deg, #007A3D, #004d26)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '2rem', boxShadow: '0 8px 20px rgba(0, 122, 61, 0.35)' }}>
              🏛️
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 8px', color: '#1e293b' }}>
              Espace Administration
            </h1>
            <p style={{ color: '#64748b', margin: 0, fontSize: '0.95rem' }}>
              Gestion Numérique des Projets Municipaux
            </p>
          </div>

          {/* Erreur */}
          {error && (
            <div style={{ padding: '14px 18px', background: '#fef2f2', color: '#991b1b', borderRadius: 12, marginBottom: '25px', fontSize: '0.875rem', fontWeight: 500, border: '1px solid #fecaca' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '8px', color: '#374151' }}>
                Identifiant Professionnel
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', border: '2px solid #e2e8f0', borderRadius: 14, padding: '14px 18px' }}>
                <span style={{ fontSize: '1.2rem' }}>📧</span>
                <input
                  type="email"
                  placeholder="nom@commune.cm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ border: 'none', outline: 'none', width: '100%', fontSize: '1rem', background: 'transparent' }}
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '8px', color: '#374151' }}>
                Mot de passe
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', border: '2px solid #e2e8f0', borderRadius: 14, padding: '14px 18px' }}>
                <span style={{ fontSize: '1.2rem' }}>🔒</span>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ border: 'none', outline: 'none', width: '100%', fontSize: '1rem', background: 'transparent' }}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '16px', background: '#007A3D', color: 'white', border: 'none', borderRadius: 14, fontSize: '1rem', fontWeight: 700, cursor: loading ? 'wait' : 'pointer', boxShadow: '0 4px 15px rgba(0,122,61,0.35)' }}
            >
              {loading ? '⏳ Connexion...' : 'Accéder au Tableau de Bord →'}
            </button>
          </form>

          {/* Séparateur */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', margin: '25px 0' }}>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
            <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>OU</span>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
          </div>

          {/* Mode Démo */}
          <button
            onClick={handleDemoMode}
            style={{ width: '100%', padding: '16px', background: 'rgba(252, 209, 22, 0.1)', color: '#92620a', border: '2px dashed #FCD116', borderRadius: 14, fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}
          >
            ✨ Mode Démo — Accès Immédiat
          </button>

          <p style={{ textAlign: 'center', marginTop: '25px', fontSize: '0.875rem' }}>
            <Link href="/citoyens" style={{ color: '#007A3D', textDecoration: 'none', fontWeight: 600 }}>
              ← Retour au Portail Citoyen
            </Link>
          </p>
        </div>

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', marginTop: '25px', fontSize: '0.85rem' }}>
          © 2024 République du Cameroun — MuniTrack v1.0
        </p>
      </div>
    </div>
  )
}
