import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  Combobox,
  Dropdown,
  Option,
  Input,
  Field,
} from '@fluentui/react-components';
import {
  ArrowDownloadRegular,
  CheckmarkCircleRegular,
  DeleteRegular,
  EditRegular,
} from '@fluentui/react-icons';
import { sortBy, debounce } from 'lodash';
import { useAuth } from '../../context/AuthContext';
import {
  getAllUsers,
  getAllUsersActivity,
  activateUserFromCompany,
  deactivateUserFromCompany,
  findAllCompanyUsers,
} from '../../services/users/users';
import type { CompanyUser, CompanyUserActivity } from '../../types/user';
import { UserRole } from '../../types/user';
import { convertUserRole } from '../../utils/convertUserRole';
import { formatShortDateTime, capitalize } from '../../utils/formatDate';
import ConfirmDialog from '../common/ConfirmDialog';
import EditUserModal from '../common/EditUserModal';
import FilterBar from '../common/FilterBar';
import TablePagination from '../common/TablePagination';

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
});

const allUserStatuses = ['active', 'invited', 'deactivated'];
const allUserRoles = Object.values(UserRole);

const dayOptions = [
  { key: '7_days', text: '7 days' },
  { key: '15_days', text: '15 days' },
  { key: '30_days', text: '30 days' },
  { key: '60_days', text: '60 days' },
];

const allCompanyTypes = ['broker', 'dealer', 'dealer_used'];
const defaultGeneralFilters = { search: '', status: '', role: '', companyType: '', company: '' };
const defaultActivityFilters = { company: 'all', days: '7_days', search: '', companyType: 'broker' };

