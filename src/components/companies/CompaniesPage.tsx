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
  MessageBar,
  MessageBarBody,
  Link,
  Input,
  Dropdown,
  Option,
  Field,
} from '@fluentui/react-components';
import { AddRegular, CheckmarkCircleRegular, DeleteRegular } from '@fluentui/react-icons';
import { useNavigate } from 'react-router-dom';
import {
  findAllCompanyUsers,
  activateOneCompany,
  deactivateOneCompany,
} from '../../services/users/users';
import type { CompanyI } from '../../types/user';
import { CompanyStatus } from '../../types/user';
import { formatShortDateTime } from '../../utils/formatDate';
import ConfirmDialog from '../common/ConfirmDialog';
import CreateCompanyModal from './CreateCompanyModal';
import FilterBar from '../common/FilterBar';
import TablePagination from '../common/TablePagination';

const allCompanyStatuses = Object.values(CompanyStatus);
const allCompanyTypes = ['broker', 'dealer', 'dealer_used'];

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
    padding: '12px 16px',
    borderBottom: `2px solid ${tokens.colorNeutralStroke1}`,
    fontWeight: 600,
    fontSize: '13px',
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  td: {
    padding: '12px 16px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    fontSize: '14px',
  },
  tr: {
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  actions: {
    display: 'flex',
    gap: '4px',
  },
  centered: {
    display: 'flex',
    justifyContent: 'center',
    padding: '40px',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
});

const defaultFilters = { search: '', status: '', type: 'broker' };

