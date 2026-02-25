'use client'

import { useState } from 'react'
import { FileText, Download, Loader2 } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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

const JABATAN_OPTIONS = ['Direktur', 'Sekretaris', 'Bendahara', 'BPUPD', 'BPPG']
const KEKELUARGAAN_OPTIONS = ['KPMJB', 'KPJ', 'KKS', 'HMMSU', 'Masmida', 'KSWA', 'KMF', 'Fosma', 'Gama Jatim'] // Added a few common ones, user mentioned KPMJB, KPJ, KKS, HMMSU

export default function SlipGajiWidget() {
    const [isGenerating, setIsGenerating] = useState(false)

    const [form, setForm] = useState({
        periode: '',
        tanggal: new Date().toISOString().split('T')[0],
        nama: '',
        jabatan: '',
        noPaspor: '',
        kekeluargaan: '',
        gajiPokok: 0,
        piketKantorCount: 0,
        gajiPiketRate: 0,
        tips: 0,
        bonus: 0,
    })

    const set = (field: string, val: string | number) => {
        setForm(prev => ({ ...prev, [field]: val }))
    }

    const formatRupiah = (number: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'EGP', // Using EGP based on the context, or we can use generic numbers. Let's just format as number with EGP prefix as requested by other parts, or just standard formatting
            minimumFractionDigits: 0,
        }).format(number).replace('EGP', 'EGP ')
    }

    // To load image as base64 for jsPDF
    const getBase64ImageFromURL = (url: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new Image()
            img.crossOrigin = 'Anonymous'
            img.onload = () => {
                const canvas = document.createElement('canvas')
                canvas.width = img.width
                canvas.height = img.height
                const ctx = canvas.getContext('2d')
                if (ctx) {
                    ctx.drawImage(img, 0, 0)
                    const dataURL = canvas.toDataURL('image/png')
                    resolve(dataURL)
                } else {
                    reject(new Error('Canvas context not available'))
                }
            }
            img.onerror = error => reject(error)
            img.src = url
        })
    }

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsGenerating(true)

        try {
            const doc = new jsPDF()

            // Attempt to load Kop Surat logo
            // Assuming logo is at /media/logo.png from the rebranded UI
            // If it fails, we just won't render the logo image
            let logoDataUrl = null
            try {
                logoDataUrl = await getBase64ImageFromURL('/media/sticky-header.png')
            } catch (err) {
                console.warn("Could not load logo image for PDF", err)
            }

            // ─── HEADER / KOP SURAT ───
            if (logoDataUrl) {
                doc.addImage(logoDataUrl, 'PNG', 15, 12, 30, 30) // x, y, width, height
            } else {
                // Fallback text if logo fails
                doc.setFontSize(24)
                doc.setFont('helvetica', 'bold')
                doc.text('WISMA NUSANTARA', 15, 25)
            }

            // Address & Info on the right of the logo
            doc.setFontSize(16)
            doc.setFont('helvetica', 'bold')
            // Handling Arabic text in standard jsPDF without custom fonts is tricky, so we omit 'Beit Indonesia' in Arabic or use standard text
            doc.text('WISMA NUSANTARA', 50, 20)
            doc.setFontSize(10)
            doc.setFont('helvetica', 'normal')
            doc.text('Indonesian Hostel in Cairo', 50, 25)
            doc.setFontSize(8)
            doc.text('Address: 8th Wahran St., Al-Manteqah Al-Oula, Rabea Al-Adawea, Nasr City, Cairo, Egypt', 50, 31)
            doc.text('Web: www.wismanusantaracairo.com | Email: wismanusantarakairo@gmail.com', 50, 36)
            doc.text('Telp: 0222601712 | Hp: +20 155 533 6481', 50, 41)

            // Divider Line
            doc.setLineWidth(0.5)
            doc.line(15, 46, 195, 46)

            // ─── TITLE ───
            doc.setFontSize(14)
            doc.setFont('helvetica', 'bold')
            doc.text('SLIP GAJI', 105, 58, { align: 'center' })
            doc.text('STAF WISMA NUSANTARA CAIRO', 105, 65, { align: 'center' })

            // ─── STAFF INFO ───
            doc.setFontSize(11)
            doc.setFont('helvetica', 'normal')
            const startY = 80
            const lineSpacing = 7

            doc.setFont('helvetica', 'bold')
            doc.text('Periode', 15, startY)
            doc.text(':', 45, startY)
            doc.setFont('helvetica', 'normal')
            doc.text(form.periode, 50, startY)

            doc.setFont('helvetica', 'bold')
            doc.text('Tanggal', 15, startY + lineSpacing)
            doc.text(':', 45, startY + lineSpacing)
            doc.setFont('helvetica', 'normal')
            // Format Tanggal
            const tglPdf = new Date(form.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
            doc.text(tglPdf, 50, startY + lineSpacing)

            doc.setFont('helvetica', 'bold')
            doc.text('Nama', 15, startY + lineSpacing * 3)
            doc.text(':', 45, startY + lineSpacing * 3)
            doc.setFont('helvetica', 'normal')
            doc.text(form.nama, 50, startY + lineSpacing * 3)

            doc.setFont('helvetica', 'bold')
            doc.text('Jabatan', 15, startY + lineSpacing * 4)
            doc.text(':', 45, startY + lineSpacing * 4)
            doc.setFont('helvetica', 'normal')
            doc.text(form.jabatan, 50, startY + lineSpacing * 4)

            doc.setFont('helvetica', 'bold')
            doc.text('No Paspor', 15, startY + lineSpacing * 5)
            doc.text(':', 45, startY + lineSpacing * 5)
            doc.setFont('helvetica', 'normal')
            doc.text(form.noPaspor, 50, startY + lineSpacing * 5)

            doc.setFont('helvetica', 'bold')
            doc.text('Kekeluargaan', 15, startY + lineSpacing * 6)
            doc.text(':', 45, startY + lineSpacing * 6)
            doc.setFont('helvetica', 'normal')
            doc.text(form.kekeluargaan, 50, startY + lineSpacing * 6)

            // ─── TABLE Gaji ───
            const totalPiket = Number(form.piketKantorCount) * Number(form.gajiPiketRate)
            const totalGaji = Number(form.gajiPokok) + totalPiket + Number(form.tips) + Number(form.bonus)

            const tableData = [
                ['Gaji Pokok', '', formatRupiah(Number(form.gajiPokok))],
                ['Piket Kantor', `${form.piketKantorCount} Kali x ${formatRupiah(Number(form.gajiPiketRate))}`, formatRupiah(totalPiket)],
                ['Tips', '', formatRupiah(Number(form.tips))],
                ['Bonus', '', formatRupiah(Number(form.bonus))],
            ]

                // Custom font weight for the footer manually via autotable hooks
                ; (autoTable as any)(doc, {
                    startY: startY + lineSpacing * 8,
                    head: [],
                    body: tableData,
                    theme: 'grid',
                    styles: {
                        fontSize: 11,
                        cellPadding: 6,
                        textColor: [0, 0, 0],
                        lineColor: [0, 0, 0],
                        lineWidth: 0.1,
                    },
                    columnStyles: {
                        0: { cellWidth: 50, fontStyle: 'bold' },
                        1: { cellWidth: 70 },
                        2: { cellWidth: 50, halign: 'right' }
                    },
                    foot: [['Total Gaji', '', formatRupiah(totalGaji)]],
                    footStyles: {
                        fillColor: [240, 240, 240],
                        textColor: [0, 0, 0],
                        fontStyle: 'bold',
                        lineColor: [0, 0, 0],
                        lineWidth: 0.1,
                    }
                })

            // ─── SIGNATURES ───
            let finalY = startY + lineSpacing * 8 + 30 // fallback
            if ((doc as any).lastAutoTable && (doc as any).lastAutoTable.finalY) {
                finalY = (doc as any).lastAutoTable.finalY + 30
            }

            doc.setFont('helvetica', 'normal')
            doc.text('Mengetahui,', 105, finalY, { align: 'center' })

            doc.text('Bendahara Wisma Nusantara', 50, finalY + 40, { align: 'center' })
            doc.text('Penerima', 160, finalY + 40, { align: 'center' })

            // Signature lines
            doc.setLineWidth(0.2)
            doc.line(20, finalY + 35, 80, finalY + 35)
            doc.line(130, finalY + 35, 190, finalY + 35)

            // Try to load Bendahara Signature
            try {
                const ttdDataUrl = await getBase64ImageFromURL('/media/ttd-bendahara.png')
                if (ttdDataUrl) {
                    doc.addImage(ttdDataUrl, 'PNG', 35, finalY + 10, 30, 20)
                }
            } catch (err) {
                // Safe to ignore, signature image not mandatory locally
            }

            // Output PDF
            doc.save(`Slip_Gaji_${form.nama.replace(/\s+/g, '_')}_${form.periode.replace(/\s+/g, '_')}.pdf`)

        } catch (error: any) {
            console.error("Failed generating PDF:", error)
            alert(`Gagal membuat PDF: ${error.message || error}`)
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <div className="card slip-gaji-widget">
            <h3><FileText size={20} className="inline-block mr-2" /> Generate Slip Gaji</h3>
            <p className="card-desc">Buat PDF Slip Gaji Staff Wisma Nusantara</p>

            <form onSubmit={handleGenerate} className="slip-form">
                <div className="form-row">
                    <div className="field">
                        <label>Periode <small>(Cth: Feb 2026)</small></label>
                        <input type="text" value={form.periode} onChange={e => set('periode', e.target.value)} required placeholder="Februari 2026" />
                    </div>
                    <div className="field">
                        <label>Tanggal Rilis</label>
                        <input type="date" value={form.tanggal} onChange={e => set('tanggal', e.target.value)} required />
                    </div>
                </div>

                <div className="form-row">
                    <div className="field">
                        <label>Nama Staff</label>
                        <select value={form.nama} onChange={e => set('nama', e.target.value)} required>
                            <option value="">— Pilih Staff —</option>
                            {STAFF_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                    <div className="field">
                        <label>Jabatan</label>
                        <select value={form.jabatan} onChange={e => set('jabatan', e.target.value)} required>
                            <option value="">— Pilih Jabatan —</option>
                            {JABATAN_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                </div>

                <div className="form-row">
                    <div className="field">
                        <label>No Paspor</label>
                        <input type="text" value={form.noPaspor} onChange={e => set('noPaspor', e.target.value)} required placeholder="Cth: C1234567" />
                    </div>
                    <div className="field">
                        <label>Kekeluargaan</label>
                        <select value={form.kekeluargaan} onChange={e => set('kekeluargaan', e.target.value)} required>
                            <option value="">— Pilih —</option>
                            {KEKELUARGAAN_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                </div>

                <div className="divider"></div>

                <div className="form-row">
                    <div className="field">
                        <label>Gaji Pokok (EGP)</label>
                        <input type="number" min="0" value={form.gajiPokok || ''} onChange={e => set('gajiPokok', Number(e.target.value))} required />
                    </div>
                </div>

                <div className="form-row piket-row">
                    <div className="field">
                        <label>Jml Piket Kantor</label>
                        <input type="number" min="0" value={form.piketKantorCount || ''} onChange={e => set('piketKantorCount', Number(e.target.value))} required />
                    </div>
                    <div className="field-x">x</div>
                    <div className="field">
                        <label>Rate per Piket (EGP)</label>
                        <input type="number" min="0" value={form.gajiPiketRate || ''} onChange={e => set('gajiPiketRate', Number(e.target.value))} required />
                    </div>
                </div>

                <div className="form-row">
                    <div className="field">
                        <label>Tips (EGP)</label>
                        <input type="number" min="0" value={form.tips || ''} onChange={e => set('tips', Number(e.target.value))} />
                    </div>
                    <div className="field">
                        <label>Bonus (EGP)</label>
                        <input type="number" min="0" value={form.bonus || ''} onChange={e => set('bonus', Number(e.target.value))} />
                    </div>
                </div>

                <div className="total-preview">
                    <span>Estimasi Total: </span>
                    <strong>{formatRupiah(Number(form.gajiPokok) + (Number(form.piketKantorCount) * Number(form.gajiPiketRate)) + Number(form.tips) + Number(form.bonus))}</strong>
                </div>

                <button type="submit" className="btn btn-primary generate-btn" disabled={isGenerating}>
                    {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                    {isGenerating ? 'Membuat PDF...' : 'Download PDF Slip Gaji'}
                </button>
            </form>

            <style jsx>{`
        .slip-gaji-widget {
          grid-column: span 1;
        }

        .slip-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .form-row {
          display: flex;
          gap: 1rem;
          width: 100%;
        }

        .field {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          min-width: 0; /* Prevents flex items from overflowing */
        }

        .piket-row {
          align-items: flex-end;
        }

        .field-x {
          padding-bottom: 0.6rem;
          font-weight: bold;
          color: var(--color-text-muted);
          flex-shrink: 0;
        }

        label {
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--color-text-secondary);
        }

        label small {
          font-weight: normal;
          opacity: 0.7;
        }

        input, select {
          padding: 0.6rem 0.75rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border);
          background: var(--color-bg-primary);
          color: var(--color-text);
          font-size: 0.95rem;
          transition: all 0.2s;
        }

        input:focus, select:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px var(--color-primary-light);
        }

        .divider {
          height: 1px;
          background: var(--color-border);
          margin: 0.5rem 0;
        }

        .total-preview {
          padding: 1rem;
          background: var(--color-bg-secondary);
          border-radius: var(--radius-md);
          display: flex;
          justify-content: space-between;
          border: 1px dashed var(--color-border);
          margin-top: 0.5rem;
        }

        .total-preview span {
          color: var(--color-text-muted);
        }

        .total-preview strong {
          font-size: 1.1rem;
          color: var(--color-primary);
        }

        .generate-btn {
          margin-top: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem;
          font-weight: 600;
        }
      `}</style>
        </div>
    )
}
