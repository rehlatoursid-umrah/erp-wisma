'use client'

import { useState } from 'react'
import {
    ChevronLeft,
    ChevronRight,
    Send,
    ClipboardList,
    Building2,
    Home,
    Check
} from 'lucide-react'

// ─── Constants ───────────────────────────────────────────────────────────────

const PETUGAS_OPTIONS = [
    'Ubaidillah Chair',
    'Obeid Albar',
    'Habib Arifin Makhtum',
    'Muaz Widad',
    'Indra Juliana Salim',
    'Zulfan Firosi Zulfadhli',
    'Subhan Hadi',
    'Rausan Fiqri',
    'Pengganti Sementara',
]

const LAMPU_OPTIONS = ['Sudah', 'Belum', 'Dimatikan orang lain']
const KEBERSIHAN_OPTIONS = ['Sudah disapu', 'Sudah lap Meja', 'Meja sudah dirapihkan']

const RUANGAN_OPTIONS = [
    'Auditorium',
    'Kantor MPA-BPA PPMI Mesir',
    'Kantor Wihdah PPMI Mesir',
    'Kantor ICMI',
    'Kamar Mandi Aula',
    'Gudang Print House',
    'Gudang Talazza',
    'PMIK',
    'Tidak ada',
    'Yang lain',
]

const KAMAR_OPTIONS = [
    'Kosong', '101', '102', '103', '104', '105', '106',
    '201', '202', '203', '204', '205', '206', '207',
    'Homestay', 'All room',
]

const SNACK_OPTIONS = [
    'Aman semua', 'Roti', 'Air galon', 'Susu',
    'Teh', 'Selai roti', 'Gula', 'Nescafe',
]

const LOBBY_OPTIONS = [
    'Buang sampah hostel',
    'Beresin dapur hostel',
    'Beresin meja makan',
    'Menyapu lobby',
    'Nyuci piring kotor',
    'Tidak ada tamu',
    'Yang lain',
]

const PENYEWA_OPTIONS = ['Tidak ada penyewa', 'Yang lain']

const PEMBAYARAN_LAIN_OPTIONS = [
    'Tidak Ada',
    'Sewa Ruangan',
    'Sewa Proyektor',
    'Sewa Layar',
    'Sewa Kursi Ke Luar',
    'Sewa Meja Ke Luar',
    'Yang lain',
]

// ─── Types ───────────────────────────────────────────────────────────────────

interface FormData {
    // Page 1
    email: string
    tanggal: string
    namaPetugas: string
    jamMasuk: string
    jamKeluar: string
    lampu: string[]
    laporanKeamanan: string
    kebersihan: string[]
    ruangan: string[]
    ruanganLain: string
    kegiatanHariIni: string
    kegiatanEsokHari: string
    meteranAir: string
    meteranListrik: string
    // Page 2
    kamarTerisi: string[]
    snack: string[]
    beresLobby: string[]
    beresLobbyLain: string
    wifiHostel: string
    adaPembayaranHostel: string
    rincianPembayaranHostel: string
    // Page 3
    penyewa1: string
    penyewa1Nama: string
    rincianBiaya1: string
    totalBiaya1: string
    penyewa2: string
    penyewa2Nama: string
    rincianBiaya2: string
    totalBiaya2: string
    pembayaranLain: string[]
    pembayaranLainCustom: string
    rincianBiayaLain: string
}

const initialFormData: FormData = {
    email: '',
    tanggal: new Date().toISOString().split('T')[0],
    namaPetugas: '',
    jamMasuk: '',
    jamKeluar: '',
    lampu: [],
    laporanKeamanan: '',
    kebersihan: [],
    ruangan: [],
    ruanganLain: '',
    kegiatanHariIni: '',
    kegiatanEsokHari: '',
    meteranAir: '',
    meteranListrik: '',
    kamarTerisi: [],
    snack: [],
    beresLobby: [],
    beresLobbyLain: '',
    wifiHostel: '',
    adaPembayaranHostel: '',
    rincianPembayaranHostel: '',
    penyewa1: '',
    penyewa1Nama: '',
    rincianBiaya1: '',
    totalBiaya1: '',
    penyewa2: '',
    penyewa2Nama: '',
    rincianBiaya2: '',
    totalBiaya2: '',
    pembayaranLain: [],
    pembayaranLainCustom: '',
    rincianBiayaLain: '',
}

