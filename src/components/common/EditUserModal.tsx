import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Field,
  Input,
  Dropdown,
  Option,
  Spinner,
  MessageBar,
  MessageBarBody,
  makeStyles,
} from '@fluentui/react-components';
import { updateUser } from '../../services/users/users';
import { UserRole } from '../../types/user';
import { convertUserRole } from '../../utils/convertUserRole';

const allRoles = Object.values(UserRole);

const useStyles = makeStyles({
  surface: {
    maxWidth: '480px',
    width: '90vw',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
});

interface EditUserModalProps {
  isOpen: boolean;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    roles: string[];
  } | null;
  onClose: () => void;
  onSaved: () => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, user, onClose, onSaved }) => {
  const styles = useStyles();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [roles, setRoles] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setEmail(user.email || '');
      setPhone((user as any).phone || '');
      setRoles(user.roles || []);
      setError('');
    }
  }, [isOpen, user]);

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim() || roles.length === 0) {
      setError('All fields are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await updateUser(user!._id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        roles,
      });
      onSaved();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update user.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <Dialog open onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface className={styles.surface}>
        <DialogBody>
          <DialogTitle>Edit User</DialogTitle>
          <DialogContent>
            <div className={styles.form}>
              {error && (
                <MessageBar intent="error">
                  <MessageBarBody>{error}</MessageBarBody>
                </MessageBar>
              )}
              <Field label="First Name" required>
                <Input
                  value={firstName}
                  onChange={(_, d) => setFirstName(d.value)}
                />
              </Field>
              <Field label="Last Name" required>
                <Input
                  value={lastName}
                  onChange={(_, d) => setLastName(d.value)}
                />
              </Field>
              <Field label="Email" required>
                <Input
                  type="email"
                  value={email}
                  onChange={(_, d) => setEmail(d.value)}
                />
              </Field>
              <Field label="Phone" required>
                <Input
                  value={phone}
                  onChange={(_, d) => setPhone(d.value)}
                />
              </Field>
              <Field label="Role" required>
                <Dropdown
                  value={roles.map((r) => convertUserRole(r as any)).join(', ')}
                  selectedOptions={roles}
                  multiselect
                  onOptionSelect={(_, d) => setRoles(d.selectedOptions)}
                >
                  {allRoles.map((r) => (
                    <Option key={r} value={r}>
                      {convertUserRole(r)}
                    </Option>
                  ))}
                </Dropdown>
              </Field>
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button appearance="primary" onClick={handleSave} disabled={saving}>
              {saving ? <Spinner size="tiny" /> : 'Save'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

export default EditUserModal;
