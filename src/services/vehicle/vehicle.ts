import api from '../api';

export const getAllMakes = async (): Promise<{ makes: string[] }> => {
  try {
    const response = await api.get('/vehicle/makes');
    return {
      makes: response.data,
    };
  } catch (e: any) {
    return {
      makes: [],
    };
  }
};
