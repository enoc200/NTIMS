'use client'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js'
import { formatChartDate } from '@/lib/utils'
import type { SalesTrendPoint } from '@/types'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

export default function SalesTrendChart({ data }: { data: SalesTrendPoint[] }) {
  const chartData = {
    labels: data.map(d => formatChartDate(d.date)),
    datasets: [{
      label: 'Revenue',
      data: data.map(d => d.total),
      fill: true,
      borderColor: '#6366f1',
      backgroundColor: (context: any) => {
        const chart = context.chart
        const { ctx, chartArea } = chart
        if (!chartArea) return null
        const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top)
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0)')
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0.15)')
        return gradient
      },
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#6366f1',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointHoverRadius: 6,
    }],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        titleFont: { family: 'Outfit', size: 12 },
        bodyFont: { family: 'Outfit', size: 14, weight: 'bold' },
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (item: any) => `KSh ${item.raw.toLocaleString('en-KE')}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { family: 'Outfit', size: 11 } }
      },
      y: {
        grid: { color: '#f1f5f9', drawBorder: false },
        ticks: {
          color: '#94a3b8',
          font: { family: 'Outfit', size: 11 },
          callback: (v: any) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v
        }
      },
    },
  }

  return (
    <div style={{ height: '240px' }}>
      <Line data={chartData} options={options as any} />
    </div>
  )
}
