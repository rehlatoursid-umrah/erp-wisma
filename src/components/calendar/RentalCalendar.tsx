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
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    const dateStr = `${y}-${m}-${d}`

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

      <>
        {/* Desktop Grid */}
        <div className="calendar-scroll desktop-only">
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

        {/* Mobile Agenda View (Today's Status) */}
        <div className="agenda-view-mobile mobile-only">
          <h4 className="agenda-title">Status Penyewaan Hari Ini</h4>
          <div className="agenda-list">
            {filteredItems.map(item => {
              const rented = getRentedQuantity(item, new Date());
              const available = item.total - rented;
              
              let statusClass = 'available';
              if (available === 0) statusClass = 'fully-rented';
              else if (rented > 0) statusClass = 'partially-rented';

              return (
                <div 
                  key={item.id} 
                  className={`agenda-rental-item status-${statusClass}`}
                  onClick={() => available > 0 && onRentItem?.(item.id, new Date())}
                >
                  <div className="agenda-rental-header">
                    <strong>{item.name}</strong>
                    <span className={`status-badge ${statusClass}`}>
                      {available === 0 ? 'Habis' : `${available} Ready`}
                    </span>
                  </div>
                  <div className="agenda-rental-details">
                    <span className="stock-info">Stok: {item.total}</span>
                    <span className="price-info">EGP {item.price}/hari</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </>

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

        @media (min-width: 769px) {
          .mobile-only { display: none !important; }
        }

        @media (max-width: 768px) {
          .desktop-only { display: none !important; }
          .legend { display: none; }

          .agenda-title {
            font-size: 1.1rem;
            margin-bottom: 16px;
            color: var(--color-text-secondary);
            padding-top: var(--spacing-sm);
          }

          .agenda-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .agenda-rental-item {
            background: var(--color-bg-primary);
            border: 1px solid var(--color-bg-secondary);
            border-radius: var(--radius-lg);
            padding: 16px;
            cursor: pointer;
            transition: all 0.2s;
            border-left: 4px solid #ccc;
          }

          .agenda-rental-item:active {
            transform: scale(0.98);
          }

          .agenda-rental-item.status-available { border-left-color: var(--color-success); }
          .agenda-rental-item.status-partially-rented { border-left-color: var(--color-warning); }
          .agenda-rental-item.status-fully-rented { border-left-color: var(--color-error); opacity: 0.7; cursor: not-allowed; }

          .agenda-rental-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
          }

          .agenda-rental-header strong {
            font-size: 1rem;
            color: var(--color-text-primary);
          }

          .status-badge {
            font-size: 0.75rem;
            font-weight: 700;
            padding: 4px 8px;
            border-radius: 99px;
          }

          .status-badge.available { background: var(--color-success-light); color: var(--color-success); }
          .status-badge.partially-rented { background: var(--color-warning-light); color: var(--color-warning); }
          .status-badge.fully-rented { background: var(--color-error-light); color: var(--color-error); }

          .agenda-rental-details {
            display: flex;
            justify-content: space-between;
            font-size: 0.85rem;
            color: var(--color-text-muted);
            font-weight: 500;
          }

          .price-info { color: var(--color-primary); font-weight: 600; }
        }
      `}</style>
    </div>
  )
}
