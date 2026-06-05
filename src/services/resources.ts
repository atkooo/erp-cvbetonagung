import { apiClient, type ApiEnvelope, type ApiListEnvelope } from './api';

type ResourceParams = Record<string, string | number | boolean | undefined | null>;

const buildQueryString = (params: ResourceParams = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    query.set(key, String(value));
  });

  const queryString = query.toString();

  return queryString ? `?${queryString}` : '';
};

export const resourceClient = {
  list<T>(module: string, resource: string, params?: ResourceParams) {
    return apiClient.request<ApiListEnvelope<T>>(
      `/${module}/${resource}${buildQueryString(params)}`
    );
  },

  get<T>(module: string, resource: string, id: string) {
    return apiClient.request<ApiEnvelope<T>>(`/${module}/${resource}/${id}`);
  },

  create<T, P extends object>(module: string, resource: string, payload: P) {
    return apiClient.request<ApiEnvelope<T>>(`/${module}/${resource}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  update<T, P extends object>(module: string, resource: string, id: string, payload: P) {
    return apiClient.request<ApiEnvelope<T>>(`/${module}/${resource}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  delete(module: string, resource: string, id: string) {
    return apiClient.request<void>(`/${module}/${resource}/${id}`, {
      method: 'DELETE',
    });
  },
};
