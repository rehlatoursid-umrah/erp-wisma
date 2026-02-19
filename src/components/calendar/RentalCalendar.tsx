'use client'

import { useState } from 'react'
import {
  Box,
  Laptop,
  Armchair,
  Tent,
  Utensils,
  X,
  Package
} from 'lucide-react'

interface RentalItem {
  id: string
  name: string
  category: 'electronics' | 'furniture' | 'outdoor' | 'kitchen'
  price: number
  available: number
  total: number
  rentals: { date: string; customer: string; quantity: number }[]
}

interface RentalCalendarProps {
  items: RentalItem[]
  onRentItem?: (itemId: string, date: Date) => void
}

export default function RentalCalendar({ items, onRentItem }: RentalCalendarProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const categories = [
    { id: 'all', name: 'Semua', icon: <Box size={16} /> },
    { id: 'electronics', name: 'Elektronik', icon: <Laptop size={16} /> },
    { id: 'furniture', name: 'Furniture', icon: <Armchair size={16} /> },
    { id: 'outdoor', name: 'Outdoor', icon: <Tent size={16} /> },
    { id: 'kitchen', name: 'Dapur', icon: <Utensils size={16} /> },
  ]

  // Generate next 7 days
  const getDays = () => {
    const days = []
    const today = new Date()
    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      days.push(date)
    }
    return days
  }

  const days = getDays()
  const daysOfWeek = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

  const getRentedQuantity = (item: RentalItem, date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    const rental = item.rentals.find(r => r.date === dateStr)
    return rental?.quantity || 0
  }

  const filteredItems = selectedCategory === 'all'
    ? items
    : items.filter(item => item.category === selectedCategory)

  return (
    <div className="rental-calendar">
      <div className="calendar-header">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Package size={24} /> Equipment Rental Status
        </h3>
        <div className="category-filter">
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`filter-btn ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="calendar-scroll">
        <table className="rental-table">
          <thead>
            <tr>
              <th className="item-header">Item</th>
              {days.map((day, idx) => (
                <th key={idx} className={`day-header ${idx === 0 ? 'today' : ''}`}>
                  <span className="day-name">{daysOfWeek[day.getDay()]}</span>
                  <span className="day-date">{day.getDate()}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredItems.map(item => (
              <tr key={item.id}>
                <td className="item-info">
                  <strong>{item.name}</strong>
                  <span className="item-stock">Stok: {item.available}/{item.total}</span>
                  <span className="item-price">EGP {item.price}/hari</span>
                </td>
                {days.map((day, idx) => {
                  const rented = getRentedQuantity(item, day)
                  const available = item.total - rented
                  return (
                    <td
                      key={idx}
                      className={`day-cell ${available === 0 ? 'fully-rented' : rented > 0 ? 'partially-rented' : 'available'} ${idx === 0 ? 'today' : ''}`}
                      onClick={() => available > 0 && onRentItem?.(item.id, day)}
                      title={`${available} tersedia`}
                    >
                      <span className="availability" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {available === 0 ? <X size={16} /> : available}
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="legend">
        <span className="legend-item"><span className="dot available"></span> Tersedia</span>
        <span className="legend-item"><span className="dot partial"></span> Sebagian Tersewa</span>
        <span className="legend-item"><span className="dot rented"></span> Habis</span>
      </div>

      <style jsx>{`
        .rental-calendar {
          background: var(--color-bg-card);
          border-radius: var(--radius-xl);
          padding: var(--spacing-lg);
          box-shadow: var(--shadow-md);
        }

        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-lg);
          flex-wrap: wrap;
          gap: var(--spacing-md);
        }

        .calendar-header h3 {
          margin: 0;
        }

        .category-filter {
          display: flex;
          gap: var(--spacing-xs);
          flex-wrap: wrap;
        }

        .filter-btn {
          padding: var(--spacing-xs) var(--spacing-sm);
          background: var(--color-bg-secondary);
          border: 1px solid rgba(139, 69, 19, 0.1);
          border-radius: var(--radius-md);
          cursor: pointer;
          font-size: 0.75rem;
          transition: all var(--transition-fast);
        }

        .filter-btn.active {
          background: var(--color-primary);
          color: white;
          border-color: var(--color-primary);
        }

        .calendar-scroll {
          overflow-x: auto;
        }

        .rental-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 600px;
        }

        .item-header {
          text-align: left;
          padding: var(--spacing-md);
          background: var(--color-bg-secondary);
          font-weight: 600;
          min-width: 180px;
          position: sticky;
          left: 0;
        }

        .day-header {
          padding: var(--spacing-sm);
          text-align: center;
          background: var(--color-bg-secondary);
          min-width: 60px;
        }

        .day-header.today {
          background: var(--color-primary);
          color: white;
        }

        .day-name {
          display: block;
          font-size: 0.6875rem;
        }

        .day-date {
          display: block;
          font-size: 1rem;
          font-weight: 700;
        }

        .item-info {
          padding: var(--spacing-md);
          background: var(--color-bg-card);
          position: sticky;
          left: 0;
          border-bottom: 1px solid rgba(139, 69, 19, 0.1);
        }

        .item-info strong {
          display: block;
        }

        .item-stock, .item-price {
          display: block;
          font-size: 0.75rem;
          color: var(--color-text-muted);
        }

        .item-price {
          color: var(--color-primary);
        }

        .day-cell {
          text-align: center;
          padding: var(--spacing-sm);
          border-bottom: 1px solid rgba(139, 69, 19, 0.1);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .day-cell.today {
          background: rgba(139, 69, 19, 0.05);
        }

        .day-cell.available {
          background: var(--color-success-light);
        }

        .day-cell.available:hover {
          background: var(--color-success);
          color: white;
        }

        .day-cell.partially-rented {
          background: var(--color-warning-light);
        }

        .day-cell.fully-rented {
          background: var(--color-error-light);
          cursor: not-allowed;
        }

        .availability {
          font-weight: 600;
        }

        .legend {
          display: flex;
          gap: var(--spacing-lg);
          margin-top: var(--spacing-lg);
          padding-top: var(--spacing-md);
          border-top: 1px solid rgba(139, 69, 19, 0.1);
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          font-size: 0.8125rem;
          color: var(--color-text-secondary);
        }

        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .dot.available { background: var(--color-success); }
        .dot.partial { background: var(--color-warning); }
        .dot.rented { background: var(--color-error); }
      `}</style>
    </div>
  )
}
