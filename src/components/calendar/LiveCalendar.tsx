'use client'

import { useState } from 'react'

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  bookings: Booking[]
}

interface Booking {
  id: string
  title: string
  type: 'booked' | 'inquiry' | 'rental'
  color?: string
}

interface LiveCalendarProps {
  bookings: { date: string; title: string; type: 'booked' | 'inquiry' | 'rental' }[]
  onDateClick?: (date: Date) => void
  onBookingClick?: (booking: any) => void
  showLegend?: boolean
  legendItems?: { label: string; color: string; type: string }[]
}

export default function LiveCalendar({
  bookings,
  onDateClick,
  onBookingClick,
  showLegend = true,
  legendItems = [
    { label: 'Booked', color: 'var(--color-error)', type: 'booked' },
    { label: 'Inquiry', color: 'var(--color-warning)', type: 'inquiry' },
    { label: 'Available', color: 'var(--color-success)', type: 'available' },
  ]
}: LiveCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const daysOfWeek = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]

  const getCalendarDays = (): CalendarDay[] => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days: CalendarDay[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)

      const dateStr = date.toISOString().split('T')[0]
      const dayBookings = bookings
        .filter(b => b.date === dateStr)
        .map(b => ({ ...b, id: `${b.date}-${b.title}` }))

      days.push({
        date,
        isCurrentMonth: date.getMonth() === month,
        isToday: date.getTime() === today.getTime(),
        bookings: dayBookings,
      })
    }

    return days
  }

  const navigateMonth = (direction: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() + direction)
      return newDate
    })
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const calendarDays = getCalendarDays()

  return (
    <div className="live-calendar">
      <div className="calendar-header">
        <div className="calendar-nav">
          <button className="nav-btn" onClick={() => navigateMonth(-1)}>←</button>
          <h3>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
          <button className="nav-btn" onClick={() => navigateMonth(1)}>→</button>
        </div>
        <button className="today-btn" onClick={goToToday}>Hari Ini</button>
      </div>

      <div className="calendar-grid">
        {daysOfWeek.map(day => (
          <div key={day} className="calendar-header-cell">{day}</div>
        ))}

        {calendarDays.map((day, idx) => (
          <div
            key={idx}
            className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} ${day.isToday ? 'today' : ''} ${day.bookings.length > 0 ? 'has-booking' : ''}`}
            onClick={() => onDateClick?.(day.date)}
          >
            <span className="day-number">{day.date.getDate()}</span>
            {day.bookings.length > 0 && (
              <div className="booking-indicators">
                {day.bookings.slice(0, 3).map((booking, bIdx) => (
                  <div
                    key={bIdx}
                    className={`booking-dot ${booking.type}`}
                    title={booking.title}
                    onClick={(e) => {
                      e.stopPropagation()
                      onBookingClick?.(booking)
                    }}
                  />
                ))}
                {day.bookings.length > 3 && (
                  <span className="more-bookings">+{day.bookings.length - 3}</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {showLegend && (
        <div className="calendar-legend">
          {legendItems.map((item, idx) => (
            <div key={idx} className="legend-item">
              <span className={`legend-dot ${item.type}`} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .live-calendar {
          background: var(--color-bg-card);
          border-radius: var(--radius-2xl);
          padding: var(--spacing-xl);
          box-shadow: var(--shadow-md);
          width: 100%;
          animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-xl);
        }

        .calendar-nav {
          display: flex;
          align-items: center;
          gap: var(--spacing-lg);
        }

        .calendar-nav h3 {
          min-width: 220px;
          text-align: center;
          margin: 0;
          font-size: 1.5rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .nav-btn {
          width: 44px;
          height: 44px;
          border: 1px solid rgba(139, 69, 19, 0.2);
          background: var(--color-bg-secondary);
          border-radius: var(--radius-lg);
          cursor: pointer;
          font-size: 1.25rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .nav-btn:hover {
          background: var(--color-primary);
          color: white;
          border-color: var(--color-primary);
          transform: scale(1.1);
          box-shadow: var(--shadow-md);
        }

        .nav-btn:active {
          transform: scale(0.95);
        }

        .today-btn {
          padding: var(--spacing-sm) var(--spacing-lg);
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
          color: white;
          border: none;
          border-radius: var(--radius-lg);
          cursor: pointer;
          font-size: 0.9375rem;
          font-weight: 500;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: var(--shadow-sm);
        }

        .today-btn:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: var(--shadow-lg);
        }

        .today-btn:active {
          transform: translateY(0) scale(0.98);
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: var(--spacing-xs);
        }

        .calendar-header-cell {
          padding: var(--spacing-md);
          text-align: center;
          font-weight: 600;
          font-size: 0.9375rem;
          color: var(--color-text-muted);
        }

        .calendar-day {
          aspect-ratio: 1;
          padding: var(--spacing-sm);
          background: var(--color-bg-secondary);
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          min-height: 80px;
          border: 2px solid transparent;
        }

        .calendar-day:hover {
          background: rgba(139, 69, 19, 0.1);
          transform: scale(1.05);
          box-shadow: var(--shadow-md);
          z-index: 1;
        }

        .calendar-day.other-month {
          opacity: 0.4;
        }

        .calendar-day.today {
          background: rgba(139, 69, 19, 0.15);
          border-color: var(--color-primary);
          box-shadow: 0 0 0 2px rgba(139, 69, 19, 0.2);
        }

        .calendar-day.has-booking {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0.02) 100%);
        }

        .day-number {
          font-size: 1rem;
          font-weight: 600;
        }

        .booking-indicators {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-top: auto;
        }

        .booking-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .booking-dot:hover {
          transform: scale(1.5);
        }

        .booking-dot.booked {
          background: var(--color-error);
        }

        .booking-dot.inquiry {
          background: var(--color-warning);
        }

        .booking-dot.rental {
          background: var(--color-info);
        }

        .more-bookings {
          font-size: 0.75rem;
          color: var(--color-text-muted);
          font-weight: 500;
        }

        .calendar-legend {
          display: flex;
          gap: var(--spacing-xl);
          margin-top: var(--spacing-xl);
          padding-top: var(--spacing-lg);
          border-top: 1px solid rgba(139, 69, 19, 0.1);
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          font-size: 0.9375rem;
          color: var(--color-text-secondary);
          transition: all 0.2s ease;
        }

        .legend-item:hover {
          color: var(--color-primary);
        }

        .legend-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .legend-item:hover .legend-dot {
          transform: scale(1.3);
        }

        .legend-dot.booked { background: var(--color-error); }
        .legend-dot.inquiry { background: var(--color-warning); }
        .legend-dot.rental { background: var(--color-info); }
        .legend-dot.available { background: var(--color-success); }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .calendar-day {
            min-height: 60px;
          }
          .day-number {
            font-size: 0.875rem;
          }
          .calendar-nav h3 {
            font-size: 1.125rem;
            min-width: 150px;
          }
        }
      `}</style>
    </div>
  )
}
