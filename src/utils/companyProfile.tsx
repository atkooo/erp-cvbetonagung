export interface CompanyProfile {
  name: string;
  address: string;
  phone: string;
  email: string;
  taxRate: number;
  logoUrl?: string;
}

const defaultProfile: CompanyProfile = {
  name: import.meta.env.VITE_APP_NAME || 'Lintara Digital',
  address: 'Jl. Raya Sukomanunggal Jaya No. 12, Kel. Sukomanunggal,\nKec. Sukomanunggal, Surabaya, Jawa Timur 60188',
  phone: '(031) 7328999',
  email: 'finance@betonagung.co.id',
  taxRate: 11,
};

import { systemApi } from '../services/api';

export function getCompanyProfile(): CompanyProfile {
  const stored = localStorage.getItem('erp_company_profile');
  if (stored) {
    try {
      return { ...defaultProfile, ...JSON.parse(stored) };
    } catch (e) {
      console.error('Failed to parse company profile', e);
    }
  }
  return defaultProfile;
}

export async function fetchCompanyProfileFromServer() {
  try {
    const settings = await systemApi.getSettings();
    if (Object.keys(settings).length > 0) {
      const profile: Partial<CompanyProfile> = {
        name: settings['company.name'],
        address: settings['company.address'],
        phone: settings['company.phone'],
        email: settings['company.email'],
        taxRate: settings['company.taxRate'] ? parseFloat(settings['company.taxRate']) : undefined,
        logoUrl: settings['company.logoUrl']
      };
      
      // Clean up undefined values
      Object.keys(profile).forEach(key => profile[key as keyof CompanyProfile] === undefined && delete profile[key as keyof CompanyProfile]);
      
      const current = getCompanyProfile();
      const updated = { ...current, ...profile };
      localStorage.setItem('erp_company_profile', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('erp_company_profile_updated'));
    }
  } catch (err) {
    console.error('Failed to fetch company profile from server', err);
  }
}

export async function saveCompanyProfile(profile: Partial<CompanyProfile>) {
  const current = getCompanyProfile();
  const updated = { ...current, ...profile };
  
  // Save to local storage first for immediate UI update
  localStorage.setItem('erp_company_profile', JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('erp_company_profile_updated'));
  
  // Sync to server
  try {
    await systemApi.saveSettings({
      'company.name': updated.name,
      'company.address': updated.address,
      'company.phone': updated.phone,
      'company.email': updated.email,
      'company.taxRate': updated.taxRate.toString(),
      'company.logoUrl': updated.logoUrl || ''
    });
  } catch (err) {
    console.error('Failed to save company profile to server', err);
  }
}

export function formatAddressForPrint(address: string): React.ReactNode {
  return address.split('\n').map((line, i) => (
    <span key={i}>
      {line}
      <br />
    </span>
  ));
}
