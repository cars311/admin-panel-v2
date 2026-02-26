import api from '../api';
import type {
  CompanyUserActivity,
  CompanyUsersRes,
  UsersActivityViewDto,
  UsersRes,
} from '../../types/user';
import { sortBy, groupBy, merge, capitalize } from 'lodash';
import { formatShortDateTime } from '../../utils/formatDate';

export const getAllUsers = async (
  page = 1,
  limit = 10,
  search?: string,
  status?: string,
  role?: string,
  companyType?: string,
): Promise<UsersRes> => {
  try {
    const response = await api.get('users', {
      params: { page, limit, search: search || undefined, status: status || undefined, role: role || undefined, companyType: companyType || undefined },
    });
    return response.data;
  } catch (e: any) {
    return {
      users: [],
      totalCount: 0,
      currentPage: 1,
      totalPages: 1,
    };
  }
};

export const getAllUsersActivity = async (
  selectedDays: string,
): Promise<CompanyUserActivity[]> => {
  try {
    const response = await api.get<UsersActivityViewDto[]>('users/activity', {
      params: { days: selectedDays },
    });
    const mappedUsersActivity: CompanyUserActivity[] = [];
    for (const { user, quotes, deals } of response.data) {
      const quotesAndDeals = Object.values(
        groupBy((quotes || []).concat(deals || []), '_id'),
      ).map((arr) => merge(arr[0], arr?.[1] || {}));
      for (const quoteAndDeal of sortBy(quotesAndDeals, '_id')) {
        mappedUsersActivity.push({
          _id: user._id,
          companyId: user.companyId?._id,
          companyName: user.companyId?.name || 'None',
          companyType: (user.companyId as any)?.type || '',
          billingStartAt: user.billingStartAt
            ? formatShortDateTime(user.billingStartAt)
            : 'None',
          deactivatedAt: user.deactivatedAt
            ? formatShortDateTime(user.deactivatedAt)
            : 'None',
          lastLogin: user.lastLogin
            ? formatShortDateTime(user.lastLogin)
            : 'None',
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          status: capitalize(user.status),
          date: quoteAndDeal._id,
          dealsCount: quoteAndDeal?.dealsCount ?? 0,
          quotesCount: quoteAndDeal?.quotesCount ?? 0,
        });
      }
    }
    return sortBy(mappedUsersActivity, 'date').reverse();
  } catch (e: any) {
    console.error(e);
    return [];
  }
};

export const activateUserFromCompany = async (
  userId: string,
): Promise<boolean> => {
  try {
    const response = await api.post(
      `users/by/company/activate/${userId}`,
    );
    return response.data;
  } catch (e: any) {
    return false;
  }
};

export const deactivateUserFromCompany = async (
  userId: string,
): Promise<boolean> => {
  try {
    const response = await api.post(
      `users/by/company/deactivate/${userId}`,
    );
    return response.data;
  } catch (e: any) {
    return false;
  }
};

export const findAllCompanyUsers = async (
  page = 1,
  limit = 10,
  search?: string,
  status?: string,
  type?: string,
): Promise<CompanyUsersRes> => {
  try {
    const response = await api.get('users/by/company-users', {
      params: { page, limit, search: search || undefined, status: status || undefined, type: type || undefined },
    });
    return response.data;
  } catch (e: any) {
    return {
      companies: [],
      totalCount: 0,
      currentPage: 1,
      totalPages: 1,
    };
  }
};

export const getCompanyById = async (id: string): Promise<import('../../types/user').CompanyDetails | null> => {
  try {
    const response = await api.get(`companies/${id}`);
    return response.data;
  } catch (e: any) {
    return null;
  }
};

export const getUsersByCompanyId = async (
  companyId: string,
  page = 1,
  limit = 10,
): Promise<import('../../types/user').UsersRes> => {
  try {
    const response = await api.get(`users/by/company/${companyId}`, {
      params: { page, limit },
    });
    return response.data;
  } catch (e: any) {
    return { users: [], totalCount: 0, currentPage: 1, totalPages: 1 };
  }
};

export const activateOneCompany = async (
  companyId: string,
): Promise<boolean> => {
  try {
    const response = await api.post(
      `users/by/company-users/activate/${companyId}`,
    );
    return response.data;
  } catch (e: any) {
    return false;
  }
};

export const deactivateOneCompany = async (
  companyId: string,
): Promise<boolean> => {
  try {
    const response = await api.post(
      `users/by/company-users/deactivate/${companyId}`,
    );
    return response.data;
  } catch (e: any) {
    return false;
  }
};

export const updateCompany = async (
  companyId: string,
  data: Record<string, any>,
): Promise<boolean> => {
  try {
    await api.patch(`companies/${companyId}`, data);
    return true;
  } catch (e: any) {
    throw e;
  }
};

export const updateUser = async (
  userId: string,
  data: { firstName: string; lastName: string; phone: string; email?: string; roles: string[] },
): Promise<boolean> => {
  try {
    await api.patch(`users/${userId}`, data);
    return true;
  } catch (e: any) {
    throw e;
  }
};

export const getUserInviteLink = async (userId: string): Promise<string> => {
  try {
    const response = await api.post(`email-sender/invite-link/${userId}`);
    return response.data.link;
  } catch (e: any) {
    return '';
  }
};

export const createCompanyUserByAdmin = async (
  companyId: string,
  data: { email: string; phone: string; firstName: string; lastName: string; roles: string[] },
): Promise<any> => {
  try {
    const response = await api.post(`companies/${companyId}/users`, data);
    return response.data;
  } catch (e: any) {
    throw e;
  }
};
