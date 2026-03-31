import React, { useEffect, useState, useCallback } from 'react';
import { getMyEvents, createEvent, updateEvent, deleteEvent } from '../api/events';
import { getEventTickets } from '../api/tickets';
import QRScanner from '../components/QRScanner';
import './OrganizerDashboard.css';

const CATEGORIES = ['academic', 'cultural', 'sports', 'technical', 'social', 'other'];

const emptyForm = {
  title: '',
  description: '',
  date: '',
  venue: '',
  price: 0,
  totalSeats: 50,
  bannerImage: '',
  category: 'other',
};

const OrganizerDashboard = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formLoading, setFormLoading] = useState(false);
  const [scanEvent, setScanEvent] = useState(null);
  const [eventTickets, setEventTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('events'); // events | scan | tickets

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getMyEvents({ limit: 50 });
      setEvents(res.data.data.events);
    } catch {
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const openCreate = () => {
    setEditingEvent(null);
    setForm(emptyForm);
    setShowForm(true);
    setSuccess('');
    setError('');
  };

  const openEdit = (event) => {
    setEditingEvent(event);
    setForm({
      title: event.title,
      description: event.description,
      date: new Date(event.date).toISOString().slice(0, 16),
      venue: event.venue,
      price: event.price,
      totalSeats: event.totalSeats,
      bannerImage: event.bannerImage || '',
      category: event.category,
    });
    setShowForm(true);
    setSuccess('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');
    setSuccess('');
    try {
      if (editingEvent) {
        await updateEvent(editingEvent._id, form);
        setSuccess('Event updated successfully!');
      } else {
        await createEvent(form);
        setSuccess('Event created successfully!');
      }
      setShowForm(false);
      fetchEvents();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save event');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await deleteEvent(eventId);
      setSuccess('Event deleted');
      fetchEvents();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to delete event');
    }
  };

  const handleViewTickets = async (event) => {
    setScanEvent(event);
    setActiveTab('tickets');
    setTicketsLoading(true);
    try {
      const res = await getEventTickets(event._id, { limit: 100 });
      setEventTickets(res.data.data.tickets);
    } catch {
      setError('Failed to load tickets');
    } finally {
      setTicketsLoading(false);
    }
  };

  const startScan = (event) => {
    setScanEvent(event);
    setActiveTab('scan');
  };

  return (
    <div className="organizer-page">
      <div className="organizer-header">
        <h1>🎤 Organizer Dashboard</h1>
        <p>Manage your events and scan tickets</p>
      </div>

      <div className="organizer-tabs">
        <button
          className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          My Events
        </button>
        <button
          className={`tab-btn ${activeTab === 'scan' ? 'active' : ''}`}
          onClick={() => setActiveTab('scan')}
        >
          Scan QR
        </button>
        {activeTab === 'tickets' && scanEvent && (
          <button className="tab-btn active">
            Tickets: {scanEvent.title}
          </button>
        )}
      </div>

      {success && <div className="alert alert--success">{success}</div>}
      {error && <div className="alert alert--error">{error}</div>}

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div className="events-tab">
          <div className="tab-actions">
            <button className="btn-create" onClick={openCreate}>
              + Create New Event
            </button>
          </div>

          {showForm && (
            <div className="event-form-wrapper">
              <h3>{editingEvent ? 'Edit Event' : 'Create New Event'}</h3>
              <form onSubmit={handleSubmit} className="event-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Title *</label>
                    <input name="title" value={form.title} onChange={handleFormChange} required />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select name="category" value={form.category} onChange={handleFormChange}>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleFormChange}
                    rows={3}
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Date & Time *</label>
                    <input
                      type="datetime-local"
                      name="date"
                      value={form.date}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Venue *</label>
                    <input name="venue" value={form.venue} onChange={handleFormChange} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Price ($)</label>
                    <input
                      type="number"
                      name="price"
                      value={form.price}
                      onChange={handleFormChange}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="form-group">
                    <label>Total Seats *</label>
                    <input
                      type="number"
                      name="totalSeats"
                      value={form.totalSeats}
                      onChange={handleFormChange}
                      min="1"
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Banner Image URL</label>
                  <input
                    type="url"
                    name="bannerImage"
                    value={form.bannerImage}
                    onChange={handleFormChange}
                    placeholder="https://..."
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-save" disabled={formLoading}>
                    {formLoading ? 'Saving...' : editingEvent ? 'Update Event' : 'Create Event'}
                  </button>
                  <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {loading && <div className="loading">Loading events...</div>}

          {!loading && events.length === 0 && (
            <div className="no-data">No events yet. Create your first event!</div>
          )}

          <div className="events-list">
            {events.map((event) => (
              <div key={event._id} className="event-row">
                <div className="event-row__info">
                  <h4>{event.title}</h4>
                  <span className={`event-status status-${event.status}`}>{event.status}</span>
                  <span className="event-meta">
                    📅 {new Date(event.date).toLocaleDateString()} &nbsp;|&nbsp;
                    🪑 {event.availableSeats}/{event.totalSeats} &nbsp;|&nbsp;
                    💰 ${event.price}
                  </span>
                </div>
                <div className="event-row__actions">
                  <button className="btn-sm btn-edit" onClick={() => openEdit(event)}>Edit</button>
                  <button className="btn-sm btn-tickets" onClick={() => handleViewTickets(event)}>Tickets</button>
                  <button className="btn-sm btn-scan" onClick={() => startScan(event)}>Scan QR</button>
                  <button className="btn-sm btn-delete" onClick={() => handleDelete(event._id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QR Scan Tab */}
      {activeTab === 'scan' && (
        <div className="scan-tab">
          {scanEvent ? (
            <>
              <p className="scan-event-title">Scanning for: <strong>{scanEvent.title}</strong></p>
              <QRScanner onScanComplete={() => {}} />
            </>
          ) : (
            <p className="no-data">Select an event from the Events tab to start scanning.</p>
          )}
        </div>
      )}

      {/* Tickets Tab */}
      {activeTab === 'tickets' && scanEvent && (
        <div className="tickets-tab">
          <h3>Tickets for: {scanEvent.title}</h3>
          {ticketsLoading && <div className="loading">Loading tickets...</div>}
          {!ticketsLoading && eventTickets.length === 0 && (
            <div className="no-data">No tickets booked yet.</div>
          )}
          <table className="tickets-table">
            <thead>
              <tr>
                <th>Ticket #</th>
                <th>Attendee</th>
                <th>Payment</th>
                <th>Used</th>
                <th>Scanned At</th>
              </tr>
            </thead>
            <tbody>
              {eventTickets.map((ticket) => (
                <tr key={ticket._id} className={ticket.isUsed ? 'row-used' : ''}>
                  <td className="mono">{ticket.ticketNumber}</td>
                  <td>{ticket.userId?.name || 'N/A'}<br /><small>{ticket.userId?.email}</small></td>
                  <td>
                    <span className={`badge badge-${ticket.paymentStatus}`}>
                      {ticket.paymentStatus}
                    </span>
                  </td>
                  <td>{ticket.isUsed ? '✅ Yes' : '—'}</td>
                  <td>{ticket.scannedAt ? new Date(ticket.scannedAt).toLocaleString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OrganizerDashboard;
