import { apiClient } from '../../services/api';
import { SupplierDto, SupplierFormData } from './types';
import { Supplier } from '../../types';
import { mapSupplierFromDto, mapSupplierToDto } from './mappers';

const READ_ENDPOINT = '/master/suppliers';
const WRITE_ENDPOINT = '/master-data/suppliers';

export const suppliersApi = {
  async getSuppliers(): Promise<Supplier[]> {
    const response = await apiClient.get<{ data: SupplierDto[] }>(READ_ENDPOINT);
    return response.data.map(mapSupplierFromDto);
  },

  async getSupplier(id: string): Promise<Supplier> {
    const response = await apiClient.get<{ data: SupplierDto }>(`${WRITE_ENDPOINT}/${id}`);
    return mapSupplierFromDto(response.data);
  },

  async createSupplier(data: SupplierFormData): Promise<Supplier> {
    const payload = mapSupplierToDto(data);
    const response = await apiClient.post<{ data: SupplierDto }>(WRITE_ENDPOINT, payload);
    return mapSupplierFromDto(response.data);
  },

  async updateSupplier(id: string, data: SupplierFormData): Promise<Supplier> {
    const payload = mapSupplierToDto(data);
    const response = await apiClient.put<{ data: SupplierDto }>(`${WRITE_ENDPOINT}/${id}`, payload);
    return mapSupplierFromDto(response.data);
  },

  async deleteSupplier(id: string): Promise<void> {
    await apiClient.delete(`${WRITE_ENDPOINT}/${id}`);
  },
};
