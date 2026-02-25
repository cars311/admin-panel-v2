import React from 'react';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@fluentui/react-components';

interface ConfirmDialogProps {
  title: string;
  message?: string;
  confirmText: string;
  cancelText?: string;
  intent?: 'success' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  message,
  confirmText,
  cancelText = 'Cancel',
  intent = 'danger',
  onConfirm,
  onCancel,
}) => {
  return (
    <Dialog open onOpenChange={(_, data) => !data.open && onCancel()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>{title}</DialogTitle>
          {message && <DialogContent>{message}</DialogContent>}
          <DialogActions>
            <Button appearance="secondary" onClick={onCancel}>
              {cancelText}
            </Button>
            <Button
              appearance="primary"
              onClick={onConfirm}
              style={
                intent === 'danger'
                  ? { backgroundColor: '#d13438', borderColor: '#d13438' }
                  : { backgroundColor: '#107c10', borderColor: '#107c10' }
              }
            >
              {confirmText}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

export default ConfirmDialog;
