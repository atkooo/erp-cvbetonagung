/** Domain types: Product & Category */

export interface Product {
  id: string;
  sku: string;
  type: 'raw_material' | 'finished_good' | 'service';
  name: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  unit: string;
  unitId?: string;
  location: string;
  minStock: number;
  status: 'Aman' | 'Menipis' | 'Habis';
  qrValue?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  itemCount: number;
  status: 'active' | 'inactive';
}

export interface QrProduct {
  sku: string;
  name: string;
  stock: number;
  qrValue: string;
}
