'use client'

import { useState, useEffect } from 'react'

interface LogEntry {
  id: string
  text: string
  timestamp: Date
  author: string
  category?: string
}

export default function Logbook() {
  const [logText, setLogText] = useState('')
  const [category, setCategory] = useState('general')
  const [logs, setLogs] = useState<LogEntry[]>([])

  // Fetch logs on mount
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/tasks')
        if (res.ok) {
          const data = await res.json()
          // Map tasks to log entries
          const mappedLogs = data.map((task: any) => ({
            id: task.id,
            text: task.title, // using title as the log text
            timestamp: new Date(task.createdAt),
            author: task.category === 'general' ? 'Piket' : task.category.toUpperCase(), // approximate author based on category or add author field later
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
    <div className="card logbook">
      <h3>📝 Daily Logbook</h3>

      <form onSubmit={handleSubmit} className="log-form">
        <div className="input-group">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="category-select"
          >
            <option value="general">📢 Umum (Piket)</option>
            <option value="bpupd">✈️ BPUPD</option>
            <option value="bppg">🏠 BPPG</option>
            <option value="bendahara">💰 Bendahara</option>
            <option value="direktur">👔 Direktur</option>
          </select>
          <input
            type="text"
            className="form-input"
            placeholder={`Catatan untuk ${category.toUpperCase()}...`}
            value={logText}
            onChange={(e) => setLogText(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Kirim
        </button>
      </form>

      <div className="log-list">
        {logs.map((log) => (
          <div key={log.id} className="log-item">
            <div className="log-header">
              <span className="log-author">
                {log.category === 'general' ? '📢 Piket/Umum' :
                  log.category === 'bpupd' ? '✈️ BPUPD' :
                    log.category === 'bppg' ? '🏠 BPPG' :
                      log.category === 'bendahara' ? '💰 Bendahara' :
                        log.category === 'direktur' ? '👔 Direktur' : log.category}
              </span>
              <span className="log-time">{formatTime(log.timestamp)}</span>
            </div>
            <p className="log-text">{log.text}</p>
          </div>
        ))}
      </div>

      <style jsx>{`
        .logbook h3 {
          margin-bottom: var(--spacing-lg);
        }

        .log-form {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-lg);
        }

        .input-group {
            display: flex;
            gap: var(--spacing-sm);
        }

        .category-select {
            padding: 8px;
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
            background: var(--color-bg-primary);
            font-size: 0.875rem;
            min-width: 120px;
        }

        .log-form input {
          flex: 1;
        }

        .log-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
          max-height: 300px;
          overflow-y: auto;
        }

        .log-item {
          padding: var(--spacing-md);
          background: var(--color-bg-secondary);
          border-radius: var(--radius-md);
        }

        .log-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: var(--spacing-xs);
        }

        .log-author {
          font-weight: 600;
          font-size: 0.8125rem;
          color: var(--color-primary);
        }

        .log-time {
          font-size: 0.75rem;
          color: var(--color-text-muted);
        }

        .log-text {
          font-size: 0.9375rem;
          color: var(--color-text-secondary);
          line-height: 1.4;
        }
      `}</style>
    </div>
  )
}
