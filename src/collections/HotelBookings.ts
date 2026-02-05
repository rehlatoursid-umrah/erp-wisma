import type { CollectionConfig } from 'payload'
// Room configuration constants
export const HOTEL_ROOMS = [
    // Floor 1
    { number: '101', type: 'double', floor: 1, price: 35 },
    { number: '102', type: 'single', floor: 1, price: 30 },
    { number: '103', type: 'single', floor: 1, price: 30 },
    { number: '104', type: 'double', floor: 1, price: 35 },
    { number: '105', type: 'double', floor: 1, price: 35 },
    { number: '106', type: 'double', floor: 1, price: 35 },
    // Floor 2
    { number: '201', type: 'double', floor: 2, price: 35 },
    { number: '202', type: 'single', floor: 2, price: 30 },
    { number: '203', type: 'single', floor: 2, price: 30 },
    { number: '204', type: 'triple', floor: 2, price: 30 },
    { number: '205', type: 'quadruple', floor: 2, price: 35 },
    { number: '206', type: 'quadruple', floor: 2, price: 35 },
    // Homestay
    { number: 'HOMESTAY', type: 'homestay', floor: 0, price: 100 },
] as const

export const ROOM_TYPES = {
    single: { label: 'Single Bed', price: 30, maxQty: 4, allowExtraBed: false },
    double: { label: 'Double Bed', price: 35, maxQty: 5, allowExtraBed: true },
    triple: { label: 'Triple Bed', price: 30, maxQty: 1, allowExtraBed: true },
    quadruple: { label: 'Quadruple', price: 35, maxQty: 2, allowExtraBed: true },
    homestay: { label: 'Homestay (3 Kamar + Fasilitas)', price: 100, maxQty: 1, allowExtraBed: true },
} as const

