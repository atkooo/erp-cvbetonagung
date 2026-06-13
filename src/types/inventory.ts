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
