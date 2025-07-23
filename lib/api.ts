import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  withCredentials: false,
});

// Optional: Add interceptors for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // You can customize error handling here
    return Promise.reject(error);
  }
);

// Budget endpoints
export const getBudget = () => api.get('/budget');
export const setBudget = (amount: number) => api.post('/budget', { amount });

// Spending endpoints
export const addSpending = (amount: number, date: string) => api.post('/spending', { amount, date });
export const editSpending = (id: string, data: { amount?: number; date?: string }) => api.put(`/spending/${id}`, data);
export const deleteSpending = (id: string) => api.delete(`/spending/${id}`);
export const getSpendingHistory = () => api.get('/spending/history');

// Wishlist endpoints
export const getWishlist = () => api.get('/wishlist');
export const addWishlistItem = (item: { name: string; targetPrice: number; allocationRatio: number }) => api.post('/wishlist', item);
export const editWishlistItem = (id: string, data: { name?: string; targetPrice?: number; allocationRatio?: number; funded?: number }) => api.put(`/wishlist/${id}`, data);
export const deleteWishlistItem = (id: string) => api.delete(`/wishlist/${id}`);
export const fundWishlist = () => api.post('/wishlist/fund');

export default api; 