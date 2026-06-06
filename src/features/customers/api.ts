import { resourceClient } from '../../services/resources';
import { createCustomerPayload, mapCustomerDtoToCustomer } from './mappers';
import type { Customer } from '../../types';
import type { CreateCustomerPayload, CustomerDto } from './types';

const MODULE = 'master-data';
const RESOURCE = 'customers';

export const customersApi = {
  async listCustomers() {
    const response = await resourceClient.list<CustomerDto>(MODULE, RESOURCE, {
      per_page: 100,
      sort: 'code',
      direction: 'asc',
    });

    return {
      customers: response.data.map(mapCustomerDtoToCustomer),
      meta: response.meta,
    };
  },

  async createCustomer(input: Parameters<typeof createCustomerPayload>[0]): Promise<Customer> {
    const payload: CreateCustomerPayload = createCustomerPayload(input);
    const response = await resourceClient.create<CustomerDto, CreateCustomerPayload>(
      MODULE,
      RESOURCE,
      payload
    );

    return mapCustomerDtoToCustomer(response.data);
  },

  async updateCustomer(id: string, input: Parameters<typeof createCustomerPayload>[0]): Promise<Customer> {
    const payload: CreateCustomerPayload = createCustomerPayload(input);
    const response = await resourceClient.update<CustomerDto, CreateCustomerPayload>(
      MODULE,
      RESOURCE,
      id,
      payload
    );

    return mapCustomerDtoToCustomer(response.data);
  },

  async deleteCustomer(id: string): Promise<void> {
    await resourceClient.delete(MODULE, RESOURCE, id);
  },
};
