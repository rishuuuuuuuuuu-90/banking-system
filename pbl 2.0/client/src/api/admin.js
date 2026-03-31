import api from './axiosConfig';

export const getAnalytics = () => api.get('/admin/analytics');
export const getEventAnalytics = (eventId) => api.get(`/admin/event/${eventId}/analytics`);
export const listUsers = (params) => api.get('/admin/users', { params });
export const listAllEvents = (params) => api.get('/admin/events', { params });
export const adminDisableEvent = (eventId) => api.patch(`/admin/events/${eventId}/disable`);
export const adminEnableEvent = (eventId) => api.patch(`/admin/events/${eventId}/enable`);
