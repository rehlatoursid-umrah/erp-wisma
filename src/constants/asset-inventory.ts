// ═══ ASSET INVENTORY CONSTANTS ═══

export const FLOORS = [
    { value: 1, label: 'Lantai 1' },
    { value: 2, label: 'Lantai 2' },
    { value: 3, label: 'Lantai 3' },
    { value: 4, label: 'Lantai 4' },
    { value: 5, label: 'Lantai 5' },
]

export const CONDITION_OPTIONS = [
    { value: 'baik', label: 'Baik', color: '#10b981', emoji: '🟢' },
    { value: 'rusak', label: 'Rusak', color: '#ef4444', emoji: '🔴' },
]

// Default exchange rate (can be overridden per item)
export const DEFAULT_EGP_TO_IDR = 4900

/**
 * Generate inventory code from floor, room code, and sequence number
 * Format: LT[floor]-[ROOMCODE]-[SEQ]
 * Example: LT1-LBY-001, LT2-K201-002, LT3-GDG-001
 */
export function generateInventoryCode(floor: number, roomCode: string, seq: number): string {
    const seqStr = String(seq).padStart(3, '0')
    return `LT${floor}-${roomCode.toUpperCase()}-${seqStr}`
}

/**
 * Generate a short room code from room name
 * Examples:
 *   "Lobby" → "LBY"
 *   "Kamar 101" → "K101"
 *   "Dapur" → "DPR"
 *   "Gudang" → "GDG"
 *   "Auditorium" → "AUD"
 *   "Kantor" → "KTR"
 *   "Musholla" → "MSL"
 */
export function generateRoomCode(roomName: string): string {
    const name = roomName.trim()

    // If it starts with "Kamar" or "Room" + number, use K + number
    const kamarMatch = name.match(/^(?:kamar|room)\s*(\d+)/i)
    if (kamarMatch) return `K${kamarMatch[1]}`

    // Common abbreviations
    const abbreviations: Record<string, string> = {
        lobby: 'LBY',
        dapur: 'DPR',
        gudang: 'GDG',
        auditorium: 'AUD',
        kantor: 'KTR',
        musholla: 'MSL',
        toilet: 'TLT',
        laundry: 'LDR',
        rooftop: 'RFT',
        halaman: 'HLM',
        tangga: 'TGA',
        koridor: 'KRD',
        pantry: 'PTR',
        ruang_rapat: 'RPT',
        homestay: 'HST',
    }

    const lower = name.toLowerCase().replace(/\s+/g, '_')
    if (abbreviations[lower]) return abbreviations[lower]

    // Fallback: take first 3 consonants or first 3 chars uppercase
    const consonants = name.replace(/[aeiouAEIOU\s]/g, '').toUpperCase()
    if (consonants.length >= 3) return consonants.slice(0, 3)
    return name.replace(/\s/g, '').toUpperCase().slice(0, 3)
}
