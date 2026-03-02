'use client'

import { useState, useEffect } from 'react'
import HotelBookingForm from '@/components/booking/HotelBookingForm'

export default function HotelBookingPage() {
    const [isPageLoading, setIsPageLoading] = useState(true)

    useEffect(() => {
        // Simulate initial page load for premium feel
        const timer = setTimeout(() => {
            setIsPageLoading(false)
        }, 600)
        return () => clearTimeout(timer)
    }, [])

    return (
        <main className="booking-page">
            <div className="booking-container">
                <header className="booking-header">
                    <div className="header-content">
                        <div className="badge">Premium Stay</div>
                        <h1>🏨 Hotel Room Booking</h1>
                        <p>Wisma Nusantara Cairo - Your Home Away from Home</p>
                    </div>
                </header>

                <div className="form-wrapper">
                    <HotelBookingForm />
                </div>

                {isPageLoading && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: '#0f0f11', // Solid dark background to hide unstyled content
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
                    }}>
                        <style>{`
                            @keyframes spin-inline {
                                from { transform: rotate(0deg); }
                                to { transform: rotate(360deg); }
                            }
                        `}</style>
                        <div style={{ fontSize: '3rem', animation: 'spin-inline 1s linear infinite' }}>⏳</div>
                        <p style={{ color: 'white', marginTop: '1rem', fontSize: '1.125rem', fontWeight: 500, letterSpacing: '0.5px' }}>
                            Memuat formulir...
                        </p>
                    </div>
                )}
            </div>

            <style jsx>{`
                .booking-page {
                    min-height: 100vh;
                    background: #0f0f11;
                    background-image: 
                        radial-gradient(circle at 15% 50%, rgba(139, 69, 19, 0.08) 0%, transparent 50%),
                        radial-gradient(circle at 85% 30%, rgba(200, 150, 80, 0.05) 0%, transparent 50%);
                    padding: 4rem 1.5rem;
                    font-family: 'Inter', system-ui, -apple-system, sans-serif;
                    color: #f3f4f6;
                }

                .booking-container {
                    max-width: 800px;
                    margin: 0 auto;
                    display: flex;
                    flex-direction: column;
                    gap: 2rem;
                }

                .booking-header {
                    text-align: center;
                    margin-bottom: 1rem;
                    animation: fadeDown 0.6s ease-out;
                }

                .badge {
                    display: inline-block;
                    padding: 0.35rem 1rem;
                    background: rgba(139, 69, 19, 0.2);
                    border: 1px solid rgba(139, 69, 19, 0.3);
                    color: #e5b072;
                    border-radius: 100px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                    margin-bottom: 1rem;
                }

                .booking-header h1 {
                    font-size: 2.25rem;
                    font-weight: 700;
                    color: #ffffff;
                    margin: 0 0 0.5rem 0;
                    letter-spacing: -0.5px;
                }

                .booking-header p {
                    color: #a1a1aa;
                    font-size: 1.1rem;
                    margin: 0;
                }

                @keyframes fadeDown {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                @media (max-width: 600px) {
                    .booking-page {
                        padding: 2rem 1rem;
                    }
                    .booking-header h1 {
                        font-size: 1.75rem;
                    }
                }
            `}</style>
        </main>
    )
}
