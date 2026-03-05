import { QRCodeSVG } from 'qrcode.react';
import { Copy, Share2, Check, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../../ui/button';
import { createUploadSession } from '../services/uploadService';

interface UploadLinkProps {
  projectId: string;
  projectTitle: string;
}

export function UploadLink({ projectId, projectTitle }: UploadLinkProps) {
  const [copied, setCopied] = useState(false);
  const [password, setPassword] = useState('');
  const [uploadUrl, setUploadUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(uploadUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Lähetä kuvia projektiin: ${projectTitle}`,
          text: `Lähetä kuvia projektiin ${projectTitle}`,
          url: uploadUrl,
        });
      } catch {
        console.log('Share cancelled or failed');
      }
    } else {
      handleCopy();
    }
  };

  const handleGenerate = async () => {
    if (loading) return;
    if (!password.trim()) {
      setError('Enter the project PIN or admin password to continue.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const url = await createUploadSession(
        projectId,
        password,
        window.location.origin,
      );
      setUploadUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-6 bg-slate-800/50 rounded-lg border border-slate-700">
      <div className="space-y-2">
        <h3 className="text-slate-200 font-semibold flex items-center gap-2">
          <Share2 className="w-5 h-5" />
          Lähetä kuvia puhelimesta
        </h3>
        <p className="text-sm text-slate-400">
          Luo QR-koodi syöttämällä projektin PIN-koodi tai ylläpitosalasana.
        </p>
      </div>

      <div className="space-y-3">
        <label className="flex flex-col gap-2">
          <span className="text-sm text-slate-400">Project PIN / Admin password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError('');
            }}
            placeholder="Enter PIN or admin password"
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
          />
        </label>

        <Button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating link...
            </>
          ) : (
            'Generate upload link'
          )}
        </Button>

        {error && (
          <div className="rounded-lg border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">
            {error}
          </div>
        )}
      </div>

      {uploadUrl && (
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-white rounded-lg">
            <QRCodeSVG
              value={uploadUrl}
              size={200}
              level="M"
              includeMargin={false}
            />
          </div>

          <div className="w-full space-y-2">
            <div className="flex items-center gap-2 p-3 bg-slate-900 rounded-lg border border-slate-700">
              <input
                type="text"
                value={uploadUrl}
                readOnly
                className="flex-1 bg-transparent text-slate-300 text-sm focus:outline-none"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopy}
                className="flex-shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 text-slate-400" />
                )}
              </Button>
            </div>

            {'share' in navigator && typeof navigator.share === 'function' && (
              <Button
                variant="outline"
                onClick={handleShare}
                className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Jaa linkki
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
