import { apiClient } from '../../services/api';
import { 
  ProductStockDto, StockMovementDto, MovementFormData,
  StockOpnameSessionDto, StockOpnameItemDto, ApprovalRequestDto,
  StockOpnameSession, StockOpnameItem, ApprovalRequest
} from './types';
import { StockMovement } from '../../types';
import { 
  mapStockMovementFromDto, mapMovementToDto,
  mapStockOpnameSessionFromDto, mapStockOpnameItemFromDto, mapApprovalRequestFromDto
} from './mappers';

const STOCK_OPNAME_ITEM_PAGE_SIZE = 100;

export const inventoryApi = {
  // Product Stocks
  async getProductStocks(): Promise<ProductStockDto[]> {
    const response = await apiClient.get<{ data: ProductStockDto[] }>('/inventory/stocks');
    return response.data;
  },

  async updateProductStock(productId: string, locationId: string, quantity: number): Promise<void> {
    await apiClient.post('/inventory/product-stocks', {
      product_id: productId,
      location_id: locationId,
      quantity
    });
  },

  // Stock Movements
  async getStockMovements(): Promise<StockMovement[]> {
    const response = await apiClient.get<{ data: StockMovementDto[] }>('/inventory/stock-movements?include=product,handledBy&sort=-movement_at');
    return response.data.map(mapStockMovementFromDto);
  },

  async getStockIns(): Promise<StockMovement[]> {
    const response = await apiClient.get<{ data: StockMovementDto[] }>('/inventory/stock-ins');
    return response.data.map(mapStockMovementFromDto);
  },

  async getStockOuts(): Promise<StockMovement[]> {
    const response = await apiClient.get<{ data: StockMovementDto[] }>('/inventory/stock-outs');
    return response.data.map(mapStockMovementFromDto);
  },

  async transferStock(data: {
    product_id: string;
    from_location_id: string;
    to_location_id: string;
    quantity: number;
    notes?: string;
  }): Promise<void> {
    await apiClient.post('/inventory/stock-movements', {
      product_id: data.product_id,
      from_location_id: data.from_location_id,
      to_location_id: data.to_location_id,
      type: 'transfer',
      quantity: data.quantity,
      notes: data.notes || 'Transfer stok antar rak',
      movement_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    });
  },

  async receiveGoods(data: MovementFormData): Promise<void> {
    await apiClient.post('/inventory/stock-movements', {
      product_id: data.product_id,
      to_location_id: data.location_id,
      type: 'in',
      quantity: data.quantity,
      reference_type: data.reference_type,
      reference_number: data.reference_number,
      notes: data.notes,
      movement_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    });
  },

  async issueGoods(data: MovementFormData): Promise<void> {
    await apiClient.post('/inventory/stock-movements', {
      product_id: data.product_id,
      from_location_id: data.location_id,
      type: 'out',
      quantity: data.quantity,
      reference_type: data.reference_type,
      reference_number: data.reference_number,
      notes: data.notes,
      movement_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    });
  },

  // Stock Opname
  async getStockOpnameSessions(): Promise<StockOpnameSession[]> {
    const response = await apiClient.get<{ data: StockOpnameSessionDto[] }>('/inventory/stock-opname-sessions?include=warehouse,startedBy');
    return response.data.map(mapStockOpnameSessionFromDto);
  },

  async getStockOpnameItems(sessionId: string): Promise<StockOpnameItem[]> {
    const firstParams = new URLSearchParams({
      session_id: sessionId,
      per_page: String(STOCK_OPNAME_ITEM_PAGE_SIZE),
      sort: '-created_at',
    });
    const firstResponse = await apiClient.get<{
      data: StockOpnameItemDto[];
      meta?: { current_page: number; last_page: number };
    }>(`/inventory/stock-opname-items?${firstParams.toString()}`);
    const items = [...firstResponse.data];
    const lastPage = firstResponse.meta?.last_page || 1;

    for (let page = 2; page <= lastPage; page += 1) {
      const params = new URLSearchParams({
        session_id: sessionId,
        per_page: String(STOCK_OPNAME_ITEM_PAGE_SIZE),
        page: String(page),
        sort: '-created_at',
      });
      const response = await apiClient.get<{ data: StockOpnameItemDto[] }>(
        `/inventory/stock-opname-items?${params.toString()}`
      );
      items.push(...response.data);
    }

    return items.map(mapStockOpnameItemFromDto);
  },

  async createStockOpnameSession(data: { warehouse_id: string; notes?: string }): Promise<StockOpnameSession> {
    const opname_number = `OPN-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const response = await apiClient.post<{ data: StockOpnameSessionDto }>('/inventory/stock-opname-sessions', {
      ...data,
      opname_number,
      status: 'draft',
      started_at: new Date().toISOString(),
    });
    return mapStockOpnameSessionFromDto(response.data);
  },

  async updateStockOpnameSessionStatus(id: string, status: 'draft' | 'in_progress' | 'closed' | 'cancelled'): Promise<StockOpnameSession> {
    const response = await apiClient.put<{ data: StockOpnameSessionDto }>(`/inventory/stock-opname-sessions/${id}`, {
      status
    });
    return mapStockOpnameSessionFromDto(response.data);
  },

  async createStockOpnameItem(data: {
    session_id: string;
    product_id: string;
    location_id: string;
    system_qty: number;
    physical_qty: number;
    difference_qty: number;
    notes?: string;
  }): Promise<StockOpnameItem> {
    const response = await apiClient.post<{ data: StockOpnameItemDto }>('/inventory/stock-opname-items', data);
    return mapStockOpnameItemFromDto(response.data);
  },

  async updateStockOpnameItem(id: string, data: Partial<{ physical_qty: number; difference_qty: number; notes: string; approval_request_id: string }>): Promise<StockOpnameItem> {
    const response = await apiClient.put<{ data: StockOpnameItemDto }>(`/inventory/stock-opname-items/${id}`, data);
    return mapStockOpnameItemFromDto(response.data);
  },

  async adjustStockOpnameItem(id: string, notes?: string): Promise<StockOpnameItem> {
    const response = await apiClient.post<{ data: StockOpnameItemDto }>(`/inventory/stock-opname-items/${id}/adjust`, {
      movement_at: new Date().toISOString().split('T')[0],
      notes: notes || 'Stock opname adjustment',
    });
    return mapStockOpnameItemFromDto(response.data);
  },

  // Approval Requests
  async getApprovalRequests(): Promise<ApprovalRequest[]> {
    const response = await apiClient.get<{ data: ApprovalRequestDto[] }>('/inventory/approval-requests?include=requester,approver&sort=-requested_at&per_page=1000');
    return response.data.map(mapApprovalRequestFromDto);
  },

  async updateApprovalRequest(id: string, status: 'approved' | 'rejected', notes?: string): Promise<ApprovalRequest> {
    const response = await apiClient.put<{ data: ApprovalRequestDto }>(`/inventory/approval-requests/${id}`, {
      status,
      decision_notes: notes || '',
      decided_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
    });
    return mapApprovalRequestFromDto(response.data);
  },

  async createApprovalRequest(data: {
    request_type: string;
    reference_type: string;
    reference_id: string;
    reference_number?: string;
    change_summary: string;
    amount?: number;
  }): Promise<ApprovalRequest> {
    const approval_number = `APP-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const response = await apiClient.post<{ data: ApprovalRequestDto }>('/inventory/approval-requests', {
      ...data,
      approval_number,
      status: 'pending',
      requested_at: new Date().toISOString(),
    });
    return mapApprovalRequestFromDto(response.data);
  },
};
