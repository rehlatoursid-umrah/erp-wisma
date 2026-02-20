import { NextRequest, NextResponse } from 'next/server'

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
    const isConfirmed = status === 'confirmed' || status === 'paid'
    const statusText = isConfirmed ? '✅ Booking Confirmed' : '⏳ Menunggu Konfirmasi'
    const statusClass = isConfirmed ? 'confirmed' : 'pending'

    const itemsParam = searchParams.get('items')

    let parsedItems = []
    if (itemsParam) {
        try {
            parsedItems = JSON.parse(itemsParam)
        } catch (e) {
            console.error('Failed to parse items', e)
        }
    }

    // Fallback
    if (parsedItems.length === 0) {
        parsedItems.push({
            item: 'Sewa Auditorium (Bundle)',
            qty: 1,
            price: total,
            total: total
        })
    }

    // Generate HTML for PDF-like confirmation
    const html = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Konfirmasi Booking - ${bookingId}</title>
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
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            font-size: 1.5rem;
            margin-bottom: 8px;
        }
        .header p {
            opacity: 0.9;
            font-size: 0.9rem;
        }
        .content {
            padding: 30px;
        }
        .booking-id {
            background: #f8f4f0;
            padding: 15px;
            border-radius: 12px;
            text-align: center;
            margin-bottom: 25px;
        }
        .booking-id-label {
            font-size: 0.8rem;
            color: #666;
            margin-bottom: 4px;
        }
        .booking-id-value {
            font-size: 1.5rem;
            font-weight: bold;
            color: #8B4513;
            font-family: monospace;
        }
        .section {
            margin-bottom: 25px;
        }
        .section-title {
            font-weight: 600;
            color: #8B4513;
            margin-bottom: 12px;
            font-size: 1rem;
            border-bottom: 2px solid #f0e6dc;
            padding-bottom: 8px;
        }
        .row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #f0f0f0;
        }
        .row:last-child {
            border-bottom: none;
        }
        .label {
            color: #666;
        }
        .value {
            font-weight: 600;
            color: #333;
        }
        .total-section {
            background: linear-gradient(135deg, #f8f4f0 0%, #fff5eb 100%);
            padding: 20px;
            border-radius: 12px;
            margin-top: 20px;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .total-label {
            font-size: 1.1rem;
            color: #333;
        }
        .total-value {
            font-size: 1.5rem;
            font-weight: bold;
            color: #8B4513;
        }
        .footer {
            background: #f8f4f0;
            padding: 20px 30px;
            text-align: center;
        }
        .footer p {
            color: #666;
            font-size: 0.85rem;
            margin-bottom: 8px;
        }
        .status-badge {
            display: inline-block;
            background: #fbbf24;
            color: #78350f;
            padding: 8px 20px;
            border-radius: 20px;
            font-weight: 600;
            margin: 15px 0;
            text-align: center; 
            display: block;
        }
        .status-badge.confirmed {
            background: #dcfce7;
            color: #166534;
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
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        .items-table th {
            text-align: left;
            padding: 10px;
            background: #f8f4f0;
            color: #8B4513;
            font-size: 0.9rem;
        }
        .items-table td {
            padding: 10px;
            border-bottom: 1px solid #eee;
            font-size: 0.9rem;
        }
        .items-table td:last-child, .items-table th:last-child {
            text-align: right;
        }
        .item-name {
            font-weight: 600;
        }
        .item-desc {
            font-size: 0.8rem;
            color: #666;
            margin-top: 4px;
        }
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏛️ Wisma Nusantara Cairo</h1>
            <p>Konfirmasi Booking Auditorium</p>
        </div>
        
        <div class="content">
            <div class="booking-id">
                <div class="booking-id-label">Booking ID</div>
                <div class="booking-id-value">${bookingId}</div>
            </div>
            
            <div class="status-badge ${statusClass}">
                ${statusText}
            </div>
            
            <div class="section">
                <div class="section-title">📋 Detail Booking</div>
                <div class="row">
                    <span class="label">Nama Pemesan</span>
                    <span class="value">${decodeURIComponent(name)}</span>
                </div>
                <div class="row">
                    <span class="label">Nama Acara</span>
                    <span class="value">${decodeURIComponent(event)}</span>
                </div>
                <div class="row">
                    <span class="label">Tanggal</span>
                    <span class="value">${date}</span>
                </div>
                <div class="row">
                    <span class="label">Waktu</span>
                    <span class="value">${decodeURIComponent(time)}</span>
                </div>
            </div>

            <div class="section">
                <div class="section-title">🛍️ Rincian Pesanan</div>
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
                            ${item.item.includes('Sewa Aula') ? `<div class="item-desc">${decodeURIComponent(event)}<br>📅 ${date}<br>⏰ ${decodeURIComponent(time)}</div>` : ''}
                        </td>
                        <td>${item.qty}</td>
                        <td>${parseInt(item.price).toLocaleString()} ${currency}</td>
                        <td>${parseInt(item.total).toLocaleString()} ${currency}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
            </div>
            
            <div class="total-section">
                <div class="total-row">
                    <span class="total-label">💰 Total Pembayaran</span>
                    <span class="total-value">${parseInt(total).toLocaleString()} ${currency}</span>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>📍 Wisma Nusantara Cairo, Egypt</p>
            <p>📱 WhatsApp: +20 150 704 9289</p>
            <p style="margin-top: 15px; font-size: 0.75rem; color: #999;">
                Dokumen ini digenerate secara otomatis pada ${new Date().toLocaleString('id-ID')}
            </p>
            <button class="print-btn" onclick="window.print()">🖨️ Cetak / Simpan PDF</button>
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
