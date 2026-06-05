import { apiClient } from '../../services/api';
import { PurchaseOrder } from '../../types';
import { 
  PurchaseOrderDto, CreatePurchaseOrderDto, ReceivePurchaseOrderDto,
  ReturnDto, CreateReturnDto, Return 
} from './types';
import { mapPurchaseOrderFromDto, mapReturnFromDto } from './mappers';

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
  },

  async getReturns(): Promise<Return[]> {
    const response = await apiClient.get<{ data: ReturnDto[] }>('/purchasing/returns?include=customer,supplier,sales_order,purchase_order,items.product');
    return response.data.map(mapReturnFromDto);
  },

  async createReturn(data: CreateReturnDto): Promise<Return> {
    const response = await apiClient.post<{ data: ReturnDto }>('/purchasing/returns', data);
    return mapReturnFromDto(response.data);
  },

  async updateReturnQcStatus(id: string, qc_status: string): Promise<Return> {
    const response = await apiClient.put<{ data: ReturnDto }>(`/purchasing/returns/${id}`, {
      qc_status
    });
    return mapReturnFromDto(response.data);
  }
};

