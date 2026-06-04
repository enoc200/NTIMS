'use client'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import type { CategoryDistribution } from '@/types'

ChartJS.register(ArcElement, Tooltip, Legend)

export default function CategoryChart({ data }: { data: CategoryDistribution[] }) {
  const chartData = {
    labels: data.map(d => d.category),
    datasets: [{
      data: data.map(d => d.count),
      backgroundColor: [
        '#6366f1',
        '#0ea5e9',
        '#10b981',
        '#f59e0b',
        '#ef4444',
        '#8b5cf6',
      ],
      borderWidth: 0,
      hoverOffset: 10,
    }],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: { family: 'Outfit', size: 12, weight: '500' },
          color: '#64748b'
        }
      },
      tooltip: {
        backgroundColor: '#1e293b',
        padding: 12,
        titleFont: { family: 'Outfit' },
        bodyFont: { family: 'Outfit' },
      }
    },
    cutout: '70%',
  }

  return (
    <div style={{ height: '240px', position: 'relative' }}>
      <Doughnut data={chartData} options={options as any} />
      <div style={{
        position: 'absolute',
        top: '42%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        pointerEvents: 'none'
      }}>
        <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Total</div>
        <div style={{ fontSize: '24px', fontWeight: 800, color: '#1e293b' }}>
          {data.reduce((sum, d) => sum + d.count, 0)}
        </div>
      </div>
    </div>
  )
}
