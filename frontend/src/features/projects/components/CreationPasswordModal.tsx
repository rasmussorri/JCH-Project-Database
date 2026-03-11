import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../ui/dialog';
import { Button } from '../../../ui/button';
import { Lock } from 'lucide-react';
import { verifyCreationPassword } from '../services/projectService';

interface CreationPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (password: string) => void;
}

export function CreationPasswordModal({
  open,
  onOpenChange,
  onSuccess,
}: CreationPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleSubmit = async () => {
    if (!password.trim()) {
      setError('Enter the creation password.');
      return;
    }
    setError('');
    setVerifying(true);
    try {
      await verifyCreationPassword(password.trim());
      onSuccess(password.trim());
      setPassword('');
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Incorrect password');
    } finally {
      setVerifying(false);
    }
  };

  const handleCancel = () => {
    setPassword('');
    setError('');
    onOpenChange(false);
  };

  useEffect(() => {
    if (!open) {
      setPassword('');
      setError('');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? undefined : handleCancel())}>
      <DialogContent
        className="max-w-[calc(100%-2rem)] w-full sm:max-w-md bg-slate-900 border-slate-800"
        aria-describedby="creation-password-desc"
      >
        <DialogHeader>
          <DialogTitle className="text-slate-100 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Enter creation password
          </DialogTitle>
          <DialogDescription id="creation-password-desc" className="text-slate-400">
            A password is required to create new projects.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
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
                if (e.key === 'Enter') handleSubmit();
              }}
              placeholder="Enter password"
              className={`rounded-lg border px-4 py-2 bg-slate-800 text-slate-100 focus:border-cyan-500 focus:outline-none ${
                error ? 'border-red-600' : 'border-slate-700'
              }`}
              autoFocus
              disabled={verifying}
              autoComplete="off"
              data-1p-ignore=""
              data-lpignore="true"
            />
            {error && (
              <span className="text-sm text-red-500">{error}</span>
            )}
          </label>
        </div>
        <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="text-slate-300 hover:text-slate-100"
            disabled={verifying}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={verifying}
            className="bg-cyan-600 hover:bg-cyan-500 text-white"
          >
            {verifying ? 'Checking…' : 'Continue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
