import api from '@/lib/api';
import { User } from '../../system/services/userService';

export interface LoginResponse {
    access_token: string;
    token_type: string;
    user: User;
}

export const authService = {
    login: async (data: any) => {
        const response = await api.post<LoginResponse>('/login', data);
        return response.data;
    },
    logout: async () => {
        const response = await api.post('/logout');
        return response.data;
    },
    me: async () => {
        const response = await api.get<User>('/me');
        return response.data;
    },
};
