import axios from 'axios';

// Create an instance of axios with default config
const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Use the correct backend port
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const message = error.response.data.message || 'An error occurred';
      
      // Handle authentication errors
      if (error.response.status === 401) {
        localStorage.removeItem('token'); // Clear invalid token
        window.location.href = '/login'; // Redirect to login
      }
      
      return Promise.reject(new Error(message));
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
      return Promise.reject(new Error('No response from server'));
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
      return Promise.reject(error);
    }
  }
);

// Create an instance for recordings with multipart/form-data
const recordingsApi = axios.create({
  baseURL: 'http://localhost:5000/api/recordings',
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});

// Add auth token to recordings API
recordingsApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => {
    console.error('Recordings API request error:', error);
    return Promise.reject(error);
  }
);

export { api as default, recordingsApi };
