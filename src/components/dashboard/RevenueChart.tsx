'use client'

import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'
import { useChartTheme } from '@/hooks/use-chart-theme'

interface TransactionDoc {
  invoiceNo: string
  customerName: string
  totalAmount: number
  currency: string
  bookingType: string
  createdAt: string
}

interface RevenueChartProps {
  invoices: TransactionDoc[]
}

export default function RevenueChart({ invoices }: RevenueChartProps) {
  const chartTheme = useChartTheme()

  const chartData = useMemo(() => {
    if (!invoices || invoices.length === 0) return []

    // Group by month and sum per currency
    const monthMap = new Map<string, { month: string; EGP: number; USD: number }>()

    invoices.forEach((inv) => {
      const date = new Date(inv.createdAt)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthLabel = date.toLocaleDateString('id-ID', { month: 'short' })

      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { month: monthLabel, EGP: 0, USD: 0 })
      }

      const entry = monthMap.get(monthKey)!
      const amount = inv.totalAmount || 0
      if (inv.currency === 'EGP') entry.EGP += amount
      else if (inv.currency === 'USD') entry.USD += amount
    })

    // Sort by month key and return array
    return Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, data]) => data)
  }, [invoices])

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp size={20} className="text-muted-foreground" />
            Revenue Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8 text-sm">
            Belum ada data revenue untuk ditampilkan
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <TrendingUp size={20} className="text-muted-foreground" />
          Revenue Trend
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradientEGP" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartTheme.primary} stopOpacity={0.25} />
                <stop offset="95%" stopColor={chartTheme.primary} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradientUSD" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartTheme.accent} stopOpacity={0.25} />
                <stop offset="95%" stopColor={chartTheme.accent} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: chartTheme.muted }}
              axisLine={{ stroke: chartTheme.grid }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: chartTheme.muted }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: chartTheme.tooltip.bg,
                border: `1px solid ${chartTheme.tooltip.border}`,
                borderRadius: '8px',
                color: chartTheme.tooltip.text,
                fontSize: '0.875rem',
              }}
              formatter={(value: any, name: any) => [
                Number(value).toLocaleString(),
                String(name),
              ]}
            />
            <Legend
              wrapperStyle={{ fontSize: '0.8rem' }}
            />
            <Area
              type="monotone"
              dataKey="EGP"
              stroke={chartTheme.primary}
              fill="url(#gradientEGP)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="USD"
              stroke={chartTheme.accent}
              fill="url(#gradientUSD)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
