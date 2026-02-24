'use client'

import { useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import {
    Send,
    Calendar,
    Users,
    Building2,
    Home,
    FileText,
    Loader2,
    CheckCircle,
    AlertCircle,
    MessageSquare,
    Check
} from 'lucide-react'
import {
    AC_OPTIONS,
    CHAIR_OPTIONS,
    PROJECTOR_SCREEN_OPTIONS,
    TABLE_OPTIONS,
    PLATE_OPTIONS,
    GLASS_OPTIONS
} from '@/constants/auditorium'

// ─── Constants ───────────────────────────────────────────────────────────────

const STAFF_OPTIONS = [
    'Ubaidillah Chair',
    'Obeid Albar',
    'Habib Arifin Makhtum',
    'Muaz Widad',
    'Indra Juliana Salim',
    'Zulfan Firosi Zulfadhli',
    'Subhan Hadi Alhabsyi',
    'Rausan Fiqri',
]

const KAMAR_OPTIONS = [
    '101', '102', '103', '104', '105', '106',
    '201', '202', '203', '204', '205', '206', '207',
    'Homestay',
]

// Build detailed Exclude Service options from auditorium constants
const EXCLUDE_SERVICE_OPTIONS = [
    { group: '❄️ Air Conditioning', items: AC_OPTIONS.filter(o => o.value).map(o => `AC ${o.label} - ${o.price} EGP`) },
    { group: '🪑 Kursi', items: CHAIR_OPTIONS.filter(o => o.value).map(o => `${o.label} - ${o.price} EGP`) },
    { group: '📽️ Proyektor & Layar', items: PROJECTOR_SCREEN_OPTIONS.filter(o => o.value).map(o => `${o.label} - ${o.price} EGP`) },
    { group: '🪑 Meja', items: TABLE_OPTIONS.filter(o => o.value).map(o => `${o.label} - ${o.price} EGP`) },
    { group: '🍽️ Piring', items: PLATE_OPTIONS.filter(o => o.value).map(o => `${o.label} - ${o.price} EGP`) },
    { group: '🥛 Gelas', items: GLASS_OPTIONS.filter(o => o.value).map(o => `${o.label} - ${o.price} EGP`) },
]

const ALL_EXCLUDE_ITEMS = EXCLUDE_SERVICE_OPTIONS.flatMap(g => g.items.map(i => `${g.group.split(' ').slice(1).join(' ')}: ${i}`))

// ─── MultiCheck sub-component (same as LaporanPiket) ────────────────────────

function MultiCheck({ label, options, selected, onChange, dense }: {
    label: string
    options: string[]
    selected: string[]
    onChange: (val: string[]) => void
    dense?: boolean
}) {
    const toggle = (opt: string) => {
        onChange(selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt])
    }
    return (
        <div className="piket-field">
            <label className="piket-label">{label}</label>
            <div className={`piket-check-grid ${dense ? 'dense' : ''}`}>
                {options.map(opt => (
                    <label key={opt} className={`piket-check-item ${selected.includes(opt) ? 'checked' : ''}`}>
                        <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggle(opt)} />
                        {!dense && <span className="piket-check-box"><Check size={14} /></span>}
                        <span>{opt}</span>
                    </label>
                ))}
            </div>
        </div>
    )
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DailyReminderPage() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const today = new Date().toISOString().split('T')[0]

    const [form, setForm] = useState({
        tanggal: today,
        petugasPiketKantor: '',
        petugasPiketDapur: '',
        acaraAuditorium: '',
        excludeService: [] as string[],
        kamarTerisi: [] as string[],
        catatan: '1. Piket kantor dimulai dari pukul 08.00 s/d 22.00\n2. ',
    })

    const [sending, setSending] = useState(false)
    const [result, setResult] = useState<{ success: boolean; message: string; preview?: string } | null>(null)

    const set = (field: string, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!form.petugasPiketKantor || !form.petugasPiketDapur) {
            alert('Mohon pilih petugas piket kantor dan dapur terlebih dahulu.')
            return
        }

        setSending(true)
        setResult(null)

        try {
            const res = await fetch('/api/daily-reminder/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            const data = await res.json()
            setResult({
                success: data.success,
                message: data.message || data.error || 'Unknown result',
                preview: data.preview,
            })
        } catch (err: any) {
            setResult({
                success: false,
                message: 'Gagal mengirim: ' + (err.message || 'Network error'),
            })
        } finally {
            setSending(false)
        }
    }

    return (
        <>
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <main className="main-content">
                <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

                {/* Page Title — same as Laporan Piket */}
                <div style={{ marginBottom: 24 }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <MessageSquare size={28} /> Daily Reminder
                    </h2>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                        Formulir pengingat harian — kirim broadcast ke WA Group
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="piket-form-body">

                    <h3 className="piket-page-title">
                        <Calendar size={24} /> Informasi Harian
                    </h3>

                    {/* ── Section 1: Tanggal & Petugas ── */}
                    <div className="piket-section">
                        <h4 className="piket-section-title">📅 Tanggal & Petugas Piket</h4>

                        <div className="piket-field">
                            <label className="piket-label">Tanggal</label>
                            <input
                                className="piket-input"
                                type="date"
                                value={form.tanggal}
                                onChange={e => set('tanggal', e.target.value)}
                                required
                            />
                        </div>

                        <div className="piket-row">
                            <div className="piket-field">
                                <label className="piket-label">Petugas Piket Kantor *</label>
                                <select className="piket-input" value={form.petugasPiketKantor} onChange={e => set('petugasPiketKantor', e.target.value)} required>
                                    <option value="">— Pilih Petugas —</option>
                                    {STAFF_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="piket-field">
                                <label className="piket-label">Petugas Piket Dapur *</label>
                                <select className="piket-input" value={form.petugasPiketDapur} onChange={e => set('petugasPiketDapur', e.target.value)} required>
                                    <option value="">— Pilih Petugas —</option>
                                    {STAFF_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* ── Section 2: Auditorium ── */}
                    <div className="piket-section">
                        <h4 className="piket-section-title">🏛️ Operasional Auditorium</h4>

                        <div className="piket-field">
                            <label className="piket-label">Acara Penyewaan Auditorium</label>
                            <input
                                className="piket-input"
                                type="text"
                                placeholder="Contoh: Seminar Ekonomi, Tidak ada acara, dll."
                                value={form.acaraAuditorium}
                                onChange={e => set('acaraAuditorium', e.target.value)}
                            />
                        </div>

                        {/* Exclude Service — grouped by category */}
                        {EXCLUDE_SERVICE_OPTIONS.map(group => (
                            <MultiCheck
                                key={group.group}
                                label={`Exclude ${group.group}`}
                                options={group.items}
                                selected={form.excludeService}
                                onChange={v => set('excludeService', v)}
                            />
                        ))}
                    </div>

                    {/* ── Section 3: Kamar Hotel ── */}
                    <div className="piket-section">
                        <h4 className="piket-section-title">🏨 Kamar Hotel Terisi</h4>

                        <MultiCheck
                            label="Pilih Kamar yang Terisi"
                            options={KAMAR_OPTIONS}
                            selected={form.kamarTerisi}
                            onChange={v => set('kamarTerisi', v)}
                            dense
                        />

                        {form.kamarTerisi.length > 0 && (
                            <div className="dr-info-badge">
                                🛏️ {form.kamarTerisi.length} kamar dipilih: <strong>{form.kamarTerisi.join(', ')}</strong>
                            </div>
                        )}
                    </div>

                    {/* ── Section 4: Catatan ── */}
                    <div className="piket-section">
                        <h4 className="piket-section-title">📝 Catatan</h4>

                        <div className="piket-field">
                            <label className="piket-label">Catatan Harian</label>
                            <textarea
                                className="piket-input piket-textarea"
                                rows={5}
                                placeholder={"1. Piket kantor dimulai dari pukul 08.00 s/d 22.00\n2. ..."}
                                value={form.catatan}
                                onChange={e => set('catatan', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* ── Submit Button ── */}
                    <div className="dr-actions">
                        <button
                            type="submit"
                            className="dr-wa-btn"
                            disabled={sending}
                        >
                            {sending ? (
                                <>
                                    <Loader2 size={20} className="dr-spin" />
                                    Mengirim ke WA Group...
                                </>
                            ) : (
                                <>
                                    <Send size={20} />
                                    Kirim ke WA Group
                                </>
                            )}
                        </button>
                    </div>

                    {/* ── Result ── */}
                    {result && (
                        <div className={`dr-result ${result.success ? 'success' : 'error'}`}>
                            {result.success ? <CheckCircle size={22} /> : <AlertCircle size={22} />}
                            <div>
                                <strong>{result.success ? '✅ Berhasil Terkirim!' : '❌ Gagal Mengirim'}</strong>
                                <p>{result.message}</p>
                            </div>
                        </div>
                    )}

                    {/* ── Preview ── */}
                    {result?.preview && (
                        <div className="dr-preview">
                            <h4>📩 Preview Pesan:</h4>
                            <pre>{result.preview}</pre>
                        </div>
                    )}
                </form>
            </main>

            <style jsx global>{`
                /* ─── LaporanPiket Design System (global for child components) ─── */

                .piket-form-body {
                    background: var(--color-bg-card);
                    border-radius: var(--radius-2xl);
                    box-shadow: var(--shadow-xl);
                    padding: 40px;
                    border: 1px solid rgba(139, 69, 19, 0.08);
                    position: relative;
                    overflow: hidden;
                    max-width: 850px;
                    margin: 0 auto;
                }

                .piket-page-title {
                    font-size: 1.5rem;
                    margin-bottom: 24px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    color: var(--color-primary);
                    border-bottom: 1px solid var(--color-bg-secondary);
                    padding-bottom: 16px;
                }

                .piket-section {
                    margin-bottom: 32px;
                }

                .piket-section-title {
                    font-size: 0.9rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: var(--color-text-muted);
                    margin-bottom: 16px;
                    font-weight: 700;
                }

                .piket-field {
                    margin-bottom: 24px;
                }

                .piket-label {
                    display: block;
                    margin-bottom: 8px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: var(--color-text-secondary);
                }

                .piket-input {
                    width: 100%;
                    padding: 12px 16px;
                    font-size: 1rem;
                    border: 1.5px solid rgba(139, 69, 19, 0.1);
                    border-radius: var(--radius-lg);
                    background: var(--color-bg-primary);
                    color: var(--color-text-primary);
                    transition: all 0.15s ease;
                    font-family: inherit;
                    box-sizing: border-box;
                }

                .piket-input:focus {
                    outline: none;
                    border-color: var(--color-primary);
                    background: var(--color-bg-card);
                    box-shadow: 0 0 0 4px rgba(139, 69, 19, 0.08);
                }

                .piket-input::placeholder {
                    color: var(--color-text-muted);
                    opacity: 0.6;
                }

                .piket-textarea {
                    min-height: 100px;
                    resize: vertical;
                    line-height: 1.6;
                }

                .piket-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                }

                /* ─── Checkbox Grid ─── */
                .piket-check-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 8px;
                }

                .piket-check-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 14px;
                    border-radius: 10px;
                    border: 1.5px solid rgba(139, 69, 19, 0.08);
                    background: var(--color-bg-primary);
                    cursor: pointer;
                    font-size: 0.88rem;
                    color: var(--color-text-secondary);
                    transition: all 0.2s ease;
                    user-select: none;
                    position: relative;
                    line-height: 1.4;
                }

                .piket-check-item:hover {
                    border-color: rgba(139, 69, 19, 0.25);
                    background: rgba(139, 69, 19, 0.03);
                }

                .piket-check-item.checked {
                    border-color: var(--color-primary);
                    background: rgba(139, 69, 19, 0.06);
                    color: var(--color-text-primary);
                }

                .piket-check-item input {
                    position: absolute;
                    opacity: 0;
                    pointer-events: none;
                }

                .piket-check-box {
                    width: 18px;
                    height: 18px;
                    min-width: 18px;
                    border-radius: 5px;
                    border: 2px solid rgba(139, 69, 19, 0.18);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: transparent;
                    transition: all 0.2s ease;
                    flex-shrink: 0;
                    background: var(--color-bg-card);
                }

                .piket-check-item.checked .piket-check-box {
                    background: var(--color-primary);
                    border-color: var(--color-primary);
                    color: white;
                }

                /* Dense variant for rooms */
                .piket-check-grid.dense {
                    grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
                    gap: 6px;
                }

                .piket-check-grid.dense .piket-check-item {
                    padding: 8px 10px;
                    font-size: 0.82rem;
                    justify-content: center;
                    text-align: center;
                    border-radius: 8px;
                }

                .piket-check-grid.dense .piket-check-box {
                    display: none;
                }

                /* ─── Daily Reminder Specific Styles ─── */
                .dr-info-badge {
                    margin-top: 12px;
                    padding: 10px 16px;
                    background: rgba(139, 69, 19, 0.06);
                    border-radius: var(--radius-lg);
                    font-size: 0.875rem;
                    color: var(--color-primary);
                }

                .dr-actions {
                    display: flex;
                    justify-content: center;
                    margin-top: 16px;
                    margin-bottom: 24px;
                }

                .dr-wa-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    padding: 16px 40px;
                    background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
                    color: white;
                    border: none;
                    border-radius: var(--radius-xl);
                    font-size: 1.1rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    font-family: inherit;
                    box-shadow: 0 6px 20px rgba(37, 211, 102, 0.3);
                }

                .dr-wa-btn:hover:not(:disabled) {
                    transform: translateY(-3px);
                    box-shadow: 0 12px 32px rgba(37, 211, 102, 0.35);
                }

                .dr-wa-btn:active:not(:disabled) {
                    transform: translateY(-1px);
                }

                .dr-wa-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .dr-result {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    padding: 16px 20px;
                    border-radius: var(--radius-xl);
                    margin-top: 16px;
                    font-size: 0.9375rem;
                    animation: slideUp 0.3s ease-out;
                }

                .dr-result.success {
                    background: rgba(37, 211, 102, 0.08);
                    border: 1.5px solid rgba(37, 211, 102, 0.25);
                    color: #0d7a45;
                }

                .dr-result.error {
                    background: rgba(220, 38, 38, 0.08);
                    border: 1.5px solid rgba(220, 38, 38, 0.25);
                    color: #b91c1c;
                }

                .dr-result strong {
                    display: block;
                    margin-bottom: 4px;
                    font-size: 1rem;
                }

                .dr-result p {
                    margin: 0;
                    opacity: 0.85;
                }

                .dr-preview {
                    background: var(--color-bg-dark, #24211e);
                    color: #e5e7eb;
                    padding: 24px;
                    border-radius: var(--radius-xl);
                    margin-top: 16px;
                }

                .dr-preview h4 {
                    margin: 0 0 12px 0;
                    color: white;
                    font-size: 1rem;
                }

                .dr-preview pre {
                    white-space: pre-wrap;
                    word-break: break-word;
                    font-family: inherit;
                    margin: 0;
                    line-height: 1.7;
                    font-size: 0.9375rem;
                    opacity: 0.9;
                }

                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                @keyframes dr-spin-anim {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                :global(.dr-spin) {
                    animation: dr-spin-anim 1s linear infinite;
                }

                @media (max-width: 600px) {
                    .piket-form-body {
                        padding: 20px;
                    }
                    .piket-row {
                        grid-template-columns: 1fr;
                    }
                    .piket-check-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </>
    )
}
