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
} from '@fluentui/react-components';
import {
  ArrowDownloadRegular,
  CheckmarkCircleRegular,
  DeleteRegular,
} from '@fluentui/react-icons';
import { sortBy } from 'lodash';
import { useAuth } from '../../context/AuthContext';
import {
  getAllUsers,
  getAllUsersActivity,
  activateUserFromCompany,
  deactivateUserFromCompany,
  findAllCompanyUsers,
} from '../../services/users/users';
import type { CompanyUser, CompanyUserActivity } from '../../types/user';
import { convertUserRole } from '../../utils/convertUserRole';
import { formatShortDateTime, capitalize } from '../../utils/formatDate';
import ConfirmDialog from '../common/ConfirmDialog';

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
  exportBtn: {
    marginLeft: 'auto',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
});

const dayOptions = [
  { key: '7_days', text: '7 days' },
  { key: '15_days', text: '15 days' },
  { key: '30_days', text: '30 days' },
  { key: '60_days', text: '60 days' },
];

const UsersPage: React.FC = () => {
  const styles = useStyles();
  const { user: currentUser } = useAuth();
  const [selectedTab, setSelectedTab] = useState<string>('general');

  // General tab state
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [userToActivate, setUserToActivate] = useState('');
  const [userToDeactivate, setUserToDeactivate] = useState('');

  // Activity tab state
  const [activityUsers, setActivityUsers] = useState<CompanyUserActivity[]>([]);
  const [displayedActivity, setDisplayedActivity] = useState<CompanyUserActivity[]>([]);
  const [activityPageIndex, setActivityPageIndex] = useState(0);
  const [activityPageSize] = useState(10);
  const [selectedDays, setSelectedDays] = useState('7_days');
  const [companies, setCompanies] = useState<{ key: string; text: string }[]>([
    { key: 'all', text: 'All' },
  ]);
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [isActivityLoading, setIsActivityLoading] = useState(false);

  // General tab
  const fetchUsers = useCallback(async (page: number, size: number) => {
    setIsLoading(true);
    const res = await getAllUsers(page + 1, size);
    setUsers(res.users);
    setPageIndex(res.currentPage - 1);
    setTotalCount(res.totalCount);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers(0, pageSize);
    loadCompanyOptions();
  }, []);

  // Activity tab
  useEffect(() => {
    if (selectedTab === 'activity') {
      fetchActivity();
    }
  }, [selectedDays, selectedTab]);

  useEffect(() => {
    setActivityPageIndex(0);
    if (selectedCompany === 'all') {
      setDisplayedActivity(activityUsers);
    } else {
      setDisplayedActivity(activityUsers.filter((u) => u.companyId === selectedCompany));
    }
  }, [selectedCompany, activityUsers]);

  const fetchActivity = async () => {
    setIsActivityLoading(true);
    const res = await getAllUsersActivity(selectedDays);
    setActivityUsers(res);
    setIsActivityLoading(false);
  };

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
    await fetchUsers(pageIndex, pageSize);
  };

  const handleDeactivate = async (id: string) => {
    setIsLoading(true);
    setUserToDeactivate('');
    await deactivateUserFromCompany(id);
    await fetchUsers(pageIndex, pageSize);
  };

  const handlePageChange = (newPage: number) => {
    setPageIndex(newPage);
    fetchUsers(newPage, pageSize);
  };

  const totalPages = Math.ceil(totalCount / pageSize);
  const activityTotalPages = Math.ceil(displayedActivity.length / activityPageSize);
  const activitySlice = displayedActivity.slice(
    activityPageIndex * activityPageSize,
    activityPageIndex * activityPageSize + activityPageSize,
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
        ['Company Name', 'First Name', 'Last Name', 'Email', 'Role', 'Latest Login', 'SignIn Date', 'Trial Days', 'Billing Start', 'Status'],
      ];
      for (const u of allU) {
        rows.push([
          (u as any).companyName || '',
          u.firstName,
          u.lastName,
          u.email,
          u.roles[0] ? convertUserRole(u.roles[0]) : 'None',
          u.lastLogin ? formatShortDateTime(u.lastLogin) : 'None',
          u.activatedAt ? formatShortDateTime(u.activatedAt) : 'None',
          u.isTrial ? String(u.trialDays) : 'None',
          formatShortDateTime(u.billingStartAt),
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
        ['First Name', 'Last Name', 'Email', 'Company Name', 'Status', 'Deactivation Date', 'Billing Start', 'Last Login', 'Activity Date', 'Quotes Count', 'Deals Count'],
      ];
      for (const u of displayedActivity) {
        rows.push([
          u.firstName,
          u.lastName,
          u.email,
          u.companyName,
          u.status,
          u.deactivatedAt,
          u.billingStartAt,
          u.lastLogin,
          u.date,
          String(u.quotesCount),
          String(u.dealsCount),
        ]);
      }
      const companyName = companies.find((c) => c.key === selectedCompany)?.text || 'All';
      downloadCsv(rows, `users_activity_${selectedDays}_${companyName}.csv`);
    } catch (e) {
      console.error(e);
    }
  };

  const downloadCsv = (rows: string[][], filename: string) => {
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((r) => r.join(',')).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', filename);
    link.click();
  };

  return (
    <div>
      <div className={styles.header}>
        <Title1>Users</Title1>
      </div>

      <Card>
        <TabList
          selectedValue={selectedTab}
          onTabSelect={(_, data) => setSelectedTab(data.value as string)}
          style={{ marginBottom: 16 }}
        >
          <Tab value="general">General</Tab>
          {/*<Tab value="activity">Activity</Tab>*/}
        </TabList>

        {selectedTab === 'general' && (
          <div className={styles.tabContent}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
              <Button
                appearance="subtle"
                icon={<ArrowDownloadRegular />}
                onClick={exportUsersCsv}
                size="small"
              >
                Export CSV
              </Button>
            </div>

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
                          <td className={styles.td} colSpan={11} style={{ textAlign: 'center' }}>
                            <Body1>No users found</Body1>
                          </td>
                        </tr>
                      ) : (
                        users.map((u) => (
                          <tr key={u._id} className={styles.tr}>
                            <td className={styles.td}>{(u as any).companyName || '—'}</td>
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

                <div className={styles.pagination}>
                  <Body1 style={{ color: tokens.colorNeutralForeground3 }}>
                    Showing {users.length} of {totalCount} users
                  </Body1>
                  <div className={styles.paginationButtons}>
                    <Button
                      appearance="subtle"
                      size="small"
                      disabled={pageIndex === 0}
                      onClick={() => handlePageChange(pageIndex - 1)}
                    >
                      Previous
                    </Button>
                    <Body1>
                      Page {pageIndex + 1} of {totalPages || 1}
                    </Body1>
                    <Button
                      appearance="subtle"
                      size="small"
                      disabled={pageIndex >= totalPages - 1}
                      onClick={() => handlePageChange(pageIndex + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {selectedTab === 'activity' && (
          <div className={styles.tabContent}>
            <div className={styles.filters}>
              <Dropdown
                value={companies.find((c) => c.key === selectedCompany)?.text || 'All'}
                selectedOptions={[selectedCompany]}
                onOptionSelect={(_, d) => setSelectedCompany(d.optionValue as string)}
                style={{ minWidth: 200 }}
              >
                {companies.map((c) => (
                  <Option key={c.key} value={c.key}>
                    {c.text}
                  </Option>
                ))}
              </Dropdown>
              <Dropdown
                value={dayOptions.find((d) => d.key === selectedDays)?.text || '7 days'}
                selectedOptions={[selectedDays]}
                onOptionSelect={(_, d) => setSelectedDays(d.optionValue as string)}
                disabled={isActivityLoading}
                style={{ minWidth: 120 }}
              >
                {dayOptions.map((d) => (
                  <Option key={d.key} value={d.key}>
                    {d.text}
                  </Option>
                ))}
              </Dropdown>
              <Button
                appearance="subtle"
                icon={<ArrowDownloadRegular />}
                onClick={exportActivityCsv}
                size="small"
                className={styles.exportBtn}
              >
                Export CSV
              </Button>
            </div>

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
                        <th className={styles.th}>Status</th>
                        <th className={styles.th}>Deactivation</th>
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
                          <td className={styles.td} colSpan={11} style={{ textAlign: 'center' }}>
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

                <div className={styles.pagination}>
                  <Body1 style={{ color: tokens.colorNeutralForeground3 }}>
                    Showing {activitySlice.length} of {displayedActivity.length} records
                  </Body1>
                  <div className={styles.paginationButtons}>
                    <Button
                      appearance="subtle"
                      size="small"
                      disabled={activityPageIndex === 0}
                      onClick={() => setActivityPageIndex(activityPageIndex - 1)}
                    >
                      Previous
                    </Button>
                    <Body1>
                      Page {activityPageIndex + 1} of {activityTotalPages || 1}
                    </Body1>
                    <Button
                      appearance="subtle"
                      size="small"
                      disabled={activityPageIndex >= activityTotalPages - 1}
                      onClick={() => setActivityPageIndex(activityPageIndex + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </Card>

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
    </div>
  );
};

export default UsersPage;
