import { apiClient } from '../../services/api';
import { toApiDate } from '../../utils/date';
import { Quotation, SalesOrder, DeliveryOrder } from '../../types';
import { QuotationDto, SalesOrderDto, DeliveryOrderDto, CreateQuotationDto, CreateSalesOrderDto } from './types';
import { mapQuotationFromDto, mapSalesOrderFromDto, mapDeliveryOrderFromDto } from './mappers';

export const salesApi = {
  async getQuotations(): Promise<Quotation[]> {
    const response = await apiClient.get<{ data: QuotationDto[] }>('/sales/quotations?include=customer,items.product');
    return response.data.map(mapQuotationFromDto);
  },

  async createQuotation(data: CreateQuotationDto): Promise<Quotation> {
    const response = await apiClient.post<{ data: QuotationDto }>('/sales/quotations', data);
    return mapQuotationFromDto(response.data);
  },

  async approveQuotation(id: string): Promise<SalesOrder> {
    const response = await apiClient.post<{ data: SalesOrderDto }>(`/sales/quotations/${id}/approve`, {
      order_date: toApiDate(),
    });
    return mapSalesOrderFromDto(response.data);
  },

  async approveSalesOrder(id: string): Promise<SalesOrder> {
    const response = await apiClient.post<{ data: SalesOrderDto }>(`/sales/sales-orders/${id}/approve`, {
      invoice_date: toApiDate(),
    });
    return mapSalesOrderFromDto(response.data);
  },

  async getSalesOrders(): Promise<SalesOrder[]> {
    const response = await apiClient.get<{ data: SalesOrderDto[] }>('/sales/orders');
    return response.data.map(mapSalesOrderFromDto);
  },

  async createSalesOrder(data: CreateSalesOrderDto): Promise<SalesOrder> {
    const response = await apiClient.post<{ data: SalesOrderDto }>('/sales/sales-orders', data);
    return mapSalesOrderFromDto(response.data);
  },

  async getDeliveryOrders(): Promise<DeliveryOrder[]> {
    const response = await apiClient.get<{ data: DeliveryOrderDto[] }>('/sales/delivery-orders?include=salesOrder,customer,items.product');
    return response.data.map(mapDeliveryOrderFromDto);
  },

  async createDeliveryOrder(
    salesOrderId: string,
    payload: { delivery_number: string; delivery_date?: string; receiver_name?: string; notes?: string }
  ): Promise<DeliveryOrder> {
    const response = await apiClient.post<{ data: DeliveryOrderDto }>(`/sales/sales-orders/${salesOrderId}/deliver`, payload);
    return mapDeliveryOrderFromDto(response.data);
  },

  async shipDeliveryOrder(
    id: string,
    payload: { from_location_id: string; handled_by?: string; notes?: string; movement_at: string }
  ): Promise<DeliveryOrder> {
    const response = await apiClient.post<{ data: DeliveryOrderDto }>(`/sales/delivery-orders/${id}/ship`, payload);
    return mapDeliveryOrderFromDto(response.data);
  },

  async updateDeliveryOrderStatus(
    id: string,
    payload: {
      status?: 'ready_to_load' | 'shipped' | 'received' | 'cancelled';
      receiver_name?: string | null;
      received_at?: string | null;
      notes?: string | null;
    }
  ): Promise<DeliveryOrder> {
    const response = await apiClient.put<{ data: DeliveryOrderDto }>(`/sales/delivery-orders/${id}`, payload);
    return mapDeliveryOrderFromDto(response.data);
  }
};
