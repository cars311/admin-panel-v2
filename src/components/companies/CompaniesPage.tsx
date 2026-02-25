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
  pagination: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 0',
    gap: '12px',
  },
  paginationButtons: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
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
});

const CompaniesPage: React.FC = () => {
  const styles = useStyles();
  const navigate = useNavigate();

  const [companies, setCompanies] = useState<CompanyI[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [companyToActivate, setCompanyToActivate] = useState<string>('');
  const [companyToDeactivate, setCompanyToDeactivate] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchCompanies = useCallback(async (page: number, size: number) => {
    setIsLoading(true);
    const res = await findAllCompanyUsers(page + 1, size);
    setCompanies(res.companies);
    setPageIndex(res.currentPage - 1);
    setTotalCount(res.totalCount);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchCompanies(pageIndex, pageSize);
  }, []);

  const handleActivate = async (id: string) => {
    setIsLoading(true);
    setCompanyToActivate('');
    await activateOneCompany(id);
    await fetchCompanies(pageIndex, pageSize);
  };

  const handleDeactivate = async (id: string) => {
    setIsLoading(true);
    setCompanyToDeactivate('');
    await deactivateOneCompany(id);
    await fetchCompanies(pageIndex, pageSize);
  };

  const handlePageChange = (newPage: number) => {
    setPageIndex(newPage);
    fetchCompanies(newPage, pageSize);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

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

      <Card>
        {isLoading && companies.length === 0 ? (
          <div className={styles.centered}>
            <Spinner size="large" label="Loading companies..." />
          </div>
        ) : (
          <>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Company Name</th>
                  <th className={styles.th}>Owner Email</th>
                  <th className={styles.th}>Registration Date</th>
                  <th className={styles.th}>Status</th>
                  <th className={styles.th} style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {companies.length === 0 ? (
                  <tr>
                    <td className={styles.td} colSpan={5} style={{ textAlign: 'center' }}>
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

            <div className={styles.pagination}>
              <Body1 style={{ color: tokens.colorNeutralForeground3 }}>
                Showing {companies.length} of {totalCount} companies
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
            fetchCompanies(pageIndex, pageSize);
          }
        }}
      />
    </div>
  );
};

export default CompaniesPage;
