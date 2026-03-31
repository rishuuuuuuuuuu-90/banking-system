import api from './axiosConfig';

export const bookTicket = (data) => api.post('/tickets/book', data);
export const getMyTickets = (params) => api.get('/tickets/my-tickets', { params });
export const getTicket = (id) => api.get(`/tickets/${id}`);
export const validateTicket = (data) => api.post('/tickets/validate', data);
export const scanTicket = (id) => api.patch(`/tickets/${id}/scan`);
export const getEventTickets = (eventId, params) =>
  api.get(`/tickets/event/${eventId}`, { params });
