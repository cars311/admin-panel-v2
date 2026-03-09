import api from '../api';

export interface ZipCodeResult {
  id: string;
  state: string;
  city: string;
  county: string;
  inCity: boolean;
  marketId: number;
  zip: string;
}

export const searchByZipCode = async (zipCode: string): Promise<ZipCodeResult[]> => {
  try {
    const response = await api.post<ZipCodeResult[]>('/market-scan-address/tax-records-by-zip', { zip: zipCode });
    return response.data;
  } catch {
    return [];
  }
};
