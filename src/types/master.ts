/** Domain types: Master Data (Customer, Supplier) */

export interface Customer {
  id: string;
  code: string;
  name: string;
  phone: string;
  city: string;
  address: string;
  email: string;
  status: 'Aktif' | 'Nonaktif';
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  contactName: string;
  phone: string;
  city: string;
  address: string;
  status: 'Aktif' | 'Nonaktif';
}
