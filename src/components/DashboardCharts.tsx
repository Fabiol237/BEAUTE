'use client'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
)

export default function DashboardCharts() {
  const barData = {
    labels: ['Douala 1', 'Douala 2', 'Douala 3', 'Douala 4', 'Douala 5'],
    datasets: [
      {
        label: 'Budget (M FCFA)',
        data: [150, 250, 100, 180, 210],
        backgroundColor: '#3b82f6',
        borderRadius: 6,
      },
    ],
  }

  const doughnutData = {
    labels: ['En cours', 'Terminé', 'Suspendu', 'En attente'],
    datasets: [
      {
        data: [12, 8, 2, 4],
        backgroundColor: ['#3b82f6', '#10b981', '#ef4444', '#f59e0b'],
        borderWidth: 0,
      },
    ],
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '2rem' }}>
      <div className="card">
        <h3>Budget par Commune</h3>
        <div style={{ height: 250 }}>
          <Bar 
            data={barData} 
            options={{ 
              responsive: true, 
              maintainAspectRatio: false,
              plugins: { legend: { display: false } } 
            }} 
          />
        </div>
      </div>
      <div className="card">
        <h3>Répartition par Statut</h3>
        <div style={{ height: 250, display: 'flex', justifyContent: 'center' }}>
          <Doughnut 
            data={doughnutData} 
            options={{ 
              responsive: true, 
              maintainAspectRatio: false,
              plugins: { legend: { position: 'bottom' } } 
            }} 
          />
        </div>
      </div>
    </div>
  )
}
