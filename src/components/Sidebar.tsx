'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FolderKanban, Banknote, Map, Users, LogOut, Menu, X } from 'lucide-react'

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

  const toggleMenu = () => setIsOpen(!isOpen)

  return (
    <>
      <aside className="sidebar">
        <div className="flex align-center gap-2">
          <div style={{ background: 'var(--primary)', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <FolderKanban size={20} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '1.25rem' }}>Projets Mun.</span>
        </div>

        {/* Mobile Toggle */}
        <button className="desktop-hidden p-2" onClick={toggleMenu}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Desktop Menu */}
        <nav className="mobile-hidden" style={{ flex: 1, marginTop: '2rem', flexDirection: 'column' }}>
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className="flex align-center gap-2"
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  marginBottom: '0.5rem',
                  color: isActive ? 'var(--primary)' : 'var(--muted)',
                  background: isActive ? 'var(--primary-light)' : 'transparent',
                  fontWeight: isActive ? 600 : 500,
                  transition: 'all 0.2s'
                }}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="mobile-hidden" style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
          <button 
            className="flex align-center gap-2" 
            style={{ color: 'var(--danger)', width: '100%', padding: '0.75rem 1rem', fontWeight: 500 }}
          >
            <LogOut size={20} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div 
          className="desktop-hidden" 
          style={{ 
            position: 'fixed', top: 64, left: 0, right: 0, bottom: 0, 
            background: 'white', zIndex: 40, padding: '1rem',
            display: 'flex', flexDirection: 'column'
          }}
        >
          <nav style={{ flex: 1 }}>
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="flex align-center gap-2"
                  style={{
                    padding: '1rem',
                    borderRadius: '8px',
                    marginBottom: '0.5rem',
                    color: isActive ? 'var(--primary)' : 'var(--muted)',
                    background: isActive ? 'var(--primary-light)' : 'transparent',
                    fontWeight: isActive ? 600 : 500,
                  }}
                >
                  <Icon size={24} />
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <button 
            className="flex align-center gap-2" 
            style={{ color: 'var(--danger)', width: '100%', padding: '1rem', fontWeight: 500, borderTop: '1px solid var(--border)' }}
          >
            <LogOut size={24} />
            Déconnexion
          </button>
        </div>
      )}
    </>
  )
}
