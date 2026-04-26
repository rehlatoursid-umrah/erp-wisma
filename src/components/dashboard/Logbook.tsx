'use client'

import { useState, useEffect } from 'react'
import {
  BookOpen,
  Megaphone,
  Plane,
  Home,
  Wallet,
  Briefcase,
  Send
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface LogEntry {
  id: string
  text: string
  timestamp: Date
  author: string
  category?: string
}

const CATEGORIES = [
  { value: 'general', label: 'Umum (Piket)', icon: Megaphone },
  { value: 'bpupd', label: 'BPUPD', icon: Plane },
  { value: 'bppg', label: 'BPPG', icon: Home },
  { value: 'bendahara', label: 'Bendahara', icon: Wallet },
  { value: 'direktur', label: 'Direktur', icon: Briefcase },
]

function getCategoryIcon(category?: string) {
  const cat = CATEGORIES.find(c => c.value === category)
  if (!cat) return <Megaphone size={14} />
  const Icon = cat.icon
  return <Icon size={14} />
}

function getCategoryLabel(category?: string) {
  if (!category || category === 'general') return 'Piket/Umum'
  return category.toUpperCase()
}

export default function Logbook() {
  const [logText, setLogText] = useState('')
  const [category, setCategory] = useState('general')
  const [logs, setLogs] = useState<LogEntry[]>([])

  // Fetch logs on mount (Last 2 Weeks Only)
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const twoWeeksAgo = new Date()
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
        const fromDateStr = twoWeeksAgo.toISOString()

        const res = await fetch(`/api/tasks?fromDate=${fromDateStr}`)
        if (res.ok) {
          const data = await res.json()
          const mappedLogs = data.map((task: any) => ({
            id: task.id,
            text: task.title,
            timestamp: new Date(task.createdAt),
            author: task.category === 'general' ? 'Piket' : task.category.toUpperCase(),
            category: task.category
          }))
          setLogs(mappedLogs)
        }
      } catch (error) {
        console.error('Failed to fetch logs', error)
      }
    }
    fetchLogs()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!logText.trim()) return

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: logText,
          category: category,
          priority: 'normal',
          status: 'pending'
        })
      })

      if (res.ok) {
        const newTask = await res.json()
        const newLog: LogEntry = {
          id: newTask.id,
          text: newTask.title,
          timestamp: new Date(newTask.createdAt),
          author: category === 'general' ? 'Piket' : category.toUpperCase(),
          category: category
        }
        setLogs([newLog, ...logs])
        setLogText('')
      }
    } catch (error) {
      console.error('Failed to save log', error)
    }
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <BookOpen size={20} className="text-muted-foreground" />
          Daily Logbook
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-2">
          {/* Desktop Layout */}
          <div className="hidden lg:flex gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm min-w-[130px] focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
            <Input
              type="text"
              placeholder={`Catatan untuk ${category.toUpperCase()}...`}
              value={logText}
              onChange={(e) => setLogText(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={!logText.trim()} size="sm" className="gap-1.5">
              <Send size={14} /> Kirim
            </Button>
          </div>

          {/* Mobile Layout — iMessage-style input */}
          <div className="lg:hidden flex items-center gap-2 bg-muted/50 dark:bg-muted rounded-full pl-3 pr-1 py-1 border border-border/50">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-transparent border-none text-xs font-semibold text-primary min-w-0 w-auto appearance-none cursor-pointer focus:outline-none"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder={`Catatan...`}
              value={logText}
              onChange={(e) => setLogText(e.target.value)}
              className="flex-1 bg-transparent border-none text-sm focus:outline-none min-w-0 py-1.5"
            />
            <button
              type="submit"
              disabled={!logText.trim()}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
                logText.trim()
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted-foreground/30 text-muted-foreground"
              )}
            >
              <Send size={14} />
            </button>
          </div>
        </form>

        {/* Log Entries */}
        {/* Desktop: Card list */}
        <div className="hidden lg:flex flex-col gap-2 max-h-[300px] overflow-y-auto scrollbar-hide">
          {logs.map((log) => (
            <div key={log.id} className="p-3 bg-muted/40 dark:bg-muted/20 rounded-lg transition-colors hover:bg-muted/60">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
                  {getCategoryIcon(log.category)}
                  {getCategoryLabel(log.category)}
                </span>
                <span className="text-[0.7rem] text-muted-foreground">{formatTime(log.timestamp)}</span>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">{log.text}</p>
            </div>
          ))}
        </div>

        {/* Mobile: Timeline view */}
        <div className="lg:hidden relative pl-6">
          {/* Timeline line */}
          <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />

          <div className="flex flex-col">
            {logs.map((log) => (
              <div key={log.id} className="relative pb-4 last:pb-0">
                {/* Timeline dot */}
                <div className="absolute -left-[15px] top-2 w-2.5 h-2.5 rounded-full bg-card border-2 border-primary z-10" />

                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    {getCategoryIcon(log.category)}
                    {getCategoryLabel(log.category)}
                  </span>
                  <span className="text-[0.65rem] text-muted-foreground">{formatTime(log.timestamp)}</span>
                </div>
                <p className="text-sm text-foreground/80 bg-muted/40 dark:bg-muted/20 inline-block px-3 py-1.5 rounded-r-xl rounded-bl-xl border border-border/30 mt-0.5">
                  {log.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
