import axios from 'axios';

const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
});

instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    console.log('Token from localStorage:', token);
    
    if (token) {
      config.headers.Authorization = `Token ${token}`;
      console.log('Request headers:', config.headers);
    } else {
      console.log('No token found in localStorage');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default instance; 