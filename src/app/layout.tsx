import './globals.css'
import Sidebar from '@/components/Sidebar'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Suivi Projets Municipaux',
  description: 'Plateforme de gestion et de suivi des projets municipaux',
}

import AppLayout from '@/components/AppLayout'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>
        <AppLayout>
          {children}
        </AppLayout>
      </body>
    </html>
  )
}
