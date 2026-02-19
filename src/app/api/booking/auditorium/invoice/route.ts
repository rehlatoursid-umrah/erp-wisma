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
            color: #333;
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
            border-bottom: 3px solid #8B4513;
        }
        .company-info h1 {
            font-size: 1.8rem;
            color: #8B4513;
            margin-bottom: 8px;
        }
        .company-info p {
            color: #666;
            font-size: 0.9rem;
            line-height: 1.6;
        }
        .invoice-title {
            text-align: right;
        }
        .invoice-title h2 {
            font-size: 2rem;
            color: #8B4513;
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
            background: #f8f4f0;
            padding: 15px;
            text-align: left;
            font-weight: 600;
            color: #8B4513;
            border-bottom: 2px solid #8B4513;
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
            background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
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
            background: #f8f4f0;
            padding: 25px;
            border-radius: 8px;
            margin-top: 30px;
        }
        .payment-info h3 {
            font-size: 1rem;
            color: #8B4513;
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
            background: #f8f4f0;
            border-top: 1px solid #eee;
        }
        .invoice-footer p {
            color: #666;
            font-size: 0.85rem;
        }
        .print-btn {
            background: #8B4513;
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
            margin-top: 15px;
        }
        .print-btn:hover {
            background: #A0522D;
        }
        @media print {
            body { background: white; padding: 0; }
            .container { box-shadow: none; }
            .print-btn { display: none; }
        }
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
    </style>
</head>
<body>
    <div class="container">
        <div class="invoice-header">
            <div class="company-info">
                <h1>🏛️ Wisma Nusantara Cairo</h1>
                <p>
                    Indonesian Hostel in Cairo<br>
                    Cairo, Egypt<br>
                    📱 +20 150 704 9289
                </p>
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
