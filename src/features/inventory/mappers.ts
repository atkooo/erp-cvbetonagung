import { 
  ProductStockDto, StockMovementDto, MovementFormData,
  StockOpnameSessionDto, StockOpnameItemDto, ApprovalRequestDto,
  StockOpnameSession, StockOpnameItem, ApprovalRequest
} from './types';
import { StockMovement } from '../../types';

export const mapStockMovementFromDto = (dto: StockMovementDto): StockMovement => ({
  id: dto.id,
  sku: dto.product?.sku || 'Unknown',
  productName: dto.product?.name || 'Unknown Product',
  type: dto.type === 'in' ? 'Masuk' : 'Keluar',
  quantity: Number(dto.quantity),
  referenceDoc: dto.reference_number || dto.reference_type || '-',
  date: dto.movement_at ? dto.movement_at.split('T')[0] : (dto.created_at?.split('T')[0] || ''),
  handler: dto.handledBy?.name || 'Sistem',
  notes: dto.notes || '-',
});

// Assuming we map it to our backend form requests
export const mapMovementToDto = (formData: MovementFormData): any => ({
  items: [
    {
      product_id: formData.product_id,
      quantity: formData.quantity,
    }
  ],
  location_id: formData.location_id,
  reference_type: formData.reference_type,
  reference_number: formData.reference_number,
  notes: formData.notes,
});

export const mapStockOpnameSessionFromDto = (dto: StockOpnameSessionDto): StockOpnameSession => ({
  id: dto.id,
  opnameNumber: dto.opname_number,
  warehouseId: dto.warehouse_id,
  warehouseName: dto.warehouse?.name || 'Unknown Warehouse',
  warehouseCode: dto.warehouse?.code || 'GDG',
  startedBy: dto.started_by_user?.name || 'Sistem',
  status: dto.status,
  startedAt: dto.started_at ? dto.started_at.split('T')[0] : '',
  closedAt: dto.closed_at ? dto.closed_at.split('T')[0] : null,
  notes: dto.notes || '',
});

export const mapStockOpnameItemFromDto = (dto: StockOpnameItemDto): StockOpnameItem => ({
  id: dto.id,
  sessionId: dto.session_id,
  productId: dto.product_id,
  sku: dto.product?.sku || 'Unknown',
  productName: dto.product?.name || 'Unknown Product',
  locationId: dto.location_id,
  locationName: dto.location?.name || 'Default',
  systemQty: Number(dto.system_qty),
  physicalQty: Number(dto.physical_qty),
  differenceQty: Number(dto.difference_qty),
  notes: dto.notes || '',
  approvalRequestId: dto.approval_request_id,
  approvalStatus: dto.approval_request?.status,
});

export const mapApprovalRequestFromDto = (dto: ApprovalRequestDto): ApprovalRequest => ({
  id: dto.id,
  approvalNumber: dto.approval_number,
  requestType: dto.request_type,
  requesterName: dto.requester?.name || 'Sistem',
  approverName: dto.approver?.name || '-',
  referenceType: dto.reference_type,
  referenceId: dto.reference_id,
  referenceNumber: dto.reference_number || '-',
  changeSummary: dto.change_summary || '',
  amount: Number(dto.amount || 0),
  status: dto.status,
  requestedAt: dto.requested_at ? dto.requested_at.replace('T', ' ').substring(0, 16) : '',
  decidedAt: dto.decided_at ? dto.decided_at.replace('T', ' ').substring(0, 16) : null,
  decisionNotes: dto.decision_notes || '',
});

