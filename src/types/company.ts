export const CompanyTypeEnum = {
  DEALER: 'dealer',
  BROKER: 'broker',
} as const;

export type CompanyTypeEnum = (typeof CompanyTypeEnum)[keyof typeof CompanyTypeEnum];

export const CompanyTypes = [
  { key: CompanyTypeEnum.DEALER, text: 'Dealer' },
  { key: CompanyTypeEnum.BROKER, text: 'Broker' },
];

export interface IBrokerData {
  brokerName: string;
  brokerLegalName: string;
  brokerId: string;
  defaultMake?: string;
}

export interface IDealerData {
  dealerName: string;
  dealerLegalName: string;
  dealerId: string;
  defaultMake: string;
  state?: string;
  region?: string;
  regionCode?: string;
  area?: string;
  areaCode?: string;
  county?: string;
  city?: string;
  zip?: string;
  address?: string;
  phone?: string;
}

export interface CreateCompanyBody {
  companyName: string;
  ownerEmail: string;
  ownerPhone: string;
  type: CompanyTypeEnum;
  ownerFirstName: string;
  ownerSecondName: string;
  nameOnDisclosure: string;
  billingAddress: string;
  billingCity: string;
  billingState: string;
  billingTaxId: string;
  billingEmail: string;
  billingZipCode: string;
  isTrialActive: boolean;
  trialDays: number;
  brokerData: IBrokerData;
  dealerData: IDealerData;
}

export interface CreateCompanyFormData extends CreateCompanyBody {
  isOwnerEmailValid: boolean;
  isBillingEmailValid: boolean;
}

export const companyDataDealerTypeFields: {
  fieldName: keyof IDealerData;
  label: string;
  required: boolean;
}[] = [
  { fieldName: 'dealerName', label: 'Dealer Name', required: true },
  { fieldName: 'dealerLegalName', label: 'Dealer Legal Name', required: true },
  { fieldName: 'dealerId', label: 'Dealer ID', required: true },
  { fieldName: 'defaultMake', label: 'Default Make', required: true },
  { fieldName: 'state', label: 'State', required: false },
  { fieldName: 'region', label: 'Region', required: false },
  { fieldName: 'regionCode', label: 'Region Code', required: false },
  { fieldName: 'area', label: 'Area', required: false },
  { fieldName: 'areaCode', label: 'Area Code', required: false },
  { fieldName: 'county', label: 'County', required: false },
  { fieldName: 'city', label: 'City', required: false },
  { fieldName: 'zip', label: 'ZIP', required: false },
  { fieldName: 'address', label: 'Address', required: false },
  { fieldName: 'phone', label: 'Phone', required: false },
];

export const companyDataBrokerTypeFields: {
  fieldName: keyof IBrokerData;
  label: string;
  required: boolean;
}[] = [
  { fieldName: 'brokerName', label: 'Broker Name', required: true },
  { fieldName: 'brokerLegalName', label: 'Broker Legal Name', required: true },
  { fieldName: 'brokerId', label: 'Broker ID', required: true },
  { fieldName: 'defaultMake', label: 'Default Make', required: true },
];
