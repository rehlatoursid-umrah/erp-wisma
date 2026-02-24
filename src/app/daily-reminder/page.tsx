'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
    MessageSquare
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
    ...AC_OPTIONS.filter(o => o.value).map(o => `❄️ AC ${o.label} - ${o.price} EGP`),
    ...CHAIR_OPTIONS.filter(o => o.value).map(o => `🪑 ${o.label} - ${o.price} EGP`),
    ...PROJECTOR_SCREEN_OPTIONS.filter(o => o.value).map(o => `📽️ ${o.label} - ${o.price} EGP`),
    ...TABLE_OPTIONS.filter(o => o.value).map(o => `🪑 ${o.label} - ${o.price} EGP`),
    ...PLATE_OPTIONS.filter(o => o.value).map(o => `🍽️ ${o.label} - ${o.price} EGP`),
    ...GLASS_OPTIONS.filter(o => o.value).map(o => `🥛 ${o.label} - ${o.price} EGP`),
]

// ─── Component ───────────────────────────────────────────────────────────────

export default function DailyReminderPage() {
    const router = useRouter()
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

    const updateField = (field: string, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }))
    }

    const toggleArrayItem = (field: 'excludeService' | 'kamarTerisi', item: string) => {
        setForm(prev => {
            const arr = prev[field] as string[]
            if (arr.includes(item)) {
                return { ...prev, [field]: arr.filter(i => i !== item) }
            }
            return { ...prev, [field]: [...arr, item] }
        })
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

                {/* Page Title */}
                <div className="page-title-row">
                    <div className="page-icon">
                        <MessageSquare size={28} color="white" />
                    </div>
                    <div>
                        <h2>Daily Reminder</h2>
                        <p className="page-subtitle">Kirim pengingat harian ke WA Group</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="reminder-form">
                    {/* Tanggal */}
                    <div className="dr-section">
                        <div className="dr-section-header">
                            <Calendar size={20} />
                            <h3>Tanggal</h3>
                        </div>
                        <input
                            type="date"
                            className="dr-input"
                            value={form.tanggal}
                            onChange={e => updateField('tanggal', e.target.value)}
                            required
                        />
                    </div>

                    {/* Petugas Piket */}
                    <div className="dr-section">
                        <div className="dr-section-header">
                            <Users size={20} />
                            <h3>Petugas Piket</h3>
                        </div>
                        <div className="dr-row">
                            <div className="dr-group">
                                <label>Petugas Piket Kantor *</label>
                                <select
                                    className="dr-input"
                                    value={form.petugasPiketKantor}
                                    onChange={e => updateField('petugasPiketKantor', e.target.value)}
                                    required
                                >
                                    <option value="">-- Pilih Staff --</option>
                                    {STAFF_OPTIONS.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="dr-group">
                                <label>Petugas Piket Dapur *</label>
                                <select
                                    className="dr-input"
                                    value={form.petugasPiketDapur}
                                    onChange={e => updateField('petugasPiketDapur', e.target.value)}
                                    required
                                >
                                    <option value="">-- Pilih Staff --</option>
                                    {STAFF_OPTIONS.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Acara Auditorium */}
                    <div className="dr-section">
                        <div className="dr-section-header">
                            <Building2 size={20} />
                            <h3>Auditorium</h3>
                        </div>
                        <div className="dr-group">
                            <label>Acara Penyewaan Auditorium</label>
                            <input
                                type="text"
                                className="dr-input"
                                placeholder="Contoh: Seminar Ekonomi, Tidak ada, dll."
                                value={form.acaraAuditorium}
                                onChange={e => updateField('acaraAuditorium', e.target.value)}
                            />
                        </div>
                        <div className="dr-group">
                            <label>Exclude Service (Layanan yang tidak terpakai)</label>
                            <div className="dr-chip-grid">
                                {EXCLUDE_SERVICE_OPTIONS.map(opt => (
                                    <button
                                        key={opt}
                                        type="button"
                                        className={`dr-chip ${form.excludeService.includes(opt) ? 'active' : ''}`}
                                        onClick={() => toggleArrayItem('excludeService', opt)}
                                    >
                                        {form.excludeService.includes(opt) ? '✓ ' : ''}{opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Kamar Hotel */}
                    <div className="dr-section">
                        <div className="dr-section-header">
                            <Home size={20} />
                            <h3>Kamar Hotel Terisi</h3>
                        </div>
                        <div className="dr-chip-grid">
                            {KAMAR_OPTIONS.map(room => (
                                <button
                                    key={room}
                                    type="button"
                                    className={`dr-chip dr-room-chip ${form.kamarTerisi.includes(room) ? 'active' : ''}`}
                                    onClick={() => toggleArrayItem('kamarTerisi', room)}
                                >
                                    {form.kamarTerisi.includes(room) ? '✓ ' : ''}
                                    {room === 'Homestay' ? '🏠 Homestay' : `🛏️ ${room}`}
                                </button>
                            ))}
                        </div>
                        {form.kamarTerisi.length > 0 && (
                            <p className="dr-selected-info">
                                {form.kamarTerisi.length} kamar dipilih: {form.kamarTerisi.join(', ')}
                            </p>
                        )}
                    </div>

                    {/* Catatan */}
                    <div className="dr-section">
                        <div className="dr-section-header">
                            <FileText size={20} />
                            <h3>Catatan</h3>
                        </div>
                        <textarea
                            className="dr-input dr-textarea"
                            rows={5}
                            placeholder={"1. Piket kantor dimulai dari pukul 08.00 s/d 22.00\n2. ..."}
                            value={form.catatan}
                            onChange={e => updateField('catatan', e.target.value)}
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        className="dr-submit-btn"
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

                    {/* Result */}
                    {result && (
                        <div className={`dr-result ${result.success ? 'success' : 'error'}`}>
                            {result.success ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                            <div>
                                <strong>{result.success ? 'Berhasil!' : 'Gagal!'}</strong>
                                <p>{result.message}</p>
                            </div>
                        </div>
                    )}

                    {/* Preview */}
                    {result?.preview && (
                        <div className="dr-preview">
                            <h3>📩 Preview Pesan yang Dikirim:</h3>
                            <pre>{result.preview}</pre>
                        </div>
                    )}
                </form>
            </main>

            <style jsx>{`
                .page-title-row {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 28px;
                }
                .page-icon {
                    width: 56px;
                    height: 56px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
                    border-radius: var(--radius-xl);
                    box-shadow: 0 4px 14px rgba(37, 211, 102, 0.25);
                }
                .page-title-row h2 {
                    margin: 0;
                    font-size: 1.5rem;
                    color: var(--color-text-primary);
                }
                .page-subtitle {
                    margin: 2px 0 0 0;
                    color: var(--color-text-muted);
                    font-size: 0.9rem;
                }

                .reminder-form {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    max-width: 800px;
                }

                .dr-section {
                    background: var(--color-bg-card);
                    border-radius: var(--radius-xl);
                    padding: 24px;
                    box-shadow: var(--shadow-sm);
                    border: 1px solid rgba(139, 69, 19, 0.08);
                }

                .dr-section-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 16px;
                    color: var(--color-primary);
                }
                .dr-section-header h3 {
                    margin: 0;
                    font-size: 1.125rem;
                    font-weight: 600;
                }

                .dr-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                }

                .dr-group {
                    margin-bottom: 12px;
                }
                .dr-group label {
                    display: block;
                    margin-bottom: 6px;
                    font-weight: 500;
                    font-size: 0.9375rem;
                    color: var(--color-text-secondary);
                }

                .dr-input {
                    width: 100%;
                    padding: 12px 16px;
                    border: 1px solid rgba(139, 69, 19, 0.2);
                    border-radius: var(--radius-lg);
                    font-size: 1rem;
                    background: var(--color-bg-primary);
                    transition: all 0.2s ease;
                    font-family: inherit;
                    box-sizing: border-box;
                }
                .dr-input:focus {
                    outline: none;
                    border-color: var(--color-primary);
                    box-shadow: 0 0 0 3px rgba(139, 69, 19, 0.1);
                }
                .dr-textarea {
                    resize: vertical;
                    min-height: 120px;
                    line-height: 1.6;
                }

                .dr-chip-grid {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .dr-chip {
                    padding: 8px 14px;
                    border: 1.5px solid rgba(139, 69, 19, 0.2);
                    border-radius: var(--radius-lg);
                    background: var(--color-bg-primary);
                    color: var(--color-text-secondary);
                    cursor: pointer;
                    font-size: 0.8125rem;
                    transition: all 0.2s;
                    font-family: inherit;
                    line-height: 1.3;
                }
                .dr-chip:hover {
                    border-color: var(--color-primary);
                    color: var(--color-primary);
                    background: rgba(139, 69, 19, 0.04);
                }
                .dr-chip.active {
                    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
                    color: white;
                    border-color: var(--color-primary);
                    font-weight: 600;
                }

                .dr-room-chip {
                    min-width: 80px;
                    text-align: center;
                    justify-content: center;
                }

                .dr-selected-info {
                    margin: 12px 0 0 0;
                    padding: 8px 14px;
                    background: rgba(139, 69, 19, 0.06);
                    border-radius: var(--radius-md);
                    font-size: 0.875rem;
                    color: var(--color-primary);
                    font-weight: 500;
                }

                .dr-submit-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    padding: 16px 32px;
                    background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
                    color: white;
                    border: none;
                    border-radius: var(--radius-xl);
                    font-size: 1.125rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    font-family: inherit;
                    box-shadow: 0 4px 14px rgba(37, 211, 102, 0.3);
                }
                .dr-submit-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(37, 211, 102, 0.4);
                }
                .dr-submit-btn:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                .dr-result {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    padding: 16px 20px;
                    border-radius: var(--radius-xl);
                    font-size: 0.9375rem;
                }
                .dr-result.success {
                    background: rgba(37, 211, 102, 0.1);
                    border: 1px solid rgba(37, 211, 102, 0.3);
                    color: #128C7E;
                }
                .dr-result.error {
                    background: rgba(220, 38, 38, 0.1);
                    border: 1px solid rgba(220, 38, 38, 0.3);
                    color: #dc2626;
                }
                .dr-result strong {
                    display: block;
                    margin-bottom: 4px;
                }
                .dr-result p {
                    margin: 0;
                }

                .dr-preview {
                    background: var(--color-bg-dark, #24211e);
                    color: #e5e7eb;
                    padding: 24px;
                    border-radius: var(--radius-xl);
                }
                .dr-preview h3 {
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
                }

                @keyframes dr-spin-anim {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                :global(.dr-spin) {
                    animation: dr-spin-anim 1s linear infinite;
                }

                @media (max-width: 768px) {
                    .dr-row {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </>
    )
}
