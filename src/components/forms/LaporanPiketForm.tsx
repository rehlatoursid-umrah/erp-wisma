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

function MultiCheck({ label, options, selected, onChange, customKey, customValue, onCustomChange, dense }: {
    label: string
    options: string[]
    selected: string[]
    onChange: (val: string[]) => void
    customKey?: string
    customValue?: string
    onCustomChange?: (val: string) => void
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
            {customKey && selected.includes(customKey) && (
                <input
                    className="piket-input"
                    style={{ marginTop: 12 }}
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
                    style={{ marginTop: 12 }}
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
    { title: 'Hostel', icon: Home },
    { title: 'Auditorium', icon: Building2 },
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
                <div className="piket-success-icon">✨</div>
                <h2>Laporan Terkirim!</h2>
                <p>Terima kasih, laporan piket kantor telah berhasil tercatat di sistem.</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                    <button className="piket-btn primary" onClick={() => { setForm(initialFormData); setSubmitted(false); setStep(0) }}>
                        Buat Laporan Lagi
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="piket-container">
            {/* Step Indicators */}
            <div className="piket-steps-wrapper">
                <div className="piket-step-line-bg" />
                <div className="piket-step-line-progress" style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }} />
                <div className="piket-steps">
                    {STEPS.map((s, i) => (
                        <div key={i} className={`piket-step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`} onClick={() => i < step && setStep(i)}>
                            <div className="piket-step-circle">
                                {i < step ? <Check size={20} /> : <s.icon size={20} />}
                            </div>
                            <span className="piket-step-label">{s.title}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Form Body */}
            <div className="piket-form-body shadow-xl">
                {/* ──── PAGE 1 ──── */}
                {step === 0 && (
                    <div className="piket-page" key="page1">
                        <h3 className="piket-page-title"><ClipboardList size={24} /> Informasi Umum</h3>

                        <div className="piket-section">
                            <div className="piket-row">
                                <div className="piket-field">
                                    <label className="piket-label">Email Petugas</label>
                                    <input className="piket-input" type="email" placeholder="email@contoh.com" value={form.email} onChange={e => set('email', e.target.value)} />
                                </div>
                                <div className="piket-field">
                                    <label className="piket-label">Tanggal Laporan</label>
                                    <input className="piket-input" type="date" value={form.tanggal} onChange={e => set('tanggal', e.target.value)} />
                                </div>
                            </div>

                            <div className="piket-field">
                                <label className="piket-label">Nama Petugas Piket</label>
                                <select className="piket-input" value={form.namaPetugas} onChange={e => set('namaPetugas', e.target.value)}>
                                    <option value="">— Pilih Petugas —</option>
                                    {PETUGAS_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>

                            <div className="piket-row">
                                <div className="piket-field">
                                    <label className="piket-label">Jam Masuk</label>
                                    <input className="piket-input" type="time" value={form.jamMasuk} onChange={e => set('jamMasuk', e.target.value)} />
                                </div>
                                <div className="piket-field">
                                    <label className="piket-label">Jam Keluar</label>
                                    <input className="piket-input" type="time" value={form.jamKeluar} onChange={e => set('jamKeluar', e.target.value)} />
                                </div>
                            </div>
                        </div>

                        <div className="piket-section">
                            <h4 className="piket-section-title">Pemeliharaan & Keamanan</h4>
                            <MultiCheck label="Lampu Pagi Hari" options={LAMPU_OPTIONS} selected={form.lampu} onChange={v => set('lampu', v)} />

                            <div className="piket-field">
                                <label className="piket-label">Laporan Keamanan & Insiden</label>
                                <textarea className="piket-input piket-textarea" placeholder="Tuliskan jika ada insiden atau laporan keamanan khusus..." value={form.laporanKeamanan} onChange={e => set('laporanKeamanan', e.target.value)} />
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
                                dense
                            />
                        </div>

                        <div className="piket-section">
                            <h4 className="piket-section-title">Log Aktivitas & Utilitas</h4>
                            <div className="piket-field">
                                <label className="piket-label">Kegiatan Hari Ini</label>
                                <textarea className="piket-input piket-textarea" placeholder="Apa saja yang dikerjakan hari ini?" value={form.kegiatanHariIni} onChange={e => set('kegiatanHariIni', e.target.value)} />
                            </div>

                            <div className="piket-field">
                                <label className="piket-label">Kegiatan Esok Hari (Rencana)</label>
                                <textarea className="piket-input piket-textarea" placeholder="Rencana kegiatan untuk besok..." value={form.kegiatanEsokHari} onChange={e => set('kegiatanEsokHari', e.target.value)} />
                            </div>

                            <div className="piket-row">
                                <div className="piket-field">
                                    <label className="piket-label">Meteran Air (EGP)</label>
                                    <input className="piket-input" type="text" placeholder="Angka meteran..." value={form.meteranAir} onChange={e => set('meteranAir', e.target.value)} />
                                </div>
                                <div className="piket-field">
                                    <label className="piket-label">Meteran Listrik (EGP)</label>
                                    <input className="piket-input" type="text" placeholder="Angka meteran..." value={form.meteranListrik} onChange={e => set('meteranListrik', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ──── PAGE 2 ──── */}
                {step === 1 && (
                    <div className="piket-page" key="page2">
                        <h3 className="piket-page-title"><Home size={24} /> Operasional Hostel</h3>

                        <div className="piket-section">
                            <MultiCheck label="Kamar yang Terisi" options={KAMAR_OPTIONS} selected={form.kamarTerisi} onChange={v => set('kamarTerisi', v)} dense />
                        </div>

                        <div className="piket-section">
                            <MultiCheck label="Persediaan Snack & Dapur" options={SNACK_OPTIONS} selected={form.snack} onChange={v => set('snack', v)} />
                        </div>

                        <div className="piket-section">
                            <MultiCheck
                                label="Beres-beres Area Lobby"
                                options={LOBBY_OPTIONS}
                                selected={form.beresLobby}
                                onChange={v => set('beresLobby', v)}
                                customKey="Yang lain"
                                customValue={form.beresLobbyLain}
                                onCustomChange={v => set('beresLobbyLain', v)}
                            />
                        </div>

                        <div className="piket-section">
                            <h4 className="piket-section-title">Teknis & Keuangan Hostel</h4>
                            <div className="piket-row">
                                <div className="piket-field">
                                    <label className="piket-label">Kondisi Wifi Hostel</label>
                                    <input className="piket-input" type="text" placeholder="Lancar / Gangguan / Rincian..." value={form.wifiHostel} onChange={e => set('wifiHostel', e.target.value)} />
                                </div>
                                <div className="piket-field">
                                    <label className="piket-label">Status Pembayaran</label>
                                    <input className="piket-input" type="text" placeholder="Ada Pelunasan? / Tidak..." value={form.adaPembayaranHostel} onChange={e => set('adaPembayaranHostel', e.target.value)} />
                                </div>
                            </div>

                            <div className="piket-field">
                                <label className="piket-label">Rincian Pembayaran Hostel</label>
                                <textarea className="piket-input piket-textarea" placeholder="Nama tamu and jumlah pembayaran jika ada..." value={form.rincianPembayaranHostel} onChange={e => set('rincianPembayaranHostel', e.target.value)} />
                            </div>
                        </div>
                    </div>
                )}

                {/* ──── PAGE 3 ──── */}
                {step === 2 && (
                    <div className="piket-page" key="page3">
                        <h3 className="piket-page-title"><Building2 size={24} /> Operasional Auditorium</h3>

                        <div className="piket-row">
                            {/* Penyewa 1 */}
                            <div className="piket-section-card">
                                <h4 className="piket-section-subtitle">Penyewa Utama</h4>
                                <SingleSelect
                                    label="Nama Penyewa / Organisasi"
                                    options={PENYEWA_OPTIONS}
                                    value={form.penyewa1}
                                    onChange={v => set('penyewa1', v)}
                                    customKey="Yang lain"
                                    customValue={form.penyewa1Nama}
                                    onCustomChange={v => set('penyewa1Nama', v)}
                                />
                                <div className="piket-field">
                                    <label className="piket-label">Rincian Sewa</label>
                                    <input className="piket-input" type="text" placeholder="Aula 4 jam + proyektor..." value={form.rincianBiaya1} onChange={e => set('rincianBiaya1', e.target.value)} />
                                </div>
                                <div className="piket-field">
                                    <label className="piket-label">Total Biaya (EGP)</label>
                                    <input className="piket-input" type="text" placeholder="0" value={form.totalBiaya1} onChange={e => set('totalBiaya1', e.target.value)} />
                                </div>
                            </div>

                            {/* Penyewa 2 */}
                            <div className="piket-section-card">
                                <h4 className="piket-section-subtitle">Penyewa Tambahan</h4>
                                <SingleSelect
                                    label="Nama Penyewa / Organisasi"
                                    options={PENYEWA_OPTIONS}
                                    value={form.penyewa2}
                                    onChange={v => set('penyewa2', v)}
                                    customKey="Yang lain"
                                    customValue={form.penyewa2Nama}
                                    onCustomChange={v => set('penyewa2Nama', v)}
                                />
                                <div className="piket-field">
                                    <label className="piket-label">Rincian Sewa</label>
                                    <input className="piket-input" type="text" placeholder="..." value={form.rincianBiaya2} onChange={e => set('rincianBiaya2', e.target.value)} />
                                </div>
                                <div className="piket-field">
                                    <label className="piket-label">Total Biaya (EGP)</label>
                                    <input className="piket-input" type="text" placeholder="0" value={form.totalBiaya2} onChange={e => set('totalBiaya2', e.target.value)} />
                                </div>
                            </div>
                        </div>

                        <div className="piket-section">
                            <h4 className="piket-section-title">Lain-lain</h4>
                            <MultiCheck
                                label="Item Pembayaran Lainnya"
                                options={PEMBAYARAN_LAIN_OPTIONS}
                                selected={form.pembayaranLain}
                                onChange={v => set('pembayaranLain', v)}
                                customKey="Yang lain"
                                customValue={form.pembayaranLainCustom}
                                onCustomChange={v => set('pembayaranLainCustom', v)}
                            />

                            <div className="piket-field">
                                <label className="piket-label">Rincian Biaya Tambahan</label>
                                <textarea className="piket-input piket-textarea" placeholder="Contoh: Sewa Kursi 50 pcs (500 EGP)" value={form.rincianBiayaLain} onChange={e => set('rincianBiayaLain', e.target.value)} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div className="piket-nav">
                {step > 0 && (
                    <button className="piket-btn secondary" onClick={() => setStep(step - 1)}>
                        <ChevronLeft size={20} /> Kembali
                    </button>
                )}
                <div style={{ flex: 1 }} />
                {step < STEPS.length - 1 ? (
                    <button className="piket-btn primary" onClick={() => setStep(step + 1)}>
                        Lanjut <ChevronRight size={20} />
                    </button>
                ) : (
                    <button className="piket-btn submit" onClick={handleSubmit}>
                        Kirim Laporan <Send size={20} />
                    </button>
                )}
            </div>

            {/* Inline Styles */}
            <style jsx>{`
        .piket-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 20px 0;
          animation: fadeIn var(--transition-base) ease-out;
        }

        /* Step Indicators */
        .piket-steps-wrapper {
          position: relative;
          margin-bottom: 40px;
          padding: 0 40px;
        }
        
        .piket-steps {
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
          z-index: 1;
        }

        .piket-step-line-bg {
          position: absolute;
          top: 24px;
          left: 40px;
          right: 40px;
          height: 2px;
          background: var(--color-bg-secondary);
          z-index: 0;
        }

        .piket-step-line-progress {
          position: absolute;
          top: 24px;
          left: 40px;
          height: 2px;
          background: var(--color-primary);
          transition: width var(--transition-slow);
          z-index: 0;
        }

        .piket-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          cursor: default;
          transition: transform var(--transition-base);
        }

        .piket-step.done { 
          cursor: pointer; 
        }
        
        .piket-step.done:hover {
          transform: translateY(-2px);
        }

        .piket-step-circle {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-bg-card);
          color: var(--color-text-muted);
          border: 2px solid var(--color-bg-secondary);
          transition: all var(--transition-base);
          box-shadow: var(--shadow-sm);
        }

        .piket-step.active .piket-step-circle {
          background: var(--color-primary);
          color: white;
          border-color: var(--color-primary);
          box-shadow: 0 8px 16px rgba(139, 69, 19, 0.2);
          transform: scale(1.1);
        }

        .piket-step.done .piket-step-circle {
          background: var(--color-success);
          color: white;
          border-color: var(--color-success);
        }

        .piket-step-label {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--color-text-muted);
          transition: color var(--transition-base);
          text-align: center;
          max-width: 120px;
        }

        .piket-step.active .piket-step-label { 
          color: var(--color-primary); 
          font-weight: 700;
        }
        .piket-step.done .piket-step-label { 
          color: var(--color-success); 
        }

        /* Form Body */
        .piket-form-body {
          background: var(--color-bg-card);
          border-radius: var(--radius-2xl);
          box-shadow: var(--shadow-xl);
          padding: 40px;
          border: 1px solid rgba(139, 69, 19, 0.08);
          position: relative;
          overflow: hidden;
          min-height: 400px;
        }

        .piket-page {
          animation: slideUp var(--transition-base) ease-out;
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

        /* Grouping */
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

        /* Fields */
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
          transition: all var(--transition-fast);
          font-family: inherit;
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
        }

        .piket-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        @media (max-width: 600px) {
          .piket-row { grid-template-columns: 1fr; }
          .piket-steps-wrapper { padding: 0 10px; }
          .piket-steps { gap: 10px; }
          .piket-step-line-bg, .piket-step-line-progress { display: none; }
        }

        /* Checkbox/Selectable Grid */
        .piket-check-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 10px;
        }

        .piket-check-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: var(--radius-lg);
          border: 1.5px solid rgba(139, 69, 19, 0.1);
          background: var(--color-bg-secondary);
          cursor: pointer;
          font-size: 0.95rem;
          transition: all var(--transition-fast);
          user-select: none;
          position: relative;
        }

        .piket-check-item:hover {
          border-color: var(--color-primary);
          background: rgba(139, 69, 19, 0.05);
          transform: translateY(-1px);
        }

        .piket-check-item.checked {
          border-color: var(--color-primary);
          background: rgba(139, 69, 19, 0.1);
          color: var(--color-primary);
          font-weight: 700;
          box-shadow: var(--shadow-sm);
        }

        .piket-check-item input { position: absolute; opacity: 0; }

        .piket-check-box {
          width: 22px;
          height: 22px;
          border-radius: 6px;
          border: 2.5px solid rgba(139, 69, 19, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: transparent;
          transition: all var(--transition-fast);
          flex-shrink: 0;
          background: var(--color-bg-card);
        }

        .piket-check-item.checked .piket-check-box {
          background: var(--color-primary);
          border-color: var(--color-primary);
          color: white;
        }

        /* Radio Styling */
        .piket-radio-dot {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 2.5px solid rgba(139, 69, 19, 0.2);
          position: relative;
          flex-shrink: 0;
          transition: all var(--transition-fast);
          background: var(--color-bg-card);
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

        /* Small variant for dense grids (rooms) */
        .piket-check-grid.dense {
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        }
        
        .piket-check-grid.dense .piket-check-item {
          padding: 8px 12px;
          font-size: 0.85rem;
          justify-content: center;
        }
        
        .piket-check-grid.dense .piket-check-box,
        .piket-check-grid.dense .piket-radio-dot {
          display: none;
        }

        /* Section Cards (Page 3) */
        .piket-section-card {
          background: var(--color-bg-primary);
          border-radius: var(--radius-xl);
          padding: 24px;
          margin-bottom: 24px;
          border: 1.5px solid rgba(139, 69, 19, 0.06);
          transition: border-color var(--transition-base);
        }
        
        .piket-section-card:hover {
          border-color: rgba(139, 69, 19, 0.15);
        }

        .piket-section-subtitle {
          font-size: 1.1rem;
          color: var(--color-primary-dark);
          margin-bottom: 20px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* Navigation */
        .piket-nav {
          display: flex;
          gap: 16px;
          margin-top: 32px;
          padding: 0 4px;
        }

        .piket-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 14px 28px;
          font-size: 1rem;
          font-weight: 700;
          border: none;
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all var(--transition-base);
          font-family: inherit;
        }

        .piket-btn.primary {
          background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
          color: white;
          box-shadow: 0 4px 12px rgba(139, 69, 19, 0.2);
        }

        .piket-btn.primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(139, 69, 19, 0.3);
        }

        .piket-btn.secondary {
          background: var(--color-bg-card);
          color: var(--color-text-secondary);
          border: 1.5px solid rgba(139, 69, 19, 0.15);
        }

        .piket-btn.secondary:hover {
          background: var(--color-bg-secondary);
          border-color: var(--color-primary);
          color: var(--color-primary);
        }

        .piket-btn.submit {
          background: linear-gradient(135deg, var(--color-success), #16a34a);
          color: white;
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.2);
        }

        .piket-btn.submit:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(34, 197, 94, 0.3);
        }

        /* Success Screen */
        .piket-success {
          text-align: center;
          padding: 80px 40px;
          background: var(--color-bg-card);
          border-radius: var(--radius-2xl);
          box-shadow: var(--shadow-xl);
          border: 1px solid rgba(34, 197, 94, 0.1);
          animation: slideUp var(--transition-base) ease-out;
        }

        .piket-success-icon { 
          font-size: 5rem; 
          margin-bottom: 24px;
          display: inline-block;
          animation: spring var(--transition-spring);
        }

        .piket-success h2 {
          margin-bottom: 12px;
          color: var(--color-success);
          font-size: 2rem;
        }

        .piket-success p {
          color: var(--color-text-muted);
          margin-bottom: 32px;
          font-size: 1.1rem;
        }

        @keyframes spring {
          0% { transform: scale(0.5); }
          70% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      `}</style>
        </div>
    )
}
