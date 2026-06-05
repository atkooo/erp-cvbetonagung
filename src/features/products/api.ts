import { apiClient } from '../../services/api';
import { CategoryDto, CategoryFormData, ProductDto, ProductFormData, UnitDto } from './types';
import { Category, Product } from '../../types';
import { mapCategoryFromDto, mapCategoryToDto, mapProductFromDto, mapProductToDto } from './mappers';

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
    const response = await apiClient.get<{ data: UnitDto[] }>('/master-data/units');
    return response.data;
  },

  // Products
  async getProducts(): Promise<Product[]> {
    const response = await apiClient.get<{ data: ProductDto[] }>('/master-data/products');
    return response.data.map(mapProductFromDto);
  },

  async getProduct(id: string): Promise<Product> {
    const response = await apiClient.get<{ data: ProductDto }>(`/master-data/products/${id}`);
    return mapProductFromDto(response.data);
  },

  async createProduct(data: ProductFormData): Promise<Product> {
    const response = await apiClient.post<{ data: ProductDto }>('/master-data/products', mapProductToDto(data));
    return mapProductFromDto(response.data);
  },

  async updateProduct(id: string, data: ProductFormData): Promise<Product> {
    const response = await apiClient.put<{ data: ProductDto }>(`/master-data/products/${id}`, mapProductToDto(data));
    return mapProductFromDto(response.data);
  },

  async deleteProduct(id: string): Promise<void> {
    await apiClient.delete(`/master-data/products/${id}`);
  },
};
