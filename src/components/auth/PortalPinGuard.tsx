'use client'

import { useState, useEffect } from 'react'

interface PortalPinGuardProps {
    expectedPin?: string
    portalName: string
    children: React.ReactNode
}

export default function PortalPinGuard({ expectedPin, portalName, children }: PortalPinGuardProps) {
    const [pin, setPin] = useState(['', '', '', '', '', ''])
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [error, setError] = useState(false)

    // Skip guard if no expected PIN is provided (e.g. Bendahara)
    useEffect(() => {
        if (!expectedPin) {
            setIsAuthenticated(true)
        }

        // Check local storage for previous session
        const savedAuth = localStorage.getItem(`portal_auth_${portalName}`)
        if (savedAuth === expectedPin) {
            setIsAuthenticated(true)
        }
    }, [expectedPin, portalName])

    if (isAuthenticated) {
        return <>{children}</>
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const value = e.target.value
        if (isNaN(Number(value))) return

        const newPin = [...pin]
        newPin[index] = value
        setPin(newPin)
        setError(false)

        // Auto-focus next input
        if (value && index < 5) {
            const nextInput = document.getElementById(`pin-${index + 1}`)
            nextInput?.focus()
        }

        // Auto-submit when all 6 digits are entered
        if (value && index === 5) {
            const enteredPin = [...newPin.slice(0, 5), value].join('')
            if (enteredPin === expectedPin) {
                setIsAuthenticated(true)
                localStorage.setItem(`portal_auth_${portalName}`, enteredPin)
            } else {
                setError(true)
                setTimeout(() => {
                    setPin(['', '', '', '', '', ''])
                    document.getElementById('pin-0')?.focus()
                }, 1000)
            }
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace' && !pin[index] && index > 0) {
            const prevInput = document.getElementById(`pin-${index - 1}`)
            prevInput?.focus()
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="mb-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Akses Terkunci</h2>
                    <p className="text-gray-500 mt-2">Masukkan PIN 6 Digit untuk mengakses Portal {portalName}</p>
                </div>

                <div className="flex justify-center gap-2 mb-6">
                    {pin.map((digit, index) => (
                        <input
                            key={index}
                            id={`pin-${index}`}
                            type="password"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(e, index)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            className={`w-12 h-14 text-center text-2xl font-bold rounded-lg border ${error ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                                } outline-none transition-all`}
                        />
                    ))}
                </div>

                {error && (
                    <p className="text-red-500 text-sm animate-pulse mb-4">PIN Salah, silakan coba lagi</p>
                )}
            </div>
        </div>
    )
}
