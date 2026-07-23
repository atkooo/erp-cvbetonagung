/** Domain types: Inventory & Stock Movements */

export interface StockMovement {
  id: string;
  sku: string;
  productName: string;
  type: 'Masuk' | 'Keluar';
  quantity: number;
  referenceDoc: string;
  date: string;
  handler: string;
  notes: string;
}

export interface BagItem {
  id: string;
  bag_id: string;
  product_id: string;
  quantity: number;
  notes?: string;
  product?: {
    id: string;
    name: string;
    sku: string;
  };
}

export interface Bag {
  id: string;
  bag_number: string;
  date: string;
  warehouse_id: string;
  location_id?: string;
  type: 'in' | 'out' | 'adjustment';
  reason_code?: string;
  notes?: string;
  status: string;
  created_by?: string;
  approved_by?: string;
  approved_at?: string;
  items?: BagItem[];
  warehouse?: {
    id: string;
    name: string;
  };
  location?: {
    id: string;
    name: string;
  };
  createdBy?: {
    id: string;
    name: string;
  };
  approvedBy?: {
    id: string;
    name: string;
  };
}
