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
  Field,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  PlayRegular,
} from '@fluentui/react-icons';
import {
  getJobs,
  getAllConfigs,
  createConfig,
  updateConfig,
  deleteConfig,
  triggerJob,
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
import FilterBar from '../common/FilterBar';
import TablePagination from '../common/TablePagination';

const allJobTypes = Object.values(JobSchedulerTypesEnum);
const allStatuses = Object.values(JobSchedulerStatusesEnum);

const triggerableJobs: { label: string; endpoint: string }[] = [
  { label: 'Sync Vehicles from ADS', endpoint: 'sync-vehicles-ads' },
  { label: 'Sync Data from Lender Desk', endpoint: 'sync-data-lender-desk' },
  { label: 'Sync Data from Market Scan', endpoint: 'sync-data-market-scan' },
  { label: 'Pull Rebates from Data Providers', endpoint: 'pull-rebates-from-data-providers' },
  { label: 'Map Rebates', endpoint: 'map-rebates' },
  { label: 'Get MS Programs', endpoint: 'get-ms-programs' },
  { label: 'Map Programs', endpoint: 'map-programs' },
  { label: 'Lender Desk — Tier Raws', endpoint: 'lender-desk-tier-raws' },
  { label: 'Lender Desk — Division Code', endpoint: 'lender-desk-division-code' },
  { label: 'Lender Desk — Style IDs', endpoint: 'lender-desk-style-ids' },
  { label: 'Lender Desk — Lenders', endpoint: 'lender-desk-lenders' },
  { label: 'Lender Desk — Rebates', endpoint: 'lender-desk-rebates' },
  { label: 'Market Scan — Lenders', endpoint: 'market-scan-lenders' },
  { label: 'Market Scan — Rules and Fees', endpoint: 'market-scan-rules-and-fees' },
  { label: 'Market Scan — Manufacturers', endpoint: 'market-scan-manufacturers' },
  { label: 'Market Scan — Makes', endpoint: 'market-scan-makes' },
  { label: 'Market Scan — Models', endpoint: 'market-scan-models' },
  { label: 'Market Scan — Bank Fee Markups', endpoint: 'market-scan-bank-fee-markups' },
  { label: 'Market Scan — Vehicle Equipment Residualizable', endpoint: 'market-scan-vehicle-equipment-residualizable' },
  { label: 'Market Scan — Terms', endpoint: 'market-scan-terms' },
  { label: 'Market Scan — Part Labors', endpoint: 'market-scan-part-labors' },
  { label: 'Market Scan — Categories', endpoint: 'market-scan-categories' },
  { label: 'Market Scan — Sub Categories', endpoint: 'market-scan-sub-categories' },
  { label: 'Market Scan — Super Categories', endpoint: 'market-scan-super-categories' },
  { label: 'Market Scan — Mileage Adjustments', endpoint: 'market-scan-mileage-adjustments' },
  { label: 'Market Scan — Vehicles', endpoint: 'market-scan-vehicles' },
  { label: 'Market Scan — Rebates', endpoint: 'market-scan-rebates' },
  { label: 'Market Scan — Rebates Vins', endpoint: 'market-scan-rebates-vins' },
  { label: 'Market Scan — Rebate Descriptions', endpoint: 'market-scan-rebate-descriptions' },
  { label: 'Market Scan — Taxes', endpoint: 'market-scan-taxes' },
];

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
  topActions: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end',
    marginBottom: '8px',
  },
});

const statusAppearanceMap: Record<string, 'success' | 'danger' | 'warning' | 'important'> = {
  [JobSchedulerStatusesEnum.FINISH]: 'success',
  [JobSchedulerStatusesEnum.FAILED]: 'danger',
  [JobSchedulerStatusesEnum.RUNNING]: 'warning',
};

// ─── Trigger Job Modal ─────────────────────────────────