const UsersPage: React.FC = () => {
  const styles = useStyles();
  const { user: currentUser } = useAuth();
  const [selectedTab, setSelectedTab] = useState<string>('general');

  // General tab state
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [userToActivate, setUserToActivate] = useState('');
  const [userToDeactivate, setUserToDeactivate] = useState('');
  const [editingUser, setEditingUser] = useState<CompanyUser | null>(null);

  const [draftGeneralFilters, setDraftGeneralFilters] = useState(defaultGeneralFilters);
  const [appliedGeneralFilters, setAppliedGeneralFilters] = useState(defaultGeneralFilters);
  const [generalCompanyInput, setGeneralCompanyInput] = useState('');
  const [generalCompanyQuery, setGeneralCompanyQuery] = useState('');
  const isGeneralDirty =
    draftGeneralFilters.search !== appliedGeneralFilters.search ||
    draftGeneralFilters.status !== appliedGeneralFilters.status ||
    draftGeneralFilters.role !== appliedGeneralFilters.role ||
    draftGeneralFilters.companyType !== appliedGeneralFilters.companyType ||
    draftGeneralFilters.company !== appliedGeneralFilters.company;

  // Activity tab state
  const [activityUsers, setActivityUsers] = useState<CompanyUserActivity[]>([]);
  const [displayedActivity, setDisplayedActivity] = useState<CompanyUserActivity[]>([]);
  const [activityPage, setActivityPage] = useState(1);
  const [activityPageSize, setActivityPageSize] = useState(10);
  const [companies, setCompanies] = useState<{ key: string; text: string }[]>([
    { key: 'all', text: 'All' },
  ]);
  const [isActivityLoading, setIsActivityLoading] = useState(false);

  const [draftActivityFilters, setDraftActivityFilters] = useState(defaultActivityFilters);
  const [appliedActivityFilters, setAppliedActivityFilters] = useState(defaultActivityFilters);
  const [activityCompanyInput, setActivityCompanyInput] = useState('');
  const [activityCompanyQuery, setActivityCompanyQuery] = useState('');
  const isActivityDirty =
    draftActivityFilters.company !== appliedActivityFilters.company ||
    draftActivityFilters.days !== appliedActivityFilters.days ||
    draftActivityFilters.search !== appliedActivityFilters.search ||
    draftActivityFilters.companyType !== appliedActivityFilters.companyType;

  // General tab fetch
  const fetchUsers = useCallback(
    async (p: number, size: number, filters: typeof defaultGeneralFilters) => {
      setIsLoading(true);
      const res = await getAllUsers(
        p,
        size,
        filters.search || undefined,
        filters.status || undefined,
        filters.role || undefined,
        filters.companyType || undefined,
        filters.company || undefined,
      );
      setUsers(res.users);
      setTotalCount(res.totalCount);
      setTotalPages(res.totalPages);
      setIsLoading(false);
    },
    [],
  );

  useEffect(() => {
    fetchUsers(page, pageSize, appliedGeneralFilters);
  }, [page, pageSize, appliedGeneralFilters]);

  useEffect(() => {
    loadCompanyOptions();
  }, []);

  // Activity tab fetch
  const fetchActivity = useCallback(async (filters: typeof defaultActivityFilters) => {
    setIsActivityLoading(true);
    const res = await getAllUsersActivity(filters.days);
    setActivityUsers(res);
    setIsActivityLoading(false);
  }, []);

  useEffect(() => {
    if (selectedTab === 'activity') {
      fetchActivity(appliedActivityFilters);
    }
  }, [selectedTab, appliedActivityFilters]);

  // Filter activity client-side
  useEffect(() => {
    setActivityPage(1);
    let filtered = activityUsers;
    if (appliedActivityFilters.company !== 'all') {
      const selectedId = String(appliedActivityFilters.company);
      filtered = filtered.filter((u) => String(u.companyId || '') === selectedId);
    }
    if (appliedActivityFilters.search) {
      const q = appliedActivityFilters.search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.firstName?.toLowerCase().includes(q) ||
          u.lastName?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q),
      );
    }
    if (appliedActivityFilters.companyType) {
      filtered = filtered.filter((u) => u.companyType === appliedActivityFilters.companyType);
    }
    setDisplayedActivity(filtered);
  }, [appliedActivityFilters.company, appliedActivityFilters.search, appliedActivityFilters.companyType, activityUsers]);

  const loadCompanyOptions = async () => {
    const res = await findAllCompanyUsers(1, 10000);
    setCompanies([
      { key: 'all', text: 'All' },
      ...sortBy(
        res.companies.map((c) => ({ key: c._id, text: c.name })),
        (i) => i.text.toLowerCase(),
      ),
    ]);
  };

  const handleActivate = async (id: string) => {
    setIsLoading(true);
    setUserToActivate('');
    await activateUserFromCompany(id);
    await fetchUsers(page, pageSize, appliedGeneralFilters);
  };

  const handleDeactivate = async (id: string) => {
    setIsLoading(true);
    setUserToDeactivate('');
    await deactivateUserFromCompany(id);
    await fetchUsers(page, pageSize, appliedGeneralFilters);
  };

  const activityTotalPages = Math.ceil(displayedActivity.length / activityPageSize);
  const activitySlice = displayedActivity.slice(
    (activityPage - 1) * activityPageSize,
    (activityPage - 1) * activityPageSize + activityPageSize,
  );

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    const color = s === 'invited' ? 'warning' : s === 'active' ? 'success' : 'informative';
    return <Badge appearance="tint" color={color}>{capitalize(status)}</Badge>;
  };

  const exportUsersCsv = async () => {
    try {
      const { users: allU } = await getAllUsers(1, 10000);
      const rows = [
        ['Company Name', 'Company Type', 'First Name', 'Last Name', 'Email', 'Roles', 'SignIn Date', 'Latest Login', 'Trial Days', 'Billing Start', 'Status'],
      ];
      for (const u of allU) {
        rows.push([
          (u as any).companyName || '',
          (u as any).companyType || '',
          u.firstName,
          u.lastName,
          u.email,
          u.roles?.length ? u.roles.map((r) => convertUserRole(r)).join('; ') : 'None',
          u.activatedAt ? formatShortDateTime(u.activatedAt) : 'None',
          u.lastLogin ? formatShortDateTime(u.lastLogin) : 'None',
          u.isTrial ? String(u.trialDays) : 'None',
          u.billingStartAt ? formatShortDateTime(u.billingStartAt) : 'None',
          capitalize(u.status),
        ]);
      }
      downloadCsv(rows, `users_${new Date().toISOString().slice(0, 10)}.csv`);
    } catch (e) {
      console.error(e);
    }
  };

  const exportActivityCsv = () => {
    try {
      const rows: string[][] = [
        ['First Name', 'Last Name', 'Email', 'Company Name', 'Company Type', 'Status', 'Deactivation Date', 'Billing Start', 'Last Login', 'Activity Date', 'Quotes Count', 'Deals Count'],
      ];
      for (const u of displayedActivity) {
        rows.push([
          u.firstName,
          u.lastName,
          u.email,
          u.companyName,
          u.companyType || '',
          u.status,
          u.deactivatedAt,
          u.billingStartAt,
          u.lastLogin,
          u.date,
          String(u.quotesCount),
          String(u.dealsCount),
        ]);
      }
      const companyName = companies.find((c) => c.key === appliedActivityFilters.company)?.text || 'All';
      downloadCsv(rows, `users_activity_${appliedActivityFilters.days}_${companyName}.csv`);
    } catch (e) {
      console.error(e);
    }
  };

  const escapeCsvField = (field: string): string => {
    const str = field == null ? '' : String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };

  const debouncedSetGeneralCompanyQuery = useMemo(
    () => debounce((val: string) => setGeneralCompanyQuery(val), 1000),
    [],
  );

  const debouncedSetActivityCompanyQuery = useMemo(
    () => debounce((val: string) => setActivityCompanyQuery(val), 1000),
    [],
  );

  const downloadCsv = (rows: string[][], filename: string) => {
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((r) => r.map(escapeCsvField).join(',')).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', filename);
    link.click();
  };

  return (
    <>
      <div className={styles.header}>
        <Title1>Users</Title1>
      </div>

      <TabList
        selectedValue={selectedTab}
        onTabSelect={(_, data) => setSelectedTab(data.value as string)}
      >
        <Tab value="general">General</Tab>
        <Tab value="activity">Activity</Tab>
      </TabList>

      <div className={styles.tabContent}>
        {selectedTab === 'general' && (
          <>
            <FilterBar
              isDirty={isGeneralDirty}
              onApply={() => { setAppliedGeneralFilters(draftGeneralFilters); setPage(1); }}
              onClear={() => { setDraftGeneralFilters(defaultGeneralFilters); debouncedSetGeneralCompanyQuery.cancel(); setGeneralCompanyInput(''); setGeneralCompanyQuery(''); }}
            >
              <Field label="Search">
                <Input
                  placeholder="Name or email..."
                  value={draftGeneralFilters.search}
                  onChange={(_, d) => setDraftGeneralFilters((f) => ({ ...f, search: d.value }))}
                  style={{ minWidth: 200 }}
                />
              </Field>
              <Field label="Status">
                <Dropdown
                  placeholder="All Statuses"
                  value={draftGeneralFilters.status || ''}
                  selectedOptions={draftGeneralFilters.status ? [draftGeneralFilters.status] : []}
                  onOptionSelect={(_, d) =>
                    setDraftGeneralFilters((f) => ({ ...f, status: d.optionValue as string }))
                  }
                  style={{ minWidth: 140 }}
                >
                  <Option value="">All Statuses</Option>
                  {allUserStatuses.map((s) => (
                    <Option key={s} value={s}>{capitalize(s)}</Option>
                  ))}
                </Dropdown>
              </Field>
              <Field label="Role">
                <Dropdown
                  placeholder="All Roles"
                  value={draftGeneralFilters.role || ''}
                  selectedOptions={draftGeneralFilters.role ? [draftGeneralFilters.role] : []}
                  onOptionSelect={(_, d) =>
                    setDraftGeneralFilters((f) => ({ ...f, role: d.optionValue as string }))
                  }
                  style={{ minWidth: 160 }}
                >
                  <Option value="">All Roles</Option>
                  {allUserRoles.map((r) => (
                    <Option key={r} value={r}>{convertUserRole(r)}</Option>
                  ))}
                </Dropdown>
              </Field>
              <Field label="Company Type">
                <Dropdown
                  placeholder="All Types"
                  value={draftGeneralFilters.companyType || ''}
                  selectedOptions={draftGeneralFilters.companyType ? [draftGeneralFilters.companyType] : []}
                  onOptionSelect={(_, d) =>
                    setDraftGeneralFilters((f) => ({ ...f, companyType: d.optionValue as string }))
                  }
                  style={{ minWidth: 140 }}
                >
                  <Option value="">All Types</Option>
                  {allCompanyTypes.map((t) => (
                    <Option key={t} value={t}>{t}</Option>
                  ))}
                </Dropdown>
              </Field>
              <Field label="Company">
                <Combobox
                  placeholder="All Companies"
                  value={generalCompanyInput}
                  selectedOptions={draftGeneralFilters.company ? [draftGeneralFilters.company] : []}
                  onChange={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const val = e.target.value;
                    setGeneralCompanyInput(val);
                    debouncedSetGeneralCompanyQuery(val);
                  }}
                  onOptionSelect={(_, d) => {
                    if (d.optionValue == null) return; // ignore freeform/clears without an option
                    const val = String(d.optionValue);
                    setDraftGeneralFilters((f) => ({ ...f, company: val }));
                    debouncedSetGeneralCompanyQuery.cancel();
                    const label = val ? (companies.find((c) => c.key === val)?.text || '') : '';
                    setGeneralCompanyInput(label);
                    setGeneralCompanyQuery('');
                  }}
                  style={{ minWidth: 200 }}
                  freeform
                  listbox={{ style: { maxHeight: '300px' } }}
                >
                  <Option value="">All Companies</Option>
                  {companies
                    .filter((c) => c.key !== 'all')
                    .filter((c) => !generalCompanyInput || generalCompanyInput === (companies.find((cc) => cc.key === draftGeneralFilters.company)?.text || '') || c.text.toLowerCase().includes(generalCompanyInput.toLowerCase()))
                    .map((c) => (
                      <Option key={c.key} value={c.key}>{c.text}</Option>
                    ))}
                </Combobox>
              </Field>
            </FilterBar>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
              <Button
                appearance="subtle"
                icon={<ArrowDownloadRegular />}
                onClick={exportUsersCsv}
                size="small"
              >
                Export CSV
              </Button>
            </div>

            <Card>
              {isLoading && users.length === 0 ? (
                <div className={styles.centered}>
                  <Spinner size="large" label="Loading users..." />
                </div>
              ) : (
                <>
                  <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th className={styles.th}>Company</th>
                          <th className={styles.th}>Company Type</th>
                          <th className={styles.th}>First Name</th>
                          <th className={styles.th}>Last Name</th>
                          <th className={styles.th}>Email</th>
                          <th className={styles.th}>Roles</th>
                          <th className={styles.th}>SignIn Date</th>
                          <th className={styles.th}>Latest Login</th>
                          <th className={styles.th}>Trial Days</th>
                          <th className={styles.th}>Billing Start</th>
                          <th className={styles.th}>Status</th>
                          <th className={styles.th} style={{ textAlign: 'center' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.length === 0 ? (
                          <tr>
                            <td className={styles.td} colSpan={12} style={{ textAlign: 'center' }}>
                              <Body1>No users found</Body1>
                            </td>
                          </tr>
                        ) : (
                          users.map((u) => (
                            <tr key={u._id} className={styles.tr}>
                              <td className={styles.td}>{(u as any).companyName || '—'}</td>
                              <td className={styles.td}>{(u as any).companyType || '—'}</td>
                              <td className={styles.td}>{u.firstName}</td>
                              <td className={styles.td}>{u.lastName}</td>
                              <td className={styles.td}>{u.email}</td>
                              <td className={styles.td}>
                                {u.roles?.length
                                  ? u.roles.map((r) => convertUserRole(r)).join(', ')
                                  : 'None'}
                              </td>
                              <td className={styles.td}>
                                {u.activatedAt ? formatShortDateTime(u.activatedAt) : 'None'}
                              </td>
                              <td className={styles.td}>
                                {u.lastLogin ? formatShortDateTime(u.lastLogin) : 'None'}
                              </td>
                              <td className={styles.td}>
                                {u.isTrial ? u.trialDays : 'None'}
                              </td>
                              <td className={styles.td}>
                                {formatShortDateTime(u.billingStartAt)}
                              </td>
                              <td className={styles.td}>{getStatusBadge(u.status)}</td>
                              <td className={styles.td}>
                                <div className={styles.actions}>
                                  <Button
                                    appearance="subtle"
                                    icon={<EditRegular />}
                                    size="small"
                                    title="Edit"
                                    onClick={() => setEditingUser(u)}
                                  />
                                  {u.status === 'deactivated' && u.email !== currentUser.email && (
                                    <Button
                                      appearance="subtle"
                                      icon={<CheckmarkCircleRegular />}
                                      size="small"
                                      title="Activate"
                                      onClick={() => setUserToActivate(u._id)}
                                    />
                                  )}
                                  {['invited', 'active'].includes(u.status) &&
                                    u.email !== currentUser.email && (
                                      <Button
                                        appearance="subtle"
                                        icon={<DeleteRegular />}
                                        size="small"
                                        title="Deactivate"
                                        onClick={() => setUserToDeactivate(u._id)}
                                      />
                                    )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <TablePagination
                    page={page}
                    totalPages={totalPages}
                    totalCount={totalCount}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
                    itemLabel="users"
                  />
                </>
              )}
            </Card>
          </>
        )}

        {selectedTab === 'activity' && (
          <>
            <FilterBar
              isDirty={isActivityDirty}
              onApply={() => { setAppliedActivityFilters(draftActivityFilters); setActivityPage(1); }}
              onClear={() => { setDraftActivityFilters(defaultActivityFilters); debouncedSetActivityCompanyQuery.cancel(); setActivityCompanyInput(''); setActivityCompanyQuery(''); }}
            >
              <Field label="Company">
                <Combobox
                  placeholder="All"
                  value={activityCompanyInput}
                  selectedOptions={[draftActivityFilters.company]}
                  onChange={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const val = e.target.value;
                    setActivityCompanyInput(val);
                    debouncedSetActivityCompanyQuery(val);
                  }}
                  onOptionSelect={(_, d) => {
                    if (d.optionValue == null) return; // ignore spurious select events
                    const val = String(d.optionValue);
                    setDraftActivityFilters((f) => ({ ...f, company: val }));
                    debouncedSetActivityCompanyQuery.cancel();
                    const label = val && val !== 'all' ? (companies.find((c) => c.key === val)?.text || '') : '';
                    setActivityCompanyInput(label);
                    setActivityCompanyQuery('');
                  }}
                  style={{ minWidth: 200 }}
                  freeform
                  listbox={{ style: { maxHeight: '300px' } }}
                >
                  <Option value="all">All</Option>
                  {companies
                    .filter((c) => c.key !== 'all')
                    .filter((c) => !activityCompanyInput || activityCompanyInput === (companies.find((cc) => cc.key === draftActivityFilters.company)?.text || '') || c.text.toLowerCase().includes(activityCompanyInput.toLowerCase()))
                    .map((c) => (
                      <Option key={c.key} value={c.key}>
                        {c.text}
                      </Option>
                    ))}
                </Combobox>
              </Field>
              <Field label="Period">
                <Dropdown
                  value={dayOptions.find((d) => d.key === draftActivityFilters.days)?.text || '7 days'}
                  selectedOptions={[draftActivityFilters.days]}
                  onOptionSelect={(_, d) =>
                    setDraftActivityFilters((f) => ({ ...f, days: d.optionValue as string }))
                  }
                  style={{ minWidth: 120 }}
                >
                  {dayOptions.map((d) => (
                    <Option key={d.key} value={d.key}>
                      {d.text}
                    </Option>
                  ))}
                </Dropdown>
              </Field>
              <Field label="Search">
                <Input
                  placeholder="Name or email..."
                  value={draftActivityFilters.search}
                  onChange={(_, d) => setDraftActivityFilters((f) => ({ ...f, search: d.value }))}
                  style={{ minWidth: 200 }}
                />
              </Field>
              <Field label="Company Type">
                <Dropdown
                  placeholder="All Types"
                  value={draftActivityFilters.companyType || ''}
                  selectedOptions={draftActivityFilters.companyType ? [draftActivityFilters.companyType] : []}
                  onOptionSelect={(_, d) =>
                    setDraftActivityFilters((f) => ({ ...f, companyType: d.optionValue as string }))
                  }
                  style={{ minWidth: 140 }}
                >
                  <Option value="">All Types</Option>
                  {allCompanyTypes.map((t) => (
                    <Option key={t} value={t}>{t}</Option>
                  ))}
                </Dropdown>
              </Field>
            </FilterBar>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
              <Button
                appearance="subtle"
                icon={<ArrowDownloadRegular />}
                onClick={exportActivityCsv}
                size="small"
              >
                Export CSV
              </Button>
            </div>

            <Card>
              {isActivityLoading ? (
                <div className={styles.centered}>
                  <Spinner size="large" label="Loading activity..." />
                </div>
              ) : (
                <>
                  <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th className={styles.th}>First Name</th>
                          <th className={styles.th}>Last Name</th>
                          <th className={styles.th}>Email</th>
                          <th className={styles.th}>Company</th>
                          <th className={styles.th}>Company Type</th>
                          <th className={styles.th}>Status</th>
                          <th className={styles.th}>Deactivation Date</th>
                          <th className={styles.th}>Billing Start</th>
                          <th className={styles.th}>Last Login</th>
                          <th className={styles.th}>Activity Date</th>
                          <th className={styles.th}>Quotes</th>
                          <th className={styles.th}>Deals</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activitySlice.length === 0 ? (
                          <tr>
                            <td className={styles.td} colSpan={12} style={{ textAlign: 'center' }}>
                              <Body1>No activity found</Body1>
                            </td>
                          </tr>
                        ) : (
                          activitySlice.map((u, idx) => (
                            <tr key={`${u._id}-${u.date}-${idx}`} className={styles.tr}>
                              <td className={styles.td}>{u.firstName}</td>
                              <td className={styles.td}>{u.lastName}</td>
                              <td className={styles.td}>{u.email}</td>
                              <td className={styles.td}>{u.companyName}</td>
                              <td className={styles.td}>{u.companyType || '—'}</td>
                              <td className={styles.td}>{u.status}</td>
                              <td className={styles.td}>{u.deactivatedAt}</td>
                              <td className={styles.td}>{u.billingStartAt}</td>
                              <td className={styles.td}>{u.lastLogin}</td>
                              <td className={styles.td}>{u.date}</td>
                              <td className={styles.td}>{u.quotesCount}</td>
                              <td className={styles.td}>{u.dealsCount}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <TablePagination
                    page={activityPage}
                    totalPages={activityTotalPages || 1}
                    totalCount={displayedActivity.length}
                    pageSize={activityPageSize}
                    onPageChange={setActivityPage}
                    onPageSizeChange={(s) => { setActivityPageSize(s); setActivityPage(1); }}
                    itemLabel="records"
                  />
                </>
              )}
            </Card>
          </>
        )}
      </div>

      {userToActivate && (
        <ConfirmDialog
          title="Activate selected user?"
          confirmText="Activate"
          intent="success"
          onConfirm={() => handleActivate(userToActivate)}
          onCancel={() => setUserToActivate('')}
        />
      )}

      {userToDeactivate && (
        <ConfirmDialog
          title="Deactivate selected user?"
          confirmText="Deactivate"
          intent="danger"
          onConfirm={() => handleDeactivate(userToDeactivate)}
          onCancel={() => setUserToDeactivate('')}
        />
      )}

      <EditUserModal
        isOpen={!!editingUser}
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onSaved={() => {
          setEditingUser(null);
          fetchUsers(page, pageSize, appliedGeneralFilters);
        }}
      />
    </>
  );
};

export default UsersPage;
