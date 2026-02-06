import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth endpoints
export const authAPI = {
  getUser: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  loginUrl: () => `${API_URL}/auth/google`,
};

// Email endpoints
export const emailAPI = {
  scheduleEmails: (formData: FormData) => 
    api.post('/api/emails/schedule', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  
  getScheduled: () => api.get('/api/emails/scheduled'),
  
  getSent: () => api.get('/api/emails/sent'),
  
  getStats: () => api.get('/api/emails/stats'),
};

export default api;
