import React from 'react';
import { Button, Body1, Dropdown, Option, makeStyles, tokens } from '@fluentui/react-components';

const useStyles = makeStyles({
  pagination: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 0',
    flexWrap: 'wrap',
    gap: '12px',
  },
  paginationLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  paginationRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  pageBtn: {
    minWidth: '32px',
  },
});

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

interface TablePaginationProps {
  page: number; // 1-based
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  itemLabel?: string;
}

const TablePagination: React.FC<TablePaginationProps> = ({
  page,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
  itemLabel = 'items',
}) => {
  const styles = useStyles();

  const getPageNumbers = (): (number | '...')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | '...')[] = [1];
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className={styles.pagination}>
      <div className={styles.paginationLeft}>
        <Body1 style={{ color: tokens.colorNeutralForeground3 }}>
          {totalCount} {itemLabel}
        </Body1>
        <Dropdown
          value={`${pageSize} / page`}
          selectedOptions={[String(pageSize)]}
          onOptionSelect={(_, d) => {
            onPageSizeChange(Number(d.optionValue));
            onPageChange(1);
          }}
          style={{ minWidth: 120 }}
        >
          {PAGE_SIZE_OPTIONS.map((s) => (
            <Option key={s} value={String(s)}>
              {s} / page
            </Option>
          ))}
        </Dropdown>
      </div>

      {totalPages > 1 && (
        <div className={styles.paginationRight}>
          <Button
            appearance="subtle"
            size="small"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            ‹
          </Button>
          {getPageNumbers().map((p, idx) =>
            p === '...' ? (
              <Body1 key={`ellipsis-${idx}`} style={{ padding: '0 4px' }}>…</Body1>
            ) : (
              <Button
                key={p}
                appearance={p === page ? 'primary' : 'subtle'}
                size="small"
                className={styles.pageBtn}
                onClick={() => onPageChange(p as number)}
              >
                {p}
              </Button>
            ),
          )}
          <Button
            appearance="subtle"
            size="small"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            ›
          </Button>
        </div>
      )}
    </div>
  );
};

export default TablePagination;
