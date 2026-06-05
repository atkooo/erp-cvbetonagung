import type { Customer } from '../../types';
import type { CreateCustomerPayload, CustomerDto } from './types';

const statusLabelByApiStatus: Record<NonNullable<CustomerDto['status']>, Customer['status']> = {
  active: 'Aktif',
  inactive: 'Nonaktif',
};

const apiStatusByStatusLabel: Record<Customer['status'], CreateCustomerPayload['status']> = {
  Aktif: 'active',
  Nonaktif: 'inactive',
};

export const mapCustomerDtoToCustomer = (customer: CustomerDto): Customer => ({
  id: customer.id,
  code: customer.code,
  name: customer.name,
  phone: customer.phone || '-',
  email: customer.email || '-',
  city: customer.city || '-',
  address: customer.address || '-',
  status: statusLabelByApiStatus[customer.status || 'active'],
});

export const createCustomerPayload = (input: {
  code: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  status: Customer['status'];
}): CreateCustomerPayload => ({
  code: input.code,
  name: input.name,
  phone: input.phone || undefined,
  email: input.email || undefined,
  city: input.city || undefined,
  address: input.address || undefined,
  status: apiStatusByStatusLabel[input.status],
});
