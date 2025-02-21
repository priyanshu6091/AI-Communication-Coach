import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});
export const recordingsApi = axios.create({
  baseURL: '/api/recordings',
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});
// Add a request interceptor to add the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// export const recordingsApi = {
//   getAll: () => api.get('/recordings'),
//   getById: (id: string) => api.get(`/recordings/${id}`),
//   create: (formData: FormData) => api.post('/recordings', formData),
//   delete: (id: string) => api.delete(`/recordings/${id}`),
// };

export const feedbackApi = {
  getStats: () => api.get('/feedback/stats'),
  addFeedback: (recordingId: string, feedback: any) => 
    api.post(`/feedback/${recordingId}`, feedback),
};

export default api;
