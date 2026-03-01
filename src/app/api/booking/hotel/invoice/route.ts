import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)

    const bookingId = searchParams.get('bookingId') || 'N/A'
    const name = searchParams.get('name') || ''
    const room = searchParams.get('room') || ''
    const nights = searchParams.get('nights') || '0'
    const checkIn = searchParams.get('checkIn') || ''
    const checkOut = searchParams.get('checkOut') || ''
    const total = searchParams.get('total') || '0'
    const currency = searchParams.get('currency') || 'USD'
    const urlStatus = searchParams.get('status') || 'pending'
    const phone = searchParams.get('phone') || ''
    const bookingDocId = searchParams.get('docId') || ''

    // Query REAL payment status from database
    let status = urlStatus
    try {
        const payload = await getPayload({ config: configPromise })
        if (bookingDocId) {
            // Look up invoice by related booking document ID
            const invoiceQuery = await payload.find({
                collection: 'transactions',
                where: {
                    and: [
                        { 'relatedBooking.value': { equals: bookingDocId } },
                        { bookingType: { equals: 'hotel' } }
                    ]
                },
                sort: '-createdAt',
                limit: 1
            })
            if (invoiceQuery.docs.length > 0) {
                status = (invoiceQuery.docs[0] as any).paymentStatus || status
            }
        }
    } catch (e) {
        console.error('Failed to query payment status from DB:', e)
    }

    const isPaid = status === 'paid'

    // Parse extra charges
    const extraBed = parseInt(searchParams.get('extraBed') || '0')
    const pickup = parseInt(searchParams.get('pickup') || '0')
    const meals = parseInt(searchParams.get('meals') || '0') // In EGP usually, but let's see how passed

    // Generate invoice number
    const invoiceNumber = `INV-${bookingId.replace('HTL-', '')}`
    const invoiceDate = new Date().toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
    const dueDate = new Date().toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })

    const logoPath = path.join(process.cwd(), 'public', 'media', 'sticky-header.png')
    let logoBase64 = ''
    try {
        logoBase64 = fs.readFileSync(logoPath, 'base64')
    } catch (e) {
        console.error('Logo not found')
    }
    const logoSrc = logoBase64 ? `data:image/png;base64,${logoBase64}` : ''

    const html = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice - ${bookingId}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; padding: 20px; color: #111827; }
        .container { max-width: 800px; margin: 0 auto; background: white; box-shadow: 0 4px 20px rgba(0,0,0,0.1); position: relative; }
        .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 40px; border-bottom: 3px solid #111827; }
        .company-info h1 { font-size: 1.8rem; color: #111827; margin-bottom: 8px; }
        .company-info p { color: #4b5563; font-size: 0.9rem; line-height: 1.6; }
        .invoice-title { text-align: right; }
        .invoice-title h2 { font-size: 2rem; color: #111827; text-transform: uppercase; letter-spacing: 2px; }
        .status-badge { display: inline-block; padding: 6px 16px; border-radius: 6px; font-weight: 700; font-size: 1rem; margin-top: 10px; text-transform: uppercase; border: 2px solid; }
        .status-badge.paid { color: #16a34a; border-color: #16a34a; background: #f0fdf4; }
        .status-badge.unpaid { color: #dc2626; border-color: #dc2626; background: #fef2f2; }
        .invoice-number { font-family: monospace; font-size: 1rem; color: #6b7280; margin-top: 8px; }
        .invoice-body { padding: 40px; }
        .invoice-details { display: flex; justify-content: space-between; margin-bottom: 40px; }
        .bill-to h3, .invoice-info h3 { font-size: 0.8rem; color: #999; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
        .bill-to p, .invoice-info p { line-height: 1.8; }
        .invoice-info { text-align: right; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .items-table th { background: #f3f4f6; padding: 15px; text-align: left; font-weight: 600; color: #111827; border-bottom: 2px solid #111827; }
        .items-table th:last-child { text-align: right; }
        .items-table td { padding: 15px; border-bottom: 1px solid #eee; }
        .items-table td:last-child { text-align: right; font-weight: 600; }
        .items-table .item-name { font-weight: 600; }
        .items-table .item-desc { font-size: 0.85rem; color: #666; margin-top: 4px; }
        .totals { display: flex; justify-content: flex-end; }
        .totals-table { width: 300px; }
        .totals-table tr td { padding: 10px 15px; }
        .totals-table tr td:first-child { color: #666; }
        .totals-table tr td:last-child { text-align: right; font-weight: 600; }
        .totals-table .grand-total { background: #111827; color: white; }
        .totals-table .grand-total td { font-size: 1.2rem; padding: 15px; }
        .totals-table .grand-total td:first-child { color: white; }
        .payment-info { background: #f9fafb; padding: 25px; border-radius: 8px; margin-top: 30px; border-left: 4px solid #111827; }
        .payment-info h3 { font-size: 1rem; color: #111827; margin-bottom: 15px; }
        .invoice-footer { text-align: center; padding: 30px; background: #f9fafb; border-top: 1px solid #e5e7eb; }
        .print-btn { background: #111827; color: white; border: none; padding: 12px 30px; border-radius: 8px; cursor: pointer; font-size: 1rem; margin-top: 15px; }
        .print-btn:hover { background: #374151; }
        .wa-btn { background: #25D366; color: white; border: none; padding: 12px 30px; border-radius: 8px; cursor: pointer; font-size: 1rem; margin-top: 15px; margin-left: 10px; }
        .wa-btn:hover { background: #1da851; }
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
        @media print { .print-btn, .wa-btn { display: none; } body { background: white; padding: 0; } .container { box-shadow: none; } }
    </style>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
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
                <div class="status-badge ${isPaid ? 'paid' : 'unpaid'}">
                    ${isPaid ? 'PAID / LUNAS' : 'UNPAID / BELUM LUNAS'}
                </div>
            </div>
        </div>
        
        <div class="invoice-body">
            <div class="invoice-details">
                <div class="bill-to">
                    <h3>Tagihan Kepada</h3>
                    <p><strong>${decodeURIComponent(name)}</strong><br>Booking ID: ${bookingId}</p>
                </div>
                <div class="invoice-info">
                    <h3>Info Invoice</h3>
                    <p>Tanggal: ${invoiceDate}</p>
                </div>
            </div>
            
            <table class="items-table">
                <thead>
                    <tr><th>Deskripsi</th><th>Qty</th><th>Harga</th></tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <div class="item-name">Sewa Kamar ${room}</div>
                            <div class="item-desc">${nights} Malam (${checkIn} - ${checkOut})</div>
                        </td>
                        <td>1</td>
                        <td>${(parseInt(total) - extraBed - pickup).toLocaleString()} ${currency}</td>
                    </tr>
                    ${extraBed > 0 ? `
                    <tr>
                        <td><div class="item-name">Extra Bed</div></td>
                        <td>1</td>
                        <td>${extraBed.toLocaleString()} ${currency}</td>
                    </tr>` : ''}
                    ${pickup > 0 ? `
                    <tr>
                        <td><div class="item-name">Airport Pickup</div></td>
                        <td>1</td>
                        <td>${pickup.toLocaleString()} ${currency}</td>
                    </tr>` : ''}
                </tbody>
            </table>
            
            <div class="totals">
                <table class="totals-table">
                    ${meals > 0 ? `
                    <tr>
                        <td>Paket Makan (EGP)</td>
                        <td style="color: #ea580c;">+ ${meals.toLocaleString()} EGP</td>
                    </tr>` : ''}
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
            <p>Terima kasih telah menginap di Operational System Wisma Nusantara Cairo</p>
            <button class="print-btn" onclick="window.print()">🖨️ Cetak Invoice</button>
            ${phone ? `<button class="wa-btn" id="sendWaBtn" onclick="sendWhatsApp()">📱 Kirim WA</button>` : ''}
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
                backgroundColor: '#ffffff',
                logging: false
            });

            // Show buttons again
            buttons.forEach(b => b.style.display = '');

            // Convert to PDF using jsPDF
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;

            // A4 dimensions in mm
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
            const response = await fetch('/api/booking/hotel/invoice/send-wa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: '${phone}',
                    pdfBase64: pdfBase64,
                    bookingId: '${bookingId}',
                    guestName: '${decodeURIComponent(name)}',
                    total: '${total}',
                    currency: '${currency}',
                    status: '${status}',
                    room: '${room}',
                    nights: '${nights}',
                    checkIn: '${checkIn}',
                    checkOut: '${checkOut}'
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
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
}
