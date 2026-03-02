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
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; padding: 20px; color: #111827; }
        .container { max-width: 800px; margin: 0 auto; background: white; box-shadow: 0 4px 20px rgba(0,0,0,0.1); position: relative; }
        .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 40px; border-bottom: 3px solid #111827; }
        .company-info { display: flex; align-items: flex-start; gap: 20px; }
        .company-info img { width: 80px; height: auto; object-fit: contain; margin-top: 5px; }
        .company-info h1 { font-size: 1.3rem; margin: 0 0 10px 0; line-height: 1.2; color: #111827; }
        .company-info .contact-details { font-size: 0.85rem; color: #4b5563; line-height: 1.6; }
        .company-info .contact-row { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
        
        .invoice-title { text-align: right; }
        .invoice-title h2 { font-size: 2rem; color: #111827; text-transform: uppercase; letter-spacing: 2px; }
        .status-badge { display: inline-block; padding: 6px 16px; border-radius: 6px; font-weight: 700; font-size: 1rem; margin-top: 10px; text-transform: uppercase; border: 2px solid; }
        .status-badge.paid { color: #16a34a; border-color: #16a34a; background: #f0fdf4; }
        .status-badge.unpaid { color: #eab308; border-color: #eab308; background: #fefce8; }
        
        .invoice-number { font-family: monospace; font-size: 1rem; color: #6b7280; margin-top: 8px; }
        .invoice-body { padding: 40px; }
        .invoice-details { display: flex; justify-content: space-between; margin-bottom: 40px; }
        .bill-to h3, .invoice-info h3 { font-size: 0.8rem; color: #999; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
        .bill-to p, .invoice-info p { line-height: 1.8; }
        .invoice-info { text-align: right; }
        
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .items-table th { background: #f3f4f6; padding: 15px; text-align: left; font-weight: 600; color: #111827; border-bottom: 2px solid #111827; }
        .items-table th.center { text-align: center; }
        .items-table th:last-child { text-align: right; }
        .items-table td { padding: 15px; border-bottom: 1px solid #eee; }
        .items-table td:last-child { text-align: right; font-weight: 600; }
        .items-table .item-name { font-weight: 600; }
        
        .totals { display: flex; justify-content: flex-end; }
        .totals-table { width: 350px; }
        .totals-table tr td { padding: 10px 15px; }
        .totals-table tr td:first-child { color: #666; }
        .totals-table tr td:last-child { text-align: right; font-weight: 600; }
        .totals-table .grand-total { background: #111827; color: white; }
        .totals-table .grand-total td { font-size: 1.2rem; padding: 15px; color: white !important;} /* forced white */
        
        .payment-info { background: #f9fafb; padding: 25px; border-radius: 8px; margin-top: 30px; border-left: 4px solid #111827; }
        .payment-info h3 { font-size: 1rem; color: #111827; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; }
        
        .invoice-footer { text-align: center; padding: 30px; background: #f9fafb; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 0.85rem;}
        
        #printBtn {
            background: white;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: all 0.2s ease;
            padding: 12px 24px;
            color: #374151;
            margin: 20px auto;
        }
        #printBtn:hover { background: #f9fafb; }
        
        /* Force background colors on print */
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
        
        @media print { 
            #printBtn { display: none !important; } 
            body { background: white; padding: 0; } 
            .container { box-shadow: none; border: none; } 
            .totals-table .grand-total td { color: white !important; }
        }
    </style>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
</head>
<body>
    <button id="printBtn">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
        Download PDF Invoice
    </button>

    <div class="container" id="invoice">
        <div class="invoice-header">
            <div class="company-info">
                <img src="${logoSrc}" alt="Logo">
                <div class="contact-details">
                    <h1 style="font-size: 1.3rem; margin: 0 0 10px 0; line-height: 1.2; color: #111827;">Operational System<br/>Wisma Nusantara Cairo</h1>
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
                <h2>Invoice</h2>
                <div class="invoice-number">${invoiceNo}</div>
                <div class="status-badge ${isPaid ? 'paid' : 'unpaid'}">
                    ${isPaid ? 'PAID / LUNAS' : (paymentStatus === 'pending' ? 'PENDING' : paymentStatus.toUpperCase())}
                </div>
            </div>
        </div>
        
        <div class="invoice-body">
            <div class="invoice-details">
                <div class="bill-to">
                    <h3>Tagihan Kepada</h3>
                    <p><strong>\${customerName}</strong><br>
                    \${customerWA && customerWA !== '-' ? \`WhatsApp: \${customerWA}<br>\` : ''}
                    Tipe: \${bookingType.replace('_', ' ').toUpperCase()}</p>
                </div>
                <div class="invoice-info">
                    <h3>Info Invoice</h3>
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
                        <td>\${subtotal ? subtotal.toLocaleString() : totalAmount.toLocaleString()} \${currency}</td>
                    </tr>
                    \${discount > 0 ? \`
                    <tr>
                        <td>Diskon</td>
                        <td style="color: #dc2626;">-\${discount.toLocaleString()} \${currency}</td>
                    </tr>
                    \` : ''}
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
                <p style="color: #4b5563; font-size: 0.9rem;">
                    \${isPaid ? \`Pembayaran telah lunas secara \${paymentMethod ? paymentMethod.toUpperCase() : 'CASH'} kepada resepsionis.\` : 'Pembayaran HANYA dapat dilakukan secara CASH (TUNAI) kepada resepsionis atau Transfer resmi Wisma Nusantara Cairo.'}
                </p>
            </div>
        </div>
        
        <div class="invoice-footer">
            Terima kasih telah menggunakan layanan Wisma Nusantara Cairo<br>
            Invoice digenerate pada ${new Date().toLocaleString('id-ID')}
        </div>
    </div>

    <script>
        document.getElementById('printBtn').addEventListener('click', async () => {
            const btn = document.getElementById('printBtn');
            const originalText = btn.innerHTML;
            btn.innerHTML = 'Sedang memproses PDF...';
            btn.style.opacity = '0.7';
            btn.disabled = true;

            try {
                const container = document.getElementById('invoice');
                const canvas = await html2canvas(container, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#ffffff', logging: false });
                
                const imgData = canvas.toDataURL('image/jpeg', 0.95);
                const pdf = new jspdf.jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4'
                });

                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

                pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
                pdf.save('${invoiceNo}.pdf');
            } catch (err) {
                console.error(err);
                alert('Gagal membuat PDF. Coba gunakan fitur Print browser.');
                window.print();
            } finally {
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
