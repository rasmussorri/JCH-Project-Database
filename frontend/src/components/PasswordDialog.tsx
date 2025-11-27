import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Lock } from 'lucide-react';

interface PasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (password: string) => void;
  projectTitle: string;
  hasProjectPassword: boolean;
  error?: string;
}

export function PasswordDialog({
  open,
  onOpenChange,
  onConfirm,
  projectTitle,
  hasProjectPassword,
  error: externalError,
}: PasswordDialogProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const displayError = externalError || error;

  const handleSubmit = () => {
    if (!password.trim()) {
      setError('Password is required');
      return;
    }
    setError('');
    onConfirm(password.trim());
    setPassword('');
  };

  const handleCancel = () => {
    setPassword('');
    setError('');
    onOpenChange(false);
  };

  // Reset password and error when dialog closes
  useEffect(() => {
    if (!open) {
      setPassword('');
      setError('');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="bg-slate-900 border-slate-800 z-[60]">
        <DialogHeader>
          <DialogTitle className="text-slate-100 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Confirm Deletion
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            To delete <span className="font-semibold text-slate-300">{projectTitle}</span>, please enter the password.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {hasProjectPassword ? (
            <p className="text-sm text-slate-400">
              Enter the project password or admin password to proceed.
            </p>
          ) : (
            <p className="text-sm text-slate-400">
              Enter the admin password to proceed.
            </p>
          )}
          <label className="flex flex-col gap-2">
            <span className="text-sm text-slate-400">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSubmit();
                }
              }}
              placeholder="Enter password"
              className={`rounded-lg border px-4 py-2 bg-slate-800 text-slate-100 focus:border-cyan-500 focus:outline-none ${
                displayError ? 'border-red-600' : 'border-slate-700'
              }`}
              autoFocus
            />
            {displayError && (
              <span className="text-sm text-red-500">{displayError}</span>
            )}
          </label>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="text-slate-300 hover:text-slate-100"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

