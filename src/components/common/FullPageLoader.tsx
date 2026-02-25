import React from 'react';
import { Spinner, makeStyles } from '@fluentui/react-components';

const useStyles = makeStyles({
  overlay: {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
});

const FullPageLoader: React.FC = () => {
  const styles = useStyles();
  return (
    <div className={styles.overlay}>
      <Spinner size="large" label="Loading..." />
    </div>
  );
};

export default FullPageLoader;
