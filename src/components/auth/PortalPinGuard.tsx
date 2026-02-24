'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

interface PortalPinGuardProps {
    expectedPin?: string
    portalName: string
    children: React.ReactNode
}

export default function PortalPinGuard({ expectedPin, portalName, children }: PortalPinGuardProps) {
    const [pin, setPin] = useState('')
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [error, setError] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    // Skip guard if no expected PIN is provided
    useEffect(() => {
        if (!expectedPin) {
            setIsAuthenticated(true)
        }
    }, [expectedPin, portalName])

    if (isAuthenticated) {
        return <>{children}</>
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (pin === expectedPin) {
            setIsAuthenticated(true)
        } else {
            setError(true)
            setTimeout(() => {
                setPin('')
                setError(false)
                inputRef.current?.focus()
            }, 800)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '') // only allow digits
        setPin(val)
        setError(false)

        // Auto submit if length is 6
        if (val.length === 6) {
            if (val === expectedPin) {
                setTimeout(() => {
                    setIsAuthenticated(true)
                }, 150)
            } else {
                setError(true)
                setTimeout(() => {
                    setPin('')
                    setError(false)
                    inputRef.current?.focus()
                }, 800)
            }
        }
    }

    return (
        <div className="pin-guard-container">
            <div className={`pin-card ${error ? 'animate-shake' : ''}`}>

                <div className="logo-wrapper">
                    <Image
                        src="/media/sticky-header.png"
                        alt="Wisma Nusantara Cairo Logo"
                        width={64}
                        height={64}
                        className="logo-img"
                        priority
                    />
                </div>

                <div className="text-center-mb6">
                    <h2>
                        <span>Portal</span><br />
                        <span>{portalName}</span>
                    </h2>
                    <p>Masukkan PIN keamanan Anda</p>
                </div>

                <form onSubmit={handleSubmit} className="form-wrapper">
                    <div className="input-wrapper">
                        <input
                            ref={inputRef}
                            type="password"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={6}
                            value={pin}
                            onChange={handleChange}
                            className={`pin-input ${error ? 'input-error' : ''}`}
                            placeholder="••••••"
                            autoFocus
                        />
                    </div>

                    <button type="submit" className="submit-btn">
                        Verifikasi PIN
                    </button>

                    <div className="error-wrapper">
                        <p className={`error-text ${error ? 'visible' : ''}`}>
                            PIN Salah. Silakan coba lagi.
                        </p>
                    </div>
                </form>
            </div>

            <style jsx>{`
                .pin-guard-container {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background-color: #24211e;
                    padding: 1rem;
                    position: relative;
                }

                .pin-card {
                    width: 100%;
                    max-width: 380px;
                    background-color: #ffffff;
                    border-radius: 1.25rem;
                    padding: 3rem;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    position: relative;
                    z-index: 10;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                    transition: transform 0.3s;
                }

                .logo-wrapper {
                    margin-bottom: 2rem;
                }

                .text-center-mb6 {
                    text-align: center;
                    margin-bottom: 2rem;
                }

                .text-center-mb6 h2 {
                    font-size: 1.875rem;
                    font-weight: 700;
                    color: #8b4513;
                    line-height: 1.2;
                    margin: 0;
                }

                .text-center-mb6 p {
                    color: #6b7280;
                    font-size: 0.875rem;
                    margin-top: 0.75rem;
                    margin-bottom: 0px;
                }

                .form-wrapper {
                    width: 100%;
                }

                .input-wrapper {
                    margin-bottom: 1.5rem;
                }

                .pin-input {
                    width: 100%;
                    text-align: center;
                    font-size: 2.25rem /* 36px */;
                    letter-spacing: 0.5em;
                    font-weight: 700;
                    border: 2px solid #e5e7eb;
                    border-radius: 0.75rem;
                    padding-top: 0.75rem;
                    padding-bottom: 0.75rem;
                    padding-left: 1.125em; /* compensate for tracking to center text */
                    outline: none;
                    transition: all 0.2s;
                    color: #1f2937;
                    background-color: transparent;
                }

                .pin-input:focus {
                    border-color: #8b4513;
                    box-shadow: 0 0 0 4px rgba(139, 69, 19, 0.1);
                }

                .input-error {
                    border-color: #ef4444;
                    background-color: #fef2f2;
                    color: #dc2626;
                }
                
                .pin-input::placeholder {
                    color: #9ca3af;
                }

                .submit-btn {
                    width: 100%;
                    background-color: #8b4513;
                    color: #ffffff;
                    font-weight: 600;
                    padding-top: 0.875rem;
                    padding-bottom: 0.875rem;
                    border-radius: 0.75rem;
                    border: none;
                    transition: background-color 0.2s;
                    letter-spacing: 0.025em;
                    font-size: 1rem;
                    cursor: pointer;
                }

                .submit-btn:hover {
                    background-color: #653610;
                }

                .error-wrapper {
                    height: 1.5rem;
                    margin-top: 1rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .error-text {
                    color: #ef4444;
                    font-size: 0.875rem;
                    font-weight: 500;
                    opacity: 0;
                    transition: opacity 0.2s;
                    margin: 0;
                }

                .error-text.visible {
                    opacity: 1;
                }

                @keyframes shake {
                    10%, 90% { transform: translate3d(-1px, 0, 0); }
                    20%, 80% { transform: translate3d(2px, 0, 0); }
                    30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                    40%, 60% { transform: translate3d(4px, 0, 0); }
                }
                .animate-shake {
                    animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
                }
            `}</style>
        </div>
    )
}
