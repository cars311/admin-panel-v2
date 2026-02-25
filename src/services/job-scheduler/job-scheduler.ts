import api from '../api';
import type {
  GetJobsQuery,
  GetJobsResponse,
  JobSchedulerConfig,
} from '../../types/job-scheduler';

export const getJobs = async (query: GetJobsQuery): Promise<GetJobsResponse> => {
  const params = new URLSearchParams();
  if (query.status) params.append('status', query.status);
  if (query.jobType) params.append('jobType', query.jobType);
  if (query.dateFrom) params.append('dateFrom', query.dateFrom);
  if (query.dateTo) params.append('dateTo', query.dateTo);
  if (query.page) params.append('page', String(query.page));
  if (query.limit) params.append('limit', String(query.limit));
  if (query.sortBy) params.append('sortBy', query.sortBy);
  if (query.order) params.append('order', query.order);
  const { data } = await api.get(`/job-schedulers?${params.toString()}`);
  return data;
};

export const getAllConfigs = async (): Promise<JobSchedulerConfig[]> => {
  const { data } = await api.get('/job-schedulers/configuration');
  return data;
};

export const createConfig = async (
  body: Pick<JobSchedulerConfig, 'jobType' | 'isActive' | 'cron'>,
): Promise<JobSchedulerConfig> => {
  const { data } = await api.post('/job-schedulers/configuration', body);
  return data;
};

export const updateConfig = async (
  id: string,
  body: Pick<JobSchedulerConfig, 'jobType' | 'isActive' | 'cron'>,
): Promise<JobSchedulerConfig> => {
  const { data } = await api.put(`/job-schedulers/configuration/${id}`, body);
  return data;
};

export const deleteConfig = async (id: string): Promise<void> => {
  await api.delete(`/job-schedulers/configuration/${id}`);
};
