'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const menuItems = [
  { icon: '📊', label: 'Dashboard', href: '/' },
  { icon: '🏗️', label: 'Projets', href: '/projets' },
  { icon: '💰', label: 'Budget', href: '/budget' },
  { icon: '📍', label: 'Carte', href: '/carte' },
  { icon: '👥', label: 'Utilisateurs', href: '/utilisateurs' },
  { icon: '🌍', label: 'Portail Citoyen', href: '/citoyens' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <>
      {menuItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '0.875rem 1rem',
              borderRadius: '12px',
              marginBottom: '4px',
              textDecoration: 'none',
              color: isActive ? '#3b82f6' : '#64748b',
              background: isActive ? '#eff6ff' : 'transparent',
              fontWeight: isActive ? 700 : 500,
              fontSize: '0.9375rem',
              transition: 'all 0.15s',
              border: '1px solid transparent',
              borderColor: isActive ? 'rgba(59,130,246,0.1)' : 'transparent',
            }}
          >
            <span style={{ fontSize: '1.2rem', width: 24, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
            {item.label}
          </Link>
        )
      })}
    </>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <header className="sidebar">
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #007A3D, #1d4ed8)', width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>
            🏛️
          </div>
          <div>
            <span style={{ fontWeight: 800, fontSize: '1.2rem', display: 'block', lineHeight: 1.1 }}>MuniTrack</span>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>DOUALA · CAMEROUN</span>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav style={{ flex: 1 }} className="sidebar-footer mobile-hidden">
          <NavLinks />
        </nav>

        {/* Desktop Logout */}
        <div className="sidebar-footer mobile-hidden" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
          <Link href="/login" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0.875rem 1rem', borderRadius: '12px', textDecoration: 'none', color: '#ef4444', fontWeight: 600 }}>
            <span style={{ fontSize: '1.2rem' }}>🚪</span> Déconnexion
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="desktop-hidden"
          onClick={() => setIsOpen(true)}
          aria-label="Ouvrir le menu"
          style={{ background: '#f1f5f9', border: 'none', borderRadius: '10px', width: 42, height: 42, cursor: 'pointer', fontSize: '1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          ☰
        </button>
      </header>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="mobile-nav-overlay"
          onClick={() => setIsOpen(false)}
        >
          <div className="mobile-menu" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <span style={{ fontWeight: 800, fontSize: '1.3rem' }}>Menu</span>
              <button onClick={() => setIsOpen(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
            </div>

            <nav style={{ flex: 1 }}>
              <NavLinks onClick={() => setIsOpen(false)} />
            </nav>

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem', marginTop: 'auto' }}>
              <Link href="/login" onClick={() => setIsOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0.875rem 1rem', textDecoration: 'none', color: '#ef4444', fontWeight: 600 }}>
                🚪 Déconnexion
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
