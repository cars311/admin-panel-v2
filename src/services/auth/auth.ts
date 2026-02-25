import api from '../api';
import type { SignInProps, SignInRes } from '../../types/auth';

export const signIn = async (body: SignInProps): Promise<SignInRes> => {
  try {
    const response = await api.post('/auth/signin', body);
    return {
      ...response.data,
      message: '',
    };
  } catch (e: any) {
    return {
      accessToken: '',
      message: e?.response?.data?.message || 'Something went wrong. Please try again.',
      roles: [],
      isEmailVerified: false,
      picture: '',
    };
  }
};

export const logoutActiveUser = async (): Promise<void> => {
  try {
    await api.get('/auth/logout');
  } catch (e: any) {
    // silent fail
  }
};
