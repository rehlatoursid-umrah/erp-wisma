import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)

    const invoiceId = searchParams.get('id')

    if (!invoiceId) {
        return new NextResponse('Missing invoice ID', { status: 400 })
    }

    let invoice: any = null;

    try {
        const payload = await getPayload({ config: configPromise })
        const query = await payload.findByID({
            collection: 'transactions',
            id: invoiceId
        })
        invoice = query;
    } catch (e) {
        console.error('Failed to query invoice from DB:', e)
        return new NextResponse('Invoice not found', { status: 404 })
    }

    if (!invoice) {
        return new NextResponse('Invoice not found', { status: 404 })
    }

    const {
        invoiceNo,
        customerName,
        customerWA,
        bookingType,
        paymentStatus,
        paymentMethod,
        invoiceDate: rawDate,
        createdAt,
        totalAmount,
        subtotal,
        discount,
        currency,
        items
    } = invoice

    const isPaid = paymentStatus === 'paid'

    const invoiceDate = rawDate ? new Date(rawDate).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) : new Date(createdAt).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })

    const dueDate = invoiceDate // For now use same or add +7 days logic if needed

    const logoPath = path.join(process.cwd(), 'public', 'media', 'sticky-header.png')
    let logoBase64 = ''
    try {
        logoBase64 = fs.readFileSync(logoPath, 'base64')
    } catch (e) {
        console.error('Logo not found')
    }
    const logoSrc = logoBase64 ? `data:image/png;base64,${logoBase64}` : ''

    const isEGP = currency === 'EGP'

    let itemsHtml = ''
    if (items && Array.isArray(items)) {
        itemsHtml = items.map((item: any) => `
            <tr>
                <td>
                    <div class="item-name">${item.itemName}</div>
                </td>
                <td style="text-align: center;">${item.quantity}</td>
                <td>${item.priceUnit.toLocaleString()} ${currency}</td>
                <td>${item.subtotal.toLocaleString()} ${currency}</td>
            </tr>
        `).join('')
    } else {
        itemsHtml = `<tr><td colspan="4" style="text-align: center;">No items found</td></tr>`
    }

    const html = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice - ${invoiceNo}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8fafc; color: #0f172a; -webkit-font-smoothing: antialiased; }
        
        .invoice-wrapper { width: 100%; overflow-x: auto; display: flex; flex-direction: column; align-items: center; padding: 20px 10px; }
        
        .container { width: 800px; min-width: 800px; background: white; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
        
        .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 40px 40px 30px; border-bottom: 2px solid #0f172a; }
        .company-info { display: flex; align-items: flex-start; gap: 20px; }
        .company-info img { width: 75px; height: auto; object-fit: contain; margin-top: 5px; }
        .company-info h1 { font-size: 1.4rem; font-weight: 800; margin: 0 0 8px 0; line-height: 1.2; color: #0f172a; }
        .company-info .contact-details { font-size: 0.85rem; color: #475569; line-height: 1.6; }
        .company-info .contact-row { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
        
        .invoice-title { text-align: right; }
        .invoice-title h2 { font-size: 2.2rem; color: #0f172a; font-weight: 900; letter-spacing: 2px; }
        .invoice-number { font-family: monospace; font-size: 0.95rem; color: #64748b; margin-top: 6px; }
        .status-badge { display: inline-block; padding: 6px 16px; border-radius: 4px; font-weight: 800; font-size: 0.9rem; margin-top: 12px; text-transform: uppercase; border: 2px solid; background: transparent; }
        .status-badge.paid { color: #16a34a; border-color: #16a34a; }
        .status-badge.unpaid { color: #eab308; border-color: #eab308; }
        
        .invoice-body { padding: 30px 0; }
        .invoice-details { display: flex; justify-content: space-between; align-items: flex-start; padding: 0 40px 30px; }
        .bill-to h3 { font-size: 1.1rem; color: #0f172a; font-weight: 800; text-transform: none; margin-bottom: 12px; }
        .bill-to p { line-height: 1.8; font-size: 0.95rem; color: #1e293b; }
        .invoice-info { text-align: right; }
        .invoice-info h3 { font-size: 0.8rem; color: #94a3b8; text-transform: uppercase; font-weight: 800; letter-spacing: 1px; margin-bottom: 12px; }
        .invoice-info p { font-size: 0.95rem; color: #0f172a; }
        
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .items-table th { background: #f8fafc; padding: 12px 15px; text-align: left; font-weight: 800; color: #0f172a; border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a; font-size: 0.9rem; }
        .items-table th:first-child { padding-left: 40px; }
        .items-table th:last-child { padding-right: 40px; text-align: right; }
        .items-table th.center { text-align: center; }
        .items-table td { padding: 15px; border-bottom: 1px solid #f1f5f9; font-size: 0.95rem; color: #0f172a; vertical-align: top; }
        .items-table td:first-child { padding-left: 40px; }
        .items-table td:last-child { padding-right: 40px; text-align: right; font-weight: 800; }
        .items-table td.center { text-align: center; }
        .items-table .item-name { font-weight: 800; color: #0f172a; }
        
        .totals { display: flex; justify-content: flex-end; padding: 0 40px; margin-bottom: 40px; }
        .totals-table { width: 350px; border-collapse: separate; border-spacing: 2px; }
        .totals-table tr td { padding: 12px 15px; font-size: 0.95rem; }
        .totals-table tr td:first-child { color: #64748b; }
        .totals-table tr td:last-child { text-align: right; font-weight: 800; color: #0f172a; }
        .totals-table .grand-total td { background: #0f172a; color: white !important; font-size: 1.1rem; }
        .totals-table .grand-total td:first-child { font-weight: 500; }
        .totals-table .grand-total td:last-child { font-weight: 800; }
        
        .payment-info { background: #f8fafc; padding: 25px 30px; border-radius: 8px; margin: 0 40px 40px; border-left: 4px solid #0f172a; }
        .payment-info h3 { font-size: 1rem; color: #0f172a; font-weight: 800; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
        .payment-info p { color: #475569; font-size: 0.95rem; line-height: 1.6; }
        
        .invoice-footer { text-align: center; padding: 30px; background: #f8fafc; color: #64748b; font-size: 0.85rem; border-top: 1px solid #e2e8f0; }
        
        .action-buttons {
            display: flex; justify-content: flex-start; gap: 15px; margin: 0 auto 20px; width: 800px; padding: 0;
        }
        .btn {
            border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; font-size: 0.9rem; font-weight: 700;
            display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 20px; transition: all 0.2s;
        }
        .btn-primary { background: white; color: #0f172a; }
        .btn-primary:hover { background: #f1f5f9; }
        .btn-success { background: #22c55e; color: white; border-color: #22c55e; box-shadow: 0 4px 10px rgba(34, 197, 94, 0.2); }
        .btn-success:hover { background: #16a34a; }
        
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
        
        @media print { 
            .no-print { display: none !important; } 
            body { background: white; padding: 0; } 
            .invoice-wrapper { overflow: visible; display: block; padding: 0; }
            .container { box-shadow: none; border: none; width: 100%; min-width: auto; } 
            .action-buttons { display: none; }
            .totals-table .grand-total td { color: white !important; }
        }
    </style>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
</head>
<body>
    <div class="invoice-wrapper">
        <div class="action-buttons no-print">
            <button id="printBtn" class="btn btn-primary">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                Print Invoice
            </button>
            <button id="waBtn" class="btn btn-success" data-id="${invoiceId}">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                Kirim WhatsApp
            </button>
        </div>

        <div class="container" id="invoice">
            <div class="invoice-header">
                <div class="company-info">
                    <img src="${logoSrc}" alt="Logo">
                    <div class="contact-details">
                        <h1>Operational System<br/>Wisma Nusantara Cairo</h1>
                        <div style="margin-bottom: 6px;">Indonesian Hostel in Cairo<br>Cairo, Egypt</div>
                        <div class="contact-row">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
                            <span>WhatsApp +62 851-8991-6769</span>
                        </div>
                        <div class="contact-row">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                            <span>Phone 01554646871</span>
                        </div>
                        <div class="contact-row">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                            <span>admin@wismanusantaracairo.com</span>
                        </div>
                    </div>
                </div>
                <div class="invoice-title">
                    <h2>INVOICE</h2>
                    <div class="invoice-number">${invoiceNo}</div>
                    <div class="status-badge ${isPaid ? 'paid' : 'unpaid'}">
                        ${isPaid ? 'PAID / LUNAS' : (paymentStatus === 'pending' ? 'PENDING' : paymentStatus.toUpperCase())}
                    </div>
                </div>
            </div>
            
            <div class="invoice-body">
                <div class="invoice-details">
                    <div class="bill-to">
                        <h3>${customerName}</h3>
                        <p>${customerWA && customerWA !== '-' ? `WhatsApp: ${customerWA}<br>` : ''}
                        Tipe: ${bookingType.replace('_', ' ').toUpperCase()}</p>
                    </div>
                    <div class="invoice-info">
                        <h3>INFO INVOICE</h3>
                        <p>Tanggal Invoice: ${invoiceDate}</p>
                    </div>
                </div>
            
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Deskripsi</th>
                        <th class="center">Qty</th>
                        <th>Harga</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>
            
            <div class="totals">
                <table class="totals-table">
                    <tr>
                        <td>Subtotal</td>
                        <td>${subtotal ? subtotal.toLocaleString() : totalAmount.toLocaleString()} ${currency}</td>
                    </tr>
                    ${discount > 0 ? `
                    <tr>
                        <td>Diskon</td>
                        <td style="color: #dc2626;">-${discount.toLocaleString()} ${currency}</td>
                    </tr>
                    ` : ''}
                    <tr class="grand-total">
                        <td>Total</td>
                        <td>${totalAmount.toLocaleString()} ${currency}</td>
                    </tr>
                </table>
            </div>

            <div class="payment-info">
                <h3>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                    Informasi Pembayaran
                </h3>
                <p>
                    ${isPaid ? `Pembayaran telah lunas secara ${paymentMethod ? paymentMethod.toUpperCase() : 'CASH'} kepada resepsionis.` : 'Pembayaran HANYA dapat dilakukan secara CASH (TUNAI) kepada resepsionis atau Transfer resmi Wisma Nusantara Cairo.'}
                </p>
            </div>
        </div>
        
        <div class="invoice-footer">
            Terima kasih telah menggunakan layanan Wisma Nusantara Cairo<br>
            Invoice digenerate pada ${new Date().toLocaleString('id-ID')}
        </div>
    </div>
</div>

    <script>
        document.getElementById('printBtn').addEventListener('click', () => {
            window.print();
        });

        document.getElementById('waBtn').addEventListener('click', async (e) => {
            const btn = e.currentTarget;
            const originalText = btn.innerHTML;
            const invoiceId = btn.getAttribute('data-id');
            
            btn.innerHTML = '⏳ Menyiapkan PDF...';
            btn.style.opacity = '0.7';
            btn.disabled = true;

            try {
                // Generate PDF first
                const buttons = document.querySelectorAll('.no-print');
                buttons.forEach(b => b.style.display = 'none');
                
                const container = document.getElementById('invoice');
                const canvas = await html2canvas(container, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#ffffff', logging: false });
                
                buttons.forEach(b => b.style.display = '');

                const imgData = canvas.toDataURL('image/jpeg', 0.95);
                const pdfWidth = Math.min(210, (canvas.width * 25.4) / 96); // Basic mm calculation
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: [pdfWidth, pdfHeight]
                });

                doc.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
                const pdfBase64 = doc.output('datauristring').split(',')[1];

                btn.innerHTML = '📤 Mengirim ke WA...';

                const res = await fetch('/api/finance/invoice/send-wa', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: invoiceId, pdfBase64: pdfBase64 })
                });
                
                if (res.ok) {
                    btn.innerHTML = '✅ Terkirim!';
                    btn.style.background = '#16a34a';
                    setTimeout(() => {
                        btn.innerHTML = originalText;
                        btn.style.background = '#25D366';
                        btn.style.opacity = '1';
                        btn.disabled = false;
                    }, 3000);
                } else {
                    const err = await res.json();
                    alert('❌ Gagal mengirim: ' + (err.error || 'Unknown error'));
                    btn.innerHTML = originalText;
                    btn.style.opacity = '1';
                    btn.disabled = false;
                }
            } catch (err) {
                console.error(err);
                alert('Oops, terjadi kesalahan sistem saat memproses PDF/WA.');
                btn.innerHTML = originalText;
                btn.style.opacity = '1';
                btn.disabled = false;
            }
        });
    </script>
</body>
</html>
    `;

    return new NextResponse(html, {
        headers: {
            'Content-Type': 'text/html; charset=utf-8'
        }
    })
}
