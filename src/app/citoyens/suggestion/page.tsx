'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import CitizenNavbar from '@/components/CitizenNavbar'
import Link from 'next/link'

function SuggestionForm() {
  const searchParams = useSearchParams()
  const projetId = searchParams.get('projet')

  const [form, setForm] = useState({ nom: '', email: '', quartier: '', message: '', type: 'suggestion' })
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleChange(e: any) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: any) {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 800)) // Simuler un envoi
    setLoading(false)
    setSent(true)
  }

  if (sent) return (
    <div style={{ minHeight: '100vh', fontFamily: 'Outfit, sans-serif', background: '#f0f4f8' }}>
      <CitizenNavbar />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', textAlign: 'center' }}>
        <div style={{ width: 90, height: 90, background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', marginBottom: 24 }}>✅</div>
        <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 800, marginBottom: 12, color: '#1e293b' }}>Merci pour votre contribution !</h1>
        <p style={{ color: '#64748b', maxWidth: 480, lineHeight: 1.7, marginBottom: 32 }}>
          Votre suggestion a bien été transmise à la mairie. Notre équipe l'examinera dans les plus brefs délais.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/citoyens" style={{ background: '#007A3D', color: 'white', padding: '14px 28px', borderRadius: 14, textDecoration: 'none', fontWeight: 700 }}>
            ← Retour à l'accueil
          </Link>
          <button onClick={() => setSent(false)} style={{ background: 'white', color: '#007A3D', padding: '14px 28px', borderRadius: 14, border: '2px solid #007A3D', fontWeight: 700, cursor: 'pointer' }}>
            Nouvelle suggestion
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', fontFamily: 'Outfit, sans-serif' }}>
      <CitizenNavbar />

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #1e293b, #334155)', padding: 'clamp(30px, 6vw, 60px) 20px', textAlign: 'center', color: 'white' }}>
        <div style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', marginBottom: 12 }}>💡</div>
        <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 800, margin: '0 0 10px', color: 'white' }}>Faire une Suggestion</h1>
        <p style={{ color: '#94a3b8', maxWidth: 540, margin: '0 auto', fontSize: 'clamp(0.9rem, 2vw, 1.05rem)', lineHeight: 1.6 }}>
          Votre voix compte. Signalez un problème ou proposez une amélioration pour votre commune.
        </p>
      </div>

      {/* Form Card */}
      <div style={{ maxWidth: 680, margin: 'clamp(20px, 5vw, 48px) auto', padding: '0 clamp(12px, 4vw, 20px)' }}>
        <form onSubmit={handleSubmit} style={{ background: 'white', borderRadius: 24, padding: 'clamp(24px, 5vw, 44px)', boxShadow: '0 10px 40px rgba(0,0,0,0.07)' }}>

          {/* Type de contribution */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: 10, color: '#1e293b' }}>Type de contribution</label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[
                { val: 'suggestion', label: '💡 Suggestion', color: '#007A3D' },
                { val: 'probleme', label: '⚠️ Signalement', color: '#ef4444' },
                { val: 'felicitation', label: '👍 Félicitation', color: '#3b82f6' },
              ].map(opt => (
                <button type="button" key={opt.val} onClick={() => setForm({ ...form, type: opt.val })} style={{
                  flex: '1 1 auto', padding: '10px 16px', borderRadius: 12, border: '2px solid',
                  borderColor: form.type === opt.val ? opt.color : '#e2e8f0',
                  background: form.type === opt.val ? opt.color + '15' : 'white',
                  color: form.type === opt.val ? opt.color : '#64748b',
                  fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem',
                }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Champs 2 colonnes sur desktop */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#374151', fontSize: '0.9rem' }}>Nom complet *</label>
              <input name="nom" required value={form.nom} onChange={handleChange} placeholder="Jean Mballa" style={{ width: '100%', padding: '12px 14px', border: '2px solid #e2e8f0', borderRadius: 12, fontSize: '0.95rem', fontFamily: 'Outfit, sans-serif', outline: 'none', boxSizing: 'border-box' as any }}
                onFocus={e => e.target.style.borderColor = '#007A3D'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#374151', fontSize: '0.9rem' }}>Email (optionnel)</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="nom@email.com" style={{ width: '100%', padding: '12px 14px', border: '2px solid #e2e8f0', borderRadius: 12, fontSize: '0.95rem', fontFamily: 'Outfit, sans-serif', outline: 'none', boxSizing: 'border-box' as any }}
                onFocus={e => e.target.style.borderColor = '#007A3D'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#374151', fontSize: '0.9rem' }}>Quartier / Commune</label>
            <input name="quartier" value={form.quartier} onChange={handleChange} placeholder="Ex: Bonamoussadi, Bépanda..." style={{ width: '100%', padding: '12px 14px', border: '2px solid #e2e8f0', borderRadius: 12, fontSize: '0.95rem', fontFamily: 'Outfit, sans-serif', outline: 'none', boxSizing: 'border-box' as any }}
              onFocus={e => e.target.style.borderColor = '#007A3D'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: '#374151', fontSize: '0.9rem' }}>Votre message *</label>
            <textarea name="message" required rows={5} value={form.message} onChange={handleChange} placeholder="Décrivez votre suggestion ou signalement en détail..." style={{ width: '100%', padding: '12px 14px', border: '2px solid #e2e8f0', borderRadius: 12, fontSize: '0.95rem', fontFamily: 'Outfit, sans-serif', outline: 'none', resize: 'vertical', boxSizing: 'border-box' as any }}
              onFocus={e => e.target.style.borderColor = '#007A3D'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
            <div style={{ textAlign: 'right', fontSize: '0.78rem', color: '#94a3b8', marginTop: 4 }}>{form.message.length} caractères</div>
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '16px', background: loading ? '#94a3b8' : '#007A3D',
            color: 'white', border: 'none', borderRadius: 14,
            fontWeight: 800, fontSize: '1.05rem', cursor: loading ? 'wait' : 'pointer',
            fontFamily: 'Outfit, sans-serif', boxShadow: loading ? 'none' : '0 4px 15px rgba(0,122,61,0.3)',
            transition: 'all 0.2s',
          }}>
            {loading ? '⏳ Envoi en cours...' : '🚀 Envoyer ma suggestion'}
          </button>
        </form>

        {/* Contact alternatif */}
        <div style={{ marginTop: 20, padding: '20px 24px', background: 'white', borderRadius: 18, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }}>
          <span style={{ fontSize: '2rem' }}>📞</span>
          <div>
            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>Besoin d'aide immédiate ?</div>
            <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Contactez votre mairie : <strong>+237 6XX XXX XXX</strong></div>
          </div>
        </div>
      </div>

      <footer style={{ background: '#1e293b', color: 'rgba(255,255,255,0.6)', padding: '30px 20px', textAlign: 'center', marginTop: 40, fontSize: '0.85rem' }}>
        © 2024 République du Cameroun — MuniTrack v1.0
      </footer>
    </div>
  )
}

export default function SuggestionPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '100px' }}>Chargement du formulaire...</div>}>
      <SuggestionForm />
    </Suspense>
  )
}
