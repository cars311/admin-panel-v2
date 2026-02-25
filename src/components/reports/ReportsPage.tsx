import React from 'react';
import {
  Card,
  Title1,
  Body1,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { WrenchRegular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    gap: '24px',
  },
  card: {
    padding: '64px',
    textAlign: 'center',
    maxWidth: '500px',
    width: '100%',
  },
  icon: {
    fontSize: '64px',
    color: tokens.colorBrandForeground1,
    marginBottom: '16px',
  },
  subtitle: {
    color: tokens.colorNeutralForeground3,
    marginTop: '8px',
  },
});

const ReportsPage: React.FC = () => {
  const styles = useStyles();

  return (
    <div>
      <Title1 style={{ marginBottom: 24, display: 'block' }}>Reports</Title1>
      <div className={styles.container}>
        <Card className={styles.card}>
          <WrenchRegular className={styles.icon} />
          <Title1>Under Construction</Title1>
          <Body1 className={styles.subtitle}>
            The Reports page is currently being developed. Check back soon for
            analytics and insights.
          </Body1>
        </Card>
      </div>
    </div>
  );
};

export default ReportsPage;
