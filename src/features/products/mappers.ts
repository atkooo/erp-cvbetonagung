import { CategoryDto, CategoryFormData, ProductDto, ProductFormData, UnitDto } from './types';
import { Category, Product } from '../../types';

export const mapCategoryFromDto = (dto: CategoryDto): Category => ({
  id: dto.id,
  name: dto.name,
  description: dto.description || '',
  itemCount: 0, // Computed from backend or derived
  status: dto.status,
});

export const mapCategoryToDto = (formData: CategoryFormData): Partial<CategoryDto> => ({
  name: formData.name,
  description: formData.description,
  status: formData.status,
});

export const mapProductFromDto = (dto: ProductDto, units: UnitDto[] = []): Product => ({
  id: dto.id,
  sku: dto.sku,
  type: dto.type,
  name: dto.name,
  category: dto.category?.name || 'Uncategorized',
  unit: dto.unit?.code || units.find((unit) => unit.id === dto.unit_id)?.code || '',
  unitId: dto.unit_id,
  stock: 0, // Product list might not return live stock by default unless eager loaded
  minStock: Number(dto.min_stock),
  sellingPrice: Number(dto.selling_price),
  costPrice: Number(dto.cost_price),
  status: dto.stock_status === 'safe' ? 'Aman' : dto.stock_status === 'low' ? 'Menipis' : 'Habis',
  qrValue: dto.qr_value || dto.sku,
  location: 'Gudang Utama',
});

export const mapProductToDto = (formData: ProductFormData): Partial<ProductDto> => ({
  sku: formData.sku,
  type: formData.type || 'finished_good',
  name: formData.name,
  category_id: formData.category_id,
  unit_id: formData.unit_id,
  cost_price: formData.cost_price.toString(),
  selling_price: formData.selling_price.toString(),
  min_stock: formData.min_stock.toString(),
  status: formData.status,
});
