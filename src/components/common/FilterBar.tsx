import React from 'react';
import { Button, Card, makeStyles, tokens } from '@fluentui/react-components';
import { FilterRegular, DismissRegular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  filterCard: {
    marginBottom: '16px',
    padding: '16px',
  },
  filterHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  filterTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontWeight: 600,
    fontSize: '13px',
    color: tokens.colorNeutralForeground2,
  },
  filterFields: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
  },
  filterActions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    marginLeft: 'auto',
  },
});

interface FilterBarProps {
  children: React.ReactNode;
  isDirty: boolean;
  onApply: () => void;
  onClear: () => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ children, isDirty, onApply, onClear }) => {
  const styles = useStyles();

  return (
    <Card className={styles.filterCard}>
      <div className={styles.filterHeader}>
        <span className={styles.filterTitle}>
          <FilterRegular />
          Filters
        </span>
      </div>
      <div className={styles.filterFields}>
        {children}
        <div className={styles.filterActions}>
          <Button
            appearance="subtle"
            icon={<DismissRegular />}
            size="small"
            onClick={onClear}
          >
            Clear All
          </Button>
          <Button
            appearance="primary"
            size="small"
            disabled={!isDirty}
            onClick={onApply}
          >
            Apply
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default FilterBar;
