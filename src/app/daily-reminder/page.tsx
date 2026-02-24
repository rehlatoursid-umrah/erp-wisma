'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Send,
    Calendar,
    Users,
    Building2,
    Home,
    FileText,
    ArrowLeft,
    Loader2,
    CheckCircle,
    AlertCircle
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
    // AC
    ...AC_OPTIONS.filter(o => o.value).map(o => `❄️ AC ${o.label} - ${o.price} EGP`),
    // Chairs
    ...CHAIR_OPTIONS.filter(o => o.value).map(o => `🪑 ${o.label} - ${o.price} EGP`),
    // Projector & Screen
    ...PROJECTOR_SCREEN_OPTIONS.filter(o => o.value).map(o => `📽️ ${o.label} - ${o.price} EGP`),
    // Tables
    ...TABLE_OPTIONS.filter(o => o.value).map(o => `🪑 ${o.label} - ${o.price} EGP`),
    // Plates
    ...PLATE_OPTIONS.filter(o => o.value).map(o => `🍽️ ${o.label} - ${o.price} EGP`),
    // Glasses
    ...GLASS_OPTIONS.filter(o => o.value).map(o => `🥛 ${o.label} - ${o.price} EGP`),
]

// ─── Component ───────────────────────────────────────────────────────────────

export default function DailyReminderPage() {
    const router = useRouter()
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
        <div className="page-wrapper">
            {/* Header */}
            <div className="page-header">
                <button className="back-btn" onClick={() => router.push('/dashboard')}>
                    <ArrowLeft size={20} /> Kembali
                </button>
                <div className="header-title">
                    <div className="header-icon">📋</div>
                    <div>
                        <h1>Daily Reminder</h1>
                        <p>Kirim pengingat harian ke WA Group</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="reminder-form">
                {/* Tanggal */}
                <div className="form-section">
                    <div className="section-header">
                        <Calendar size={20} />
                        <h2>Tanggal</h2>
                    </div>
                    <input
                        type="date"
                        className="form-input"
                        value={form.tanggal}
                        onChange={e => updateField('tanggal', e.target.value)}
                        required
                    />
                </div>

                {/* Petugas Piket */}
                <div className="form-section">
                    <div className="section-header">
                        <Users size={20} />
                        <h2>Petugas Piket</h2>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Petugas Piket Kantor *</label>
                            <select
                                className="form-input"
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
                        <div className="form-group">
                            <label>Petugas Piket Dapur *</label>
                            <select
                                className="form-input"
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
                <div className="form-section">
                    <div className="section-header">
                        <Building2 size={20} />
                        <h2>Auditorium</h2>
                    </div>
                    <div className="form-group">
                        <label>Acara Penyewaan Auditorium</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Contoh: Seminar Ekonomi, Tidak ada, dll."
                            value={form.acaraAuditorium}
                            onChange={e => updateField('acaraAuditorium', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Exclude Service (Layanan yang tidak terpakai)</label>
                        <div className="chip-grid">
                            {EXCLUDE_SERVICE_OPTIONS.map(opt => (
                                <button
                                    key={opt}
                                    type="button"
                                    className={`chip ${form.excludeService.includes(opt) ? 'active' : ''}`}
                                    onClick={() => toggleArrayItem('excludeService', opt)}
                                >
                                    {form.excludeService.includes(opt) ? '✓ ' : ''}{opt}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Kamar Hotel */}
                <div className="form-section">
                    <div className="section-header">
                        <Home size={20} />
                        <h2>Kamar Hotel Terisi</h2>
                    </div>
                    <div className="chip-grid">
                        {KAMAR_OPTIONS.map(room => (
                            <button
                                key={room}
                                type="button"
                                className={`chip room-chip ${form.kamarTerisi.includes(room) ? 'active' : ''}`}
                                onClick={() => toggleArrayItem('kamarTerisi', room)}
                            >
                                {form.kamarTerisi.includes(room) ? '✓ ' : ''}
                                {room === 'Homestay' ? '🏠 Homestay' : `🛏️ ${room}`}
                            </button>
                        ))}
                    </div>
                    {form.kamarTerisi.length > 0 && (
                        <p className="selected-info">
                            {form.kamarTerisi.length} kamar dipilih: {form.kamarTerisi.join(', ')}
                        </p>
                    )}
                </div>

                {/* Catatan */}
                <div className="form-section">
                    <div className="section-header">
                        <FileText size={20} />
                        <h2>Catatan</h2>
                    </div>
                    <textarea
                        className="form-input textarea"
                        rows={5}
                        placeholder="1. Piket kantor dimulai dari pukul 08.00 s/d 22.00&#10;2. ..."
                        value={form.catatan}
                        onChange={e => updateField('catatan', e.target.value)}
                    />
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    className="submit-btn"
                    disabled={sending}
                >
                    {sending ? (
                        <>
                            <Loader2 size={20} className="spin" />
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
                    <div className={`result-box ${result.success ? 'success' : 'error'}`}>
                        {result.success ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                        <div>
                            <strong>{result.success ? 'Berhasil!' : 'Gagal!'}</strong>
                            <p>{result.message}</p>
                        </div>
                    </div>
                )}

                {/* Preview */}
                {result?.preview && (
                    <div className="preview-box">
                        <h3>📩 Preview Pesan yang Dikirim:</h3>
                        <pre>{result.preview}</pre>
                    </div>
                )}
            </form>

            <style jsx>{`
                .page-wrapper {
                    min-height: 100vh;
                    background: var(--color-bg-primary);
                    padding: var(--spacing-xl) var(--spacing-2xl);
                    max-width: 800px;
                    margin: 0 auto;
                }

                .page-header {
                    margin-bottom: var(--spacing-2xl);
                }

                .back-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: var(--spacing-sm) var(--spacing-md);
                    border: 1px solid rgba(139, 69, 19, 0.2);
                    border-radius: var(--radius-lg);
                    background: var(--color-bg-card);
                    color: var(--color-text-secondary);
                    cursor: pointer;
                    font-size: 0.875rem;
                    margin-bottom: var(--spacing-lg);
                    transition: all 0.2s;
                }
                .back-btn:hover {
                    background: var(--color-bg-secondary);
                    color: var(--color-primary);
                }

                .header-title {
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-lg);
                }
                .header-icon {
                    font-size: 2.5rem;
                    width: 64px;
                    height: 64px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
                    border-radius: var(--radius-xl);
                }
                .header-title h1 {
                    margin: 0;
                    font-size: 1.75rem;
                    color: var(--color-text-primary);
                }
                .header-title p {
                    margin: 4px 0 0 0;
                    color: var(--color-text-muted);
                    font-size: 0.9375rem;
                }

                .reminder-form {
                    display: flex;
                    flex-direction: column;
                    gap: var(--spacing-xl);
                }

                .form-section {
                    background: var(--color-bg-card);
                    border-radius: var(--radius-xl);
                    padding: var(--spacing-xl);
                    box-shadow: var(--shadow-sm);
                    border: 1px solid rgba(139, 69, 19, 0.08);
                }

                .section-header {
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-sm);
                    margin-bottom: var(--spacing-lg);
                    color: var(--color-primary);
                }
                .section-header h2 {
                    margin: 0;
                    font-size: 1.125rem;
                    font-weight: 600;
                }

                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: var(--spacing-lg);
                }

                .form-group {
                    margin-bottom: var(--spacing-md);
                }
                .form-group label {
                    display: block;
                    margin-bottom: var(--spacing-xs);
                    font-weight: 500;
                    font-size: 0.9375rem;
                    color: var(--color-text-secondary);
                }

                .form-input {
                    width: 100%;
                    padding: var(--spacing-md);
                    border: 1px solid rgba(139, 69, 19, 0.2);
                    border-radius: var(--radius-lg);
                    font-size: 1rem;
                    background: var(--color-bg-primary);
                    transition: all 0.2s ease;
                    font-family: inherit;
                    box-sizing: border-box;
                }
                .form-input:focus {
                    outline: none;
                    border-color: var(--color-primary);
                    box-shadow: 0 0 0 3px rgba(139, 69, 19, 0.1);
                }
                .textarea {
                    resize: vertical;
                    min-height: 120px;
                    line-height: 1.6;
                }

                .chip-grid {
                    display: flex;
                    flex-wrap: wrap;
                    gap: var(--spacing-sm);
                }

                .chip {
                    padding: var(--spacing-xs) var(--spacing-md);
                    border: 1.5px solid rgba(139, 69, 19, 0.2);
                    border-radius: var(--radius-lg);
                    background: var(--color-bg-primary);
                    color: var(--color-text-secondary);
                    cursor: pointer;
                    font-size: 0.875rem;
                    transition: all 0.2s;
                    font-family: inherit;
                }
                .chip:hover {
                    border-color: var(--color-primary);
                    color: var(--color-primary);
                    background: rgba(139, 69, 19, 0.04);
                }
                .chip.active {
                    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
                    color: white;
                    border-color: var(--color-primary);
                    font-weight: 600;
                }

                .room-chip {
                    min-width: 80px;
                    text-align: center;
                    justify-content: center;
                }

                .selected-info {
                    margin: var(--spacing-md) 0 0 0;
                    padding: var(--spacing-sm) var(--spacing-md);
                    background: rgba(139, 69, 19, 0.06);
                    border-radius: var(--radius-md);
                    font-size: 0.875rem;
                    color: var(--color-primary);
                    font-weight: 500;
                }

                .submit-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: var(--spacing-sm);
                    padding: var(--spacing-lg) var(--spacing-2xl);
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
                .submit-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(37, 211, 102, 0.4);
                }
                .submit-btn:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                .result-box {
                    display: flex;
                    align-items: flex-start;
                    gap: var(--spacing-md);
                    padding: var(--spacing-lg);
                    border-radius: var(--radius-xl);
                    font-size: 0.9375rem;
                }
                .result-box.success {
                    background: rgba(37, 211, 102, 0.1);
                    border: 1px solid rgba(37, 211, 102, 0.3);
                    color: #128C7E;
                }
                .result-box.error {
                    background: rgba(220, 38, 38, 0.1);
                    border: 1px solid rgba(220, 38, 38, 0.3);
                    color: #dc2626;
                }
                .result-box strong {
                    display: block;
                    margin-bottom: 4px;
                }
                .result-box p {
                    margin: 0;
                }

                .preview-box {
                    background: var(--color-bg-dark, #24211e);
                    color: #e5e7eb;
                    padding: var(--spacing-xl);
                    border-radius: var(--radius-xl);
                }
                .preview-box h3 {
                    margin: 0 0 var(--spacing-md) 0;
                    color: white;
                    font-size: 1rem;
                }
                .preview-box pre {
                    white-space: pre-wrap;
                    word-break: break-word;
                    font-family: inherit;
                    margin: 0;
                    line-height: 1.7;
                    font-size: 0.9375rem;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                :global(.spin) {
                    animation: spin 1s linear infinite;
                }

                @media (max-width: 768px) {
                    .page-wrapper {
                        padding: var(--spacing-md);
                    }
                    .form-row {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    )
}
