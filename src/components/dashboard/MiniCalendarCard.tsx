'use client'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface MiniCalendarCardProps {
  icon: React.ComponentType<{ size?: number; className?: string }>
  title: string
  items: any[]
  emptyText: string
  onViewAll: () => void
  viewAllLabel: string
  renderItem: (item: any, idx: number) => React.ReactNode
  className?: string
}

export default function MiniCalendarCard({
  icon: Icon,
  title,
  items,
  emptyText,
  onViewAll,
  viewAllLabel,
  renderItem,
  className,
}: MiniCalendarCardProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer border border-transparent transition-all duration-300 group",
        "hover:-translate-y-1.5 hover:shadow-lg hover:border-primary/20",
        "relative overflow-hidden",
        className
      )}
      onClick={onViewAll}
    >
      {/* Decorative gradient corner */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-bl-full" />

      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Icon size={20} className="text-muted-foreground" />
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent className="pb-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">{emptyText}</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {items.slice(0, 5).map((item, idx) => renderItem(item, idx))}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        <span className="text-sm font-medium text-primary flex items-center gap-1 transition-transform duration-200 group-hover:translate-x-1">
          {viewAllLabel}
        </span>
      </CardFooter>
    </Card>
  )
}
