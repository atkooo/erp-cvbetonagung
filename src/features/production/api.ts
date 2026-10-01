import { apiClient } from '../../services/api';
import { ProductionWorkOrder, ProductionWorkLog, Bom } from '../../types';
import { 
  ProductionWorkOrderDto, 
  ProductionWorkLogDto, 
  BomDto,
  CreateWorkOrderDto,
  CreateWorkLogDto,
  CreateBomDto
} from './types';
import { 
  mapWorkOrderFromDto, 
  mapWorkLogFromDto, 
  mapBomFromDto,
  mapStockProductionRequestFromDto
} from './mappers';

export const productionApi = {
  // Work Orders
  async getWorkOrders(): Promise<ProductionWorkOrder[]> {
    const response = await apiClient.get<{ data: ProductionWorkOrderDto[] }>(
      '/production/work-orders?include=product,salesOrder,project,logs.employee'
    );
    return response.data.map(mapWorkOrderFromDto);
  },

  async createWorkOrder(data: CreateWorkOrderDto): Promise<ProductionWorkOrder> {
    const response = await apiClient.post<{ data: ProductionWorkOrderDto }>(
      '/production/work-orders',
      data
    );
    return mapWorkOrderFromDto(response.data);
  },

  async updateWorkOrder(id: string, data: any): Promise<ProductionWorkOrder> {
    const response = await apiClient.put<{ data: ProductionWorkOrderDto }>(
      `/production/work-orders/${id}`,
      data
    );
    return mapWorkOrderFromDto(response.data);
  },

  async deleteWorkOrder(id: string): Promise<void> {
    await apiClient.delete(`/production/work-orders/${id}`);
  },

  async receiveWorkOrder(id: string, data: { quantity: number; target_location_id: string; source_location_id?: string; notes?: string }): Promise<ProductionWorkOrder> {
    const response = await apiClient.post<{ data: ProductionWorkOrderDto }>(
      `/production/work-orders/${id}/receive`,
      data
    );
    return mapWorkOrderFromDto(response.data);
  },

  async cancelWorkOrder(id: string, reason: string): Promise<ProductionWorkOrder> {
    const response = await apiClient.post<{ data: ProductionWorkOrderDto }>(
      `/production/work-orders/${id}/cancel`,
      { reason }
    );
    return mapWorkOrderFromDto(response.data);
  },

  // Work Logs
  async createWorkLog(data: CreateWorkLogDto): Promise<ProductionWorkLog> {
    const response = await apiClient.post<{ data: ProductionWorkLogDto }>(
      '/production/work-logs',
      data
    );
    return mapWorkLogFromDto(response.data);
  },

  async deleteWorkLog(id: string): Promise<void> {
    await apiClient.delete(`/production/work-logs/${id}`);
  },

  // Bill of Materials (BOM)
  async getBoms(): Promise<Bom[]> {
    const response = await apiClient.get<{ data: BomDto[] }>(
      '/production/boms?include=product,items.componentProduct,items.unit'
    );
    return response.data.map(mapBomFromDto);
  },

  async createBom(data: CreateBomDto): Promise<Bom> {
    const response = await apiClient.post<{ data: BomDto }>(
      '/production/boms',
      data
    );
    return mapBomFromDto(response.data);
  },

  async updateBom(id: string, data: any): Promise<Bom> {
    const response = await apiClient.put<{ data: BomDto }>(
      `/production/boms/${id}`,
      data
    );
    return mapBomFromDto(response.data);
  },

  async deleteBom(id: string): Promise<void> {
    await apiClient.delete(`/production/boms/${id}`);
  },

  // Stock Production Requests (SPR)
  async getStockProductionRequests(): Promise<any[]> {
    const response = await apiClient.get<any>('/production/stock-production-requests');
    const items = response.data || [];
    return items.map(mapStockProductionRequestFromDto);
  },

  async createStockProductionRequest(data: any): Promise<any> {
    const response = await apiClient.post<{ message: string; data: any }>(
      '/production/stock-production-requests',
      data
    );
    return mapStockProductionRequestFromDto(response.data);
  },

  async approveStockProductionRequest(id: string): Promise<any> {
    const response = await apiClient.post<{ message: string; data: any; work_orders: any[] }>(
      `/production/stock-production-requests/${id}/approve`
    );
    return {
      request: mapStockProductionRequestFromDto(response.data),
      workOrders: (response.work_orders || []).map(mapWorkOrderFromDto),
    };
  },

  async cancelStockProductionRequest(id: string, reason: string): Promise<any> {
    const response = await apiClient.post<{ message: string; data: any }>(
      `/production/stock-production-requests/${id}/cancel`,
      { reason }
    );
    return mapStockProductionRequestFromDto(response.data);
  },
};
