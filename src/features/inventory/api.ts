import { apiClient } from '../../services/api';
import { ProductStockDto, StockMovementDto, MovementFormData } from './types';
import { StockMovement } from '../../types';
import { mapStockMovementFromDto, mapMovementToDto } from './mappers';

export const inventoryApi = {
  // Product Stocks
  async getProductStocks(): Promise<ProductStockDto[]> {
    const response = await apiClient.get<{ data: ProductStockDto[] }>('/inventory/product-stocks?include=product,location');
    return response.data;
  },

  // Stock Movements
  async getStockMovements(): Promise<StockMovement[]> {
    const response = await apiClient.get<{ data: StockMovementDto[] }>('/inventory/stock-movements?include=product,handledBy&sort=-movement_at');
    return response.data.map(mapStockMovementFromDto);
  },

  async receiveGoods(data: MovementFormData): Promise<void> {
    const payload = mapMovementToDto(data);
    await apiClient.post('/inventory/movements/in', payload);
  },

  async issueGoods(data: MovementFormData): Promise<void> {
    const payload = mapMovementToDto(data);
    await apiClient.post('/inventory/movements/out', payload);
  },
};