// ─── Reusable Sub-Components ─────────────────────────────────────────────────

function MultiCheck({ label, options, selected, onChange, customKey, customValue, onCustomChange }: {
    label: string
    options: string[]
    selected: string[]
    onChange: (val: string[]) => void
    customKey?: string
    customValue?: string
    onCustomChange?: (val: string) => void
}) {
    const toggle = (opt: string) => {
        onChange(selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt])
    }
    return (
        <div className="piket-field">
            <label className="piket-label">{label}</label>
            <div className="piket-check-grid">
                {options.map(opt => (
                    <label key={opt} className={`piket-check-item ${selected.includes(opt) ? 'checked' : ''}`}>
                        <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggle(opt)} />
                        <span className="piket-check-box"><Check size={14} /></span>
                        <span>{opt}</span>
                    </label>
                ))}
            </div>
            {customKey && selected.includes(customKey) && (
                <input
                    className="piket-input"
                    style={{ marginTop: 8 }}
                    placeholder={`Sebutkan ${label.toLowerCase()}...`}
                    value={customValue || ''}
                    onChange={e => onCustomChange?.(e.target.value)}
                />
            )}
        </div>
    )
}

function SingleSelect({ label, options, value, onChange, customKey, customValue, onCustomChange }: {
    label: string
    options: string[]
    value: string
    onChange: (val: string) => void
    customKey?: string
    customValue?: string
    onCustomChange?: (val: string) => void
}) {
    return (
        <div className="piket-field">
            <label className="piket-label">{label}</label>
            <div className="piket-check-grid">
                {options.map(opt => (
                    <label key={opt} className={`piket-check-item radio ${value === opt ? 'checked' : ''}`}>
                        <input type="radio" name={label} checked={value === opt} onChange={() => onChange(opt)} />
                        <span className="piket-radio-dot" />
                        <span>{opt}</span>
                    </label>
                ))}
            </div>
            {customKey && value === customKey && (
                <input
                    className="piket-input"
                    style={{ marginTop: 8 }}
                    placeholder="Masukkan nama..."
                    value={customValue || ''}
                    onChange={e => onCustomChange?.(e.target.value)}
                />
            )}
        </div>
    )
}

// ─── Steps ───────────────────────────────────────────────────────────────────

const STEPS = [
    { title: 'Info Umum', icon: ClipboardList },
    { title: 'Operasional Hostel', icon: Home },
    { title: 'Operasional Auditorium', icon: Building2 },
]

// ─── Main Component ──────────────────────────────────────────────────────────

