export interface SignInProps {
  email: string;
  password: string;
  isUndertakeSession?: boolean;
  isFromAdminPanel?: boolean;
}

export interface SignInRes {
  accessToken: string;
  message: string;
  roles: string[];
  isEmailVerified: boolean;
  picture: string;
}
