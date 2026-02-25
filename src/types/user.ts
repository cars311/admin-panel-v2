export const UserRole = {
  Admin: 'admin',
  CompanyOwner: 'company_owner',
  CompanyManager: 'company_manager',
  CompanyBillingManager: 'billing_manager',
  SalesManager: 'sales_manager',
  User: 'user',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export type UserStatus = 'invited' | 'active' | 'deactivated';

export interface CompanyUser {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  roles: UserRole[];
  lastLogin: string;
  activatedAt: string;
  createdAt: string;
  updatedAt: string;
  billingStartAt: string;
  status: UserStatus;
  isTrial: boolean;
  trialDays: number;
  companyName?: string;
}

export interface CompanyUserActivity {
  _id: string;
  companyId: string;
  companyName: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  lastLogin: string;
  billingStartAt: string;
  deactivatedAt: string;
  date: string;
  quotesCount: number;
  dealsCount: number;
}

export interface CompanyI {
  _id: string;
  name: string;
  ownerEmail: string;
  owner?: { _id: string; email: string; firstName: string; lastName: string; phone: string };
  creationDate: string;
  status: CompanyStatus;
}

export interface CompanyDetails {
  _id: string;
  name: string;
  nameOnDisclosure: string;
  status: CompanyStatus;
  type: string;
  licensed_seats: number;
  phone: string;
  billingName: string;
  billingAddress: string;
  billingAddressTwo: string;
  billingCity: string;
  billingState: string;
  billingZipCode: string;
  billingTaxId: string;
  billingEmail: string;
  billingCountry: string;
  soldToName: string;
  soldToAddress: string;
  soldToAddressTwo: string;
  soldToCity: string;
  soldToState: string;
  soldToZipCode: string;
  soldToTaxId: string;
  soldToEmail: string;
  soldToCountry: string;
  dealerData?: {
    dealerName: string;
    dealerLegalName: string;
    dealerId: string;
    defaultMake: string;
    state: string;
    region: string;
    regionCode: string;
    area: string;
    areaCode: string;
    county: string;
    city: string;
    zip: string;
    address: string;
    phone: string;
  };
  brokerData?: {
    brokerName: string;
    brokerLegalName: string;
    brokerId: string;
    defaultMake: string;
  };
  emailRecipients: { _id: string; email: string; name: string }[];
  owner?: { _id: string; email: string; firstName: string; lastName: string; phone: string };
  createdAt: string;
  updatedAt: string;
}

export const CompanyStatus = {
  ACTIVE_TRIAL: 'Active Trial',
  ACTIVE_BILLING: 'Active Billing',
  DEACTIVATED: 'Deactivated',
} as const;

export type CompanyStatus = (typeof CompanyStatus)[keyof typeof CompanyStatus];

export interface CompanyUsersRes {
  companies: CompanyI[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export interface UsersRes {
  users: CompanyUser[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export interface UsersActivityViewDto {
  user: {
    _id: string;
    companyId: {
      _id: string;
      name: string;
    };
    firstName: string;
    lastName: string;
    username: string;
    status: string;
    lastLogin: string;
    billingStartAt: string;
    email: string;
    deactivatedAt: string;
  };
  quotes: {
    _id: string;
    quotesCount?: number;
    dealsCount?: number;
  }[];
  deals: {
    _id: string;
    dealsCount?: number;
    quotesCount?: number;
  }[];
}
