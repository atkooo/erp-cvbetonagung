import { apiClient } from '../../services/api';
import { CategoryDto, CategoryFormData, ProductDto, ProductFormData, UnitDto, UnitFormData } from './types';
import { Category, Product } from '../../types';
import { mapCategoryFromDto, mapCategoryToDto, mapProductFromDto, mapProductToDto } from './mappers';

export const DEFAULT_UNITS: UnitDto[] = [
  { id: 'pcs', name: 'Pcs', code: 'pcs' },
  { id: 'sak', name: 'Sak', code: 'sak' },
  { id: 'm3', name: 'Meter Kubik', code: 'm3' },
  { id: 'kg', name: 'Kilogram', code: 'kg' },
  { id: 'lembar', name: 'Lembar', code: 'lembar' },
  { id: 'batch', name: 'Batch', code: 'batch' },
];

const normalizeListResponse = <T>(response: { data?: T[] } | T[]): T[] => {
  if (Array.isArray(response)) {
    return response;
  }

  return Array.isArray(response.data) ? response.data : [];
};

export const productsApi = {
  // Categories
  async getCategories(): Promise<Category[]> {
    const response = await apiClient.get<{ data: CategoryDto[] }>('/master-data/product-categories');
    return response.data.map(mapCategoryFromDto);
  },

  async createCategory(data: CategoryFormData): Promise<Category> {
    const response = await apiClient.post<{ data: CategoryDto }>('/master-data/product-categories', mapCategoryToDto(data));
    return mapCategoryFromDto(response.data);
  },

  async updateCategory(id: string, data: CategoryFormData): Promise<Category> {
    const response = await apiClient.put<{ data: CategoryDto }>(`/master-data/product-categories/${id}`, mapCategoryToDto(data));
    return mapCategoryFromDto(response.data);
  },

  async deleteCategory(id: string): Promise<void> {
    await apiClient.delete(`/master-data/product-categories/${id}`);
  },

  // Units
  async getUnits(): Promise<UnitDto[]> {
    const response = await apiClient.get<{ data?: UnitDto[] } | UnitDto[]>('/master-data/units');
    return normalizeListResponse(response);
  },

  async createUnit(data: UnitFormData): Promise<UnitDto> {
    const response = await apiClient.post<{ data: UnitDto }>('/master-data/units', data);
    return response.data;
  },

  async updateUnit(id: string, data: UnitFormData): Promise<UnitDto> {
    const response = await apiClient.put<{ data: UnitDto }>(`/master-data/units/${id}`, data);
    return response.data;
  },

  async deleteUnit(id: string): Promise<void> {
    await apiClient.delete(`/master-data/units/${id}`);
  },

  // Products
  async getProducts(): Promise<Product[]> {
    const [productsResponse, units] = await Promise.all([
      apiClient.get<{ data: ProductDto[] }>('/master/products'),
      productsApi.getUnits(),
    ]);
    return productsResponse.data.map((product) => mapProductFromDto(product, units));
  },

  async getProduct(id: string): Promise<Product> {
    const [productResponse, units] = await Promise.all([
      apiClient.get<{ data: ProductDto }>(`/master-data/products/${id}`),
      productsApi.getUnits(),
    ]);
    return mapProductFromDto(productResponse.data, units);
  },

  async createProduct(data: ProductFormData): Promise<Product> {
    const [response, units] = await Promise.all([
      apiClient.post<{ data: ProductDto }>('/master-data/products', mapProductToDto(data)),
      productsApi.getUnits(),
    ]);
    return mapProductFromDto(response.data, units);
  },

  async updateProduct(id: string, data: ProductFormData): Promise<Product> {
    const [response, units] = await Promise.all([
      apiClient.put<{ data: ProductDto }>(`/master-data/products/${id}`, mapProductToDto(data)),
      productsApi.getUnits(),
    ]);
    return mapProductFromDto(response.data, units);
  },

  async deleteProduct(id: string): Promise<void> {
    await apiClient.delete(`/master-data/products/${id}`);
  },
};
