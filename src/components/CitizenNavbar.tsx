'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function CitizenNavbar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const navLinks = [
    { label: 'Accueil', href: '/citoyens' },
    { label: 'Projets', href: '/citoyens/projets' },
    { label: 'Suggestions', href: '/citoyens/suggestion' },
  ]

  return (
    <nav className="navbar-custom">
      <style jsx>{`
        .navbar-custom {
          background: linear-gradient(135deg, #007A3D, #3d8b6f);
          padding: 0.75rem 2rem;
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: sticky;
          top: 0;
          z-index: 1000;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .brand { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 1.25rem; color: white; text-decoration: none; }
        .brand img { height: 35px; background: white; padding: 5px; border-radius: 8px; }
        .nav-links { display: flex; gap: 2rem; }
        .nav-link { color: rgba(255,255,255,0.8); text-decoration: none; font-weight: 500; transition: color 0.2s; }
        .nav-link:hover, .nav-link.active { color: #FCD116; }
        
        @media (max-width: 768px) {
          .nav-links { display: none; }
          .mobile-toggle { display: block; }
        }
        @media (min-width: 769px) {
          .mobile-toggle { display: none; }
        }
      `}</style>
      
      <Link href="/citoyens" className="brand">
        <img src="/assets/images/logo.png" alt="Logo" />
        Portail Citoyen
      </Link>

      <div className="nav-links">
        {navLinks.map((link) => (
          <Link 
            key={link.href} 
            href={link.href} 
            className={`nav-link ${pathname === link.href ? 'active' : ''}`}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <button className="mobile-toggle" onClick={() => setIsOpen(!isOpen)} style={{ background: 'none', border: 'none', color: 'white' }}>
        {isOpen ? <X size={28} /> : <Menu size={28} />}
      </button>

      {/* Mobile Menu Simplified */}
      {isOpen && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#007A3D', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', zIndex: 999 }}>
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setIsOpen(false)} style={{ color: 'white', textDecoration: 'none' }}>
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