interface TriggerJobModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TriggerJobModal: React.FC<TriggerJobModalProps> = ({ isOpen, onClose }) => {
  const styles = useStyles();
  const [selectedEndpoint, setSelectedEndpoint] = useState('');
  const [triggering, setTriggering] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedEndpoint('');
      setError('');
      setSuccessMsg('');
    }
  }, [isOpen]);

  const handleTrigger = async () => {
    if (!selectedEndpoint) return;
    setTriggering(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await triggerJob(selectedEndpoint);
      setSuccessMsg(res?.message || 'Job started successfully');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to trigger job');
    } finally {
      setTriggering(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface className={styles.surface}>
        <DialogBody>
          <DialogTitle>Run Job Immediately</DialogTitle>
          <DialogContent>
            <div className={styles.form}>
              {error && (
                <MessageBar intent="error">
                  <MessageBarBody>{error}</MessageBarBody>
                </MessageBar>
              )}
              {successMsg && (
                <MessageBar intent="success">
                  <MessageBarBody>{successMsg}</MessageBarBody>
                </MessageBar>
              )}
              <Field label="Select Job" required>
                <Dropdown
                  placeholder="Select a job to run"
                  value={triggerableJobs.find((j) => j.endpoint === selectedEndpoint)?.label || undefined}
                  selectedOptions={selectedEndpoint ? [selectedEndpoint] : []}
                  onOptionSelect={(_, d) => setSelectedEndpoint(d.optionValue as string)}
                >
                  {triggerableJobs.map((job) => (
                    <Option key={job.endpoint} value={job.endpoint}>
                      {job.label}
                    </Option>
                  ))}
                </Dropdown>
              </Field>
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={onClose} disabled={triggering}>
              Close
            </Button>
            <Button
              appearance="primary"
              icon={<PlayRegular />}
              onClick={handleTrigger}
              disabled={triggering || !selectedEndpoint}
            >
              {triggering ? <Spinner size="tiny" /> : 'Run'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

// ─── Jobs Tab ───────────────────────────────────────────

const defaultJobFilters = { status: '', jobType: '', dateFrom: '', dateTo: '' };

const JobsTab: React.FC = () => {
  const styles = useStyles();
  const [jobs, setJobs] = useState<JobScheduler[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [triggerModalOpen, setTriggerModalOpen] = useState(false);

  // Draft filters (what user is editing in the UI)
  const [draftFilters, setDraftFilters] = useState(defaultJobFilters);
  // Applied filters (what is actually sent to backend)
  const [appliedFilters, setAppliedFilters] = useState(defaultJobFilters);

  const isDirty =
    draftFilters.status !== appliedFilters.status ||
    draftFilters.jobType !== appliedFilters.jobType ||
    draftFilters.dateFrom !== appliedFilters.dateFrom ||
    draftFilters.dateTo !== appliedFilters.dateTo;

  const fetchJobs = useCallback(
    async (p: number, size: number, filters: typeof defaultJobFilters) => {
      setLoading(true);
      try {
        const query: GetJobsQuery = {
          page: p,
          limit: size,
          sortBy: 'createdAt',
          order: 'DESC',
        };
        if (filters.status) query.status = filters.status as JobSchedulerStatusesEnum;
        if (filters.jobType) query.jobType = filters.jobType as JobSchedulerTypesEnum;
        if (filters.dateFrom) query.dateFrom = filters.dateFrom;
        if (filters.dateTo) query.dateTo = filters.dateTo;

        const res = await getJobs(query);
        setJobs(res.jobs);
        setTotalCount(res.totalCount);
        setTotalPages(Math.ceil(res.totalCount / size));
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchJobs(page, pageSize, appliedFilters);
  }, [page, pageSize, appliedFilters, fetchJobs]);

  const handleApply = () => {
    setAppliedFilters(draftFilters);
    setPage(1);
  };

  const handleClear = () => {
    setDraftFilters(defaultJobFilters);
  };

  return (
    <>
      <TriggerJobModal isOpen={triggerModalOpen} onClose={() => setTriggerModalOpen(false)} />

      <FilterBar isDirty={isDirty} onApply={handleApply} onClear={handleClear}>
        <Field label="Status">
          <Dropdown
            placeholder="All Statuses"
            value={draftFilters.status || undefined}
            selectedOptions={draftFilters.status ? [draftFilters.status] : []}
            onOptionSelect={(_, d) =>
              setDraftFilters((f) => ({ ...f, status: d.optionValue as string }))
            }
            style={{ minWidth: 150 }}
          >
            <Option value="">All Statuses</Option>
            {allStatuses.map((s) => (
              <Option key={s} value={s}>{s}</Option>
            ))}
          </Dropdown>
        </Field>
        <Field label="Job Type">
          <Dropdown
            placeholder="All Job Types"
            value={draftFilters.jobType || undefined}
            selectedOptions={draftFilters.jobType ? [draftFilters.jobType] : []}
            onOptionSelect={(_, d) =>
              setDraftFilters((f) => ({ ...f, jobType: d.optionValue as string }))
            }
            style={{ minWidth: 220 }}
          >
            <Option value="">All Job Types</Option>
            {allJobTypes.map((t) => (
              <Option key={t} value={t}>{t}</Option>
            ))}
          </Dropdown>
        </Field>
        <Field label="Date From">
          <Input
            type="date"
            value={draftFilters.dateFrom}
            onChange={(_, d) => setDraftFilters((f) => ({ ...f, dateFrom: d.value }))}
          />
        </Field>
        <Field label="Date To">
          <Input
            type="date"
            value={draftFilters.dateTo}
            onChange={(_, d) => setDraftFilters((f) => ({ ...f, dateTo: d.value }))}
          />
        </Field>
      </FilterBar>

      <div className={styles.topActions}>
        <Button
          icon={<ArrowClockwiseRegular />}
          appearance="subtle"
          onClick={() => fetchJobs(page, pageSize, appliedFilters)}
        >
          Refresh
        </Button>
        <Button
          icon={<PlayRegular />}
          appearance="primary"
          onClick={() => setTriggerModalOpen(true)}
        >
          Run Job
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
        <TablePagination
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
          itemLabel="jobs"
        />
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
