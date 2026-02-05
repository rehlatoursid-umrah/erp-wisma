

import HotelBookingForm from '@/components/booking/HotelBookingForm'

export const metadata = {
    title: 'Book Hotel Room - Wisma Nusantara Cairo',
    description: 'Book your stay at Wisma Nusantara Cairo. Indonesian hostel in Egypt with comfortable rooms and authentic Indonesian hospitality.',
}

export default function HotelBookingPage() {
    return (
        <main style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #fef7ed 0%, #fdf2e3 100%)',
            padding: '40px 20px',
            fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
        }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <h1 style={{ fontSize: '2rem', color: '#1f2937', margin: '0 0 8px' }}>🏨 Hotel Room Booking</h1>
                <p style={{ color: '#6b7280', fontSize: '1.1rem', margin: '0' }}>Wisma Nusantara Cairo - Your Home Away from Home</p>
            </div>

            <HotelBookingForm />


        </main>
    )
}
