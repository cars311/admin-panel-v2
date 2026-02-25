import api from '../api';
import type { CreateCompanyBody } from '../../types/company';

export const sendNewCompanyInviteLink = async (
  body: CreateCompanyBody,
): Promise<boolean> => {
  const response = await api.post(
    'email-sender/send-new-company-user-invite-link',
    body,
  );
  return response.data;
};
