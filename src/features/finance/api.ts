import { apiClient } from '../../services/api';
import { Invoice, Payment } from '../../types';
import { InvoiceDto, PaymentDto, SupplierPayableDto, SupplierPayable, AccountDto, CashTransactionDto, CreateCashTransactionDto } from './types';
import { mapInvoiceFromDto, mapPaymentFromDto, mapSupplierPayableFromDto } from './mappers';

export const financeApi = {
  async getInvoices(): Promise<Invoice[]> {
    const response = await apiClient.get<{ data: InvoiceDto[] }>('/finance/invoices?include=customer');
    return response.data.map(mapInvoiceFromDto);
  },

  async createInvoice(data: { customer_id: string; sales_order_id: string; invoice_date: string; due_date?: string; total: number; status?: string }): Promise<Invoice> {
    const response = await apiClient.post<{ data: InvoiceDto }>('/finance/invoices', data);
    return mapInvoiceFromDto(response.data);
  },

  async getPayments(): Promise<Payment[]> {
    const response = await apiClient.get<{ data: PaymentDto[] }>('/finance/payments?include=invoice.customer');
    return response.data.map(mapPaymentFromDto);
  },

  async verifyPayment(id: string): Promise<Payment> {
    const response = await apiClient.post<{ data: PaymentDto }>(`/finance/payments/${id}/verify`, {});
    return mapPaymentFromDto(response.data);
  },

  async getSupplierPayables(): Promise<SupplierPayable[]> {
    const response = await apiClient.get<{ data: SupplierPayableDto[] }>('/purchasing/supplier-payables?include=supplier,purchase_order');
    return response.data.map(mapSupplierPayableFromDto);
  },

  async updateSupplierPayable(id: string, data: Partial<{ paid_amount: number; status: 'open' | 'partial' | 'paid' }>): Promise<SupplierPayable> {
    const response = await apiClient.put<{ data: SupplierPayableDto }>(`/purchasing/supplier-payables/${id}`, data);
    return mapSupplierPayableFromDto(response.data);
  },

  async getAccounts(): Promise<AccountDto[]> {
    const response = await apiClient.get<{ data: AccountDto[] }>('/finance/accounts');
    return response.data;
  },

  async getCashTransactions(): Promise<CashTransactionDto[]> {
    const response = await apiClient.get<{ data: CashTransactionDto[] }>('/finance/cash-transactions?include=account');
    return response.data;
  },

  async createCashTransaction(data: CreateCashTransactionDto): Promise<CashTransactionDto> {
    const response = await apiClient.post<{ data: CashTransactionDto }>('/finance/cash-transactions', data);
    return response.data;
  }
};