const CompaniesPage: React.FC = () => {
  const styles = useStyles();
  const navigate = useNavigate();

  const [companies, setCompanies] = useState<CompanyI[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Draft filter state (what user is editing)
  const [draftFilters, setDraftFilters] = useState(defaultFilters);
  // Applied filter state (what is actually sent to backend)
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);

  const isDirty =
    draftFilters.search !== appliedFilters.search ||
    draftFilters.status !== appliedFilters.status ||
    draftFilters.type !== appliedFilters.type;

  const [companyToActivate, setCompanyToActivate] = useState<string>('');
  const [companyToDeactivate, setCompanyToDeactivate] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchCompanies = useCallback(
    async (p: number, size: number, filters: typeof defaultFilters) => {
      setIsLoading(true);
      const res = await findAllCompanyUsers(p, size, filters.search || undefined, filters.status || undefined, filters.type || undefined);
      setCompanies(res.companies);
      setTotalCount(res.totalCount);
      setTotalPages(res.totalPages);
      setIsLoading(false);
    },
    [],
  );

  useEffect(() => {
    fetchCompanies(page, pageSize, appliedFilters);
  }, [page, pageSize, appliedFilters]);

  const handleApply = () => {
    setAppliedFilters(draftFilters);
    setPage(1);
  };

  const handleClear = () => {
    setDraftFilters(defaultFilters);
  };

  const handleActivate = async (id: string) => {
    setIsLoading(true);
    setCompanyToActivate('');
    await activateOneCompany(id);
    await fetchCompanies(page, pageSize, appliedFilters);
  };

  const handleDeactivate = async (id: string) => {
    setIsLoading(true);
    setCompanyToDeactivate('');
    await deactivateOneCompany(id);
    await fetchCompanies(page, pageSize, appliedFilters);
  };

  const getStatusBadge = (status: CompanyStatus) => {
    switch (status) {
      case CompanyStatus.ACTIVE_TRIAL:
        return <Badge appearance="tint" color="warning">{status}</Badge>;
      case CompanyStatus.ACTIVE_BILLING:
        return <Badge appearance="tint" color="success">{status}</Badge>;
      case CompanyStatus.DEACTIVATED:
        return <Badge appearance="tint" color="danger">{status}</Badge>;
      default:
        return <Badge appearance="tint">Status is Missing</Badge>;
    }
  };

  return (
    <div>
      <div className={styles.header}>
        <Title1>Companies</Title1>
        <Button
          appearance="primary"
          icon={<AddRegular />}
          onClick={() => setIsCreateModalOpen(true)}
        >
          Create Company
        </Button>
      </div>

      {successMessage && (
        <MessageBar intent="success" style={{ marginBottom: 16 }}>
          <MessageBarBody>{successMessage}</MessageBarBody>
        </MessageBar>
      )}

      <FilterBar isDirty={isDirty} onApply={handleApply} onClear={handleClear}>
        <Field label="Search">
          <Input
            placeholder="Name..."
            value={draftFilters.search}
            onChange={(_, d) => setDraftFilters((f) => ({ ...f, search: d.value }))}
            style={{ minWidth: 200 }}
          />
        </Field>
        <Field label="Status">
          <Dropdown
            placeholder="All Statuses"
            value={draftFilters.status || undefined}
            selectedOptions={draftFilters.status ? [draftFilters.status] : []}
            onOptionSelect={(_, d) =>
              setDraftFilters((f) => ({ ...f, status: d.optionValue as string }))
            }
            style={{ minWidth: 160 }}
          >
            <Option value="">All Statuses</Option>
            {allCompanyStatuses.map((s) => (
              <Option key={s} value={s}>{s}</Option>
            ))}
          </Dropdown>
        </Field>
        <Field label="Type">
          <Dropdown
            placeholder="All Types"
            value={draftFilters.type || undefined}
            selectedOptions={draftFilters.type ? [draftFilters.type] : []}
            onOptionSelect={(_, d) =>
              setDraftFilters((f) => ({ ...f, type: d.optionValue as string }))
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

      <Card>
        {isLoading && companies.length === 0 ? (
          <div className={styles.centered}>
            <Spinner size="large" label="Loading companies..." />
          </div>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Company Name</th>
                    <th className={styles.th}>Owner Email</th>
                    <th className={styles.th}>Type</th>
                    <th className={styles.th}>Registration Date</th>
                    <th className={styles.th}>Status</th>
                    <th className={styles.th} style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.length === 0 ? (
                    <tr>
                      <td className={styles.td} colSpan={6} style={{ textAlign: 'center' }}>
                        <Body1>No companies found</Body1>
                      </td>
                    </tr>
                  ) : (
                    companies.map((company) => (
                      <tr key={company._id} className={styles.tr}>
                        <td className={styles.td}>
                          <Link onClick={() => navigate(`/companies/${company._id}`)}>
                            {company.name}
                          </Link>
                        </td>
                        <td className={styles.td}>
                          {company.owner?.email || company.ownerEmail || '—'}
                        </td>
                        <td className={styles.td}>
                          {company.type || '—'}
                        </td>
                        <td className={styles.td}>
                          {company.creationDate
                            ? formatShortDateTime(company.creationDate)
                            : 'None'}
                        </td>
                        <td className={styles.td}>
                          {getStatusBadge(company.status)}
                        </td>
                        <td className={styles.td}>
                          <div className={styles.actions} style={{ justifyContent: 'center' }}>
                            {company.status === CompanyStatus.DEACTIVATED && (
                              <Button
                                appearance="subtle"
                                icon={<CheckmarkCircleRegular />}
                                size="small"
                                title="Activate"
                                onClick={() => setCompanyToActivate(company._id)}
                              />
                            )}
                            {company.status !== CompanyStatus.DEACTIVATED && (
                              <Button
                                appearance="subtle"
                                icon={<DeleteRegular />}
                                size="small"
                                title="Deactivate"
                                onClick={() => setCompanyToDeactivate(company._id)}
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
              onPageSizeChange={setPageSize}
              itemLabel="companies"
            />
          </>
        )}
      </Card>

      {companyToActivate && (
        <ConfirmDialog
          title="Activate selected company?"
          confirmText="Activate"
          intent="success"
          onConfirm={() => handleActivate(companyToActivate)}
          onCancel={() => setCompanyToActivate('')}
        />
      )}

      {companyToDeactivate && (
        <ConfirmDialog
          title="Deactivate selected company?"
          confirmText="Deactivate"
          intent="danger"
          onConfirm={() => handleDeactivate(companyToDeactivate)}
          onCancel={() => setCompanyToDeactivate('')}
        />
      )}

      <CreateCompanyModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={(success) => {
          setIsCreateModalOpen(false);
          if (success) {
            setSuccessMessage('Company created successfully');
            setTimeout(() => setSuccessMessage(''), 5000);
            fetchCompanies(page, pageSize, appliedFilters);
          }
        }}
      />
    </div>
  );
};

export default CompaniesPage;
