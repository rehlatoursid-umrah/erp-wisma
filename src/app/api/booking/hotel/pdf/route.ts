import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)

    const bookingId = searchParams.get('bookingId') || 'N/A'
    const name = searchParams.get('name') || ''
    const room = searchParams.get('room') || ''
    const checkIn = searchParams.get('checkIn') || ''
    const checkOut = searchParams.get('checkOut') || ''
    const nights = searchParams.get('nights') || '0'
    const total = searchParams.get('total') || '0'
    const status = searchParams.get('status') || 'pending'
    const currency = searchParams.get('currency') || 'USD'
    const extraBed = parseInt(searchParams.get('extraBed') || '0')
    const pickup = parseInt(searchParams.get('pickup') || '0')
    const meals = parseInt(searchParams.get('meals') || '0')

    const isConfirmed = status === 'confirmed' || status === 'paid' || status === 'checked-in' || status === 'checked-out'
    const statusLabel = isConfirmed ? 'KONFIRMASI BOOKING' : 'MENUNGGU KONFIRMASI'
    const statusColor = isConfirmed ? '#22c55e' : '#f59e0b'
    const statusBg = isConfirmed ? '#dcfce7' : '#fef3c7'
    const statusText = isConfirmed ? 'Booking Confirmed' : 'Waiting for Confirmation'

    // Generate HTML for PDF-like confirmation
    const html = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Hotel - ${bookingId}</title>
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
            max-width: 700px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            overflow: hidden;
            position: relative;
        }
        .header {
            background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
            color: white;
            padding: 30px;
            text-align: center;
            position: relative;
        }
        .header h1 {
            font-size: 1.5rem;
            margin-bottom: 8px;
            letter-spacing: 0.5px;
        }
        .header p {
            opacity: 0.9;
            font-size: 0.9rem;
        }
        .content {
            padding: 30px;
        }
        .booking-status {
            text-align: center;
            margin-bottom: 30px;
        }
        .status-badge {
            display: inline-block;
            background: ${statusBg};
            color: ${statusColor};
            padding: 8px 20px;
            border-radius: 50px;
            font-weight: 700;
            font-size: 0.9rem;
            border: 1px solid ${statusColor}40;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .booking-id-section {
            display: flex;
            justify-content: center;
            margin-bottom: 25px;
        }
        .booking-id-box {
            background: #f8fafc;
            padding: 15px 30px;
            border-radius: 12px;
            text-align: center;
            border: 1px dashed #cbd5e1;
        }
        .booking-id-label {
            font-size: 0.75rem;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 4px;
        }
        .booking-id-value {
            font-size: 1.4rem;
            font-weight: bold;
            color: #1e3a8a;
            font-family: monospace;
        }
        .section {
            margin-bottom: 30px;
        }
        .section-title {
            font-weight: 700;
            color: #1e3a8a;
            margin-bottom: 15px;
            font-size: 1rem;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .detail-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        .detail-item {
            margin-bottom: 12px;
        }
        .label {
            display: block;
            color: #64748b;
            font-size: 0.85rem;
            margin-bottom: 2px;
        }
        .value {
            font-weight: 600;
            color: #0f172a;
            font-size: 1rem;
        }
        .total-section {
            background: #f8fafc;
            padding: 20px;
            border-radius: 12px;
            margin-top: 20px;
            border: 1px solid #e2e8f0;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .total-label {
            font-size: 1.1rem;
            color: #334155;
            font-weight: 600;
        }
        .total-value {
            font-size: 1.6rem;
            font-weight: 800;
            color: #1e3a8a;
        }
        .footer {
            background: #f1f5f9;
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        .footer p {
            color: #64748b;
            font-size: 0.85rem;
            margin-bottom: 6px;
        }
        .print-btn {
            background: #1e3a8a;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.95rem;
            margin-top: 15px;
            font-weight: 600;
            transition: background 0.2s;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }
        .print-btn:hover {
            background: #1e40af;
        }
        @media print {
            body { background: white; padding: 0; }
            .container { box-shadow: none; max-width: 100%; border-radius: 0; }
            .print-btn { display: none; }
            .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .status-badge { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏛️ Wisma Nusantara Cairo</h1>
            <p>Hotel & Homestay Booking Confirmation</p>
        </div>
        
        <div class="content">
            <div class="booking-status">
                <span class="status-badge">${statusLabel}</span>
                <div style="margin-top: 8px; font-size: 0.9rem; color: #64748b;">${statusText}</div>
            </div>

            <div class="booking-id-section">
                <div class="booking-id-box">
                    <div class="booking-id-label">Booking Reference</div>
                    <div class="booking-id-value">${bookingId}</div>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">👤 Guest Information</div>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="label">Primary Guest</span>
                        <span class="value">${decodeURIComponent(name)}</span>
                    </div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">🏨 Room Details</div>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="label">Room Number</span>
                        <span class="value">Room ${room}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Duration</span>
                        <span class="value">${nights} Night(s)</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Check-in Date</span>
                        <span class="value">${checkIn}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Check-out Date</span>
                        <span class="value">${checkOut}</span>
                    </div>
                </div>
            </div>

            ${(extraBed > 0 || pickup > 0 || meals > 0) ? `
            <div class="section">
                <div class="section-title">✨ Additional Services</div>
                <div class="detail-grid">
                    ${extraBed > 0 ? `
                    <div class="detail-item">
                        <span class="label">Extra Bed</span>
                        <span class="value">${extraBed.toLocaleString()} ${currency}</span>
                    </div>` : ''}
                    ${pickup > 0 ? `
                    <div class="detail-item">
                        <span class="label">Airport Pickup</span>
                        <span class="value">${pickup.toLocaleString()} ${currency}</span>
                    </div>` : ''}
                    ${meals > 0 ? `
                    <div class="detail-item">
                        <span class="label">Meals (Paid Separately)</span>
                        <span class="value" style="color: #ea580c;">${meals.toLocaleString()} EGP</span>
                    </div>` : ''}
                </div>
            </div>
            ` : ''}
            
            <div class="total-section">
                <div class="total-row">
                    <span class="total-label">Total Amount</span>
                    <span class="total-value">${parseInt(total).toLocaleString()} ${currency}</span>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>📍 Wisma Nusantara Cairo, 68 Taha Hussein, First Settlement, Cairo, Egypt</p>
            <p>📱 WhatsApp: +20 150 704 9289 | 🌐 wismanusantara.com</p>
            <p style="margin-top: 20px; font-size: 0.75rem; opacity: 0.7;">
                Generated on ${new Date().toLocaleString('en-US')}
            </p>
            <button class="print-btn" onclick="window.print()">
                🖨️ Download PDF / Print
            </button>
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
