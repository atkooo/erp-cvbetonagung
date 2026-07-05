import { apiClient } from '../../services/api';
import { Invoice, Payment } from '../../types';
import { InvoiceDto, PaymentDto, SupplierPayableDto, SupplierPayable, AccountDto, CashTransactionDto, CreateCashTransactionDto } from './types';
import { mapInvoiceFromDto, mapPaymentFromDto, mapSupplierPayableFromDto } from './mappers';

export const financeApi = {
  async getInvoices(): Promise<Invoice[]> {
    const response = await apiClient.get<{ data: InvoiceDto[] }>('/finance/billing');
    return response.data.map(mapInvoiceFromDto);
  },

  async createInvoice(data: { customer_id: string; sales_order_id: string; invoice_date: string; due_date?: string; total: number; status?: string }): Promise<Invoice> {
    const response = await apiClient.post<{ data: InvoiceDto }>('/finance/invoices', data);
    return mapInvoiceFromDto(response.data);
  },

  async createPayment(data: { invoice_id: string; account_id: string; payment_date: string; method: 'cash' | 'transfer' | 'qris'; amount: number; notes?: string }): Promise<Payment> {
    const response = await apiClient.post<{ data: PaymentDto }>('/finance/payments', data);
    return mapPaymentFromDto(response.data);
  },

  async getPayments(): Promise<Payment[]> {
    const response = await apiClient.get<{ data: PaymentDto[] }>('/finance/cashier');
    return response.data.map(mapPaymentFromDto);
  },

  async verifyPayment(id: string): Promise<Payment> {
    const todayStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const response = await apiClient.post<{ data: PaymentDto }>(`/finance/payments/${id}/verify`, {
      verified_at: todayStr,
    });
    return mapPaymentFromDto(response.data);
  },

  async getSupplierPayables(): Promise<SupplierPayable[]> {
    const response = await apiClient.get<{ data: SupplierPayableDto[] }>('/finance/account-payable');
    return response.data.map(mapSupplierPayableFromDto);
  },

  async paySupplierPayable(id: string, data: { account_id: string; amount: number; method?: 'cash' | 'transfer' | 'qris'; notes?: string }): Promise<SupplierPayable> {
    const response = await apiClient.post<{ data: SupplierPayableDto }>(`/finance/supplier-payables/${id}/pay`, data);
    return mapSupplierPayableFromDto(response.data);
  },

  async getAccounts(): Promise<AccountDto[]> {
    const response = await apiClient.get<{ data: AccountDto[] }>('/finance/accounts');
    return response.data;
  },

  async createAccount(data: Partial<AccountDto>): Promise<AccountDto> {
    const response = await apiClient.post<{ data: AccountDto }>('/finance/accounts', data);
    return response.data;
  },

  async updateAccount(id: string, data: Partial<AccountDto>): Promise<AccountDto> {
    const response = await apiClient.put<{ data: AccountDto }>(`/finance/accounts/${id}`, data);
    return response.data;
  },

  async deleteAccount(id: string): Promise<void> {
    await apiClient.delete(`/finance/accounts/${id}`);
  },

  async getCashTransactions(): Promise<CashTransactionDto[]> {
    const response = await apiClient.get<{ data: CashTransactionDto[] }>('/finance/cash-transactions?include=account');
    return response.data;
  },

  async getCashBank(): Promise<{ accounts: AccountDto[]; cashTransactions: CashTransactionDto[] }> {
    const response = await apiClient.get<{ data: { accounts: AccountDto[]; cash_transactions: CashTransactionDto[] } }>('/finance/cash-bank');
    return {
      accounts: response.data.accounts,
      cashTransactions: response.data.cash_transactions,
    };
  },

  async createCashTransaction(data: CreateCashTransactionDto): Promise<CashTransactionDto> {
    const response = await apiClient.post<{ data: CashTransactionDto }>('/finance/cash-transactions', data);
    return response.data;
  },

  async cancelInvoice(id: string, reason: string): Promise<void> {
    await apiClient.post(`/finance/invoices/${id}/cancel`, { reason });
  },

  async cancelPayment(id: string, reason: string): Promise<void> {
    await apiClient.post(`/finance/payments/${id}/cancel`, { reason });
  }
};
