import React, { useEffect, useState, useCallback } from 'react';
import { listEvents } from '../api/events';
import { bookTicket } from '../api/tickets';
import { createPaymentIntent, verifyPayment } from '../api/payments';
import { useAuth } from '../context/AuthContext';
import EventCard from '../components/EventCard';
import './EventListing.css';

const EventsListing = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [bookingMsg, setBookingMsg] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 9, status: 'active' };
      if (search) params.search = search;
      if (category) params.category = category;
      const res = await listEvents(params);
      setEvents(res.data.data.events);
      setPagination(res.data.data.pagination);
    } catch (err) {
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [page, search, category]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchEvents();
  };

  const handleBook = async (event) => {
    if (!user) return;
    setBookingLoading(true);
    setBookingMsg('');
    try {
      if (event.price > 0) {
        // Create payment intent first
        const intentRes = await createPaymentIntent({ eventId: event._id });
        const { paymentIntentId } = intentRes.data.data;

        // Book ticket with intent
        await bookTicket({ eventId: event._id, paymentIntentId });

        // Verify payment (in production, this would use Stripe.js to confirm card)
        // Here we simulate completion
        await verifyPayment({ paymentIntentId, eventId: event._id });
        setBookingMsg(`🎟 Ticket booked for "${event.title}"! Check My Tickets for QR code.`);
      } else {
        await bookTicket({ eventId: event._id });
        setBookingMsg(`🎟 Free ticket booked for "${event.title}"! Check My Tickets.`);
      }
      fetchEvents();
    } catch (err) {
      setBookingMsg(
        '❌ ' + (err?.response?.data?.message || 'Booking failed. Please try again.')
      );
    } finally {
      setBookingLoading(false);
    }
  };

  const categories = ['academic', 'cultural', 'sports', 'technical', 'social', 'other'];

  return (
    <div className="events-page">
      <div className="events-hero">
        <h1>Upcoming Events</h1>
        <p>Discover and book events at your college</p>
      </div>

      <div className="events-filters">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="btn-search">Search</button>
        </form>
        <div className="category-filters">
          <button
            className={`filter-btn ${category === '' ? 'active' : ''}`}
            onClick={() => { setCategory(''); setPage(1); }}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`filter-btn ${category === cat ? 'active' : ''}`}
              onClick={() => { setCategory(cat); setPage(1); }}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {bookingMsg && (
        <div className={`booking-alert ${bookingMsg.startsWith('❌') ? 'error' : 'success'}`}>
          {bookingMsg}
        </div>
      )}

      {loading && <div className="loading-spinner">Loading events...</div>}
      {error && <div className="error-msg">{error}</div>}

      {!loading && events.length === 0 && (
        <div className="no-events">No events found. Check back later!</div>
      )}

      <div className="events-grid">
        {events.map((event) => (
          <EventCard
            key={event._id}
            event={event}
            onBook={bookingLoading ? null : handleBook}
          />
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
          <span className="page-info">Page {page} of {pagination.pages}</span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
            disabled={page === pagination.pages}
            className="page-btn"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default EventsListing;
