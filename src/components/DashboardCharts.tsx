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
    labels: ['D1', 'D2', 'D3', 'D4', 'D5'],
    datasets: [
      {
        label: 'Budget (M)',
        data: [150, 250, 100, 180, 210],
        backgroundColor: '#3b82f6',
        borderRadius: 6,
      },
    ],
  }

  const doughnutData = {
    labels: ['En cours', 'Terminé', 'Retard'],
    datasets: [
      {
        data: [12, 8, 4],
        backgroundColor: ['#3b82f6', '#10b981', '#ef4444'],
        borderWidth: 0,
      },
    ],
  }

  return (
    <div className="grid-responsive mt-6">
      <div className="card">
        <h3>Budget / Commune</h3>
        <div style={{ height: 200 }}>
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
        <h3>Statut Projets</h3>
        <div style={{ height: 200, display: 'flex', justifyContent: 'center' }}>
          <Doughnut 
            data={doughnutData} 
            options={{ 
              responsive: true, 
              maintainAspectRatio: false,
              plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } } 
            }} 
          />
        </div>
      </div>
    </div>
  )
}
