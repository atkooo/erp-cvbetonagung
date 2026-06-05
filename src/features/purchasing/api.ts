import { apiClient } from '../../services/api';
import { PurchaseOrder } from '../../types';
import { PurchaseOrderDto, CreatePurchaseOrderDto, ReceivePurchaseOrderDto } from './types';
import { mapPurchaseOrderFromDto } from './mappers';

export const purchasingApi = {
  async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    const response = await apiClient.get<{ data: PurchaseOrderDto[] }>('/purchasing/purchase-orders?include=supplier,items.product');
    return response.data.map(mapPurchaseOrderFromDto);
  },

  async createPurchaseOrder(data: CreatePurchaseOrderDto): Promise<PurchaseOrder> {
    const response = await apiClient.post<{ data: PurchaseOrderDto }>('/purchasing/purchase-orders', data);
    return mapPurchaseOrderFromDto(response.data);
  },

  async receivePurchaseOrder(id: string, data: ReceivePurchaseOrderDto): Promise<PurchaseOrder> {
    const response = await apiClient.post<{ data: PurchaseOrderDto }>(`/purchasing/purchase-orders/${id}/receive`, data);
    return mapPurchaseOrderFromDto(response.data);
  }
};
