'use client'

interface Room {
    id: string
    status: 'available' | 'occupied' | 'dirty' | 'maintenance'
    guest?: string
}

interface RoomGridProps {
    rooms: Room[]
    onRoomClick?: (room: Room) => void
}

export default function RoomGrid({ rooms, onRoomClick }: RoomGridProps) {
    return (
        <div className="room-grid">
            {rooms.map((room) => (
                <button
                    key={room.id}
                    className={`room-card ${room.status}`}
                    onClick={() => onRoomClick?.(room)}
                >
                    <span className={`room-status-dot ${room.status}`} />
                    <span className="room-number">{room.id}</span>
                    {room.guest && <span className="room-guest">{room.guest}</span>}
                </button>
            ))}

            <style jsx>{`
        .room-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
          gap: var(--spacing-md);
        }

        .room-card {
          position: relative;
          aspect-ratio: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: var(--color-bg-card);
          border-radius: var(--radius-lg);
          border: 2px solid transparent;
          cursor: pointer;
          transition: all var(--transition-fast);
          box-shadow: var(--shadow-sm);
        }

        .room-card.available { border-color: var(--color-available); }
        .room-card.occupied { border-color: var(--color-occupied); }
        .room-card.dirty { border-color: var(--color-dirty); }
        .room-card.maintenance { border-color: var(--color-maintenance); }

        .room-card:hover {
          transform: scale(1.05);
          box-shadow: var(--shadow-lg);
        }

        .room-number {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--color-text-primary);
        }

        .room-guest {
          font-size: 0.6875rem;
          color: var(--color-text-muted);
          margin-top: 2px;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          padding: 0 4px;
        }

        .room-status-dot {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .room-status-dot.available { background: var(--color-available); }
        .room-status-dot.occupied { background: var(--color-occupied); }
        .room-status-dot.dirty { background: var(--color-dirty); }
        .room-status-dot.maintenance { background: var(--color-maintenance); }
      `}</style>
        </div>
    )
}
