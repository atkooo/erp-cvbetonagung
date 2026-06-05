import { ProductionWorkOrder, ProductionWorkLog, Bom, BomItem } from '../../types';
import { ProductionWorkOrderDto, ProductionWorkLogDto, BomDto, BomItemDto } from './types';

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

export const mapWorkOrderFromDto = (dto: ProductionWorkOrderDto): ProductionWorkOrder => ({
  id: dto.id,
  workOrderNumber: dto.work_order_number,
  productId: dto.product_id,
  productName: dto.product?.name || 'Unknown Product',
  productSku: dto.product?.sku || '',
  salesOrderId: dto.sales_order_id || undefined,
  salesOrderNumber: dto.sales_order?.order_number || undefined,
  projectId: dto.project_id || undefined,
  projectName: dto.project?.name || undefined,
  sourceLabel: dto.source_label || undefined,
  stage: dto.stage,
  targetQty: Number(dto.target_qty),
  completedQty: Number(dto.completed_qty),
  progress: Number(dto.progress),
  dueDate: dto.due_date ? dto.due_date.split('T')[0] : undefined,
  logs: (dto.logs || []).map(mapWorkLogFromDto),
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
