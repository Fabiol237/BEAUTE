'use client'

import { usePathname } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // /citoyens a son propre layout.tsx - ce cas ne devrait plus jamais arriver
  // Mais par sécurité on garde la vérification
  const isPublic = pathname?.startsWith('/citoyens') || pathname?.startsWith('/login')

  if (isPublic) {
    return <>{children}</>
  }

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}
