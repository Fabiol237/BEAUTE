'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export default function CitizenNavbar() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  const navLinks = [
    { label: 'Accueil', href: '/citoyens' },
    { label: 'Projets', href: '/citoyens/projets' },
    { label: 'Carte', href: '/citoyens/carte' },
    { label: 'Suggestions', href: '/citoyens/suggestion' },
    { label: 'Admin', href: '/login' },
  ]

  return (
    <>
      <nav style={{
        background: '#007A3D',
        padding: '0 20px',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '64px',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        fontFamily: 'Outfit, sans-serif',
      }}>
        {/* Logo */}
        <Link href="/citoyens" style={{ color: 'white', textDecoration: 'none', fontWeight: 800, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          🇨🇲 <span>Mairie Connect</span>
        </Link>

        {/* Desktop Links */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }} className="citizen-nav-desktop">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                color: 'white',
                textDecoration: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: pathname === link.href ? 700 : 400,
                background: pathname === link.href ? 'rgba(255,255,255,0.2)' : 'transparent',
                fontSize: '0.95rem',
                whiteSpace: 'nowrap',
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Mobile Hamburger */}
        <button
          className="citizen-nav-mobile"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.8rem', padding: '5px', lineHeight: 1 }}
          aria-label="Menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </nav>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div
          className="citizen-nav-mobile"
          style={{
            position: 'fixed',
            top: '64px',
            left: 0,
            right: 0,
            background: '#005a2d',
            zIndex: 999,
            padding: '10px 0',
            boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
          }}
        >
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'block',
                color: 'white',
                textDecoration: 'none',
                padding: '14px 25px',
                fontWeight: pathname === link.href ? 700 : 400,
                borderLeft: pathname === link.href ? '4px solid #FCD116' : '4px solid transparent',
                fontSize: '1.05rem',
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}

      <style>{`
        .citizen-nav-desktop { display: flex !important; }
        .citizen-nav-mobile { display: none !important; }
        @media (max-width: 768px) {
          .citizen-nav-desktop { display: none !important; }
          .citizen-nav-mobile { display: block !important; }
        }
      `}</style>
    </>
  )
}
