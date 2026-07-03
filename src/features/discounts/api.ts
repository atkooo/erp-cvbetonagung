import { apiClient } from '../../services/api';
import { Discount } from '../../types';

export const discountsApi = {
  async getDiscounts(): Promise<Discount[]> {
    const response = await apiClient.get<{ data: Discount[] }>('/master-data/discounts?per_page=100');
    return response.data;
  },

  async getDiscount(id: string): Promise<Discount> {
    const response = await apiClient.get<{ data: Discount }>(`/master-data/discounts/${id}`);
    return response.data;
  },

  async createDiscount(data: Omit<Discount, 'id'>): Promise<Discount> {
    const response = await apiClient.post<{ data: Discount }>('/master-data/discounts', data);
    return response.data;
  },

  async updateDiscount(id: string, data: Partial<Discount>): Promise<Discount> {
    const response = await apiClient.put<{ data: Discount }>(`/master-data/discounts/${id}`, data);
    return response.data;
  },

  async deleteDiscount(id: string): Promise<void> {
    await apiClient.delete(`/master-data/discounts/${id}`);
  },
};
