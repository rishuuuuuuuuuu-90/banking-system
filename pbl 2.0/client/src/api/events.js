import api from './axiosConfig';

export const listEvents = (params) => api.get('/events', { params });
export const getEvent = (id) => api.get(`/events/${id}`);
export const createEvent = (data) => api.post('/events', data);
export const updateEvent = (id, data) => api.put(`/events/${id}`, data);
export const deleteEvent = (id) => api.delete(`/events/${id}`);
export const getMyEvents = (params) => api.get('/events/organizer/my-events', { params });
export const disableEvent = (id) => api.patch(`/events/${id}/disable`);
