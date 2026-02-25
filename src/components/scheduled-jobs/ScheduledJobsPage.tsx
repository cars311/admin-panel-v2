import React, { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  Title1,
  Body1,
  Badge,
  makeStyles,
  tokens,
  Spinner,
  Tab,
  TabList,
  Dropdown,
  Option,
  Input,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Field,
  Switch,
  Tooltip,
  MessageBar,
  MessageBarBody,
} from '@fluentui/react-components';
import {
  AddRegular,
  EditRegular,
  DeleteRegular,
  ArrowClockwiseRegular,
} from '@fluentui/react-icons';
import {
  getJobs,
  getAllConfigs,
  createConfig,
  updateConfig,
  deleteConfig,
} from '../../services/job-scheduler/job-scheduler';
import type {
  JobScheduler,
  JobSchedulerConfig,
  GetJobsQuery,
} from '../../types/job-scheduler';
import {
  JobSchedulerTypesEnum,
  JobSchedulerStatusesEnum,
} from '../../types/job-scheduler';
import { formatShortDateTime } from '../../utils/formatDate';
import ConfirmDialog from '../common/ConfirmDialog';

const allJobTypes = Object.values(JobSchedulerTypesEnum);
const allStatuses = Object.values(JobSchedulerStatusesEnum);

const useStyles = makeStyles({
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '10px 12px',
    borderBottom: `2px solid ${tokens.colorNeutralStroke1}`,
    fontWeight: 600,
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '10px 12px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    fontSize: '13px',
    whiteSpace: 'nowrap',
  },
  tr: {
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  pagination: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 0',
  },
  paginationButtons: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  actions: {
    display: 'flex',
    gap: '4px',
    justifyContent: 'center',
  },
  centered: {
    display: 'flex',
    justifyContent: 'center',
    padding: '40px',
  },
  filters: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  tabContent: {
    marginTop: '16px',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  surface: {
    maxWidth: '500px',
    width: '90vw',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
});

const statusAppearanceMap: Record<string, 'success' | 'danger' | 'warning' | 'important'> = {
  [JobSchedulerStatusesEnum.FINISH]: 'success',
  [JobSchedulerStatusesEnum.FAILED]: 'danger',
  [JobSchedulerStatusesEnum.RUNNING]: 'warning',
};

// ─── Jobs Tab ───────────────────────────────────────────

const JobsTab: React.FC = () => {
  const styles = useStyles();
  const [jobs, setJobs] = useState<JobScheduler[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterJobType, setFilterJobType] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const query: GetJobsQuery = {
        page,
        limit,
        sortBy: 'createdAt',
        order: 'DESC',
      };
      if (filterStatus) query.status = filterStatus as JobSchedulerStatusesEnum;
      if (filterJobType) query.jobType = filterJobType as JobSchedulerTypesEnum;
      if (filterDateFrom) query.dateFrom = filterDateFrom;
      if (filterDateTo) query.dateTo = filterDateTo;

      const res = await getJobs(query);
      setJobs(res.jobs);
      setTotalCount(res.totalCount);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, limit, filterStatus, filterJobType, filterDateFrom, filterDateTo]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <>
      <div className={styles.filters}>
        <Dropdown
          placeholder="Status"
          value={filterStatus || undefined}
          selectedOptions={filterStatus ? [filterStatus] : []}
          onOptionSelect={(_, d) => { setFilterStatus(d.optionValue as string); setPage(1); }}
          style={{ minWidth: 150 }}
        >
          <Option value="">All Statuses</Option>
          {allStatuses.map((s) => (
            <Option key={s} value={s}>{s}</Option>
          ))}
        </Dropdown>
        <Dropdown
          placeholder="Job Type"
          value={filterJobType || undefined}
          selectedOptions={filterJobType ? [filterJobType] : []}
          onOptionSelect={(_, d) => { setFilterJobType(d.optionValue as string); setPage(1); }}
          style={{ minWidth: 220 }}
        >
          <Option value="">All Job Types</Option>
          {allJobTypes.map((t) => (
            <Option key={t} value={t}>{t}</Option>
          ))}
        </Dropdown>
        <Input
          type="date"
          value={filterDateFrom}
          onChange={(_, d) => { setFilterDateFrom(d.value); setPage(1); }}
          placeholder="From"
        />
        <Input
          type="date"
          value={filterDateTo}
          onChange={(_, d) => { setFilterDateTo(d.value); setPage(1); }}
          placeholder="To"
        />
        <Button
          icon={<ArrowClockwiseRegular />}
          appearance="subtle"
          onClick={fetchJobs}
        >
          Refresh
        </Button>
      </div>

      <Card>
        <div className={styles.tableWrapper}>
          {loading ? (
            <div className={styles.centered}><Spinner size="medium" /></div>
          ) : jobs.length === 0 ? (
            <div className={styles.centered}><Body1>No jobs found</Body1></div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Status</th>
                  <th className={styles.th}>Job Type</th>
                  <th className={styles.th}>Name</th>
                  <th className={styles.th}>Cron</th>
                  <th className={styles.th}>Created At</th>
                  <th className={styles.th}>Ended At</th>
                  <th className={styles.th}>Error</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job._id} className={styles.tr}>
                    <td className={styles.td}>
                      <Badge
                        appearance="filled"
                        color={statusAppearanceMap[job.status] || 'important'}
                      >
                        {job.status}
                      </Badge>
                    </td>
                    <td className={styles.td}>{job.jobType}</td>
                    <td className={styles.td}>{job.name}</td>
                    <td className={styles.td}>{job.cron}</td>
                    <td className={styles.td}>{formatShortDateTime(job.createdAt)}</td>
                    <td className={styles.td}>{job.endedAt ? formatShortDateTime(job.endedAt) : '—'}</td>
                    <td className={styles.td} style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {job.error || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <Body1>
              Page {page} of {totalPages} ({totalCount} total)
            </Body1>
            <div className={styles.paginationButtons}>
              <Button
                appearance="subtle"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                appearance="subtle"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </>
  );
};

// ─── Config Modal ───────────────────────────────────────

interface ConfigModalProps {
  isOpen: boolean;
  config: JobSchedulerConfig | null;
  existingJobTypes: JobSchedulerTypesEnum[];
  onClose: () => void;
  onSaved: () => void;
}

const ConfigModal: React.FC<ConfigModalProps> = ({
  isOpen,
  config,
  existingJobTypes,
  onClose,
  onSaved,
}) => {
  const styles = useStyles();
  const isEdit = !!config;
  const [jobType, setJobType] = useState<string>('');
  const [isActive, setIsActive] = useState(false);
  const [cron, setCron] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (config) {
        setJobType(config.jobType);
        setIsActive(config.isActive);
        setCron(config.cron || '');
      } else {
        setJobType('');
        setIsActive(false);
        setCron('');
      }
      setError('');
    }
  }, [isOpen, config]);

  const availableJobTypes = isEdit
    ? allJobTypes
    : allJobTypes.filter((t) => !existingJobTypes.includes(t));

  const handleSave = async () => {
    if (!jobType) {
      setError('Job type is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const body = {
        jobType: jobType as JobSchedulerTypesEnum,
        isActive,
        cron: cron || undefined,
      };
      if (isEdit && config) {
        await updateConfig(config._id, body);
      } else {
        await createConfig(body);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = () => {
    if (isEdit) {
      setShowConfirm(true);
    } else {
      handleSave();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <Dialog open onOpenChange={(_, data) => !data.open && onClose()}>
        <DialogSurface className={styles.surface}>
          <DialogBody>
            <DialogTitle>{isEdit ? 'Edit Configuration' : 'Create Configuration'}</DialogTitle>
            <DialogContent>
              <div className={styles.form}>
                {error && (
                  <MessageBar intent="error">
                    <MessageBarBody>{error}</MessageBarBody>
                  </MessageBar>
                )}
                <Field label="Job Type" required>
                  <Dropdown
                    value={jobType || undefined}
                    selectedOptions={jobType ? [jobType] : []}
                    onOptionSelect={(_, d) => setJobType(d.optionValue as string)}
                    disabled={isEdit}
                    placeholder="Select job type"
                  >
                    {availableJobTypes.map((t) => (
                      <Option key={t} value={t}>{t}</Option>
                    ))}
                  </Dropdown>
                </Field>
                <Field label="Active">
                  <Switch
                    checked={isActive}
                    onChange={(_, d) => setIsActive(d.checked)}
                  />
                </Field>
                <Field label="Cron Expression" hint="6-field cron with seconds, e.g. 0 0 6 * * *">
                  <Input
                    value={cron}
                    onChange={(_, d) => setCron(d.value)}
                    placeholder="0 0 6 * * *"
                  />
                </Field>
              </div>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button appearance="primary" onClick={handleSubmit} disabled={saving || !jobType}>
                {saving ? <Spinner size="tiny" /> : isEdit ? 'Update' : 'Create'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {showConfirm && (
        <ConfirmDialog
          title="Confirm Update"
          message={`Are you sure you want to update the configuration for "${jobType}"?`}
          confirmText="Update"
          intent="success"
          onConfirm={() => {
            setShowConfirm(false);
            handleSave();
          }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
};

// ─── Configuration Tab ──────────────────────────────────

const ConfigurationTab: React.FC = () => {
  const styles = useStyles();
  const [configs, setConfigs] = useState<JobSchedulerConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editConfig, setEditConfig] = useState<JobSchedulerConfig | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<JobSchedulerConfig | null>(null);

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllConfigs();
      setConfigs(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteConfig(deleteTarget._id);
      setDeleteTarget(null);
      fetchConfigs();
    } catch {
      // silent
    }
  };

  const existingJobTypes = configs.map((c) => c.jobType);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button
          appearance="primary"
          icon={<AddRegular />}
          onClick={() => { setEditConfig(null); setModalOpen(true); }}
        >
          Create Configuration
        </Button>
      </div>

      <Card>
        <div className={styles.tableWrapper}>
          {loading ? (
            <div className={styles.centered}><Spinner size="medium" /></div>
          ) : configs.length === 0 ? (
            <div className={styles.centered}><Body1>No configurations found</Body1></div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Job Type</th>
                  <th className={styles.th}>Active</th>
                  <th className={styles.th}>Cron</th>
                  <th className={styles.th}>Created At</th>
                  <th className={styles.th}>Updated At</th>
                  <th className={styles.th} style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {configs.map((cfg) => (
                  <tr key={cfg._id} className={styles.tr}>
                    <td className={styles.td}>{cfg.jobType}</td>
                    <td className={styles.td}>
                      <Badge
                        appearance="filled"
                        color={cfg.isActive ? 'success' : 'danger'}
                      >
                        {cfg.isActive ? 'Yes' : 'No'}
                      </Badge>
                    </td>
                    <td className={styles.td}>{cfg.cron || '—'}</td>
                    <td className={styles.td}>{cfg.createdAt ? formatShortDateTime(cfg.createdAt) : '—'}</td>
                    <td className={styles.td}>{cfg.updatedAt ? formatShortDateTime(cfg.updatedAt) : '—'}</td>
                    <td className={styles.td}>
                      <div className={styles.actions}>
                        <Tooltip content="Edit" relationship="label">
                          <Button
                            icon={<EditRegular />}
                            appearance="subtle"
                            size="small"
                            onClick={() => { setEditConfig(cfg); setModalOpen(true); }}
                          />
                        </Tooltip>
                        <Tooltip content="Delete" relationship="label">
                          <Button
                            icon={<DeleteRegular />}
                            appearance="subtle"
                            size="small"
                            onClick={() => setDeleteTarget(cfg)}
                          />
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <ConfigModal
        isOpen={modalOpen}
        config={editConfig}
        existingJobTypes={existingJobTypes}
        onClose={() => { setModalOpen(false); setEditConfig(null); }}
        onSaved={fetchConfigs}
      />

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Configuration"
          message={`Are you sure you want to delete the configuration for "${deleteTarget.jobType}"? This action cannot be undone.`}
          confirmText="Delete"
          intent="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
};

// ─── Main Page ──────────────────────────────────────────

const ScheduledJobsPage: React.FC = () => {
  const styles = useStyles();
  const [activeTab, setActiveTab] = useState('jobs');

  return (
    <>
      <div className={styles.header}>
        <Title1>Scheduled Jobs</Title1>
      </div>

      <TabList
        selectedValue={activeTab}
        onTabSelect={(_, d) => setActiveTab(d.value as string)}
      >
        <Tab value="jobs">Jobs</Tab>
        <Tab value="configuration">Jobs Configuration</Tab>
      </TabList>

      <div className={styles.tabContent}>
        {activeTab === 'jobs' && <JobsTab />}
        {activeTab === 'configuration' && <ConfigurationTab />}
      </div>
    </>
  );
};

export default ScheduledJobsPage;
