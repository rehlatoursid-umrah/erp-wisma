export const HALL_PACKAGES = [
    { maxHours: 4, value: '4h', label: '4 Hours', price: 420 },
    { maxHours: 9, value: '9h', label: '9 Hours', price: 900 },
    { maxHours: 12, value: '12h', label: '12 Hours', price: 1100 },
    { maxHours: 14, value: '14h', label: 'Full Day (14h)', price: 1250 },
]

export const AFTER_HOURS_RATE = 125 // EGP per hour (22:00 - 07:00)
export const EXTRA_HOUR_RATE = 115 // EGP per hour for hours beyond package

export const AC_OPTIONS = [
    { value: '', label: 'No AC', price: 0 },
    { value: '4-6', label: '4-6 hours', price: 150 },
    { value: '7-9', label: '7-9 hours', price: 200 },
    { value: '10-12', label: '10-12 hours', price: 300 },
    { value: '13-14', label: '13-14 hours', price: 350 },
]

export const CHAIR_OPTIONS = [
    { value: '', label: 'No chairs', price: 0 },
    { value: '3', label: '3 chairs', price: 75 },
    { value: '5', label: '5 chairs', price: 120 },
    { value: '7', label: '7 chairs', price: 160 },
    { value: '10', label: '10 chairs', price: 210 },
    { value: '15', label: '15 chairs', price: 300 },
    { value: '20', label: '20 chairs', price: 380 },
    { value: '30', label: '30 chairs', price: 540 },
    { value: '40', label: '40 chairs', price: 680 },
]

export const PROJECTOR_SCREEN_OPTIONS = [
    { value: '', label: 'None', price: 0 },
    { value: 'projector', label: 'Projector only', price: 250 },
    { value: 'screen', label: 'Screen only', price: 75 },
    { value: 'both', label: 'Projector & Screen', price: 275 },
]

export const TABLE_OPTIONS = [
    { value: '', label: 'No tables', price: 0 },
    { value: '3', label: '3 tables', price: 140 },
    { value: '6', label: '6 tables', price: 240 },
    { value: '9', label: '9 tables', price: 300 },
    { value: 'more', label: 'More than 9 tables', price: 0 },
]

export const PLATE_OPTIONS = [
    { value: '', label: 'No plates', price: 0 },
    { value: '6', label: '6 plates', price: 60 },
    { value: '12', label: '12 plates', price: 110 },
    { value: '18', label: '18 plates', price: 160 },
    { value: '24', label: '24 plates', price: 200 },
]

export const GLASS_OPTIONS = [
    { value: '', label: 'No glasses', price: 0 },
    { value: '3', label: '3 glasses', price: 20 },
    { value: '6', label: '6 glasses', price: 35 },
    { value: '12', label: '12 glasses', price: 60 },
]

// Helper function to calculate hours between two times
export function calculateDuration(startTime: string, endTime: string): number {
    if (!startTime || !endTime) return 0
    const [startH, startM] = startTime.split(':').map(Number)
    const [endH, endM] = endTime.split(':').map(Number)

    let startMinutes = startH * 60 + startM
    let endMinutes = endH * 60 + endM

    // Handle overnight events
    if (endMinutes <= startMinutes) {
        endMinutes += 24 * 60
    }

    return Math.ceil((endMinutes - startMinutes) / 60)
}

// Helper function to count after-hours (22:00 - 07:00)
export function calculateAfterHours(startTime: string, endTime: string): number {
    if (!startTime || !endTime) return 0

    const [startH] = startTime.split(':').map(Number)

    let afterHoursCount = 0

    // Simple calculation: count hours that fall in 22:00-07:00 range
    let currentHour = startH
    const duration = calculateDuration(startTime, endTime)

    for (let i = 0; i < duration; i++) {
        const hour = currentHour % 24
        // After hours: 22, 23, 0, 1, 2, 3, 4, 5, 6
        if (hour >= 22 || hour < 7) {
            afterHoursCount++
        }
        currentHour++
    }

    return afterHoursCount
}

export function calculateHallPricing(duration: number): {
    basePackage: typeof HALL_PACKAGES[0];
    extraHours: number;
    basePrice: number;
    extraHoursPrice: number;
} {
    if (duration <= 0) {
        return { basePackage: HALL_PACKAGES[0], extraHours: 0, basePrice: 0, extraHoursPrice: 0 }
    }

    let selectedPackage = HALL_PACKAGES[0]
    let extraHours = 0

    if (duration <= 4) {
        selectedPackage = HALL_PACKAGES[0] // 4h
        extraHours = 0
    } else if (duration > 4 && duration < 9) {
        selectedPackage = HALL_PACKAGES[0] // 4h
        extraHours = duration - 4
    } else if (duration === 9) {
        selectedPackage = HALL_PACKAGES[1] // 9h
        extraHours = 0
    } else if (duration > 9 && duration < 12) {
        selectedPackage = HALL_PACKAGES[1] // 9h
        extraHours = duration - 9
    } else if (duration === 12) {
        selectedPackage = HALL_PACKAGES[2] // 12h
        extraHours = 0
    } else if (duration > 12 && duration < 14) {
        selectedPackage = HALL_PACKAGES[2] // 12h
        extraHours = duration - 12
    } else if (duration === 14) {
        selectedPackage = HALL_PACKAGES[3] // 14h
        extraHours = 0
    } else {
        selectedPackage = HALL_PACKAGES[3] // 14h
        extraHours = duration - 14
    }

    const basePrice = selectedPackage.price
    const extraHoursPrice = extraHours * EXTRA_HOUR_RATE

    return { basePackage: selectedPackage, extraHours, basePrice, extraHoursPrice }
}
