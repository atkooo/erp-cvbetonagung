import { ProductDto } from '../products/types';

export interface LocationDto {
  id: string;
  name: string;
  code: string;
  warehouse_id?: string;
  description?: string | null;
}

export interface ProductStockDto {
  id: string;
  product_id: string;
  location_id: string;
  quantity: string | number;
  product?: ProductDto;
  location?: LocationDto;
}

export interface StockMovementDto {
  id: string;
  product_id: string;
  from_location_id: string | null;
  to_location_id: string | null;
  type: 'in' | 'out' | 'transfer' | 'adjustment';
  quantity: string | number;
  reference_type: string | null;
  reference_number: string | null;
  movement_at: string;
  notes: string | null;
  handled_by: string | null;
  product?: ProductDto;
  handledBy?: { name: string };
  created_at?: string;
}

export interface MovementFormData {
  product_id: string;
  quantity: number;
  location_id: string;
  reference_type?: string;
  reference_number?: string;
  notes?: string;
}

export interface StockOpnameSessionDto {
  id: string;
  opname_number: string;
  warehouse_id: string;
  started_by: string | null;
  status: 'draft' | 'in_progress' | 'completed' | 'canceled' | 'closed';
  started_at: string;
  closed_at: string | null;
  notes: string | null;
  warehouse?: { id: string; name: string; code: string };
  started_by_user?: { id: string; name: string };
}

export interface ApprovalRequestDto {
  id: string;
  approval_number: string;
  request_type: string;
  requester_id: string;
  approver_id: string | null;
  reference_type: string;
  reference_id: string;
  reference_number: string | null;
  change_summary: string | null;
  amount: string | number | null;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  decided_at: string | null;
  decision_notes: string | null;
  requester?: { id: string; name: string };
  approver?: { id: string; name: string };
}

export interface StockOpnameItemDto {
  id: string;
  session_id: string;
  product_id: string;
  location_id: string;
  system_qty: string | number;
  physical_qty: string | number;
  difference_qty: string | number;
  notes: string | null;
  approval_request_id: string | null;
  is_adjusted?: boolean;
  session?: StockOpnameSessionDto;
  product?: ProductDto;
  location?: LocationDto;
  approval_request?: ApprovalRequestDto;
}

// React Interfaces
export interface StockOpnameSession {
  id: string;
  opnameNumber: string;
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  startedBy: string;
  status: 'draft' | 'in_progress' | 'completed' | 'canceled' | 'closed';
  startedAt: string;
  closedAt: string | null;
  notes: string;
}

export interface StockOpnameItem {
  id: string;
  sessionId: string;
  productId: string;
  sku: string;
  productName: string;
  locationId: string;
  locationName: string;
  systemQty: number;
  physicalQty: number;
  differenceQty: number;
  notes: string;
  approvalRequestId: string | null;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  isAdjusted?: boolean;
}

export interface ApprovalRequest {
  id: string;
  approvalNumber: string;
  requestType: string;
  requesterName: string;
  approverName: string;
  referenceType: string;
  referenceId: string;
  referenceNumber: string;
  changeSummary: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  decidedAt: string | null;
  decisionNotes: string;
}

