import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Badge,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  Dropdown,
  Field,
  Input,
  Option,
  Spinner,
  Tab,
  TabList,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
  Title2,
  Title3,
  Tooltip,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  AddRegular,
  ArrowLeft24Regular,
  CheckmarkCircle24Regular,
  Dismiss24Regular,
  EditRegular,
  Person24Regular,
  Building24Regular,
  PeopleCommunity24Regular,
  SaveRegular,
  DismissRegular,
} from '@fluentui/react-icons';
import type { CompanyDetails, CompanyUser } from '../../types/user';
import { CompanyStatus } from '../../types/user';
import {
  getCompanyById,
  getUsersByCompanyId,
  activateOneCompany,
  deactivateOneCompany,
  activateUserFromCompany,
  deactivateUserFromCompany,
  updateCompany,
} from '../../services/users/users';
import { formatShortDateTime } from '../../utils/formatDate';
import { convertUserRole } from '../../utils/convertUserRole';
import EditUserModal from '../common/EditUserModal';
import CreateUserModal from '../common/CreateUserModal';

const allCompanyTypes = ['broker', 'dealer', 'dealer_used'];

const useStyles = makeStyles({
  page: {
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px',
  },
  backBtn: {
    minWidth: 'auto',
  },
  statusBadge: {
    marginLeft: '12px',
  },
  card: {
    marginBottom: '24px',
    padding: '20px',
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
  },
  sectionTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '16px',
  },
  fieldValue: {
    fontWeight: '600',
    color: tokens.colorNeutralForeground1,
  },
  fieldEmpty: {
    color: tokens.colorNeutralForeground4,
    fontStyle: 'italic',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
  },
  tabContent: {
    marginTop: '16px',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  errorMsg: {
    color: tokens.colorPaletteRedForeground1,
    marginTop: '8px',
  },
  successMsg: {
    color: tokens.colorPaletteGreenForeground1,
    marginTop: '8px',
  },
  spinnerWrapper: {
    display: 'flex',
    justifyContent: 'center',
    padding: '48px',
  },
  editActions: {
    display: 'flex',
    gap: '8px',
  },
});

const statusColor = (status: string) => {
  if (status === CompanyStatus.ACTIVE_TRIAL) return 'warning';
  if (status === CompanyStatus.ACTIVE_BILLING) return 'success';
  return 'danger';
};

const InfoField: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => {
  const styles = useStyles();
  return (
    <Field label={label}>
      <Text className={value ? styles.fieldValue : styles.fieldEmpty}>
        {value || '—'}
      </Text>
    </Field>
  );
};

const EditableField: React.FC<{
  label: string;
  value: string;
  onChange: (val: string) => void;
  type?: string;
}> = ({ label, value, onChange, type }) => (
  <Field label={label}>
    <Input value={value} onChange={(_, d) => onChange(d.value)} type={type} />
  </Field>
);

const CompanyDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const styles = useStyles();

  const [company, setCompany] = useState<CompanyDetails | null>(null);
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize] = useState(10);
  const [activeTab, setActiveTab] = useState<'info' | 'users'>('info');

  const [isLoading, setIsLoading] = useState(true);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Record<string, any>>({});
  const [editSaving, setEditSaving] = useState(false);

  // User edit/create modals
  const [editingUser, setEditingUser] = useState<CompanyUser | null>(null);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ open: false, title: '', description: '', onConfirm: () => {} });

  useEffect(() => {
    if (id) loadCompany();
  }, [id]);

  useEffect(() => {
    if (id && activeTab === 'users') loadUsers();
  }, [id, activeTab, pageIndex]);

  const loadCompany = async () => {
    setIsLoading(true);
    setErrorMsg('');
    const data = await getCompanyById(id!);
    if (data) {
      setCompany(data);
    } else {
      setErrorMsg('Failed to load company data.');
    }
    setIsLoading(false);
  };

  const loadUsers = async () => {
    setIsUsersLoading(true);
    const res = await getUsersByCompanyId(id!, pageIndex + 1, pageSize);
    setUsers(res.users);
    setTotalUsers(res.totalCount);
    setIsUsersLoading(false);
  };

  const showConfirm = (title: string, description: string, onConfirm: () => void) => {
    setConfirmDialog({ open: true, title, description, onConfirm });
  };

  const handleActivateCompany = () => {
    showConfirm(
      'Activate Company',
      'Are you sure you want to activate this company and all its users?',
      async () => {
        setConfirmDialog((p) => ({ ...p, open: false }));
        setActionLoading(true);
        const ok = await activateOneCompany(id!);
        if (ok) {
          setSuccessMsg('Company activated successfully.');
          setTimeout(() => setSuccessMsg(''), 4000);
          await loadCompany();
        } else {
          setErrorMsg('Failed to activate company.');
        }
        setActionLoading(false);
      },
    );
  };

  const handleDeactivateCompany = () => {
    showConfirm(
      'Deactivate Company',
      'Are you sure you want to deactivate this company and all its users?',
      async () => {
        setConfirmDialog((p) => ({ ...p, open: false }));
        setActionLoading(true);
        const ok = await deactivateOneCompany(id!);
        if (ok) {
          setSuccessMsg('Company deactivated successfully.');
          setTimeout(() => setSuccessMsg(''), 4000);
          await loadCompany();
        } else {
          setErrorMsg('Failed to deactivate company.');
        }
        setActionLoading(false);
      },
    );
  };

  const handleActivateUser = (userId: string) => {
    showConfirm('Activate User', 'Are you sure you want to activate this user?', async () => {
      setConfirmDialog((p) => ({ ...p, open: false }));
      setIsUsersLoading(true);
      await activateUserFromCompany(userId);
      await loadUsers();
    });
  };

  const handleDeactivateUser = (userId: string) => {
    showConfirm('Deactivate User', 'Are you sure you want to deactivate this user?', async () => {
      setConfirmDialog((p) => ({ ...p, open: false }));
      setIsUsersLoading(true);
      await deactivateUserFromCompany(userId);
      await loadUsers();
    });
  };

  // Edit mode helpers
  const startEditing = () => {
    if (!company) return;
    setEditData({
      name: company.name || '',
      nameOnDisclosure: company.nameOnDisclosure || '',
      type: company.type || '',
      phone: company.phone || '',
      billingName: company.billingName || '',
      billingEmail: company.billingEmail || '',
      billingTaxId: company.billingTaxId || '',
      billingAddress: company.billingAddress || '',
      billingAddressTwo: company.billingAddressTwo || '',
      billingCity: company.billingCity || '',
      billingState: company.billingState || '',
      billingZipCode: company.billingZipCode || '',
      billingCountry: company.billingCountry || '',
      soldToName: company.soldToName || '',
      soldToEmail: company.soldToEmail || '',
      soldToTaxId: company.soldToTaxId || '',
      soldToAddress: company.soldToAddress || '',
      soldToAddressTwo: company.soldToAddressTwo || '',
      soldToCity: company.soldToCity || '',
      soldToState: company.soldToState || '',
      soldToZipCode: company.soldToZipCode || '',
      soldToCountry: company.soldToCountry || '',
    });
    setIsEditing(true);
    setErrorMsg('');
  };

  const discardEditing = () => {
    setIsEditing(false);
    setEditData({});
    setErrorMsg('');
  };

  const saveEditing = async () => {
    setEditSaving(true);
    setErrorMsg('');
    try {
      await updateCompany(id!, editData);
      setIsEditing(false);
      setSuccessMsg('Company updated successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
      await loadCompany();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Failed to update company.');
    } finally {
      setEditSaving(false);
    }
  };

  const updateField = (key: string, value: string) => {
    setEditData((prev) => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className={styles.spinnerWrapper}>
        <Spinner size="large" label="Loading company..." />
      </div>
    );
  }

  if (!company) {
    return (
      <div className={styles.page}>
        <Text className={styles.errorMsg}>Company not found.</Text>
        <Button onClick={() => navigate('/companies')} style={{ marginTop: 16 }}>
          Back to Companies
        </Button>
      </div>
    );
  }

  const isDeactivated = company.status === CompanyStatus.DEACTIVATED;
  const totalPages = Math.ceil(totalUsers / pageSize);

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <Button
          className={styles.backBtn}
          appearance="subtle"
          icon={<ArrowLeft24Regular />}
          onClick={() => navigate('/companies')}
        />
        <Title2>{company.name}</Title2>
        <Badge
          className={styles.statusBadge}
          color={statusColor(company.status)}
          size="large"
        >
          {company.status}
        </Badge>
      </div>

      {/* Action buttons */}
      <div className={styles.actions}>
        {isDeactivated ? (
          <Button
            appearance="primary"
            icon={<CheckmarkCircle24Regular />}
            onClick={handleActivateCompany}
            disabled={actionLoading}
          >
            Activate Company
          </Button>
        ) : (
          <Button
            appearance="secondary"
            icon={<Dismiss24Regular />}
            onClick={handleDeactivateCompany}
            disabled={actionLoading}
          >
            Deactivate Company
          </Button>
        )}
        {actionLoading && <Spinner size="small" />}
      </div>

      {errorMsg && <Text className={styles.errorMsg}>{errorMsg}</Text>}
      {successMsg && <Text className={styles.successMsg}>{successMsg}</Text>}

      {/* Tabs */}
      <TabList
        selectedValue={activeTab}
        onTabSelect={(_, d) => setActiveTab(d.value as 'info' | 'users')}
      >
        <Tab value="info" icon={<Building24Regular />}>Company Info</Tab>
        <Tab value="users" icon={<PeopleCommunity24Regular />}>Users</Tab>
      </TabList>

      <div className={styles.tabContent}>
        {activeTab === 'info' && (
          <>
            {/* Edit / Save / Discard buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
              {!isEditing ? (
                <Button
                  appearance="primary"
                  icon={<EditRegular />}
                  onClick={startEditing}
                >
                  Edit Company
                </Button>
              ) : (
                <div className={styles.editActions}>
                  <Button
                    appearance="secondary"
                    icon={<DismissRegular />}
                    onClick={discardEditing}
                    disabled={editSaving}
                  >
                    Discard
                  </Button>
                  <Button
                    appearance="primary"
                    icon={<SaveRegular />}
                    onClick={saveEditing}
                    disabled={editSaving}
                  >
                    {editSaving ? <Spinner size="tiny" /> : 'Save Changes'}
                  </Button>
                </div>
              )}
            </div>

            {/* Owner Info (read-only always) */}
            <Card className={styles.card}>
              <div className={styles.sectionTitle}>
                <Person24Regular />
                <Title3>Owner Information</Title3>
              </div>
              <div className={styles.grid}>
                <InfoField label="First Name" value={company.owner?.firstName} />
                <InfoField label="Last Name" value={company.owner?.lastName} />
                <InfoField label="Email" value={company.owner?.email} />
                <InfoField label="Phone" value={company.owner?.phone} />
              </div>
            </Card>

            {/* Company Info */}
            <Card className={styles.card}>
              <div className={styles.sectionTitle}>
                <Building24Regular />
                <Title3>Company Information</Title3>
              </div>
              <div className={styles.grid}>
                {isEditing ? (
                  <>
                    <EditableField label="Company Name" value={editData.name} onChange={(v) => updateField('name', v)} />
                    <EditableField label="Name on Disclosure" value={editData.nameOnDisclosure} onChange={(v) => updateField('nameOnDisclosure', v)} />
                    <Field label="Type">
                      <Dropdown
                        value={editData.type || ''}
                        selectedOptions={editData.type ? [editData.type] : []}
                        onOptionSelect={(_, d) => updateField('type', d.optionValue as string)}
                      >
                        {allCompanyTypes.map((t) => (
                          <Option key={t} value={t}>{t}</Option>
                        ))}
                      </Dropdown>
                    </Field>
                    <InfoField label="Licensed Seats" value={company.licensed_seats} />
                    <EditableField label="Phone" value={editData.phone} onChange={(v) => updateField('phone', v)} />
                    <InfoField label="Created At" value={company.createdAt ? formatShortDateTime(company.createdAt) : undefined} />
                  </>
                ) : (
                  <>
                    <InfoField label="Company Name" value={company.name} />
                    <InfoField label="Name on Disclosure" value={company.nameOnDisclosure} />
                    <InfoField label="Type" value={company.type} />
                    <InfoField label="Licensed Seats" value={company.licensed_seats} />
                    <InfoField label="Phone" value={company.phone} />
                    <InfoField label="Created At" value={company.createdAt ? formatShortDateTime(company.createdAt) : undefined} />
                  </>
                )}
              </div>
            </Card>

            {/* Billing Info */}
            <Card className={styles.card}>
              <div className={styles.sectionTitle}>
                <Title3>Billing Information</Title3>
              </div>
              <div className={styles.grid}>
                {isEditing ? (
                  <>
                    <EditableField label="Billing Name" value={editData.billingName} onChange={(v) => updateField('billingName', v)} />
                    <EditableField label="Billing Email" value={editData.billingEmail} onChange={(v) => updateField('billingEmail', v)} type="email" />
                    <EditableField label="Billing Tax ID" value={editData.billingTaxId} onChange={(v) => updateField('billingTaxId', v)} />
                    <EditableField label="Billing Address" value={editData.billingAddress} onChange={(v) => updateField('billingAddress', v)} />
                    <EditableField label="Billing Address 2" value={editData.billingAddressTwo} onChange={(v) => updateField('billingAddressTwo', v)} />
                    <EditableField label="Billing City" value={editData.billingCity} onChange={(v) => updateField('billingCity', v)} />
                    <EditableField label="Billing State" value={editData.billingState} onChange={(v) => updateField('billingState', v)} />
                    <EditableField label="Billing Zip Code" value={editData.billingZipCode} onChange={(v) => updateField('billingZipCode', v)} />
                    <EditableField label="Billing Country" value={editData.billingCountry} onChange={(v) => updateField('billingCountry', v)} />
                  </>
                ) : (
                  <>
                    <InfoField label="Billing Name" value={company.billingName} />
                    <InfoField label="Billing Email" value={company.billingEmail} />
                    <InfoField label="Billing Tax ID" value={company.billingTaxId} />
                    <InfoField label="Billing Address" value={company.billingAddress} />
                    <InfoField label="Billing Address 2" value={company.billingAddressTwo} />
                    <InfoField label="Billing City" value={company.billingCity} />
                    <InfoField label="Billing State" value={company.billingState} />
                    <InfoField label="Billing Zip Code" value={company.billingZipCode} />
                    <InfoField label="Billing Country" value={company.billingCountry} />
                  </>
                )}
              </div>
            </Card>

            {/* Sold To Info */}
            <Card className={styles.card}>
              <div className={styles.sectionTitle}>
                <Title3>Sold To Information</Title3>
              </div>
              <div className={styles.grid}>
                {isEditing ? (
                  <>
                    <EditableField label="Sold To Name" value={editData.soldToName} onChange={(v) => updateField('soldToName', v)} />
                    <EditableField label="Sold To Email" value={editData.soldToEmail} onChange={(v) => updateField('soldToEmail', v)} type="email" />
                    <EditableField label="Sold To Tax ID" value={editData.soldToTaxId} onChange={(v) => updateField('soldToTaxId', v)} />
                    <EditableField label="Sold To Address" value={editData.soldToAddress} onChange={(v) => updateField('soldToAddress', v)} />
                    <EditableField label="Sold To Address 2" value={editData.soldToAddressTwo} onChange={(v) => updateField('soldToAddressTwo', v)} />
                    <EditableField label="Sold To City" value={editData.soldToCity} onChange={(v) => updateField('soldToCity', v)} />
                    <EditableField label="Sold To State" value={editData.soldToState} onChange={(v) => updateField('soldToState', v)} />
                    <EditableField label="Sold To Zip Code" value={editData.soldToZipCode} onChange={(v) => updateField('soldToZipCode', v)} />
                    <EditableField label="Sold To Country" value={editData.soldToCountry} onChange={(v) => updateField('soldToCountry', v)} />
                  </>
                ) : (
                  <>
                    <InfoField label="Sold To Name" value={company.soldToName} />
                    <InfoField label="Sold To Email" value={company.soldToEmail} />
                    <InfoField label="Sold To Tax ID" value={company.soldToTaxId} />
                    <InfoField label="Sold To Address" value={company.soldToAddress} />
                    <InfoField label="Sold To Address 2" value={company.soldToAddressTwo} />
                    <InfoField label="Sold To City" value={company.soldToCity} />
                    <InfoField label="Sold To State" value={company.soldToState} />
                    <InfoField label="Sold To Zip Code" value={company.soldToZipCode} />
                    <InfoField label="Sold To Country" value={company.soldToCountry} />
                  </>
                )}
              </div>
            </Card>

            {/* Dealer / Broker Data (read-only) */}
            {company.dealerData && (
              <Card className={styles.card}>
                <div className={styles.sectionTitle}>
                  <Title3>Dealer Data</Title3>
                </div>
                <div className={styles.grid}>
                  <InfoField label="Dealer Name" value={company.dealerData.dealerName} />
                  <InfoField label="Dealer Legal Name" value={company.dealerData.dealerLegalName} />
                  <InfoField label="Dealer ID" value={company.dealerData.dealerId} />
                  <InfoField label="Default Make" value={company.dealerData.defaultMake} />
                  <InfoField label="State" value={company.dealerData.state} />
                  <InfoField label="Region" value={company.dealerData.region} />
                  <InfoField label="Region Code" value={company.dealerData.regionCode} />
                  <InfoField label="Area" value={company.dealerData.area} />
                  <InfoField label="Area Code" value={company.dealerData.areaCode} />
                  <InfoField label="County" value={company.dealerData.county} />
                  <InfoField label="City" value={company.dealerData.city} />
                  <InfoField label="Zip" value={company.dealerData.zip} />
                  <InfoField label="Address" value={company.dealerData.address} />
                  <InfoField label="Phone" value={company.dealerData.phone} />
                </div>
              </Card>
            )}

            {company.brokerData && (
              <Card className={styles.card}>
                <div className={styles.sectionTitle}>
                  <Title3>Broker Data</Title3>
                </div>
                <div className={styles.grid}>
                  <InfoField label="Broker Name" value={company.brokerData.brokerName} />
                  <InfoField label="Broker Legal Name" value={company.brokerData.brokerLegalName} />
                  <InfoField label="Broker ID" value={company.brokerData.brokerId} />
                  <InfoField label="Default Make" value={company.brokerData.defaultMake} />
                </div>
              </Card>
            )}

            {/* Email Recipients */}
            {company.emailRecipients?.length > 0 && (
              <Card className={styles.card}>
                <div className={styles.sectionTitle}>
                  <Title3>Email Recipients</Title3>
                </div>
                <div className={styles.tableWrapper}>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHeaderCell>Name</TableHeaderCell>
                        <TableHeaderCell>Email</TableHeaderCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {company.emailRecipients.map((r) => (
                        <TableRow key={r._id}>
                          <TableCell>{r.name}</TableCell>
                          <TableCell>{r.email}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            )}
          </>
        )}

        {activeTab === 'users' && (
          <Card className={styles.card}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleGroup}>
                <PeopleCommunity24Regular />
                <Title3>Company Users</Title3>
              </div>
              <Button
                appearance="primary"
                icon={<AddRegular />}
                onClick={() => setIsCreateUserOpen(true)}
              >
                Add User
              </Button>
            </div>
            {isUsersLoading ? (
              <div className={styles.spinnerWrapper}>
                <Spinner size="medium" label="Loading users..." />
              </div>
            ) : (
              <>
                <div className={styles.tableWrapper}>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHeaderCell>First Name</TableHeaderCell>
                        <TableHeaderCell>Last Name</TableHeaderCell>
                        <TableHeaderCell>Email</TableHeaderCell>
                        <TableHeaderCell>Roles</TableHeaderCell>
                        <TableHeaderCell>Status</TableHeaderCell>
                        <TableHeaderCell>Last Login</TableHeaderCell>
                        <TableHeaderCell>Actions</TableHeaderCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7}>
                            <Text>No users found.</Text>
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((u) => (
                          <TableRow key={u._id}>
                            <TableCell>{u.firstName}</TableCell>
                            <TableCell>{u.lastName}</TableCell>
                            <TableCell>{u.email}</TableCell>
                            <TableCell>
                              {u.roles?.length
                                ? u.roles.map((r) => convertUserRole(r)).join(', ')
                                : '—'}
                            </TableCell>
                            <TableCell>
                              <Badge
                                color={
                                  u.status === 'active'
                                    ? 'success'
                                    : u.status === 'invited'
                                    ? 'warning'
                                    : 'danger'
                                }
                              >
                                {u.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {u.lastLogin ? formatShortDateTime(u.lastLogin) : '—'}
                            </TableCell>
                            <TableCell>
                              <div style={{ display: 'flex', gap: 4 }}>
                                <Tooltip content="Edit user" relationship="label">
                                  <Button
                                    size="small"
                                    appearance="subtle"
                                    icon={<EditRegular />}
                                    onClick={() => setEditingUser(u)}
                                  />
                                </Tooltip>
                                {u.status === 'deactivated' ? (
                                  <Tooltip content="Activate user" relationship="label">
                                    <Button
                                      size="small"
                                      appearance="primary"
                                      icon={<CheckmarkCircle24Regular />}
                                      onClick={() => handleActivateUser(u._id)}
                                    />
                                  </Tooltip>
                                ) : (
                                  <Tooltip content="Deactivate user" relationship="label">
                                    <Button
                                      size="small"
                                      appearance="subtle"
                                      icon={<Dismiss24Regular />}
                                      onClick={() => handleDeactivateUser(u._id)}
                                    />
                                  </Tooltip>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 16, alignItems: 'center' }}>
                    <Button
                      size="small"
                      disabled={pageIndex === 0}
                      onClick={() => setPageIndex((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <Text>
                      Page {pageIndex + 1} of {totalPages} ({totalUsers} total)
                    </Text>
                    <Button
                      size="small"
                      disabled={pageIndex + 1 >= totalPages}
                      onClick={() => setPageIndex((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </Card>
        )}
      </div>

      {/* Confirm Dialog */}
      <Dialog open={confirmDialog.open}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>{confirmDialog.title}</DialogTitle>
            <DialogContent>{confirmDialog.description}</DialogContent>
            <DialogActions>
              <DialogTrigger disableButtonEnhancement>
                <Button
                  appearance="secondary"
                  onClick={() => setConfirmDialog((p) => ({ ...p, open: false }))}
                >
                  Cancel
                </Button>
              </DialogTrigger>
              <Button appearance="primary" onClick={confirmDialog.onConfirm}>
                Confirm
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={!!editingUser}
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onSaved={() => {
          setEditingUser(null);
          setSuccessMsg('User updated successfully.');
          setTimeout(() => setSuccessMsg(''), 4000);
          loadUsers();
        }}
      />

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={isCreateUserOpen}
        companyId={id!}
        onClose={() => setIsCreateUserOpen(false)}
        onCreated={() => {
          setIsCreateUserOpen(false);
          setSuccessMsg('User created successfully.');
          setTimeout(() => setSuccessMsg(''), 4000);
          loadUsers();
        }}
      />
    </div>
  );
};

export default CompanyDetailsPage;
