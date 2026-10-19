import { apiClient } from '../../services/api';
import { createCustomerPayload, mapCustomerDtoToCustomer } from './mappers';
import type { Customer } from '../../types';
import type { CreateCustomerPayload, CustomerDto } from './types';

const READ_ENDPOINT = '/master/customers';
const WRITE_ENDPOINT = '/master-data/customers';

export const customersApi = {
  async listCustomers() {
    const response = await apiClient.get<{ data: CustomerDto[]; meta?: any }>(
      `${READ_ENDPOINT}?per_page=100&sort=code&direction=asc`
    );

    return {
      customers: response.data.map(mapCustomerDtoToCustomer),
      meta: response.meta,
    };
  },

  async createCustomer(input: Parameters<typeof createCustomerPayload>[0]): Promise<Customer> {
    const payload: CreateCustomerPayload = createCustomerPayload(input);
    const response = await apiClient.post<{ data: CustomerDto }>(WRITE_ENDPOINT, payload);
    return mapCustomerDtoToCustomer(response.data);
  },

  async updateCustomer(id: string, input: Parameters<typeof createCustomerPayload>[0]): Promise<Customer> {
    const payload: CreateCustomerPayload = createCustomerPayload(input);
    const response = await apiClient.patch<{ data: CustomerDto }>(`${WRITE_ENDPOINT}/${id}`, payload);
    return mapCustomerDtoToCustomer(response.data);
  },

  async deleteCustomer(id: string): Promise<void> {
    await apiClient.delete(`${WRITE_ENDPOINT}/${id}`);
  },
};
