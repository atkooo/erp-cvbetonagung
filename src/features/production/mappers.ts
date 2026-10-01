import { ProductionWorkOrder, ProductionWorkLog, Bom, BomItem } from '../../types';
import { ProductionWorkOrderTask } from '../../types/production';
import { ProductionWorkOrderDto, ProductionWorkLogDto, BomDto, BomItemDto, ProductionWorkOrderTaskDto } from './types';

export const mapWorkLogFromDto = (dto: ProductionWorkLogDto): ProductionWorkLog => ({
  id: dto.id,
  workOrderId: dto.work_order_id,
  employeeId: dto.employee_id || undefined,
  employeeName: dto.employee?.name || 'Unknown Worker',
  workDate: dto.work_date ? dto.work_date.split('T')[0] : '',
  stage: dto.stage,
  madeQty: Number(dto.made_qty),
  rejectQty: Number(dto.reject_qty),
  okQty: Number(dto.ok_qty),
  pieceRate: Number(dto.piece_rate),
  notes: dto.notes || undefined,
  verifiedBy: dto.verified_by || undefined,
  verifiedAt: dto.verified_at || undefined,
});

export const mapWorkOrderTaskFromDto = (dto: ProductionWorkOrderTaskDto): ProductionWorkOrderTask => ({
  id: dto.id,
  workOrderId: dto.work_order_id,
  taskCode: dto.task_code,
  taskName: dto.task_name,
  status: dto.status,
  assignedTo: dto.assigned_to || undefined,
  assignedEmployeeName: dto.assigned_employee?.name || undefined,
  targetQty: Number(dto.target_qty),
  completedQty: Number(dto.completed_qty),
  rejectQty: Number(dto.reject_qty),
  sequence: Number(dto.sequence),
});

export const mapWorkOrderFromDto = (dto: ProductionWorkOrderDto): ProductionWorkOrder => ({
  id: dto.id,
  workOrderNumber: dto.work_order_number,
  productId: dto.product_id,
  productName: dto.product?.name || 'Unknown Product',
  productSku: dto.product?.sku || '',
  salesOrderId: dto.sales_order_id || undefined,
  salesOrderNumber: dto.sales_order?.order_number || undefined,
  customerName: dto.sales_order?.customer?.name || undefined,
  projectId: dto.project_id || undefined,
  projectName: dto.project?.name || undefined,
  stockProductionRequestId: dto.stock_production_request_id || undefined,
  stockProductionRequestNumber: dto.stock_production_request?.request_number || undefined,
  sourceLabel: dto.source_label || undefined,
  stage: dto.stage,
  targetQty: Number(dto.target_qty),
  completedQty: Number(dto.completed_qty),
  progress: Number(dto.progress),
  dueDate: dto.due_date ? dto.due_date.split('T')[0] : undefined,
  logs: (dto.logs || []).map(mapWorkLogFromDto),
  tasks: (dto.tasks || []).map(mapWorkOrderTaskFromDto),
});

export const mapStockProductionRequestFromDto = (dto: any): any => ({
  id: dto.id,
  requestNumber: dto.request_number,
  storageLocationId: dto.storage_location_id || undefined,
  storageLocationName: dto.storage_location?.name || undefined,
  requestedBy: dto.requested_by || undefined,
  requestedByName: dto.requested_by_user?.name || undefined,
  approvedBy: dto.approved_by || undefined,
  requestDate: dto.request_date ? dto.request_date.split('T')[0] : '',
  dueDate: dto.due_date ? dto.due_date.split('T')[0] : undefined,
  status: dto.status,
  notes: dto.notes || undefined,
  items: (dto.items || []).map((i: any) => ({
    id: i.id,
    stockProductionRequestId: i.stock_production_request_id,
    productId: i.product_id,
    productName: i.product?.name || 'Item',
    productSku: i.product?.sku || '',
    targetQty: Number(i.target_qty),
    completedQty: Number(i.completed_qty || 0),
    notes: i.notes || undefined,
  })),
  workOrders: (dto.work_orders || []).map(mapWorkOrderFromDto),
});

export const mapBomItemFromDto = (dto: BomItemDto): BomItem => ({
  id: dto.id,
  bomId: dto.bom_id,
  componentProductId: dto.component_product_id || undefined,
  componentSku: dto.component_product?.sku || '',
  componentName: dto.component_product?.name || dto.component_name || 'Unknown Component',
  quantity: Number(dto.quantity),
  unitCode: dto.unit?.code || 'pcs',
  unitCost: Number(dto.unit_cost),
  subtotal: Number(dto.subtotal),
});

export const mapBomFromDto = (dto: BomDto): Bom => ({
  id: dto.id,
  productId: dto.product_id,
  productName: dto.product?.name || 'Unknown Product',
  productSku: dto.product?.sku || '',
  version: dto.version,
  effectiveFrom: dto.effective_from ? dto.effective_from.split('T')[0] : undefined,
  status: dto.status,
  totalCost: Number(dto.total_cost),
  items: (dto.items || []).map(mapBomItemFromDto),
});
