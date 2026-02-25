import React, { useState } from 'react';
import {
  Button,
  Card,
  Field,
  Input,
  Spinner,
  Title1,
  Body1,
  MessageBar,
  MessageBarBody,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { EyeRegular, EyeOffRegular } from '@fluentui/react-icons';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/images/ai-sales-logo-dark.svg';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
  },
  leftPanel: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    padding: '40px',
  },
  rightPanel: {
    flex: 1,
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    '@media (max-width: 768px)': {
      display: 'none',
    },
  },
  rightContent: {
    textAlign: 'center',
    color: '#ffffff',
    maxWidth: '400px',
  },
  rightTitle: {
    color: '#ffffff',
    fontSize: '32px',
    fontWeight: 700,
    marginBottom: '16px',
  },
  rightSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '16px',
    lineHeight: '24px',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    padding: '40px',
    boxShadow: 'none',
    border: 'none',
  },
  logo: {
    height: '40px',
    marginBottom: '32px',
  },
  title: {
    marginBottom: '8px',
  },
  subtitle: {
    color: tokens.colorNeutralForeground3,
    marginBottom: '32px',
    display: 'block',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  forgotPassword: {
    textAlign: 'right' as const,
    marginTop: '-8px',
  },
  submitButton: {
    marginTop: '8px',
    height: '44px',
  },
});

const LoginPage: React.FC = () => {
  const styles = useStyles();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showUndertakeDialog, setShowUndertakeDialog] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      const result = await login({ email, password });
      if (result.message === 'This user is already logged in') {
        setShowUndertakeDialog(true);
      } else if (result.message) {
        setErrorMessage(result.message);
      }
    } catch (err: any) {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUndertakeSession = async () => {
    setShowUndertakeDialog(false);
    setIsLoading(true);
    setErrorMessage('');
    try {
      const result = await login({ email, password, isUndertakeSession: true });
      if (result.message) {
        setErrorMessage(result.message);
      }
    } catch (err: any) {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.leftPanel}>
        <Card className={styles.card}>
          <img src={logo} alt="Cars311" className={styles.logo} />
          <Title1 className={styles.title}>Welcome back</Title1>
          <Body1 className={styles.subtitle}>
            Sign in to the admin panel
          </Body1>

          {errorMessage && (
            <MessageBar intent="error" style={{ marginBottom: 16 }}>
              <MessageBarBody>{errorMessage}</MessageBarBody>
            </MessageBar>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <Field label="Email" required>
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(_, data) => setEmail(data.value)}
                size="large"
                appearance="outline"
              />
            </Field>

            <Field label="Password" required>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(_, data) => setPassword(data.value)}
                size="large"
                appearance="outline"
                contentAfter={
                  <Button
                    appearance="transparent"
                    icon={showPassword ? <EyeOffRegular /> : <EyeRegular />}
                    size="small"
                    onClick={() => setShowPassword(!showPassword)}
                    type="button"
                  />
                }
              />
            </Field>

            <Button
              appearance="primary"
              type="submit"
              disabled={isLoading || !email || !password}
              className={styles.submitButton}
              size="large"
            >
              {isLoading ? <Spinner size="tiny" /> : 'Sign In'}
            </Button>
          </form>
        </Card>
      </div>
      <div className={styles.rightPanel}>
        <div className={styles.rightContent}>
          <div className={styles.rightTitle}>Cars311 Admin Panel</div>
          <div className={styles.rightSubtitle}>
            Manage your companies, users, and reports all in one place.
            Streamline your workflow with powerful admin tools.
          </div>
        </div>
      </div>

      <Dialog open={showUndertakeDialog} onOpenChange={(_, data) => { if (!data.open) setShowUndertakeDialog(false); }}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Session Already Active</DialogTitle>
            <DialogContent>
              This account is already logged in on another device or browser.
              Do you want to sign out the other session and continue here?
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setShowUndertakeDialog(false)}>
                Cancel
              </Button>
              <Button appearance="primary" onClick={handleUndertakeSession}>
                Take Over Session
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};

export default LoginPage;
