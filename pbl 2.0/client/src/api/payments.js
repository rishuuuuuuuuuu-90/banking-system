import api from './axiosConfig';

export const createPaymentIntent = (data) => api.post('/payments/create-intent', data);
export const verifyPayment = (data) => api.post('/payments/verify', data);
export const getPaymentHistory = (params) => api.get('/payments/history', { params });
