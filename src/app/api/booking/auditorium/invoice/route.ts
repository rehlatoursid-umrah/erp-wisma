import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)

    const bookingId = searchParams.get('bookingId') || 'N/A'
    const name = searchParams.get('name') || ''
    const event = searchParams.get('event') || ''
    const date = searchParams.get('date') || ''
    const total = searchParams.get('total') || '0'
    const urlStatus = searchParams.get('status') || 'pending'
    const docId = searchParams.get('docId') || ''
    const phone = searchParams.get('phone') || ''

    const logoPath = path.join(process.cwd(), 'public', 'media', 'sticky-header.png')
    let logoBase64 = ''
    try {
        logoBase64 = fs.readFileSync(logoPath, 'base64')
    } catch (e) {
        console.error('Logo not found')
    }
    const logoSrc = logoBase64 ? `data:image/png;base64,${logoBase64}` : ''

    // Query REAL payment status from database
    let paymentStatus = urlStatus
    try {
        const payload = await getPayload({ config: configPromise })
        if (docId) {
            const invoiceQuery = await payload.find({
                collection: 'transactions',
                where: {
                    and: [
                        { 'relatedBooking.value': { equals: docId } },
                        { bookingType: { equals: 'auditorium' } }
                    ]
                },
                sort: '-createdAt',
                limit: 1
            })
            if (invoiceQuery.docs.length > 0) {
                paymentStatus = (invoiceQuery.docs[0] as any).paymentStatus || paymentStatus
            }
        }
    } catch (e) {
        console.error('Failed to query payment status from DB:', e)
    }

    const isPaid = paymentStatus === 'paid'
    const statusLabel = isPaid ? 'PAID / LUNAS' : 'UNPAID / BELUM LUNAS'
    const statusClass = isPaid ? 'paid' : 'unpaid'

    const currency = searchParams.get('currency') || 'EGP'
    const itemsParam = searchParams.get('items')

    let parsedItems = []
    if (itemsParam) {
        try {
            parsedItems = JSON.parse(itemsParam)
        } catch (e) {
            console.error('Failed to parse items', e)
        }
    }

    // Fallback if no items passed
    if (parsedItems.length === 0) {
        parsedItems.push({
            item: 'Sewa Auditorium (Bundle)',
            qty: 1,
            price: total,
            total: total
        })
    }

    // Generate invoice number
    const invoiceNumber = `INV-${bookingId.replace('AULA-', '')}`
    const invoiceDate = new Date().toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })

    // ... (rest of the code)

    const html = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice - ${invoiceNumber}</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f5f5;
            padding: 20px;
            color: #111827;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .invoice-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 40px;
            border-bottom: 3px solid #111827;
        }
        .company-info h1 {
            font-size: 1.8rem;
            color: #111827;
            margin-bottom: 8px;
        }
        .company-info p {
            color: #4b5563;
            font-size: 0.9rem;
            line-height: 1.6;
        }
        .invoice-title {
            text-align: right;
        }
        .invoice-title h2 {
            font-size: 2rem;
            color: #111827;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .invoice-number {
            font-family: monospace;
            font-size: 1rem;
            color: #666;
            margin-top: 8px;
        }
        .invoice-body {
            padding: 40px;
        }
        .invoice-details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
        }
        .bill-to h3, .invoice-info h3 {
            font-size: 0.8rem;
            color: #999;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 10px;
        }
        .bill-to p, .invoice-info p {
            line-height: 1.8;
        }
        .invoice-info {
            text-align: right;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        .items-table th {
            background: #f3f4f6;
            padding: 15px;
            text-align: left;
            font-weight: 600;
            color: #111827;
            border-bottom: 2px solid #111827;
        }
        .items-table th:last-child {
            text-align: right;
        }
        .items-table td {
            padding: 15px;
            border-bottom: 1px solid #eee;
        }
        .items-table td:last-child {
            text-align: right;
            font-weight: 600;
        }
        .items-table .item-name {
            font-weight: 600;
        }
        .items-table .item-desc {
            font-size: 0.85rem;
            color: #666;
            margin-top: 4px;
        }
        .totals {
            display: flex;
            justify-content: flex-end;
        }
        .totals-table {
            width: 300px;
        }
        .totals-table tr td {
            padding: 10px 15px;
        }
        .totals-table tr td:first-child {
            color: #666;
        }
        .totals-table tr td:last-child {
            text-align: right;
            font-weight: 600;
        }
        .totals-table .grand-total {
            background: #111827;
            color: white;
        }
        .totals-table .grand-total td {
            font-size: 1.2rem;
            padding: 15px;
        }
        .totals-table .grand-total td:first-child {
            color: white;
        }
        .payment-info {
            background: #f9fafb;
            padding: 25px;
            border-radius: 8px;
            margin-top: 30px;
            border-left: 4px solid #111827;
        }
        .payment-info h3 {
            font-size: 1rem;
            color: #111827;
            margin-bottom: 15px;
        }
        .payment-info p {
            font-size: 0.9rem;
            color: #666;
            line-height: 1.8;
        }
        .invoice-footer {
            text-align: center;
            padding: 30px;
            background: #f9fafb;
            border-top: 1px solid #e5e7eb;
        }
        .invoice-footer p {
            color: #666;
            font-size: 0.85rem;
        }
        #printBtn, #sendWaBtn {
            border: none;
            border-radius: 10px;
            cursor: pointer;
            font-size: 1.05rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 10px;
            transition: all 0.3s ease;
            color: white;
            padding: 14px 28px;
        }
        #printBtn {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
        #printBtn:hover { 
            transform: translateY(-2px); 
            box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4); 
        }
        #sendWaBtn {
            background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
            box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3);
        }
        #sendWaBtn:hover { 
            transform: translateY(-2px); 
            box-shadow: 0 6px 16px rgba(37, 211, 102, 0.4); 
        }
        #sendWaBtn:disabled {
            opacity: 0.7;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }
        .print-btn { display: none; } /* Fallback for older tests */
        .wa-btn { display: none; }
        @media print {
            body { background: white; padding: 0; }
            .container { box-shadow: none; }
            .print-btn { display: none; }
        }
        .status-badge {
            display: inline-block;
            padding: 6px 16px;
            border-radius: 6px;
            font-weight: 700;
            font-size: 1rem;
            margin-top: 10px;
            text-transform: uppercase;
            border: 2px solid;
            background: transparent;
        }
        .status-badge.unpaid {
            background: #fef2f2;
            color: #dc2626;
            border-color: #dc2626;
        }
        .status-badge.paid {
            background: #f0fdf4;
            color: #16a34a;
            border-color: #16a34a;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="invoice-header">
            <div class="company-info" style="display: flex; align-items: flex-start; gap: 20px;">
                <img src="${logoSrc}" alt="Logo" style="width: 80px; height: auto; object-fit: contain; margin-top: 5px;">
                <div>
                    <h1 style="font-size: 1.3rem; margin: 0 0 10px 0; line-height: 1.2; color: #111827;">Operational System<br/>Wisma Nusantara Cairo</h1>
                    <div style="font-size: 0.85rem; color: #4b5563; line-height: 1.6;">
                        <div style="margin-bottom: 6px;">Indonesian Hostel in Cairo<br>Cairo, Egypt</div>
                        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
                            <span>WhatsApp +62 851-8991-6769</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                            <span>Phone 01554646871</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                            <span>admin@wismanusantaracairo.com</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="invoice-title">
                <h2>Invoice</h2>
                <div class="invoice-number">${invoiceNumber}</div>
                <div style="margin-top: 10px;">
                    <span class="status-badge ${statusClass}">${statusLabel}</span>
                </div>
            </div>
        </div>
        
        <div class="invoice-body">
            <div class="invoice-details">
                <div class="bill-to">
                    <h3>Tagihan Kepada</h3>
                    <p>
                        <strong>${decodeURIComponent(name)}</strong><br>
                        Booking ID: ${bookingId}
                    </p>
                </div>
                <div class="invoice-info">
                    <h3>Info Invoice</h3>
                    <p>
                        Tanggal Invoice: ${invoiceDate}<br>
                        Jatuh Tempo: ${dueDate}
                    </p>
                </div>
            </div>
            
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Deskripsi</th>
                        <th>Qty</th>
                        <th>Harga</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${parsedItems.map((item: any) => `
                    <tr>
                        <td>
                            <div class="item-name">${item.item}</div>
                            ${item.item.includes('Sewa Aula') ? `<div class="item-desc">${decodeURIComponent(event)}<br>📅 ${date}</div>` : ''}
                        </td>
                        <td>${item.qty}</td>
                        <td>${parseInt(item.price).toLocaleString()} ${currency}</td>
                        <td>${parseInt(item.total).toLocaleString()} ${currency}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="totals">
                <table class="totals-table">
                    <tr>
                        <td>Subtotal</td>
                        <td>${parseInt(total).toLocaleString()} ${currency}</td>
                    </tr>
                    <tr>
                        <td>Pajak (0%)</td>
                        <td>0 ${currency}</td>
                    </tr>
                    <tr class="grand-total">
                        <td>Total</td>
                        <td>${parseInt(total).toLocaleString()} ${currency}</td>
                    </tr>
                </table>
            </div>
            
            <div class="payment-info">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
                    <h3 style="margin: 0;">Informasi Pembayaran</h3>
                </div>
                <p>Pembayaran <strong>HANYA</strong> dapat dilakukan secara <strong>CASH (TUNAI)</strong> kepada resepsionis.</p>
            </div>
        </div>
        
        <div class="invoice-footer">
            <p>Terima kasih telah menggunakan layanan Wisma Nusantara Cairo</p>
            <p style="margin-top: 8px; font-size: 0.75rem; color: #999;">
                Invoice digenerate pada ${new Date().toLocaleString('id-ID')}
            </p>
            <div style="display: flex; justify-content: center; gap: 10px; margin-top: 20px;">
                <button id="printBtn" onclick="window.print()">🖨️ Cetak Invoice</button>
                ${phone ? `<button id="sendWaBtn" onclick="sendWhatsApp()">📱 Kirim WA</button>` : ''}
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
            // Hide buttons before capture
            const footer = document.querySelector('.invoice-footer');
            const buttons = footer.querySelectorAll('button');
            buttons.forEach(b => b.style.display = 'none');

            // Capture the invoice container as image
            const container = document.querySelector('.container');
            const canvas = await html2canvas(container, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#f5f5f5',
                logging: false
            });

            // Show buttons again
            buttons.forEach(b => b.style.display = '');

            // Convert to PDF using jsPDF
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;

            const pdfWidth = 210;
            const pdfHeight = (imgHeight * pdfWidth) / imgWidth;

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
                unit: 'mm',
                format: [pdfWidth, pdfHeight]
            });

            doc.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

            // Get PDF as base64
            const pdfBase64 = doc.output('datauristring').split(',')[1];

            btn.textContent = '📤 Mengirim ke WA...';

            // Send to server
            // We use the same route for WA sending: /api/booking/hotel/invoice/send-wa
            // but we adapt the payload to fit the template for Auditorium
            const response = await fetch('/api/booking/auditorium/invoice/send-wa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: '${phone}',
                    pdfBase64: pdfBase64,
                    bookingId: '${bookingId}',
                    guestName: '${decodeURIComponent(name)}',
                    eventName: '${decodeURIComponent(event)}',
                    total: '${total}',
                    currency: '${currency}',
                    status: '${paymentStatus}',
                    date: '${date}'
                })
            });

            const data = await response.json();

            if (data.success) {
                btn.textContent = '✅ Terkirim!';
                btn.style.background = '#16a34a';
                setTimeout(() => {
                    btn.textContent = '📱 Kirim WA';
                    btn.style.background = '#25D366';
                    btn.style.opacity = '1';
                    btn.disabled = false;
                }, 3000);
            } else {
                alert('❌ Gagal mengirim: ' + (data.error || 'Unknown error'));
                btn.textContent = '📱 Kirim WA';
                btn.style.opacity = '1';
                btn.disabled = false;
            }
        } catch(err) {
            alert('❌ Error: ' + err.message);
            btn.textContent = '📱 Kirim WA';
            btn.style.opacity = '1';
            btn.disabled = false;
        }
    }
    </script>
</body>
</html>
`

    return new NextResponse(html, {
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
        },
    })
}
