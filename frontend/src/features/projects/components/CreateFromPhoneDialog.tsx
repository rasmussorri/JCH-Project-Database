import { useCallback, useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Loader2, CheckCircle, Smartphone } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../ui/dialog';
import { Button } from '../../../ui/button';
import { supabase } from '../../../lib/supabaseClient';
import { createCreationSession } from '../services/projectService';

interface CreateFromPhoneDialogProps {
  onProjectCreated: () => void;
  onFallbackClick: () => void;
  existingCategories: string[];
  /** When set, dialog open state is controlled by parent and the "+ Add Project" button is not rendered. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreateFromPhoneDialog({
  onProjectCreated,
  onFallbackClick,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: CreateFromPhoneDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined && controlledOnOpenChange !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = useCallback(
    (v: boolean) => {
      if (isControlled) {
        controlledOnOpenChange?.(v);
      } else {
        setInternalOpen(v);
      }
    },
    [isControlled, controlledOnOpenChange]
  );
  const [loading, setLoading] = useState(false);
  const [createUrl, setCreateUrl] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState(false);
  const [copied, setCopied] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const initSession = useCallback(async () => {
    setLoading(true);
    setError('');
    setCompleted(false);
    setCreateUrl('');
    setToken('');

    try {
      const session = await createCreationSession(window.location.origin);
      setCreateUrl(session.createUrl);
      setToken(session.token);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create session.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    initSession();
  }, [open, initSession]);

  useEffect(() => {
    if (!token || !open) return;

    const channel = supabase
      .channel(`creation-session-${token}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'creation_sessions',
          filter: `token=eq.${token}`,
        },
        (payload) => {
          if (payload.new && (payload.new as Record<string, unknown>).completed_at) {
            setCompleted(true);
            onProjectCreated();
            setTimeout(() => setOpen(false), 3000);
          }
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [token, open, onProjectCreated, setOpen]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(createUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard not available */
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setCreateUrl('');
      setToken('');
      setError('');
      setCompleted(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!isControlled && (
        <Button
          variant="outline"
          onClick={() => setOpen(true)}
          className="border-white text-white hover:bg-white/10 hover:text-white"
        >
          + Add Project
        </Button>
      )}
      <DialogContent
        className="max-w-[calc(100%-1rem)] sm:max-w-md bg-slate-900 border-slate-800"
        aria-describedby="create-from-phone-desc"
      >
        <DialogHeader>
          <DialogTitle className="text-slate-100 flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Create from Phone
          </DialogTitle>
          <DialogDescription id="create-from-phone-desc" className="text-slate-400">
            Scan the QR code on your phone to fill out the project form.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-5 py-4">
          {loading && (
            <div className="flex items-center gap-2 text-slate-400 py-12">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Creating session...</span>
            </div>
          )}

          {error && (
            <div className="w-full rounded-lg border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {completed && (
            <div className="flex flex-col items-center gap-3 py-8">
              <CheckCircle className="w-14 h-14 text-green-500" />
              <p className="text-lg font-medium text-slate-100">Project created!</p>
              <p className="text-sm text-slate-400">
                This dialog will close automatically.
              </p>
            </div>
          )}

          {createUrl && !completed && (
            <>
              <div className="p-3 sm:p-4 bg-white rounded-xl w-fit mx-auto">
                <QRCodeSVG value={createUrl} size={220} level="M" includeMargin={false} className="w-[180px] h-[180px] sm:w-[220px] sm:h-[220px]" />
              </div>

              <div className="w-full flex items-center gap-2 p-3 bg-slate-800 rounded-lg border border-slate-700">
                <input
                  type="text"
                  value={createUrl}
                  readOnly
                  className="flex-1 bg-transparent text-slate-300 text-xs focus:outline-none truncate"
                />
                <Button variant="ghost" size="icon" onClick={handleCopy} className="flex-shrink-0">
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-400" />
                  )}
                </Button>
              </div>

              <div className="flex flex-col items-center gap-1 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Waiting for project to be created...
                </div>
                <p className="text-xs text-slate-500">
                  Please refresh the page after creating the project.
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onFallbackClick();
            }}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors underline underline-offset-2"
          >
            Create from desktop instead
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
