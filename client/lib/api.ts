import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add interceptor to inject token if available
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export interface Escrow {
    id: string;
    escrowId: number;
    chainId: number;
    client: string;
    provider: string;
    token: string;
    amount: string;
    fee: string;
    status: number;
    deadline: string;
    description: string;
    createdAt: string;
    updatedAt: string;
}

export const getEscrows = async (params?: {
    chainId?: number;
    client?: string;
    provider?: string;
    status?: number;
}) => {
    const response = await api.get<Escrow[]>('/escrows', { params });
    return response.data;
};

export const getEscrow = async (id: string) => {
    const response = await api.get<Escrow>(`/escrows/${id}`);
    return response.data;
};

export const getEscrowStats = async (address: string) => {
    const response = await api.get('/escrows/stats', { params: { address } });
    return response.data;
};
