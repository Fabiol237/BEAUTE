'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FolderKanban, Banknote, Map, Users, Settings, LogOut } from 'lucide-react'

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: FolderKanban, label: 'Projets', href: '/projets' },
  { icon: Banknote, label: 'Budget', href: '/budget' },
  { icon: Map, label: 'Carte', href: '/carte' },
  { icon: Users, label: 'Utilisateurs', href: '/utilisateurs' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="sidebar">
      <div className="flex align-center gap-2 mb-4" style={{ padding: '0.5rem' }}>
        <div style={{ background: 'var(--primary)', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          <FolderKanban size={20} />
        </div>
        <span style={{ fontWeight: 700, fontSize: '1.25rem' }}>Projets Mun.</span>
      </div>

      <nav style={{ flex: 1, marginTop: '2rem' }}>
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex align-center gap-2`}
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

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
        <button 
          className="flex align-center gap-2" 
          style={{ 
            color: 'var(--danger)', 
            width: '100%', 
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            fontWeight: 500
          }}
        >
          <LogOut size={20} />
          Déconnexion
        </button>
      </div>
    </aside>
  )
}
