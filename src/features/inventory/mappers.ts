import { ProductStockDto, StockMovementDto, MovementFormData } from './types';
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
