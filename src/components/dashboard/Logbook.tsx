'use client'

import { useState, useEffect } from 'react'

interface LogEntry {
  id: string
  text: string
  timestamp: Date
  author: string
  category?: string
}

import {
  BookOpen,
  Megaphone,
  Plane,
  Home,
  Wallet,
  Briefcase,
  Send
} from 'lucide-react'

// ... interface LogEntry ...

export default function Logbook() {
  const [logText, setLogText] = useState('')
  // ... state ...
  const [category, setCategory] = useState('general')
  const [logs, setLogs] = useState<LogEntry[]>([])

  // Fetch logs on mount (Last 2 Weeks Only)
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        // Calculate date 2 weeks ago
        const twoWeeksAgo = new Date()
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
        const fromDateStr = twoWeeksAgo.toISOString()

        const res = await fetch(`/api/tasks?fromDate=${fromDateStr}`)
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
      <h3><BookOpen className="inline-icon" size={20} /> Daily Logbook</h3>

      <form onSubmit={handleSubmit} className="log-form">
        <div className="input-group">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="category-select"
          >
            <option value="general">Umum (Piket)</option>
            <option value="bpupd">BPUPD</option>
            <option value="bppg">BPPG</option>
            <option value="bendahara">Bendahara</option>
            <option value="direktur">Direktur</option>
          </select>
          <input
            type="text"
            className="form-input"
            placeholder={`Catatan untuk ${category.toUpperCase()}...`}
            value={logText}
            onChange={(e) => setLogText(e.target.value)}
          />
          <button type="submit" className="mobile-send-btn" disabled={!logText.trim()} aria-label="Kirim">
            <Send size={16} />
          </button>
        </div>
        <button type="submit" className="btn btn-primary icon-btn desktop-send-btn" disabled={!logText.trim()}>
          <Send size={16} /> Kirim
        </button>
      </form>

      <div className="log-list">
        {logs.map((log) => (
          <div key={log.id} className="log-item">
            <div className="log-header">
              <span className="log-author">
                {log.category === 'general' ? <><Megaphone size={14} /> Piket/Umum</> :
                  log.category === 'bpupd' ? <><Plane size={14} /> BPUPD</> :
                    log.category === 'bppg' ? <><Home size={14} /> BPPG</> :
                      log.category === 'bendahara' ? <><Wallet size={14} /> Bendahara</> :
                        log.category === 'direktur' ? <><Briefcase size={14} /> Direktur</> : log.category}
              </span>
              <span className="log-time">{formatTime(log.timestamp)}</span>
            </div>
            <p className="log-text">{log.text}</p>
          </div>
        ))}
      </div>

      <style jsx>{`
        .inline-icon {
            display: inline-block;
            vertical-align: middle;
            margin-right: 8px;
            margin-bottom: 2px;
        }

        .icon-btn {
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        /* ... existing styles ... */

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
          display: flex;
          align-items: center;
          gap: 6px;
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

        .mobile-send-btn {
          display: none;
        }

        @media (max-width: 768px) {
           .log-form {
             margin-bottom: var(--spacing-md);
           }
           
           .logbook h3 {
             font-size: 1.1rem;
             margin-bottom: var(--spacing-sm);
           }

           .input-group {
             background: var(--color-bg-secondary);
             border-radius: 50px;
             padding: 4px;
             padding-left: 12px;
             display: flex;
             align-items: center;
             gap: 8px;
             border: 1px solid rgba(0,0,0,0.05);
           }

           .category-select {
             border: none;
             background: transparent;
             padding: 4px 8px;
             border-radius: 20px;
             color: var(--color-primary);
             font-weight: 600;
             font-size: 0.75rem;
             min-width: auto;
             appearance: none;
             outline: none;
             cursor: pointer;
           }

           .form-input {
             border: none;
             background: transparent;
             padding: 8px 0;
             font-size: 0.9rem;
             flex: 1;
             outline: none;
             box-shadow: none;
           }

           .desktop-send-btn {
             display: none !important;
           }

           .mobile-send-btn {
             display: flex;
             align-items: center;
             justify-content: center;
             width: 36px;
             height: 36px;
             border-radius: 50px;
             background: var(--color-primary);
             color: white;
             border: none;
             flex-shrink: 0;
             margin-right: 2px;
             cursor: pointer;
             transition: all 0.2s ease;
           }

           .mobile-send-btn:disabled {
             opacity: 0.5;
             background: var(--color-text-muted);
           }

           .log-list {
             gap: 0;
             padding-left: 12px;
             position: relative;
             overflow-y: visible;
             max-height: none;
           }

           .log-list::before {
             content: '';
             position: absolute;
             left: 20px;
             top: 10px;
             bottom: 10px;
             width: 2px;
             background: var(--color-border);
             z-index: 1;
           }

           .log-item {
             background: transparent;
             padding: var(--spacing-sm) 0 var(--spacing-md) 28px;
             border-radius: 0;
             position: relative;
             z-index: 2;
           }

           .log-item::before {
             content: '';
             position: absolute;
             left: 3px;
             top: 18px;
             width: 10px;
             height: 10px;
             border-radius: 50%;
             background: var(--color-bg-card);
             border: 2px solid var(--color-primary);
           }

           .log-header {
             margin-bottom: 2px;
           }

           .log-author {
             font-size: 0.85rem;
             color: var(--color-text-primary);
           }

           .log-text {
             font-size: 0.9rem;
             background: var(--color-bg-secondary);
             padding: var(--spacing-sm) var(--spacing-md);
             border-radius: 0 var(--radius-xl) var(--radius-xl) var(--radius-xl);
             display: inline-block;
             margin-top: 4px;
             border: 1px solid rgba(0,0,0,0.03);
             color: var(--color-text-primary);
           }
        }
      `}</style>
    </div>
  )
}
