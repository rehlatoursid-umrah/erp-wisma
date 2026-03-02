import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)

    const bookingId = searchParams.get('bookingId') || 'N/A'
    const name = searchParams.get('name') || ''
    const event = searchParams.get('event') || ''
    const date = searchParams.get('date') || ''
    const time = searchParams.get('time') || ''
    const total = searchParams.get('total') || '0'
    const currency = searchParams.get('currency') || 'EGP'
    const status = (searchParams.get('status') || 'pending').toLowerCase()
    const phone = searchParams.get('phone') || ''

    const logoPath = path.join(process.cwd(), 'public', 'media', 'sticky-header.png')
    let logoBase64 = ''
    try {
        logoBase64 = fs.readFileSync(logoPath, 'base64')
    } catch (e) {
        console.error('Logo not found', e)
    }
    const logoSrc = logoBase64 ? `data:image/png;base64,${logoBase64}` : ''

    const isConfirmed = status === 'confirmed' || status === 'paid' || status === 'booked'
    const statusLabel = isConfirmed ? 'BOOKING TERKONFIRMASI' : 'MENUNGGU KONFIRMASI'
    const statusColor = isConfirmed ? '#16a34a' : '#d97706'
    const statusBg = isConfirmed ? '#f0fdf4' : '#fffbeb'
    const statusText = isConfirmed ? 'Booking Confirmed' : 'Waiting for Confirmation'

    const itemsParam = searchParams.get('items')
    let parsedItems: any[] = []
    if (itemsParam) {
        try { parsedItems = JSON.parse(itemsParam) } catch (e) { console.error('Failed to parse items', e) }
    }
    if (parsedItems.length === 0) {
        parsedItems.push({ item: 'Sewa Auditorium (Bundle)', qty: 1, price: total, total: total })
    }

    const html = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Konfirmasi Booking - ${bookingId}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: #f1f5f9;
            padding: 16px;
            color: #1e293b;
            -webkit-font-smoothing: antialiased;
        }
        .container {
            max-width: 640px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 20px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.06);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(145deg, #0f172a 0%, #1e293b 50%, #334155 100%);
            padding: 22px 24px;
            display: flex;
            align-items: center;
            gap: 20px;
            position: relative;
            overflow: hidden;
        }
        .header::after {
            content: '';
            position: absolute;
            top: -40px;
            right: -40px;
            width: 180px;
            height: 180px;
            border-radius: 50%;
            background: rgba(255,255,255,0.03);
        }
        .header-logo { width: 56px; height: 56px; object-fit: contain; border-radius: 10px; flex-shrink: 0; background: #ffffff; padding: 5px; }
        .header-text h1 { font-size: 1.1rem; font-weight: 700; color: #ffffff; line-height: 1.3; letter-spacing: -0.3px; }
        .header-text p { font-size: 0.72rem; color: #94a3b8; margin-top: 2px; font-weight: 400; letter-spacing: 0.5px; }
        .content { padding: 20px 24px; }
        .status-block { text-align: center; margin-bottom: 16px; }
        .status-badge {
            display: inline-flex; align-items: center; gap: 8px;
            background: ${statusBg}; color: ${statusColor};
            padding: 7px 18px; border-radius: 100px;
            font-weight: 700; font-size: 0.72rem; letter-spacing: 1.2px;
            text-transform: uppercase; border: 1.5px solid ${statusColor}30;
        }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; background: ${statusColor}; animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .status-sub { margin-top: 4px; font-size: 0.72rem; color: #94a3b8; }
        .booking-ref { display: flex; justify-content: center; margin-bottom: 18px; }
        .booking-ref-box { background: #f8fafc; padding: 10px 28px; border-radius: 10px; text-align: center; border: 1.5px dashed #cbd5e1; }
        .booking-ref-label { font-size: 0.6rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; font-weight: 600; margin-bottom: 4px; }
        .booking-ref-value { font-size: 1.15rem; font-weight: 800; color: #0f172a; font-family: 'SF Mono', 'Fira Code', 'Courier New', monospace; letter-spacing: 1px; }
        .section { margin-bottom: 16px; }
        .section-header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; }
        .section-icon { width: 26px; height: 26px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; flex-shrink: 0; }
        .section-icon.guest { background: #eff6ff; }
        .section-icon.event { background: #f0fdf4; }
        .section-icon.items { background: #fefce8; }
        .section-title { font-weight: 700; color: #0f172a; font-size: 0.82rem; letter-spacing: -0.2px; }
        .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
        .detail-item { padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
        .detail-item:nth-child(odd) { padding-right: 12px; }
        .detail-item:nth-child(even) { padding-left: 12px; border-left: 1px solid #f1f5f9; }
        .detail-item.full { grid-column: 1 / -1; padding-right: 0; }
        .detail-label { display: block; color: #94a3b8; font-size: 0.65rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 2px; }
        .detail-value { font-weight: 600; color: #0f172a; font-size: 0.88rem; }
        .items-table { width: 100%; border-collapse: collapse; margin-top: 4px; }
        .items-table th { text-align: left; padding: 6px 8px; background: #f8fafc; color: #64748b; font-size: 0.65rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; }
        .items-table th:last-child { text-align: right; }
        .items-table td { padding: 7px 8px; border-bottom: 1px solid #f1f5f9; font-size: 0.82rem; color: #334155; }
        .items-table td:last-child { text-align: right; font-weight: 600; }
        .items-table td.qty { text-align: center; }
        .item-name { font-weight: 600; color: #0f172a; }
        .item-desc { font-size: 0.7rem; color: #94a3b8; margin-top: 2px; line-height: 1.4; }
        .total-block {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            padding: 16px 20px; border-radius: 12px; margin-top: 14px;
            display: flex; justify-content: space-between; align-items: center;
        }
        .total-label { color: #94a3b8; font-size: 0.8rem; font-weight: 500; }
        .total-label span { display: block; color: #64748b; font-size: 0.65rem; margin-top: 2px; }
        .total-value { font-size: 1.5rem; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
        .divider { height: 1px; background: linear-gradient(90deg, transparent, #e2e8f0, transparent); margin: 4px 0; }
        .footer { background: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0; }
        .footer-contacts { display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; margin-bottom: 4px; }
        .footer-contact { display: flex; align-items: center; gap: 5px; font-size: 0.7rem; color: #64748b; font-weight: 500; }
        .footer-contact svg { flex-shrink: 0; }
        .footer-time { font-size: 0.65rem; color: #94a3b8; margin-top: 6px; }
        .btn-group { display: flex; justify-content: center; gap: 10px; margin-top: 12px; flex-wrap: wrap; }
        .print-btn {
            background: #0f172a; color: white; border: none; padding: 10px 22px; border-radius: 8px;
            cursor: pointer; font-size: 0.8rem; font-weight: 600; transition: all 0.2s;
            display: inline-flex; align-items: center; gap: 6px; font-family: 'Inter', sans-serif;
        }
        .print-btn:hover { background: #1e293b; transform: translateY(-1px); }
        .wa-btn {
            background: #25D366; color: white; border: none; padding: 10px 22px; border-radius: 8px;
            cursor: pointer; font-size: 0.8rem; font-weight: 600; transition: all 0.2s;
            display: inline-flex; align-items: center; gap: 6px; font-family: 'Inter', sans-serif;
        }
        .wa-btn:hover { background: #1da851; transform: translateY(-1px); }
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
        @media print {
            body { background: white; padding: 0; }
            .container { box-shadow: none; border-radius: 0; }
            .print-btn, .wa-btn, .btn-group { display: none !important; }
        }
    </style>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="${logoSrc}" alt="Logo" class="header-logo">
            <div class="header-text">
                <h1>Wisma Nusantara Cairo</h1>
                <p>AUDITORIUM BOOKING CONFIRMATION</p>
            </div>
        </div>

        <div class="content">
            <div class="status-block">
                <div class="status-badge">
                    <span class="status-dot"></span>
                    ${statusLabel}
                </div>
                <div class="status-sub">${statusText}</div>
            </div>

            <div class="booking-ref">
                <div class="booking-ref-box">
                    <div class="booking-ref-label">Booking Reference</div>
                    <div class="booking-ref-value">${bookingId}</div>
                </div>
            </div>

            <div class="divider"></div>

            <!-- Booking Details -->
            <div class="section">
                <div class="section-header">
                    <div class="section-icon guest">📋</div>
                    <div class="section-title">Booking Details</div>
                </div>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="detail-label">Nama Pemesan</span>
                        <span class="detail-value">${decodeURIComponent(name)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Booking Status</span>
                        <span class="detail-value" style="color: ${statusColor};">${statusText}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Nama Acara</span>
                        <span class="detail-value">${decodeURIComponent(event)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Tanggal</span>
                        <span class="detail-value">${date}</span>
                    </div>
                    ${time ? `
                    <div class="detail-item full">
                        <span class="detail-label">Waktu</span>
                        <span class="detail-value">${decodeURIComponent(time)}</span>
                    </div>
                    ` : ''}
                </div>
            </div>

            <!-- Order Items -->
            <div class="section">
                <div class="section-header">
                    <div class="section-icon items">🛍️</div>
                    <div class="section-title">Rincian Pesanan</div>
                </div>
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Deskripsi</th>
                            <th style="text-align:center;">Qty</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${parsedItems.map((item: any) => `
                        <tr>
                            <td>
                                <div class="item-name">${item.item}</div>
                                ${item.item.includes('Sewa Aula') ? `<div class="item-desc">${decodeURIComponent(event)}<br>📅 ${date} ${time ? `· ⏰ ${decodeURIComponent(time)}` : ''}</div>` : ''}
                            </td>
                            <td class="qty">${item.qty}</td>
                            <td>${parseInt(item.total).toLocaleString()} ${currency}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <!-- Total -->
            <div class="total-block">
                <div class="total-label">
                    Total Pembayaran
                    <span>Including all services</span>
                </div>
                <div class="total-value">${parseInt(total).toLocaleString()} ${currency}</div>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div class="footer-contacts">
                <span class="footer-contact">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    68 Taha Hussein, First Settlement, Cairo
                </span>
                <span class="footer-contact">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    +62 851-8991-6769
                </span>
            </div>
            <div class="footer-time">Generated on ${new Date().toLocaleString('en-US')}</div>
            <div class="btn-group">
                <button class="print-btn" onclick="window.print()">🖨️ Download PDF / Print</button>
                ${phone ? `<button class="wa-btn" id="sendWaBtn" onclick="sendWhatsApp()">📱 Kirim WA</button>` : ''}
            </div>
        </div>
    </div>

    <script>
    async function sendWhatsApp() {
        const btn = document.getElementById('sendWaBtn');
        btn.disabled = true;
        btn.textContent = '⏳ Membuat PDF...';
        btn.style.opacity = '0.7';
        try {
            const buttons = document.querySelectorAll('.print-btn, .wa-btn');
            buttons.forEach(b => b.style.display = 'none');
            const container = document.querySelector('.container');
            const canvas = await html2canvas(container, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#ffffff', logging: false });
            buttons.forEach(b => b.style.display = '');
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const pdfWidth = 210;
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [pdfWidth, pdfHeight] });
            doc.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            const pdfBase64 = doc.output('datauristring').split(',')[1];
            btn.textContent = '📤 Mengirim ke WA...';
            const response = await fetch('/api/booking/auditorium/pdf/send-wa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: '${phone}', pdfBase64, bookingId: '${bookingId}',
                    guestName: '${decodeURIComponent(name)}', total: '${total}',
                    currency: '${currency}', status: '${status}',
                    room: 'Auditorium', nights: '-',
                    checkIn: '${date}', checkOut: '-'
                })
            });
            const data = await response.json();
            if (data.success) {
                btn.textContent = '✅ Terkirim!';
                btn.style.background = '#16a34a';
                setTimeout(() => { btn.textContent = '📱 Kirim WA'; btn.style.background = '#25D366'; btn.style.opacity = '1'; btn.disabled = false; }, 3000);
            } else {
                alert('❌ Gagal: ' + (data.error || 'Unknown error'));
                btn.textContent = '📱 Kirim WA'; btn.style.opacity = '1'; btn.disabled = false;
            }
        } catch(err) {
            alert('❌ Error: ' + err.message);
            btn.textContent = '📱 Kirim WA'; btn.style.opacity = '1'; btn.disabled = false;
        }
    }
    </script>
</body>
</html>
`

    return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
}
