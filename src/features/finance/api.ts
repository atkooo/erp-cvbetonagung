import { apiClient } from '../../services/api';
import { Invoice, Payment } from '../../types';
import { InvoiceDto, PaymentDto } from './types';
import { mapInvoiceFromDto, mapPaymentFromDto } from './mappers';

export const financeApi = {
  async getInvoices(): Promise<Invoice[]> {
    const response = await apiClient.get<{ data: InvoiceDto[] }>('/finance/invoices?include=customer');
    return response.data.map(mapInvoiceFromDto);
  },

  async getPayments(): Promise<Payment[]> {
    const response = await apiClient.get<{ data: PaymentDto[] }>('/finance/payments?include=invoice.customer');
    return response.data.map(mapPaymentFromDto);
  },

  async verifyPayment(id: string): Promise<Payment> {
    const response = await apiClient.post<{ data: PaymentDto }>(`/finance/payments/${id}/verify`, {});
    return mapPaymentFromDto(response.data);
  }
};
