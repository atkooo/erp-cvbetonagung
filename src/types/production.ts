/** Domain types: Production (Work Orders, BOM) */

export interface ProductionWorkLog {
  id: string;
  workOrderId: string;
  employeeId?: string;
  employeeName?: string;
  workDate: string;
  stage: string;
  madeQty: number;
  rejectQty: number;
  okQty: number;
  pieceRate: number;
  notes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface ProductionWorkOrderTask {
  id: string;
  workOrderId: string;
  taskCode: string;
  taskName: string;
  status: string;
  assignedTo?: string;
  assignedEmployeeName?: string;
  targetQty: number;
  completedQty: number;
  rejectQty: number;
  sequence: number;
}

export interface ProductionWorkOrder {
  id: string;
  workOrderNumber: string;
  productId: string;
  productName?: string;
  productSku?: string;
  salesOrderId?: string;
  salesOrderNumber?: string;
  customerName?: string;
  projectId?: string;
  projectName?: string;
  stockProductionRequestId?: string;
  stockProductionRequestNumber?: string;
  sourceLabel?: string;
  stage: string;
  targetQty: number;
  completedQty: number;
  progress: number;
  dueDate?: string;
  logs?: ProductionWorkLog[];
  tasks?: ProductionWorkOrderTask[];
}

export interface StockProductionRequestItem {
  id: string;
  stockProductionRequestId: string;
  productId: string;
  productName?: string;
  productSku?: string;
  targetQty: number;
  completedQty: number;
  notes?: string;
}

export interface StockProductionRequest {
  id: string;
  requestNumber: string;
  storageLocationId?: string;
  storageLocationName?: string;
  requestedBy?: string;
  requestedByName?: string;
  approvedBy?: string;
  requestDate: string;
  dueDate?: string;
  status: 'draft' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  items?: StockProductionRequestItem[];
  workOrders?: ProductionWorkOrder[];
}

export interface BomItem {
  id: string;
  bomId: string;
  componentProductId?: string;
  componentSku?: string;
  componentName?: string;
  quantity: number;
  unitCode?: string;
  unitCost: number;
  subtotal: number;
}

export interface Bom {
  id: string;
  productId: string;
  productName?: string;
  productSku?: string;
  version: string;
  effectiveFrom?: string;
  status: 'active' | 'inactive';
  totalCost: number;
  items?: BomItem[];
}
