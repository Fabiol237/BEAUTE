import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  color: 'primary' | 'success' | 'warning' | 'danger'
  trend?: string
}

export default function StatCard({ label, value, icon: Icon, color, trend }: StatCardProps) {
  const colorMap = {
    primary: { bg: 'var(--primary-light)', text: 'var(--primary)' },
    success: { bg: 'var(--success-light)', text: 'var(--success)' },
    warning: { bg: 'var(--warning-light)', text: 'var(--warning)' },
    danger: { bg: 'var(--danger-light)', text: 'var(--danger)' },
  }

  return (
    <div className="card stat-card">
      <div 
        className="stat-icon" 
        style={{ 
          background: colorMap[color].bg, 
          color: colorMap[color].text 
        }}
      >
        <Icon size={24} />
      </div>
      <div className="stat-info">
        <h4>{label}</h4>
        <p>{value}</p>
        {trend && (
          <small style={{ color: trend.startsWith('+') ? 'var(--success)' : 'var(--danger)' }}>
            {trend} depuis le mois dernier
          </small>
        )}
      </div>
    </div>
  )
}
