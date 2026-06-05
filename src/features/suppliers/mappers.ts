import { SupplierDto, SupplierFormData } from './types';
import { Supplier } from '../../types';

export const mapSupplierFromDto = (dto: SupplierDto): Supplier => ({
  id: dto.id,
  code: dto.code,
  name: dto.name,
  contactName: dto.contact_name || '',
  phone: dto.phone || '',
  address: dto.address || '',
  city: dto.city || '',
  status: dto.status === 'active' ? 'Aktif' : 'Nonaktif',
});

export const mapSupplierToDto = (formData: SupplierFormData): Partial<SupplierDto> => ({
  code: formData.code,
  name: formData.name,
  contact_name: formData.contact_name,
  phone: formData.phone,
  city: formData.city,
  address: formData.address,
  status: formData.status,
});
