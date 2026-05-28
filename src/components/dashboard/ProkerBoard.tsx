'use client'

import { useState, useEffect } from 'react'
import { Plus, X, Trash2, KanbanSquare, ChevronLeft, ChevronRight, MoveLeft, MoveRight } from 'lucide-react'

interface Staff {
  name: string
  initials: string
  color: string
}

interface ProkerBoardProps {
  category: string
  staffList: Staff[]
}

export default function ProkerBoard({ category, staffList }: ProkerBoardProps) {
  const [tasks, setTasks] = useState<any[]>([])
  const [prokerMonth, setProkerMonth] = useState(new Date().getMonth())
  const [prokerYear, setProkerYear] = useState(new Date().getFullYear())
  const [showAddTask, setShowAddTask] = useState<string | null>(null)
  const [taskForm, setTaskForm] = useState({
    title: '', description: '', priority: 'normal' as 'high' | 'normal' | 'low',
    assigneeName: '', dueDate: new Date().toISOString().split('T')[0],
  })

  const fetchTasks = async () => {
    try {
      const res = await fetch(`/api/tasks?category=${category}&month=${prokerMonth}&year=${prokerYear}`)
      if (res.ok) setTasks(await res.json())
    } catch (e) { console.error(e) }
  }
  useEffect(() => { fetchTasks() }, [prokerMonth, prokerYear, category])

  const handleAddTask = async (status: string) => {
    if (!taskForm.title) return
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...taskForm, category, status, relatedRoom: taskForm.assigneeName, dueDate: taskForm.dueDate || undefined })
      })
      if (res.ok) { setTaskForm({ title: '', description: '', priority: 'normal', assigneeName: '', dueDate: new Date().toISOString().split('T')[0] }); setShowAddTask(null); fetchTasks() }
    } catch (e) { console.error(e) }
  }

  const moveTask = async (task: any, newStatus: string) => {
    try {
      const res = await fetch('/api/tasks', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: task.id, status: newStatus }) })
      if (res.ok) fetchTasks()
    } catch (e) { console.error(e) }
  }

  const deleteProkerTask = async (id: string) => {
    if (!confirm('Hapus proker ini?')) return
    try { const res = await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' }); if (res.ok) fetchTasks() } catch (e) { console.error(e) }
  }

  const prokerMonthLabel = new Date(prokerYear, prokerMonth, 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' })
  const COLS = [
    { status: 'pending', label: '📋 Todo', color: '#6b7280', bg: '#f3f4f6' },
    { status: 'in_progress', label: '⚡ In Progress', color: '#f59e0b', bg: '#fffbeb' },
    { status: 'done', label: '✅ Selesai', color: '#10b981', bg: '#ecfdf5' },
  ]

  return (
    <div className="proker-board-wrapper">
      <div className="proker-header">
        <div className="proker-title-row">
          <KanbanSquare size={22} style={{ color: 'var(--color-primary)' }} />
          <h2>Program Kerja Bulanan</h2>
        </div>
        <div className="proker-controls-row">
          <div className="month-nav-pill">
            <button className="mnav-btn" onClick={() => { if (prokerMonth === 0) { setProkerMonth(11); setProkerYear(y => y - 1) } else setProkerMonth(m => m - 1) }}><ChevronLeft size={16} /></button>
            <span className="mnav-label">{prokerMonthLabel}</span>
            <button className="mnav-btn" onClick={() => { if (prokerMonth === 11) { setProkerMonth(0); setProkerYear(y => y + 1) } else setProkerMonth(m => m + 1) }}><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      <div className="trello-board">
        {COLS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.status)
          return (
            <div key={col.status} className="trello-col">
              <div className="trello-col-header">
                <span className="trello-col-title" style={{ color: col.color }}>{col.label}</span>
                <span className="trello-col-count" style={{ background: col.bg, color: col.color }}>{colTasks.length}</span>
                <button className="trello-add-btn" onClick={() => { setShowAddTask(showAddTask === col.status ? null : col.status); setTaskForm({ title: '', description: '', priority: 'normal', assigneeName: '', dueDate: new Date(prokerYear, prokerMonth, 15).toISOString().split('T')[0] }) }}>
                  <Plus size={16} />
                </button>
              </div>

              {showAddTask === col.status && (
                <div className="trello-add-form">
                  <input className="trello-input" placeholder="Judul task..." value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} autoFocus />
                  <textarea className="trello-textarea" placeholder="Deskripsi (opsional)" value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} rows={2} />
                  <div className="trello-form-row">
                    <select className="trello-select" value={taskForm.priority} onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value as any }))}>
                      <option value="high">🔴 High</option><option value="normal">🟡 Normal</option><option value="low">🟢 Low</option>
                    </select>
                    <select className="trello-select" value={taskForm.assigneeName} onChange={e => setTaskForm(f => ({ ...f, assigneeName: e.target.value }))}>
                      <option value="">— Assignee —</option>
                      {staffList.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="trello-form-actions">
                    <button className="trello-save-btn" onClick={() => handleAddTask(col.status)}><Plus size={14} /> Tambah</button>
                    <button className="trello-cancel-btn" onClick={() => setShowAddTask(null)}><X size={14} /></button>
                  </div>
                </div>
              )}

              <div className="trello-cards">
                {colTasks.length === 0 && showAddTask !== col.status && (
                  <div className="trello-empty">Belum ada task di sini</div>
                )}
                {colTasks.map(task => {
                  const assignee = staffList.find(s => s.name === (task as any).relatedRoom)
                  return (
                    <div key={task.id} className={`trello-card priority-${task.priority}`}>
                      <div className="trello-card-body">
                        <p className={`trello-card-title ${task.status === 'done' ? 'task-done' : ''}`}>{task.title}</p>
                        {task.description && <p className="trello-card-desc">{task.description}</p>}
                      </div>
                      <div className="trello-card-footer">
                        <span className={`priority-badge p-${task.priority}`}>
                          {task.priority === 'high' ? '🔴 High' : task.priority === 'normal' ? '🟡 Normal' : '🟢 Low'}
                        </span>
                        {assignee && (
                          <span className="assignee-chip" style={{ background: assignee.color + '20', color: assignee.color, border: `1px solid ${assignee.color}40` }}>
                            <span className="assignee-dot" style={{ background: assignee.color }}>{assignee.initials[0]}</span>
                            {assignee.initials}
                          </span>
                        )}
                      </div>
                      <div className="trello-card-actions">
                        {col.status !== 'pending' && <button className="card-move-btn" title="Mundur" onClick={() => moveTask(task, col.status === 'in_progress' ? 'pending' : 'in_progress')}><MoveLeft size={13} /></button>}
                        {col.status !== 'done' && <button className="card-move-btn fwd" title="Maju" onClick={() => moveTask(task, col.status === 'pending' ? 'in_progress' : 'done')}><MoveRight size={13} /></button>}
                        <button className="card-del-btn" title="Hapus" onClick={() => deleteProkerTask(task.id)}><Trash2 size={13} /></button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Staff Summary */}
      <div className="staff-summary">
        {staffList.map(s => {
          const myTasks = tasks.filter(t => (t as any).relatedRoom === s.name)
          const done = myTasks.filter(t => t.status === 'done').length
          const total = myTasks.length
          const pct = total > 0 ? Math.round((done / total) * 100) : 0
          return (
            <div key={s.name} className="staff-card">
              <div className="staff-avatar" style={{ background: s.color }}>{s.initials}</div>
              <div className="staff-info">
                <span className="staff-name">{s.name}</span>
                <div className="staff-progress-bar"><div className="staff-progress-fill" style={{ width: `${pct}%`, background: s.color }} /></div>
                <span className="staff-stat">{done}/{total} selesai · {pct}%</span>
              </div>
            </div>
          )
        })}
      </div>
      <style jsx>{`
        /* PROKER — mobile-first */
        .proker-board-wrapper { display: flex; flex-direction: column; gap: 20px; animation: fadeIn 0.4s ease-out; padding: 0 var(--spacing-lg); }
        .proker-header { background: var(--color-bg-card); border-radius: var(--radius-xl); padding: 16px 20px; display: flex; flex-direction: column; gap: 14px; box-shadow: var(--shadow-sm); border: 1px solid var(--color-bg-secondary); }
        .proker-title-row { display: flex; align-items: center; gap: 10px; }
        .proker-title-row h2 { font-size: 1.2rem; font-weight: 700; color: var(--color-text-primary); margin: 0; }
        .proker-controls-row { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }

        /* Month Nav */
        .month-nav-pill { display: inline-flex; align-items: center; background: var(--color-bg-secondary); border-radius: 30px; overflow: hidden; border: 1px solid var(--color-bg-secondary); }
        .mnav-btn { background: none; border: none; padding: 6px 10px; cursor: pointer; color: var(--color-text-secondary); display: flex; align-items: center; transition: background 0.2s; }
        .mnav-btn:hover { background: rgba(139,69,19,0.08); color: var(--color-primary); }
        .mnav-label { font-size: 0.85rem; font-weight: 700; padding: 0 8px; color: var(--color-text-primary); white-space: nowrap; min-width: 110px; text-align: center; }

        /* Board */
        .trello-board { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        @media (max-width: 768px) { .trello-board { grid-template-columns: 1fr; } }

        /* Column */
        .trello-col { background: var(--color-bg-secondary); border-radius: var(--radius-xl); padding: 12px; display: flex; flex-direction: column; gap: 10px; min-height: 300px; }
        .trello-col-header { display: flex; align-items: center; gap: 8px; padding: 2px 0 6px; border-bottom: 1.5px solid rgba(0,0,0,0.06); }
        .trello-col-title { font-size: 0.82rem; font-weight: 700; flex: 1; }
        .trello-col-count { font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 20px; min-width: 22px; text-align: center; }
        .trello-add-btn { background: none; border: none; cursor: pointer; color: var(--color-text-muted); display: flex; align-items: center; border-radius: 6px; padding: 3px; transition: all 0.2s; }
        .trello-add-btn:hover { background: var(--color-bg-card); color: var(--color-primary); }

        /* Add Form */
        .trello-add-form { background: var(--color-bg-card); border-radius: var(--radius-lg); padding: 10px; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); border: 1px solid var(--color-bg-secondary); }
        .trello-input, .trello-textarea, .trello-select { width: 100%; padding: 8px 10px; border: 1.5px solid var(--color-bg-secondary); border-radius: 8px; font-size: 0.82rem; background: var(--color-bg-primary); color: var(--color-text-primary); font-family: var(--font-sans); transition: border 0.2s; resize: none; }
        .trello-input:focus, .trello-textarea:focus, .trello-select:focus { outline: none; border-color: var(--color-primary); }
        .trello-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
        .trello-form-actions { display: flex; gap: 6px; }
        .trello-save-btn { flex: 1; background: var(--color-primary); color: white; border: none; border-radius: 8px; padding: 7px; font-weight: 700; font-size: 0.8rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px; transition: opacity 0.2s; }
        .trello-save-btn:hover { opacity: 0.88; }
        .trello-cancel-btn { background: var(--color-bg-secondary); border: none; border-radius: 8px; padding: 7px 10px; cursor: pointer; color: var(--color-text-muted); display: flex; align-items: center; transition: background 0.2s; }
        .trello-cancel-btn:hover { background: rgba(239,68,68,0.1); color: #ef4444; }

        /* Cards */
        .trello-cards { display: flex; flex-direction: column; gap: 8px; }
        .trello-empty { text-align: center; padding: 20px; color: var(--color-text-muted); font-size: 0.78rem; border: 1.5px dashed var(--color-bg-card); border-radius: var(--radius-lg); }
        .trello-card { background: var(--color-bg-card); border-radius: var(--radius-lg); padding: 10px 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); border-left: 3px solid transparent; transition: box-shadow 0.2s, transform 0.15s; }
        .trello-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); transform: translateY(-1px); }
        .trello-card.priority-high { border-left-color: #ef4444; }
        .trello-card.priority-normal { border-left-color: #f59e0b; }
        .trello-card.priority-low { border-left-color: #10b981; }
        .trello-card-body { margin-bottom: 8px; }
        .trello-card-title { font-size: 0.85rem; font-weight: 600; color: var(--color-text-primary); line-height: 1.4; }
        .trello-card-title.task-done { text-decoration: line-through; color: var(--color-text-muted); }
        .trello-card-desc { font-size: 0.75rem; color: var(--color-text-muted); margin-top: 4px; line-height: 1.4; }
        .trello-card-footer { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 6px; }
        .priority-badge { font-size: 0.68rem; font-weight: 700; padding: 2px 7px; border-radius: 10px; }
        .p-high { background: #fee2e2; color: #dc2626; }
        .p-normal { background: #fef3c7; color: #b45309; }
        .p-low { background: #d1fae5; color: #065f46; }
        .assignee-chip { display: inline-flex; align-items: center; gap: 4px; font-size: 0.68rem; font-weight: 700; padding: 2px 7px; border-radius: 10px; }
        .assignee-dot { width: 14px; height: 14px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.55rem; color: white; font-weight: 700; }
        .trello-card-actions { display: flex; gap: 4px; justify-content: flex-end; padding-top: 6px; border-top: 1px solid var(--color-bg-secondary); }
        .card-move-btn { background: var(--color-bg-secondary); border: none; border-radius: 6px; padding: 4px 6px; cursor: pointer; color: var(--color-text-muted); display: flex; align-items: center; transition: all 0.15s; }
        .card-move-btn:hover { background: rgba(139,69,19,0.1); color: var(--color-primary); }
        .card-move-btn.fwd:hover { background: rgba(16,185,129,0.1); color: #10b981; }
        .card-del-btn { background: none; border: none; border-radius: 6px; padding: 4px 6px; cursor: pointer; color: var(--color-text-muted); display: flex; align-items: center; transition: all 0.15s; margin-left: auto; }
        .card-del-btn:hover { background: rgba(239,68,68,0.08); color: #ef4444; }

        /* Staff Summary */
        .staff-summary { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        @media (max-width: 768px) { .staff-summary { grid-template-columns: 1fr; } }
        .staff-card { background: var(--color-bg-card); border-radius: var(--radius-xl); padding: 14px 16px; display: flex; align-items: center; gap: 14px; box-shadow: var(--shadow-sm); border: 1px solid var(--color-bg-secondary); }
        .staff-avatar { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 0.9rem; flex-shrink: 0; }
        .staff-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
        .staff-name { font-size: 0.82rem; font-weight: 700; color: var(--color-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .staff-progress-bar { height: 6px; background: var(--color-bg-secondary); border-radius: 10px; overflow: hidden; }
        .staff-progress-fill { height: 100%; border-radius: 10px; transition: width 0.5s ease; }
        .staff-stat { font-size: 0.72rem; color: var(--color-text-muted); }
      `}</style>
    </div>
  )
}
