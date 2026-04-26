'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3 } from 'lucide-react'
import { useChartTheme } from '@/hooks/use-chart-theme'

interface OccupancyBarProps {
  stats: {
    hotel: number
    auditorium: number
    visa: number
    rental: number
  }
}

const CATEGORIES = [
  { key: 'hotel', label: 'Hotel', colorVar: 'info' },
  { key: 'auditorium', label: 'Aula', colorVar: 'primary' },
  { key: 'visa', label: 'Visa', colorVar: 'warning' },
  { key: 'rental', label: 'Rental', colorVar: 'success' },
] as const

export default function OccupancyBar({ stats }: OccupancyBarProps) {
  const chartTheme = useChartTheme()

  const chartData = CATEGORIES.map(cat => ({
    name: cat.label,
    count: stats[cat.key] || 0,
    color: chartTheme[cat.colorVar] || chartTheme.primary,
  }))

  const total = chartData.reduce((sum, d) => sum + d.count, 0)

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BarChart3 size={20} className="text-muted-foreground" />
            Weekly Activity
          </CardTitle>
          <span className="text-2xl font-bold text-primary">{total}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">Total bookings this week</p>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-sm">
            Belum ada aktivitas minggu ini
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              barSize={40}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: chartTheme.muted }}
                axisLine={{ stroke: chartTheme.grid }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: chartTheme.muted }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: chartTheme.tooltip.bg,
                  border: `1px solid ${chartTheme.tooltip.border}`,
                  borderRadius: '8px',
                  color: chartTheme.tooltip.text,
                  fontSize: '0.875rem',
                }}
                formatter={(value: any) => [Number(value), 'Bookings']}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