export default function LaporanPiketForm() {
    const [step, setStep] = useState(0)
    const [form, setForm] = useState<FormData>(initialFormData)
    const [submitted, setSubmitted] = useState(false)

    const set = <K extends keyof FormData>(key: K, value: FormData[K]) =>
        setForm(prev => ({ ...prev, [key]: value }))

    const handleSubmit = () => {
        console.log('📋 Laporan Piket Submitted:', form)
        setSubmitted(true)
    }

    if (submitted) {
        return (
            <div className="piket-success">
                <div className="piket-success-icon">✅</div>
                <h2>Laporan Berhasil Dikirim!</h2>
                <p>Terima kasih, laporan piket kantor telah tercatat.</p>
                <button className="piket-btn primary" onClick={() => { setForm(initialFormData); setSubmitted(false); setStep(0) }}>
                    Buat Laporan Baru
                </button>
            </div>
        )
    }

    return (
        <div className="piket-container">
            {/* Step Indicators */}
            <div className="piket-steps">
                {STEPS.map((s, i) => (
                    <div key={i} className={`piket-step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`} onClick={() => i < step && setStep(i)}>
                        <div className="piket-step-circle">
                            {i < step ? <Check size={18} /> : <s.icon size={18} />}
                        </div>
                        <span className="piket-step-label">{s.title}</span>
                    </div>
                ))}
                <div className="piket-step-line" style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }} />
            </div>

            {/* Form Body */}
            <div className="piket-form-body">
                {/* ──── PAGE 1 ──── */}
                {step === 0 && (
                    <div className="piket-page">
                        <h3 className="piket-page-title">📋 Informasi Umum</h3>

                        <div className="piket-row">
                            <div className="piket-field">
                                <label className="piket-label">Email</label>
                                <input className="piket-input" type="email" placeholder="email@contoh.com" value={form.email} onChange={e => set('email', e.target.value)} />
                            </div>
                            <div className="piket-field">
                                <label className="piket-label">Tanggal</label>
                                <input className="piket-input" type="date" value={form.tanggal} onChange={e => set('tanggal', e.target.value)} />
                            </div>
                        </div>

                        <div className="piket-field">
                            <label className="piket-label">Nama Petugas Piket Kantor</label>
                            <select className="piket-input" value={form.namaPetugas} onChange={e => set('namaPetugas', e.target.value)}>
                                <option value="">— Pilih Petugas —</option>
                                {PETUGAS_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>

                        <div className="piket-row">
                            <div className="piket-field">
                                <label className="piket-label">Jam Masuk Kantor</label>
                                <input className="piket-input" type="time" value={form.jamMasuk} onChange={e => set('jamMasuk', e.target.value)} />
                            </div>
                            <div className="piket-field">
                                <label className="piket-label">Jam Keluar Kantor</label>
                                <input className="piket-input" type="time" value={form.jamKeluar} onChange={e => set('jamKeluar', e.target.value)} />
                            </div>
                        </div>

                        <MultiCheck label="Sudah mematikan lampu di pagi hari?" options={LAMPU_OPTIONS} selected={form.lampu} onChange={v => set('lampu', v)} />

                        <div className="piket-field">
                            <label className="piket-label">Laporan Keamanan</label>
                            <textarea className="piket-input piket-textarea" placeholder="Tulis laporan keamanan..." value={form.laporanKeamanan} onChange={e => set('laporanKeamanan', e.target.value)} />
                        </div>

                        <MultiCheck label="Kebersihan Kantor" options={KEBERSIHAN_OPTIONS} selected={form.kebersihan} onChange={v => set('kebersihan', v)} />

                        <MultiCheck
                            label="Ruangan yang Digunakan"
                            options={RUANGAN_OPTIONS}
                            selected={form.ruangan}
                            onChange={v => set('ruangan', v)}
                            customKey="Yang lain"
                            customValue={form.ruanganLain}
                            onCustomChange={v => set('ruanganLain', v)}
                        />

                        <div className="piket-field">
                            <label className="piket-label">Kegiatan Hari Ini</label>
                            <textarea className="piket-input piket-textarea" placeholder="Deskripsikan kegiatan hari ini..." value={form.kegiatanHariIni} onChange={e => set('kegiatanHariIni', e.target.value)} />
                        </div>

                        <div className="piket-field">
                            <label className="piket-label">Kegiatan Esok Hari</label>
                            <textarea className="piket-input piket-textarea" placeholder="Deskripsikan kegiatan esok hari..." value={form.kegiatanEsokHari} onChange={e => set('kegiatanEsokHari', e.target.value)} />
                        </div>

                        <div className="piket-row">
                            <div className="piket-field">
                                <label className="piket-label">Meteran Air</label>
                                <input className="piket-input" type="text" placeholder="Angka meteran air" value={form.meteranAir} onChange={e => set('meteranAir', e.target.value)} />
                            </div>
                            <div className="piket-field">
                                <label className="piket-label">Meteran Listrik</label>
                                <input className="piket-input" type="text" placeholder="Angka meteran listrik" value={form.meteranListrik} onChange={e => set('meteranListrik', e.target.value)} />
                            </div>
                        </div>
                    </div>
                )}

                {/* ──── PAGE 2 ──── */}
                {step === 1 && (
                    <div className="piket-page">
                        <h3 className="piket-page-title">🏨 Operasional Hostel</h3>

                        <MultiCheck label="Kamar yang Terisi" options={KAMAR_OPTIONS} selected={form.kamarTerisi} onChange={v => set('kamarTerisi', v)} />

                        <MultiCheck label="Snack di Hostel" options={SNACK_OPTIONS} selected={form.snack} onChange={v => set('snack', v)} />

                        <MultiCheck
                            label="Beres-beres Lobby"
                            options={LOBBY_OPTIONS}
                            selected={form.beresLobby}
                            onChange={v => set('beresLobby', v)}
                            customKey="Yang lain"
                            customValue={form.beresLobbyLain}
                            onCustomChange={v => set('beresLobbyLain', v)}
                        />

                        <div className="piket-field">
                            <label className="piket-label">Wifi Hostel</label>
                            <input className="piket-input" type="text" placeholder="Status wifi hostel..." value={form.wifiHostel} onChange={e => set('wifiHostel', e.target.value)} />
                        </div>

                        <div className="piket-field">
                            <label className="piket-label">Ada Pembayaran Hostel?</label>
                            <input className="piket-input" type="text" placeholder="Ada / Tidak ada" value={form.adaPembayaranHostel} onChange={e => set('adaPembayaranHostel', e.target.value)} />
                        </div>

                        <div className="piket-field">
                            <label className="piket-label">Rincian Pembayaran Hostel</label>
                            <textarea className="piket-input piket-textarea" placeholder="Rincian pembayaran jika ada..." value={form.rincianPembayaranHostel} onChange={e => set('rincianPembayaranHostel', e.target.value)} />
                        </div>
                    </div>
                )}

                {/* ──── PAGE 3 ──── */}
                {step === 2 && (
                    <div className="piket-page">
                        <h3 className="piket-page-title">🏛️ Operasional Auditorium</h3>

                        {/* Penyewa 1 */}
                        <div className="piket-section-card">
                            <h4 className="piket-section-subtitle">Penyewa Pertama</h4>
                            <SingleSelect
                                label="Nama Penyewa Pertama"
                                options={PENYEWA_OPTIONS}
                                value={form.penyewa1}
                                onChange={v => set('penyewa1', v)}
                                customKey="Yang lain"
                                customValue={form.penyewa1Nama}
                                onCustomChange={v => set('penyewa1Nama', v)}
                            />
                            <div className="piket-field">
                                <label className="piket-label">Rincian Biaya Penyewa Pertama</label>
                                <input className="piket-input" type="text" placeholder="Contoh: Aula 4 jam + 1 jam extra + proyektor + 3 Kursi" value={form.rincianBiaya1} onChange={e => set('rincianBiaya1', e.target.value)} />
                            </div>
                            <div className="piket-field">
                                <label className="piket-label">Total Biaya Sewa Pertama</label>
                                <input className="piket-input" type="text" placeholder="Contoh: 1500 EGP" value={form.totalBiaya1} onChange={e => set('totalBiaya1', e.target.value)} />
                            </div>
                        </div>

                        {/* Penyewa 2 */}
                        <div className="piket-section-card">
                            <h4 className="piket-section-subtitle">Penyewa Kedua</h4>
                            <SingleSelect
                                label="Nama Penyewa Kedua"
                                options={PENYEWA_OPTIONS}
                                value={form.penyewa2}
                                onChange={v => set('penyewa2', v)}
                                customKey="Yang lain"
                                customValue={form.penyewa2Nama}
                                onCustomChange={v => set('penyewa2Nama', v)}
                            />
                            <div className="piket-field">
                                <label className="piket-label">Rincian Biaya Penyewa Kedua</label>
                                <input className="piket-input" type="text" placeholder="Contoh: Aula 4 jam + 1 jam extra + proyektor + 3 Kursi" value={form.rincianBiaya2} onChange={e => set('rincianBiaya2', e.target.value)} />
                            </div>
                            <div className="piket-field">
                                <label className="piket-label">Total Biaya Sewa Kedua</label>
                                <input className="piket-input" type="text" placeholder="Contoh: 1500 EGP" value={form.totalBiaya2} onChange={e => set('totalBiaya2', e.target.value)} />
                            </div>
                        </div>

                        {/* Pembayaran Lainnya */}
                        <MultiCheck
                            label="Pembayaran Lainnya"
                            options={PEMBAYARAN_LAIN_OPTIONS}
                            selected={form.pembayaranLain}
                            onChange={v => set('pembayaranLain', v)}
                            customKey="Yang lain"
                            customValue={form.pembayaranLainCustom}
                            onCustomChange={v => set('pembayaranLainCustom', v)}
                        />

                        <div className="piket-field">
                            <label className="piket-label">Rincian Biaya</label>
                            <textarea className="piket-input piket-textarea" placeholder="Contoh: PPMI bayar Sewa Ruangan 1 bulan (1000 LE)" value={form.rincianBiayaLain} onChange={e => set('rincianBiayaLain', e.target.value)} />
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div className="piket-nav">
                {step > 0 && (
                    <button className="piket-btn secondary" onClick={() => setStep(step - 1)}>
                        <ChevronLeft size={18} /> Sebelumnya
                    </button>
                )}
                <div style={{ flex: 1 }} />
                {step < STEPS.length - 1 ? (
                    <button className="piket-btn primary" onClick={() => setStep(step + 1)}>
                        Selanjutnya <ChevronRight size={18} />
                    </button>
                ) : (
                    <button className="piket-btn submit" onClick={handleSubmit}>
                        <Send size={18} /> Kirim Laporan
                    </button>
                )}
            </div>

            {/* Inline Styles */}
            <style jsx>{`
        .piket-container {
          max-width: 800px;
          margin: 0 auto;
        }

        /* Step Indicators */
        .piket-steps {
          display: flex;
          justify-content: center;
          gap: 48px;
          margin-bottom: 32px;
          position: relative;
          padding: 0 24px;
        }
        .piket-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          cursor: default;
          z-index: 1;
        }
        .piket-step.done { cursor: pointer; }
        .piket-step-circle {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-bg-secondary);
          color: var(--color-text-muted);
          border: 2px solid var(--color-bg-secondary);
          transition: all 0.3s;
        }
        .piket-step.active .piket-step-circle {
          background: var(--color-primary);
          color: white;
          border-color: var(--color-primary);
          box-shadow: 0 4px 12px rgba(139, 69, 19, 0.3);
        }
        .piket-step.done .piket-step-circle {
          background: var(--color-success);
          color: white;
          border-color: var(--color-success);
        }
        .piket-step-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--color-text-muted);
        }
        .piket-step.active .piket-step-label { color: var(--color-primary); }
        .piket-step.done .piket-step-label { color: var(--color-success); }

        .piket-step-line {
          position: absolute;
          top: 24px;
          left: 72px;
          height: 2px;
          background: var(--color-primary);
          transition: width 0.5s;
          z-index: 0;
        }

        /* Form Body */
        .piket-form-body {
          background: var(--color-bg-card);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-md);
          padding: 32px;
          border: 1px solid rgba(139, 69, 19, 0.1);
        }

        .piket-page-title {
          font-size: 1.25rem;
          margin-bottom: 24px;
          padding-bottom: 12px;
          border-bottom: 2px solid var(--color-bg-secondary);
          color: var(--color-primary);
        }

        /* Fields */
        .piket-field { margin-bottom: 20px; }
        .piket-label {
          display: block;
          margin-bottom: 6px;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--color-text-secondary);
        }
        .piket-input {
          width: 100%;
          padding: 10px 14px;
          font-size: 0.95rem;
          border: 1px solid rgba(139, 69, 19, 0.2);
          border-radius: var(--radius-md);
          background: var(--color-bg-card);
          color: var(--color-text-primary);
          transition: border-color 0.2s, box-shadow 0.2s;
          font-family: inherit;
        }
        .piket-input:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(139, 69, 19, 0.1);
        }
        .piket-textarea {
          min-height: 80px;
          resize: vertical;
        }
        .piket-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 600px) {
          .piket-row { grid-template-columns: 1fr; }
        }

        /* Checkbox Grid */
        .piket-check-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .piket-check-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: var(--radius-md);
          border: 1px solid rgba(139, 69, 19, 0.15);
          background: var(--color-bg-secondary);
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.2s;
          user-select: none;
        }
        .piket-check-item:hover {
          border-color: var(--color-primary);
          background: rgba(139, 69, 19, 0.05);
        }
        .piket-check-item.checked {
          border-color: var(--color-primary);
          background: rgba(139, 69, 19, 0.1);
          color: var(--color-primary);
          font-weight: 600;
        }
        .piket-check-item input { display: none; }
        .piket-check-box {
          width: 20px;
          height: 20px;
          border-radius: 4px;
          border: 2px solid rgba(139, 69, 19, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: transparent;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .piket-check-item.checked .piket-check-box {
          background: var(--color-primary);
          border-color: var(--color-primary);
          color: white;
        }

        /* Radio */
        .piket-radio-dot {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid rgba(139, 69, 19, 0.3);
          position: relative;
          flex-shrink: 0;
          transition: all 0.2s;
        }
        .piket-check-item.radio.checked .piket-radio-dot {
          border-color: var(--color-primary);
        }
        .piket-check-item.radio.checked .piket-radio-dot::after {
          content: '';
          position: absolute;
          top: 3px;
          left: 3px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--color-primary);
        }

        /* Section Cards (Page 3) */
        .piket-section-card {
          background: var(--color-bg-secondary);
          border-radius: var(--radius-lg);
          padding: 20px;
          margin-bottom: 20px;
          border: 1px solid rgba(139, 69, 19, 0.08);
        }
        .piket-section-subtitle {
          font-size: 1rem;
          color: var(--color-primary);
          margin-bottom: 16px;
        }

        /* Navigation */
        .piket-nav {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }
        .piket-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          font-size: 0.95rem;
          font-weight: 600;
          border: none;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
        }
        .piket-btn.primary {
          background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
          color: white;
        }
        .piket-btn.primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(139, 69, 19, 0.3);
        }
        .piket-btn.secondary {
          background: var(--color-bg-secondary);
          color: var(--color-text-primary);
          border: 1px solid rgba(139, 69, 19, 0.2);
        }
        .piket-btn.secondary:hover {
          background: rgba(139, 69, 19, 0.05);
        }
        .piket-btn.submit {
          background: linear-gradient(135deg, var(--color-success), #16a34a);
          color: white;
        }
        .piket-btn.submit:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
        }

        /* Success */
        .piket-success {
          text-align: center;
          padding: 80px 40px;
          background: var(--color-bg-card);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-md);
        }
        .piket-success-icon { font-size: 4rem; margin-bottom: 16px; }
        .piket-success h2 {
          margin-bottom: 8px;
          color: var(--color-success);
        }
        .piket-success p {
          color: var(--color-text-muted);
          margin-bottom: 24px;
        }
      `}</style>
        </div>
    )
}
