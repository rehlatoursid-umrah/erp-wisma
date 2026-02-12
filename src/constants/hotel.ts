// Room type configuration with pricing and availability
export const ROOM_TYPES = {
    single: { label: 'Single Bed', price: 30, maxQty: 4, allowExtraBed: false, icon: 'Single' },
    double: { label: 'Double Bed', price: 35, maxQty: 5, allowExtraBed: true, icon: 'Double' },
    triple: { label: 'Triple Bed', price: 30, maxQty: 1, allowExtraBed: true, icon: 'Triple' },
    quadruple: { label: 'Quadruple', price: 35, maxQty: 2, allowExtraBed: true, icon: 'Quad' },
    homestay: { label: 'Homestay', price: 100, maxQty: 1, allowExtraBed: true, icon: 'Home', description: 'Living room, Kitchen, Toilet, 3 Bedrooms' },
}

export const AIRPORT_PICKUP = [
    { value: 'none', label: 'No Pickup Needed', price: 0 },
    { value: 'medium', label: 'Medium Private Vehicle - For 2-4 passengers with luggage', price: 35 },
    { value: 'hiace', label: 'Hiace Van - Up to 10 passengers with large luggage', price: 50 },
]

export const MEAL_PACKAGES = [
    { id: 'nasiGoreng', label: 'Nasi Goreng', price: 100 },
    { id: 'ayamGoreng', label: 'Ayam Goreng', price: 120 },
    { id: 'nasiKuning', label: 'Nasi Kuning', price: 130 },
]

export const MEAL_TIMES = ['Breakfast', 'Lunch', 'Dinner']
export const MEAL_DAYS = ['Check-in Day', 'During Stay', 'Check-out Day']

export const EXTRA_BED_PRICE = 10 // USD per night

// Physical room mapping (for calendar display)
export const HOTEL_ROOMS = [
    { number: '101', type: 'double', floor: 1, price: 35 },
    { number: '102', type: 'single', floor: 1, price: 30 },
    { number: '103', type: 'single', floor: 1, price: 30 },
    { number: '104', type: 'double', floor: 1, price: 35 },
    { number: '105', type: 'double', floor: 1, price: 35 },
    { number: '106', type: 'double', floor: 1, price: 35 },
    { number: '201', type: 'double', floor: 2, price: 35 },
    { number: '202', type: 'single', floor: 2, price: 30 },
    { number: '203', type: 'single', floor: 2, price: 30 },
    { number: '204', type: 'triple', floor: 2, price: 30 },
    { number: '205', type: 'quadruple', floor: 2, price: 35 },
    { number: '206', type: 'quadruple', floor: 2, price: 35 },
    { number: 'HOMESTAY', type: 'homestay', floor: 0, price: 100 },
] as const

export type RoomType = keyof typeof ROOM_TYPES
