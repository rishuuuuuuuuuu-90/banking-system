import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './EventCard.css';

const EventCard = ({ event, onBook }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleBooking = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (onBook) onBook(event);
  };

  const isFull = event.availableSeats === 0;
  const isFree = event.price === 0;

  return (
    <div className={`event-card ${event.status !== 'active' ? 'event-card--inactive' : ''}`}>
      {event.bannerImage && (
        <div className="event-card__banner">
          <img src={event.bannerImage} alt={event.title} />
        </div>
      )}
      <div className="event-card__body">
        <div className="event-card__header">
          <span className={`event-card__category category-${event.category}`}>
            {event.category}
          </span>
          <span className={`event-card__status status-${event.status}`}>
            {event.status}
          </span>
        </div>
        <h3 className="event-card__title">{event.title}</h3>
        <p className="event-card__desc">
          {event.description.length > 120
            ? event.description.slice(0, 120) + '...'
            : event.description}
        </p>
        <div className="event-card__info">
          <span>📅 {formatDate(event.date)}</span>
          <span>📍 {event.venue}</span>
          <span>🪑 {event.availableSeats} / {event.totalSeats} seats left</span>
          <span className="event-card__price">
            {isFree ? '🆓 Free' : `💰 $${event.price.toFixed(2)}`}
          </span>
        </div>
        {event.organizerId && (
          <p className="event-card__organizer">
            🎤 {event.organizerId.name || 'Organizer'}
          </p>
        )}
      </div>
      {user?.role === 'student' && (
        <div className="event-card__footer">
          <button
            className="btn-book"
            onClick={handleBooking}
            disabled={isFull || event.status !== 'active'}
          >
            {isFull ? 'Sold Out' : event.status !== 'active' ? 'Unavailable' : 'Book Ticket'}
          </button>
        </div>
      )}
    </div>
  );
};

export default EventCard;
