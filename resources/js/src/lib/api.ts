import axios from 'axios';
import { useAuthStore } from '@/domains/auth/store/useAuthStore';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Accept': 'application/json',
    },
});

// Add a request interceptor for tokens
api.interceptors.request.use((config) => {
    const state = useAuthStore.getState();
    if (state.token) {
        config.headers.Authorization = `Bearer ${state.token}`;
    }
    return config;
});

// Add a response interceptor for 401 errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            useAuthStore.getState().clearAuth();
            // Optional: redirect to login
            const isDriverPath = window.location.pathname.startsWith('/driver');
            const loginPath = isDriverPath ? '/driver/login' : '/auth/login';
            if (window.location.pathname !== loginPath) {
                window.location.href = loginPath;
            }
        }
        return Promise.reject(error);
    }
);

export default api;
