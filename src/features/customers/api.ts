import { resourceClient } from '../../services/resources';
import { createCustomerPayload, mapCustomerDtoToCustomer } from './mappers';
import type { Customer } from '../../types';
import type { CreateCustomerPayload, CustomerDto } from './types';

const READ_MODULE = 'master';
const WRITE_MODULE = 'master-data';
const RESOURCE = 'customers';

export const customersApi = {
  async listCustomers() {
    const response = await resourceClient.list<CustomerDto>(READ_MODULE, RESOURCE, {
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
      WRITE_MODULE,
      RESOURCE,
      payload
    );

    return mapCustomerDtoToCustomer(response.data);
  },

  async updateCustomer(id: string, input: Parameters<typeof createCustomerPayload>[0]): Promise<Customer> {
    const payload: CreateCustomerPayload = createCustomerPayload(input);
    const response = await resourceClient.update<CustomerDto, CreateCustomerPayload>(
      WRITE_MODULE,
      RESOURCE,
      id,
      payload
    );

    return mapCustomerDtoToCustomer(response.data);
  },

  async deleteCustomer(id: string): Promise<void> {
    await resourceClient.delete(WRITE_MODULE, RESOURCE, id);
  },
};
