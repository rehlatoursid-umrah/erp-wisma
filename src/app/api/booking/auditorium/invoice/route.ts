import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)

    const bookingId = searchParams.get('bookingId') || 'N/A'
    const name = searchParams.get('name') || ''
    const event = searchParams.get('event') || ''
    const date = searchParams.get('date') || ''
    const total = searchParams.get('total') || '0'
    const status = searchParams.get('status') || 'pending'
    const isPaid = status === 'paid' || status === 'confirmed' // Adjust based on your logic, usually 'paid'
    const statusLabel = isPaid ? '✅ LUNAS' : '⏳ Belum Dibayar'
    const statusClass = isPaid ? 'paid' : 'unpaid'

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
    <style>
        /* ... existing styles ... */
        .status-badge {
            display: inline-block;
            background: #fbbf24;
            color: #78350f;
            padding: 6px 16px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 0.8rem;
        }
        .status-badge.unpaid {
            background: #fee2e2;
            color: #991b1b;
        }
        .status-badge.paid {
            background: #dcfce7;
            color: #166534;
        }
        /* ... */
    </style>
</head>
<body>
    <div class="container">
        <div class="invoice-header">
            <div class="company-info">
               <!-- ... -->
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
                <h3>💳 Informasi Pembayaran</h3>
                <p>
                    Pembayaran dapat dilakukan melalui:<br>
                    • Cash langsung ke admin<br>
                    • Transfer bank (hubungi admin untuk detail rekening)<br>
                    • Vodafone Cash<br><br>
                    📱 Konfirmasi pembayaran: WhatsApp +20 150 704 9289
                </p>
            </div>
        </div>
        
        <div class="invoice-footer">
            <p>Terima kasih telah menggunakan layanan Wisma Nusantara Cairo</p>
            <p style="margin-top: 8px; font-size: 0.75rem; color: #999;">
                Invoice digenerate pada ${new Date().toLocaleString('id-ID')}
            </p>
            <button class="print-btn" onclick="window.print()">🖨️ Cetak Invoice</button>
        </div>
    </div>
</body>
</html>
`

    return new NextResponse(html, {
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
        },
    })
}
