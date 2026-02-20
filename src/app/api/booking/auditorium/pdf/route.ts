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
    const status = searchParams.get('status') || 'pending'
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
        /* ... existing styles ... */
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
        /* ... */
    </style>
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
