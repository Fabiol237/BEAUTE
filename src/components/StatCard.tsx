import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  color: 'primary' | 'success' | 'warning' | 'danger'
}

export default function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  const colors = {
    primary: { bg: 'var(--primary-light)', text: 'var(--primary)' },
    success: { bg: 'var(--success-light)', text: 'var(--success)' },
    warning: { bg: 'var(--warning-light)', text: 'var(--warning)' },
    danger: { bg: 'var(--danger-light)', text: 'var(--danger)' },
  }

  const { bg, text } = colors[color]

  return (
    <div className="card flex items-center gap-4">
      <div style={{ 
        background: bg, 
        color: text, 
        width: 54, 
        height: 54, 
        borderRadius: 14, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <Icon size={28} />
      </div>
      <div>
        <span style={{ fontSize: '0.875rem', color: 'var(--muted)', fontWeight: 600, display: 'block', marginBottom: '2px' }}>
          {label}
        </span>
        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.02em' }}>
          {value}
        </span>
      </div>
    </div>
  )
}
