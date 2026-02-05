'use client'

interface HeaderProps {
    onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
    // Mock data - akan diganti dengan data real
    const user = {
        name: 'Ahmad Fauzi',
        role: 'Staff Piket',
        avatar: null,
    }

    const tickerData = {
        saldoLaci: 'EGP 2,400',
        statusListrik: 'Aman',
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    }

    return (
        <header className="header">
            <div className="header-left">
                <button className="menu-btn" onClick={onMenuClick}>
                    <span>☰</span>
                </button>
                <div className="header-ticker">
                    <div className="ticker-item">
                        <span>💰</span>
                        <span>Saldo Laci: <strong>{tickerData.saldoLaci}</strong></span>
                    </div>
                    <div className="ticker-item">
                        <span>⚡</span>
                        <span>Listrik: <strong className="status-ok">{tickerData.statusListrik}</strong></span>
                    </div>
                    <div className="ticker-item">
                        <span>🕐</span>
                        <span>{tickerData.time}</span>
                    </div>
                </div>
            </div>

            <div className="user-profile">
                <div className="user-info">
                    <div className="user-name">{user.name}</div>
                    <div className="user-role">{user.role}</div>
                </div>
                <div className="user-avatar">
                    {user.avatar ? (
                        <img src={user.avatar} alt={user.name} />
                    ) : (
                        <span>{user.name.charAt(0)}</span>
                    )}
                </div>
            </div>

            <style jsx>{`
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--spacing-md) var(--spacing-lg);
          background: var(--color-bg-card);
          border-radius: var(--radius-xl);
          margin-bottom: var(--spacing-lg);
          box-shadow: var(--shadow-sm);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: var(--spacing-lg);
        }

        .menu-btn {
          display: none;
          width: 40px;
          height: 40px;
          border: none;
          background: var(--color-bg-secondary);
          border-radius: var(--radius-md);
          cursor: pointer;
          font-size: 1.25rem;
        }

        .header-ticker {
          display: flex;
          gap: var(--spacing-xl);
        }

        .ticker-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          font-size: 0.9375rem;
          color: var(--color-text-secondary);
        }

        .status-ok {
          color: var(--color-success);
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .user-info {
          text-align: right;
        }

        .user-name {
          font-weight: 600;
          font-size: 0.9375rem;
        }

        .user-role {
          font-size: 0.8125rem;
          color: var(--color-text-muted);
        }

        .user-avatar {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-full);
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 1.125rem;
          overflow: hidden;
        }

        .user-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        @media (max-width: 768px) {
          .menu-btn {
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .header-ticker {
            display: none;
          }
        }
      `}</style>
        </header>
    )
}
