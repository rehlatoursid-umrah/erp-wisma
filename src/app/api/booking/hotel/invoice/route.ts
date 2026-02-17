import { NextRequest, NextResponse } from 'next/server'

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

    const html = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice - ${bookingId}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; padding: 20px; color: #333; }
        .container { max-width: 800px; margin: 0 auto; background: white; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 40px; border-bottom: 3px solid #10B981; }
        .company-info h1 { font-size: 1.8rem; color: #047857; margin-bottom: 8px; }
        .company-info p { color: #666; font-size: 0.9rem; line-height: 1.6; }
        .invoice-title { text-align: right; }
        .invoice-title h2 { font-size: 2rem; color: #047857; text-transform: uppercase; letter-spacing: 2px; }
        .invoice-number { font-family: monospace; font-size: 1rem; color: #666; margin-top: 8px; }
        .invoice-body { padding: 40px; }
        .invoice-details { display: flex; justify-content: space-between; margin-bottom: 40px; }
        .bill-to h3, .invoice-info h3 { font-size: 0.8rem; color: #999; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
        .bill-to p, .invoice-info p { line-height: 1.8; }
        .invoice-info { text-align: right; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .items-table th { background: #ecfdf5; padding: 15px; text-align: left; font-weight: 600; color: #047857; border-bottom: 2px solid #047857; }
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
        .totals-table .grand-total { background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; }
        .totals-table .grand-total td { font-size: 1.2rem; padding: 15px; }
        .totals-table .grand-total td:first-child { color: white; }
        .payment-info { background: #f0fdf4; padding: 25px; border-radius: 8px; margin-top: 30px; }
        .payment-info h3 { font-size: 1rem; color: #047857; margin-bottom: 15px; }
        .invoice-footer { text-align: center; padding: 30px; background: #f9fafb; border-top: 1px solid #eee; }
        .print-btn { background: #059669; color: white; border: none; padding: 12px 30px; border-radius: 8px; cursor: pointer; font-size: 1rem; margin-top: 15px; }
        .print-btn:hover { background: #047857; }
        @media print { .print-btn { display: none; } body { background: white; padding: 0; } .container { box-shadow: none; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="invoice-header">
            <div class="company-info">
                <h1>🏨 Wisma Nusantara Cairo</h1>
                <p>Indonesian Hostel in Cairo<br>Cairo, Egypt<br>📱 +20 150 704 9289</p>
            </div>
            <div class="invoice-title">
                <h2>Invoice</h2>
                <div class="invoice-number">${invoiceNumber}</div>
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
                <h3>💳 Informasi Pembayaran</h3>
                <p>Pembayaran dapat dilakukan melalui Cash, Transfer Bank, atau Vodafone Cash.<br>Silakan hubungi admin untuk konfirmasi.</p>
            </div>
        </div>
        
        <div class="invoice-footer">
            <p>Terima kasih telah menginap di Wisma Nusantara Cairo</p>
            <button class="print-btn" onclick="window.print()">🖨️ Cetak Invoice</button>
        </div>
    </div>
</body>
</html>
    `

    return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
}
