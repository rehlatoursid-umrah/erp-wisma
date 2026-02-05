'use client'

interface POSButtonProps {
    onClick: () => void
}

export default function POSButton({ onClick }: POSButtonProps) {
    return (
        <button className="pos-button card-hover" onClick={onClick}>
            <span className="pos-icon">🛒</span>
            <span className="pos-label">NEW TRANSACTION</span>
            <span className="pos-subtitle">Klik untuk memulai transaksi baru</span>

            <style jsx>{`
        .pos-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-md);
          padding: var(--spacing-2xl);
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
          color: var(--color-text-light);
          border-radius: var(--radius-2xl);
          cursor: pointer;
          border: none;
          box-shadow: var(--shadow-lg);
          width: 100%;
          min-height: 200px;
          transition: all var(--transition-base);
        }

        .pos-button:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-xl);
        }

        .pos-button:active {
          transform: translateY(-2px);
        }

        .pos-icon {
          font-size: 3.5rem;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
        }

        .pos-label {
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: 0.02em;
        }

        .pos-subtitle {
          font-size: 0.875rem;
          opacity: 0.8;
        }
      `}</style>
        </button>
    )
}
