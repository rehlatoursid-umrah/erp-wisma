'use client'

import { useState } from 'react'

interface LogEntry {
    id: string
    text: string
    timestamp: Date
    author: string
}

export default function Logbook() {
    const [logText, setLogText] = useState('')
    const [logs, setLogs] = useState<LogEntry[]>([
        {
            id: '1',
            text: 'Tamu kamar 102 request extra towel',
            timestamp: new Date(Date.now() - 3600000),
            author: 'Ahmad',
        },
        {
            id: '2',
            text: 'AC kamar 105 bunyi keras, sudah dilaporkan ke BPPG',
            timestamp: new Date(Date.now() - 7200000),
            author: 'Budi',
        },
    ])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!logText.trim()) return

        const newLog: LogEntry = {
            id: Date.now().toString(),
            text: logText,
            timestamp: new Date(),
            author: 'You',
        }

        setLogs([newLog, ...logs])
        setLogText('')
        // TODO: Save to Payload CMS
    }

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    }

    return (
        <div className="card logbook">
            <h3>📝 Daily Logbook</h3>

            <form onSubmit={handleSubmit} className="log-form">
                <input
                    type="text"
                    className="form-input"
                    placeholder="Tulis laporan kejadian..."
                    value={logText}
                    onChange={(e) => setLogText(e.target.value)}
                />
                <button type="submit" className="btn btn-primary">
                    Submit
                </button>
            </form>

            <div className="log-list">
                {logs.map((log) => (
                    <div key={log.id} className="log-item">
                        <div className="log-header">
                            <span className="log-author">{log.author}</span>
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
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-lg);
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
