import { apiClient } from '../../services/api';
import { GoodsReceiptNote, PurchaseOrder, PurchaseRequest, Rfq } from '../../types';
import { 
  PurchaseOrderDto, CreatePurchaseOrderDto,
  ReturnDto, CreateReturnDto, Return, PurchaseRequestDto, CreatePurchaseRequestDto,
  GoodsReceiptNoteDto, CreateGoodsReceiptNoteDto
} from './types';
import { mapGoodsReceiptNoteFromDto, mapPurchaseOrderFromDto, mapReturnFromDto, mapPurchaseRequestFromDto, mapRfqFromDto } from './mappers';

export const purchasingApi = {
  async getPurchaseRequests(): Promise<PurchaseRequest[]> {
    const response = await apiClient.get<{ data: PurchaseRequestDto[] }>('/purchasing/purchase-requests?include=requester,items.product.unit');
    return response.data.map(mapPurchaseRequestFromDto);
  },

  async createPurchaseRequest(data: CreatePurchaseRequestDto): Promise<PurchaseRequest> {
    const payload = {
      requester_id: data.requester_id,
      request_date: data.request_date,
      required_date: data.required_date,
      department: data.department,
      notes: data.notes,
      status: 'Draft'
    };

    // Create the main PR
    const prRes = await apiClient.post<{ data: PurchaseRequestDto }>('/purchasing/purchase-requests', payload);
    const prId = prRes.data.id;

    // Create the PR Items
    if (data.items && data.items.length > 0) {
      await Promise.all(data.items.map(item => 
        apiClient.post('/purchasing/purchase-request-items', {
          purchase_request_id: prId,
          product_id: item.product_id,
          quantity: item.quantity,
          description: item.description,
          status: 'Draft'
        })
      ));
    }

    // Fetch the complete PR with relations
    const finalRes = await apiClient.get<{ data: PurchaseRequestDto }>(`/purchasing/purchase-requests/${prId}?include=requester,items.product`);
    return mapPurchaseRequestFromDto(finalRes.data);
  },

  async approvePurchaseOrder(id: string): Promise<PurchaseOrder> {
    const response = await apiClient.put<{ data: PurchaseOrderDto }>(`/purchasing/purchase-orders/${id}`, {
      status: 'ordered'
    });
    return mapPurchaseOrderFromDto(response.data);
  },

  async cancelPurchaseOrder(id: string, notes?: string): Promise<PurchaseOrder> {
    const payload: any = { reason: notes || 'Dibatalkan' };
    const response = await apiClient.post<{ data: PurchaseOrderDto }>(`/purchasing/purchase-orders/${id}/cancel`, payload);
    return mapPurchaseOrderFromDto(response.data);
  },

  async cancelPurchaseRequest(id: string, reason: string): Promise<PurchaseRequest> {
    const response = await apiClient.post<{ data: PurchaseRequestDto }>(`/purchasing/purchase-requests/${id}/cancel`, { reason });
    return mapPurchaseRequestFromDto(response.data);
  },

  async updatePurchaseRequestStatus(id: string, status: string): Promise<PurchaseRequest> {
    const response = await apiClient.put<{ data: PurchaseRequestDto }>(`/purchasing/purchase-requests/${id}`, {
      status
    });
    return mapPurchaseRequestFromDto(response.data);
  },

  async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    const response = await apiClient.get<{ data: PurchaseOrderDto[] }>('/purchasing/purchase-orders?include=supplier,items.product,salesOrder');
    return response.data.map(mapPurchaseOrderFromDto);
  },

  async getPurchaseOrder(id: string): Promise<PurchaseOrder> {
    const response = await apiClient.get<{ data: PurchaseOrderDto }>(`/purchasing/purchase-orders/${id}?include=supplier,items.product,salesOrder`);
    return mapPurchaseOrderFromDto(response.data);
  },

  async createPurchaseOrder(data: CreatePurchaseOrderDto & { rfq_id?: string; purchase_request_id?: string }): Promise<PurchaseOrder> {
    const payload = {
      supplier_id: data.supplier_id,
      po_date: data.order_date, // Note: DB uses po_date
      expected_date: data.expected_date,
      status: 'draft',
      rfq_id: data.rfq_id,
      purchase_request_id: data.purchase_request_id,
      sales_order_id: data.sales_order_id,
      total: data.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0),
      notes: data.notes
    };

    const response = await apiClient.post<{ data: PurchaseOrderDto }>('/purchasing/purchase-orders', payload);
    const poId = response.data.id;

    if (data.items && data.items.length > 0) {
      await Promise.all(data.items.map(item => 
        apiClient.post('/purchasing/purchase-order-items', {
          purchase_order_id: poId,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          description: item.description,
          subtotal: item.quantity * item.unit_price
        })
      ));
    }

    const finalRes = await apiClient.get<{ data: PurchaseOrderDto }>(`/purchasing/purchase-orders/${poId}?include=supplier,items.product,salesOrder`);
    return mapPurchaseOrderFromDto(finalRes.data);
  },

  async getGoodsReceiptNotes(): Promise<GoodsReceiptNote[]> {
    const response = await apiClient.get<{ data: GoodsReceiptNoteDto[] }>('/purchasing/receivings');
    return response.data.map(mapGoodsReceiptNoteFromDto);
  },

  async createGoodsReceiptNote(data: CreateGoodsReceiptNoteDto): Promise<GoodsReceiptNote> {
    const response = await apiClient.post<{ data: GoodsReceiptNoteDto }>('/purchasing/goods-receipts', data);
    return mapGoodsReceiptNoteFromDto(response.data);
  },

  async getReturns(): Promise<Return[]> {
    const response = await apiClient.get<{ data: ReturnDto[] }>('/returns?include=customer,supplier,sales_order.invoices,purchase_order,items.product');
    return response.data.map(mapReturnFromDto);
  },

  async createReturn(data: CreateReturnDto): Promise<Return> {
    const payload = { ...data, return_number: `RTN-${Date.now()}` };
    const response = await apiClient.post<{ data: ReturnDto }>('/returns', payload);
    const returnId = response.data.id;

    const finalRes = await apiClient.get<{ data: ReturnDto }>(`/returns/${returnId}?include=customer,supplier,sales_order.invoices,purchase_order,items.product`);
    return mapReturnFromDto(finalRes.data);
  },

  async updateReturnQcStatus(id: string, qcStatus: string, allowBackorder?: boolean): Promise<Return> {
    const payload: any = { qc_status: qcStatus };
    if (allowBackorder) {
      payload.allow_backorder = true;
    }
    const response = await apiClient.put<{ data: ReturnDto }>(`/returns/${id}`, payload);
    return mapReturnFromDto(response.data);
  },

  async refundReturn(id: string, accountId: string): Promise<void> {
    await apiClient.post(`/returns/${id}/refund`, { account_id: accountId });
  },

  async deleteReturn(id: string): Promise<void> {
    await apiClient.delete(`/returns/${id}`);
  },

  async getRfqs(): Promise<Rfq[]> {
    const response = await apiClient.get<{ data: any[] }>('/purchasing/rfqs?include=supplier,items.product.unit,purchaseRequest');
    return response.data.map(mapRfqFromDto);
  },

  async createRfq(data: any): Promise<any> {
    const payload = {
      rfq_number: `RFQ-${Date.now()}`,
      purchase_request_id: data.purchase_request_id || null,
      supplier_id: data.supplier_id,
      rfq_date: data.rfq_date,
      valid_until: data.valid_until,
      status: data.status,
      notes: data.notes
    };

    const rfqRes = await apiClient.post<{ data: any }>('/purchasing/rfqs', payload);
    const rfqId = rfqRes.data.id;

    if (data.items && data.items.length > 0) {
      await Promise.all(data.items.map((item: any) => 
        apiClient.post('/purchasing/rfq-items', {
          rfq_id: rfqId,
          product_id: item.product_id || null,
          description: item.description || null,
          quantity: item.quantity,
          quoted_unit_price: item.quoted_unit_price,
          subtotal: item.subtotal
        })
      ));
    }

    const finalRes = await apiClient.get<{ data: any }>(`/purchasing/rfqs/${rfqId}?include=supplier,items.product`);
    const { mapRfqFromDto } = await import('./mappers');
    return mapRfqFromDto(finalRes.data);
  },

  async updateRfqStatus(id: string, status: string): Promise<any> {
    const response = await apiClient.put<{ data: any }>(`/purchasing/rfqs/${id}`, {
      status
    });
    const { mapRfqFromDto } = await import('./mappers');
    return mapRfqFromDto(response.data);
  },

  async cancelRfq(id: string, reason: string): Promise<any> {
    const response = await apiClient.post<{ data: any }>(`/purchasing/rfqs/${id}/cancel`, { reason });
    const { mapRfqFromDto } = await import('./mappers');
    return mapRfqFromDto(response.data);
  }
};
