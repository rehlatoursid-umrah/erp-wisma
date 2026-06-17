// ═══ ASSET INVENTORY CONSTANTS ═══

export const FLOORS = [
    { value: 1, label: 'Lantai 1' },
    { value: 2, label: 'Lantai 2' },
    { value: 3, label: 'Lantai 3' },
    { value: 4, label: 'Lantai 4' },
    { value: 5, label: 'Lantai 5' },
    { value: 6, label: 'Lantai 6' },
]

export const CONDITION_OPTIONS = [
    { value: 'baik', label: 'Baik', color: '#10b981', emoji: '🟢' },
    { value: 'rusak', label: 'Rusak', color: '#ef4444', emoji: '🔴' },
]

// Default exchange rate (can be overridden per item)
export const DEFAULT_EGP_TO_IDR = 4900

// ═══ DIVISION RESPONSIBILITY MAPPING ═══

export const DIVISION_OPTIONS = [
    { value: 'bppg', label: 'BPPG', color: '#8b4513', bg: '#fef3c7', emoji: '🏠' },
    { value: 'bpupd', label: 'BPUPD', color: '#1d4ed8', bg: '#dbeafe', emoji: '✈️' },
    { value: 'bph', label: 'BPH', color: '#7c3aed', bg: '#ede9fe', emoji: '🏛️' },
    { value: 'pmik', label: 'PMIK', color: '#059669', bg: '#d1fae5', emoji: '📚' },
] as const

export type DivisionValue = typeof DIVISION_OPTIONS[number]['value']

/**
 * Default division per floor:
 * - Lantai 1: BPPG (kecuali Mushola Akhwat & Aula → BPUPD)
 * - Lantai 2: BPUPD (full)
 * - Lantai 3: BPUPD (full)
 * - Lantai 4: BPH (kecuali Gudang BPUPD → BPUPD)
 * - Lantai 5: PMIK (full)
 * - Lantai 6: BPPG (full)
 */
export const FLOOR_DEFAULT_DIVISION: Record<number, DivisionValue> = {
    1: 'bppg',
    2: 'bpupd',
    3: 'bpupd',
    4: 'bph',
    5: 'pmik',
    6: 'bppg',
}

/**
 * Exceptions: room names (lowercase partial match) that override the floor default
 */
const DIVISION_EXCEPTIONS: { floor: number; match: string; division: DivisionValue }[] = [
    // Lantai 1: Mushola Akhwat & Aula → BPUPD
    { floor: 1, match: 'mushola akhwat', division: 'bpupd' },
    { floor: 1, match: 'aula', division: 'bpupd' },
    { floor: 1, match: 'auditorium', division: 'bpupd' },
    // Lantai 4: Gudang BPUPD → BPUPD
    { floor: 4, match: 'gudang bpupd', division: 'bpupd' },
]

/**
 * Get the responsible division for a room based on floor + room name.
 * First checks exceptions, then falls back to floor default.
 */
export function getResponsibleDivision(floor: number, roomName: string): DivisionValue {
    const lower = roomName.toLowerCase().trim()

    // Check exceptions first
    for (const exc of DIVISION_EXCEPTIONS) {
        if (exc.floor === floor && lower.includes(exc.match)) {
            return exc.division
        }
    }

    // Default by floor
    return FLOOR_DEFAULT_DIVISION[floor] || 'bppg'
}

/**
 * Get division display info (label, color, emoji) by value
 */
export function getDivisionInfo(divisionValue: string) {
    return DIVISION_OPTIONS.find(d => d.value === divisionValue) || DIVISION_OPTIONS[0]
}

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
