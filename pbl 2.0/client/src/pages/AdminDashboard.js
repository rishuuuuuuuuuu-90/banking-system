import React, { useEffect, useState } from 'react';
import { getAnalytics, getEventAnalytics, listAllEvents, adminDisableEvent, adminEnableEvent, listUsers } from '../api/admin';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('analytics');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventStats, setEventStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [analyticsRes, eventsRes, usersRes] = await Promise.all([
          getAnalytics(),
          listAllEvents({ limit: 100 }),
          listUsers({ limit: 100 }),
        ]);
        setAnalytics(analyticsRes.data.data);
        setEvents(eventsRes.data.data.events);
        setUsers(usersRes.data.data.users);
      } catch {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleDisable = async (eventId) => {
    try {
      await adminDisableEvent(eventId);
      setSuccess('Event disabled');
      setEvents((prev) =>
        prev.map((e) => (e._id === eventId ? { ...e, status: 'disabled' } : e))
      );
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to disable event');
    }
  };

  const handleEnable = async (eventId) => {
    try {
      await adminEnableEvent(eventId);
      setSuccess('Event enabled');
      setEvents((prev) =>
        prev.map((e) => (e._id === eventId ? { ...e, status: 'active' } : e))
      );
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to enable event');
    }
  };

  const handleViewEventStats = async (event) => {
    setSelectedEvent(event);
    setStatsLoading(true);
    setActiveTab('event-stats');
    try {
      const res = await getEventAnalytics(event._id);
      setEventStats(res.data.data);
    } catch {
      setError('Failed to load event stats');
    } finally {
      setStatsLoading(false);
    }
  };

  if (loading) {
    return <div className="admin-loading">Loading dashboard...</div>;
  }

  const roleCount = (role) => users.filter((u) => u.role === role).length;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>🛡 Admin Dashboard</h1>
        <p>Platform analytics and management</p>
      </div>

      <div className="admin-tabs">
        {['analytics', 'events', 'users'].map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
        {activeTab === 'event-stats' && selectedEvent && (
          <button className="tab-btn active">Stats: {selectedEvent.title}</button>
        )}
      </div>

      {success && <div className="alert alert--success">{success}</div>}
      {error && <div className="alert alert--error">{error}</div>}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && analytics && (
        <div className="analytics-tab">
          <div className="stats-grid">
            <div className="stat-card stat-card--blue">
              <div className="stat-value">${analytics.revenue?.toFixed(2) || '0.00'}</div>
              <div className="stat-label">Total Revenue</div>
            </div>
            <div className="stat-card stat-card--green">
              <div className="stat-value">{analytics.ticketsSold || 0}</div>
              <div className="stat-label">Tickets Sold</div>
            </div>
            <div className="stat-card stat-card--purple">
              <div className="stat-value">{analytics.attendance || 0}%</div>
              <div className="stat-label">Attendance Rate</div>
            </div>
            <div className="stat-card stat-card--orange">
              <div className="stat-value">{analytics.eventStats?.total || 0}</div>
              <div className="stat-label">Total Events</div>
            </div>
          </div>

          <div className="analytics-row">
            <div className="analytics-card">
              <h3>Event Status Breakdown</h3>
              <div className="stat-list">
                {Object.entries(analytics.eventStats || {}).map(([key, val]) => (
                  key !== 'total' && (
                    <div key={key} className="stat-item">
                      <span className="stat-item__key">{key}</span>
                      <span className="stat-item__val">{val}</span>
                    </div>
                  )
                ))}
              </div>
            </div>

            {analytics.popularEvent && (
              <div className="analytics-card">
                <h3>🏆 Most Popular Event</h3>
                <div className="popular-event">
                  <p className="popular-title">{analytics.popularEvent.event.title}</p>
                  <p className="popular-tickets">
                    {analytics.popularEvent.ticketsSold} tickets sold
                  </p>
                  <p className="popular-meta">
                    📅 {new Date(analytics.popularEvent.event.date).toLocaleDateString()}<br />
                    📍 {analytics.popularEvent.event.venue}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="analytics-card">
            <h3>User Breakdown</h3>
            <div className="stat-list">
              <div className="stat-item">
                <span className="stat-item__key">Total Users</span>
                <span className="stat-item__val">{users.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-item__key">Students</span>
                <span className="stat-item__val">{roleCount('student')}</span>
              </div>
              <div className="stat-item">
                <span className="stat-item__key">Organizers</span>
                <span className="stat-item__val">{roleCount('organizer')}</span>
              </div>
              <div className="stat-item">
                <span className="stat-item__key">Admins</span>
                <span className="stat-item__val">{roleCount('admin')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div className="events-tab">
          <div className="admin-events-list">
            {events.map((event) => (
              <div key={event._id} className="admin-event-row">
                <div className="admin-event-info">
                  <h4>{event.title}</h4>
                  <span className={`badge badge-${event.status}`}>{event.status}</span>
                  <span className="admin-event-meta">
                    📅 {new Date(event.date).toLocaleDateString()} &nbsp;|&nbsp;
                    🪑 {event.availableSeats}/{event.totalSeats} &nbsp;|&nbsp;
                    By: {event.organizerId?.name}
                  </span>
                </div>
                <div className="admin-event-actions">
                  <button
                    className="btn-sm btn-stats"
                    onClick={() => handleViewEventStats(event)}
                  >
                    Stats
                  </button>
                  {event.status === 'active' ? (
                    <button
                      className="btn-sm btn-disable"
                      onClick={() => handleDisable(event._id)}
                    >
                      Disable
                    </button>
                  ) : event.status === 'disabled' ? (
                    <button
                      className="btn-sm btn-enable"
                      onClick={() => handleEnable(event._id)}
                    >
                      Enable
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="users-tab">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`badge badge-role badge-${u.role}`}>{u.role}</span>
                  </td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${u.isActive ? 'badge-active' : 'badge-inactive'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Event Stats Tab */}
      {activeTab === 'event-stats' && selectedEvent && (
        <div className="event-stats-tab">
          <h3>Analytics: {selectedEvent.title}</h3>
          {statsLoading && <div className="loading">Loading stats...</div>}
          {eventStats && (
            <>
              <div className="stats-grid">
                <div className="stat-card stat-card--blue">
                  <div className="stat-value">${eventStats.stats.totalRevenue?.toFixed(2)}</div>
                  <div className="stat-label">Revenue</div>
                </div>
                <div className="stat-card stat-card--green">
                  <div className="stat-value">{eventStats.stats.totalTickets}</div>
                  <div className="stat-label">Tickets Booked</div>
                </div>
                <div className="stat-card stat-card--purple">
                  <div className="stat-value">{eventStats.stats.attendanceRate}%</div>
                  <div className="stat-label">Attendance</div>
                </div>
                <div className="stat-card stat-card--orange">
                  <div className="stat-value">{eventStats.stats.occupancyRate}%</div>
                  <div className="stat-label">Occupancy</div>
                </div>
              </div>
              <div className="stat-list">
                <div className="stat-item">
                  <span className="stat-item__key">Available Seats</span>
                  <span className="stat-item__val">{eventStats.stats.availableSeats} / {eventStats.stats.totalSeats}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-item__key">Used Tickets</span>
                  <span className="stat-item__val">{eventStats.stats.usedTickets}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-item__key">Completed Payments</span>
                  <span className="stat-item__val">{eventStats.stats.completedTickets}</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