export const HotelBookings: CollectionConfig = {
    slug: 'hotel-bookings',
    admin: {
        useAsTitle: 'bookingId',
        defaultColumns: ['bookingId', 'guest.name', 'checkIn', 'checkOut', 'totalPrice', 'status'],
        group: 'Operations',
    },
    access: {
        read: () => true,
        create: () => true,
        update: () => true,
    },
    fields: [
        {
            name: 'bookingId',
            type: 'text',
            required: true,
            unique: true,
            admin: { description: 'Auto-generated (HTL-YYYYMMDD-XXXX)' },
        },
        // Physical Room Assignment (Auto-assigned by API or manually by admin)
        {
            name: 'assignedRooms',
            type: 'text',
            hasMany: true,
            label: 'Assigned Room Numbers',
            admin: {
                description: 'Physical rooms assigned to this booking (e.g. "101", "102")',
                className: 'validate-rooms'
            },
        },
        // Personal Information
        {
            type: 'group',
            name: 'guest',
            label: 'Personal Information',
            fields: [
                { name: 'fullName', type: 'text', required: true, label: 'Full Name' },
                { name: 'country', type: 'text', required: true, label: 'Country of Origin' },
                { name: 'passport', type: 'text', required: true, label: 'Passport Number' },
                { name: 'phone', type: 'text', required: true, label: 'Phone (with country code)' },
                { name: 'whatsapp', type: 'text', required: true, label: 'WhatsApp (with country code)' },
            ],
        },
        // Room Selection (by type)
        {
            type: 'group',
            name: 'rooms',
            label: 'Room Selection',
            fields: [
                {
                    type: 'row',
                    fields: [
                        { name: 'singleQty', type: 'number', label: 'Single Rooms', min: 0, max: 4, defaultValue: 0, admin: { width: '20%' } },
                        { name: 'doubleQty', type: 'number', label: 'Double Rooms', min: 0, max: 5, defaultValue: 0, admin: { width: '20%' } },
                        { name: 'tripleQty', type: 'number', label: 'Triple Rooms', min: 0, max: 1, defaultValue: 0, admin: { width: '20%' } },
                        { name: 'quadrupleQty', type: 'number', label: 'Quadruple Rooms', min: 0, max: 2, defaultValue: 0, admin: { width: '20%' } },
                        { name: 'homestayQty', type: 'number', label: 'Homestay', min: 0, max: 1, defaultValue: 0, admin: { width: '20%' } },
                    ],
                },
                {
                    type: 'row',
                    fields: [
                        { name: 'doubleExtraBed', type: 'number', label: 'Extra Beds (Double)', min: 0, defaultValue: 0, admin: { width: '25%' } },
                        { name: 'tripleExtraBed', type: 'number', label: 'Extra Beds (Triple)', min: 0, defaultValue: 0, admin: { width: '25%' } },
                        { name: 'quadrupleExtraBed', type: 'number', label: 'Extra Beds (Quad)', min: 0, defaultValue: 0, admin: { width: '25%' } },
                        { name: 'homestayExtraBed', type: 'number', label: 'Extra Beds (Homestay)', min: 0, defaultValue: 0, admin: { width: '25%' } },
                    ],
                },
            ],
        },
        // Guest Details
        {
            type: 'row',
            fields: [
                { name: 'adults', type: 'number', required: true, label: 'Adults (18+)', min: 1, admin: { width: '50%' } },
                { name: 'children', type: 'number', label: 'Children (under 18)', min: 0, defaultValue: 0, admin: { width: '50%' } },
            ],
        },
        // Stay Duration
        {
            type: 'row',
            fields: [
                { name: 'checkIn', type: 'date', required: true, label: 'Check-In', admin: { width: '25%', date: { pickerAppearance: 'dayAndTime' } } },
                { name: 'checkInTime', type: 'text', label: 'Check-In Time', admin: { width: '25%', placeholder: '14:00' } },
                { name: 'checkOut', type: 'date', required: true, label: 'Check-Out', admin: { width: '25%', date: { pickerAppearance: 'dayAndTime' } } },
                { name: 'checkOutTime', type: 'text', label: 'Check-Out Time', admin: { width: '25%', placeholder: '12:00' } },
            ],
        },
        { name: 'nights', type: 'number', required: true, min: 1, label: 'Number of Nights' },
        // Airport Pickup
        {
            name: 'airportPickup',
            type: 'select',
            label: 'Airport Pickup',
            defaultValue: 'none',
            options: [
                { label: 'No Pickup Needed', value: 'none' },
                { label: 'Medium Private Vehicle (2-4 pax) - $35 USD', value: 'medium' },
                { label: 'Hiace Van (up to 10 pax) - $50 USD', value: 'hiace' },
            ],
        },
        // Meal Packages
        {
            type: 'group',
            name: 'meals',
            label: 'Indonesian Meal Package',
            fields: [
                {
                    type: 'group',
                    name: 'nasiGoreng',
                    label: 'Nasi Goreng (100 EGP/portion)',
                    fields: [
                        { name: 'qty', type: 'number', label: 'Portions', min: 0, defaultValue: 0 },
                        {
                            name: 'timing',
                            type: 'select',
                            hasMany: true,
                            label: 'When',
                            options: [
                                { label: 'Breakfast - Check-in Day', value: 'breakfast_checkin' },
                                { label: 'Breakfast - During Stay', value: 'breakfast_during' },
                                { label: 'Breakfast - Check-out Day', value: 'breakfast_checkout' },
                                { label: 'Lunch - Check-in Day', value: 'lunch_checkin' },
                                { label: 'Lunch - During Stay', value: 'lunch_during' },
                                { label: 'Lunch - Check-out Day', value: 'lunch_checkout' },
                                { label: 'Dinner - Check-in Day', value: 'dinner_checkin' },
                                { label: 'Dinner - During Stay', value: 'dinner_during' },
                                { label: 'Dinner - Check-out Day', value: 'dinner_checkout' },
                            ],
                        },
                    ],
                },
                {
                    type: 'group',
                    name: 'ayamGoreng',
                    label: 'Ayam Goreng (120 EGP/portion)',
                    fields: [
                        { name: 'qty', type: 'number', label: 'Portions', min: 0, defaultValue: 0 },
                        {
                            name: 'timing',
                            type: 'select',
                            hasMany: true,
                            label: 'When',
                            options: [
                                { label: 'Breakfast - Check-in Day', value: 'breakfast_checkin' },
                                { label: 'Breakfast - During Stay', value: 'breakfast_during' },
                                { label: 'Breakfast - Check-out Day', value: 'breakfast_checkout' },
                                { label: 'Lunch - Check-in Day', value: 'lunch_checkin' },
                                { label: 'Lunch - During Stay', value: 'lunch_during' },
                                { label: 'Lunch - Check-out Day', value: 'lunch_checkout' },
                                { label: 'Dinner - Check-in Day', value: 'dinner_checkin' },
                                { label: 'Dinner - During Stay', value: 'dinner_during' },
                                { label: 'Dinner - Check-out Day', value: 'dinner_checkout' },
                            ],
                        },
                    ],
                },
                {
                    type: 'group',
                    name: 'nasiKuning',
                    label: 'Nasi Kuning (130 EGP/portion)',
                    fields: [
                        { name: 'qty', type: 'number', label: 'Portions', min: 0, defaultValue: 0 },
                        {
                            name: 'timing',
                            type: 'select',
                            hasMany: true,
                            label: 'When',
                            options: [
                                { label: 'Breakfast - Check-in Day', value: 'breakfast_checkin' },
                                { label: 'Breakfast - During Stay', value: 'breakfast_during' },
                                { label: 'Breakfast - Check-out Day', value: 'breakfast_checkout' },
                                { label: 'Lunch - Check-in Day', value: 'lunch_checkin' },
                                { label: 'Lunch - During Stay', value: 'lunch_during' },
                                { label: 'Lunch - Check-out Day', value: 'lunch_checkout' },
                                { label: 'Dinner - Check-in Day', value: 'dinner_checkin' },
                                { label: 'Dinner - During Stay', value: 'dinner_during' },
                                { label: 'Dinner - Check-out Day', value: 'dinner_checkout' },
                            ],
                        },
                    ],
                },
            ],
        },
        // Pricing Summary
        {
            type: 'group',
            name: 'pricing',
            label: 'Pricing Summary',
            fields: [
                { name: 'roomsTotal', type: 'number', label: 'Rooms Total (USD)', admin: { readOnly: true } },
                { name: 'extraBedTotal', type: 'number', label: 'Extra Bed Total (USD)', admin: { readOnly: true } },
                { name: 'pickupTotal', type: 'number', label: 'Pickup Total (USD)', admin: { readOnly: true } },
                { name: 'mealsTotal', type: 'number', label: 'Meals Total (EGP)', admin: { readOnly: true } },
                { name: 'grandTotal', type: 'number', label: 'Grand Total (USD + EGP)', admin: { readOnly: true } },
            ],
        },
        // Status
        {
            name: 'status',
            type: 'select',
            required: true,
            defaultValue: 'pending',
            options: [
                { label: '⏳ Pending', value: 'pending' },
                { label: '✅ Confirmed', value: 'confirmed' },
                { label: '🏨 Checked-In', value: 'checked-in' },
                { label: '🚪 Checked-Out', value: 'checked-out' },
                { label: '❌ Cancelled', value: 'cancelled' },
            ],
            admin: { position: 'sidebar' },
        },
        { name: 'notes', type: 'textarea', label: 'Additional Notes' },
        {
            name: 'createdAt',
            type: 'date',
            admin: { position: 'sidebar', readOnly: true, date: { pickerAppearance: 'dayAndTime' } },
            hooks: {
                beforeChange: [({ operation }) => { if (operation === 'create') return new Date() }],
            },
        },
    ],
}
