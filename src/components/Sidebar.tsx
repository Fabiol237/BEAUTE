'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FolderKanban, Banknote, Map, Users, LogOut, Menu, X, PlusCircle } from 'lucide-react'

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: FolderKanban, label: 'Projets', href: '/projets' },
  { icon: Banknote, label: 'Budget', href: '/budget' },
  { icon: Map, label: 'Carte', href: '/carte' },
  { icon: Users, label: 'Utilisateurs', href: '/utilisateurs' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const toggleMenu = () => setIsOpen(!isOpen)

  return (
    <>
      <header className="sidebar">
        <div className="flex items-center gap-4">
          <div style={{ background: 'linear-gradient(135deg, var(--primary), #1d4ed8)', width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)' }}>
            <FolderKanban size={24} />
          </div>
          <div>
            <span style={{ fontWeight: 800, fontSize: '1.25rem', display: 'block', lineHeight: 1 }}>MuniTrack</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Douala v1.0</span>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          <select 
            className="form-select" 
            style={{ fontSize: '0.85rem', fontWeight: 600 }}
            onChange={(e) => {
              const val = e.target.value;
              window.location.href = val ? `/?commune=${val}` : '/';
            }}
          >
            <option value="">Toutes les Mairies</option>
            <option value="1">Douala 1er</option>
            <option value="2">Douala 2e</option>
            <option value="3">Douala 3e</option>
            <option value="4">Douala 4e</option>
            <option value="5">Douala 5e</option>
          </select>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="desktop-hidden" 
          onClick={toggleMenu}
          style={{ width: 44, height: 44, background: 'var(--primary-light)', borderRadius: 12, color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Desktop Menu */}
        <nav className="mobile-hidden" style={{ flex: 1, marginTop: '3rem', display: 'flex', flexDirection: 'column' }}>
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className="flex items-center gap-3"
                style={{
                  padding: '1rem 1.25rem',
                  borderRadius: '12px',
                  marginBottom: '0.5rem',
                  color: isActive ? 'var(--primary)' : 'var(--muted)',
                  background: isActive ? 'var(--primary-light)' : 'transparent',
                  fontWeight: isActive ? 700 : 500,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: isActive ? '1px solid rgba(59, 130, 246, 0.1)' : '1px solid transparent'
                }}
              >
                <Icon size={22} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="mobile-hidden" style={{ borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
          <Link 
            href="/login"
            className="flex items-center gap-3" 
            style={{ color: 'var(--danger)', width: '100%', padding: '1rem', fontWeight: 600, borderRadius: 12 }}
          >
            <LogOut size={22} />
            Déconnexion
          </Link>
        </div>
      </header>

      {/* Mobile Menu Navigation */}
      {isOpen && (
        <div className="mobile-nav-overlay" onClick={toggleMenu}>
          <div className="mobile-menu" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <span style={{ fontWeight: 800, fontSize: '1.5rem' }}>Menu</span>
              <button onClick={toggleMenu} style={{ background: '#f1f5f9', p: 2, borderRadius: '50%' }}>
                <X size={20} />
              </button>
            </div>
            
            <nav style={{ flex: 1 }}>
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    onClick={toggleMenu}
                    className="flex items-center gap-4"
                    style={{
                      padding: '1.25rem',
                      borderRadius: '16px',
                      marginBottom: '0.75rem',
                      color: isActive ? 'var(--primary)' : 'var(--muted)',
                      background: isActive ? 'var(--primary-light)' : 'transparent',
                      fontWeight: isActive ? 700 : 600,
                      fontSize: '1.1rem'
                    }}
                  >
                    <Icon size={26} />
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            <Link href="/projets/nouveau" className="btn btn-primary mb-6" onClick={toggleMenu}>
              <PlusCircle size={20} />
              Nouveau Projet
            </Link>

            <Link 
              href="/login"
              className="flex items-center gap-4" 
              style={{ color: 'var(--danger)', width: '100%', padding: '1.25rem', fontWeight: 700, borderTop: '1px solid var(--border)' }}
            >
              <LogOut size={26} />
              Déconnexion
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
