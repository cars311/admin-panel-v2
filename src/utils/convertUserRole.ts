import { UserRole } from '../types/user';

const userRoles: Record<string, string> = {
  admin: 'System Admin',
  company_owner: 'Company Owner',
  company_manager: 'Company Admin',
  billing_manager: 'Billing Manager',
  sales_manager: 'Sales Manager',
  user: 'Sales Representative',
};

export const convertUserRole = (role: UserRole | string): string =>
  userRoles[role] || role;
