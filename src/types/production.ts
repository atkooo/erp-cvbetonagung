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

export interface ProductionWorkOrder {
  id: string;
  workOrderNumber: string;
  productId: string;
  productName?: string;
  productSku?: string;
  salesOrderId?: string;
  salesOrderNumber?: string;
  projectId?: string;
  projectName?: string;
  sourceLabel?: string;
  stage: string;
  targetQty: number;
  completedQty: number;
  progress: number;
  dueDate?: string;
  logs?: ProductionWorkLog[];
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
