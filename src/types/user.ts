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
  owner?: { email: string };
  creationDate: string;
  status: CompanyStatus;
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
