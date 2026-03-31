import React, { useEffect, useState } from 'react';
import { getMyTickets } from '../api/tickets';
import './MyTickets.css';

const MyTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [selectedQR, setSelectedQR] = useState(null);

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await getMyTickets({ page, limit: 8 });
        setTickets(res.data.data.tickets);
        setPagination(res.data.data.pagination);
      } catch (err) {
        setError('Failed to load tickets');
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, [page]);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const statusColor = (status) => {
    const map = { completed: 'success', pending: 'warning', failed: 'error', refunded: 'info' };
    return map[status] || 'info';
  };

  return (
    <div className="my-tickets-page">
      <div className="my-tickets-header">
        <h1>🎟 My Tickets</h1>
        <p>Your event bookings and QR codes</p>
      </div>

      {loading && <div className="loading">Loading your tickets...</div>}
      {error && <div className="error-msg">{error}</div>}

      {!loading && tickets.length === 0 && (
        <div className="no-tickets">
          <span>🎪</span>
          <p>You haven&apos;t booked any tickets yet.</p>
          <a href="/events" className="browse-link">Browse Events</a>
        </div>
      )}

      <div className="tickets-grid">
        {tickets.map((ticket) => (
          <div
            key={ticket._id}
            className={`ticket-card ${ticket.isUsed ? 'ticket-card--used' : ''}`}
          >
            <div className="ticket-card__event">
              {ticket.eventId ? (
                <>
                  <h3>{ticket.eventId.title}</h3>
                  <p className="ticket-date">📅 {formatDate(ticket.eventId.date)}</p>
                  <p className="ticket-venue">📍 {ticket.eventId.venue}</p>
                </>
              ) : (
                <h3>Event no longer available</h3>
              )}
            </div>
            <div className="ticket-card__info">
              <div className="ticket-number">
                <span className="label">Ticket #</span>
                <span className="value">{ticket.ticketNumber}</span>
              </div>
              <div className="ticket-amount">
                <span className="label">Amount</span>
                <span className="value">${ticket.amount.toFixed(2)}</span>
              </div>
              <div className="ticket-status-row">
                <span className={`status-badge status-${statusColor(ticket.paymentStatus)}`}>
                  {ticket.paymentStatus}
                </span>
                {ticket.isUsed && (
                  <span className="used-badge">✅ Used</span>
                )}
              </div>
            </div>
            {ticket.qrCode && ticket.paymentStatus === 'completed' && !ticket.isUsed && (
              <div className="ticket-card__qr">
                <button
                  className="btn-show-qr"
                  onClick={() => setSelectedQR(selectedQR === ticket._id ? null : ticket._id)}
                >
                  {selectedQR === ticket._id ? 'Hide QR' : '📱 Show QR Code'}
                </button>
                {selectedQR === ticket._id && (
                  <div className="qr-display">
                    <img src={ticket.qrCode} alt="QR Code" className="qr-image" />
                    <p className="qr-hint">Show this QR at the entrance</p>
                  </div>
                )}
              </div>
            )}
            {ticket.isUsed && ticket.scannedAt && (
              <div className="scanned-info">
                ✅ Used on {new Date(ticket.scannedAt).toLocaleString()}
              </div>
            )}
          </div>
        ))}
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="page-btn"
          >
            ← Prev
          </button>
          <span>{page} / {pagination.pages}</span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
            disabled={page === pagination.pages}
            className="page-btn"
          >
            Next →
          </button>
        </div>
      )}

      {/* Modal for QR display on mobile */}
      {selectedQR && (
        <div className="qr-modal-overlay" onClick={() => setSelectedQR(null)}>
          <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
            <button className="qr-modal-close" onClick={() => setSelectedQR(null)}>✕</button>
            {tickets.find((t) => t._id === selectedQR)?.qrCode && (
              <img
                src={tickets.find((t) => t._id === selectedQR).qrCode}
                alt="QR Code"
                className="qr-modal-image"
              />
            )}
            <p>Show this QR code at the event entrance</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTickets;
