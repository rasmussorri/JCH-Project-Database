import { useState, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { Upload, X, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../../ui/button';
import { ImageWithFallback } from '../../../components/ImageWithFallback';
import { signUpload } from '../services/uploadService';

function getFileExtension(file: File): string {
  const fromName = file.name.split('.').pop();
  if (fromName) return fromName.toLowerCase();
  const fromType = file.type.split('/').pop();
  return fromType ? fromType.toLowerCase() : 'jpg';
}

export function UploadPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 p-4 flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <h1 className="text-2xl font-semibold text-slate-100">
            Invalid upload link
          </h1>
          <p className="text-slate-400">
            The upload token is missing or invalid.
          </p>
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to projects
          </Button>
        </div>
      </div>
    );
  }

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setError(null);
    setUploaded(false);

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setPreview(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreview(null);
  };

  const handleUpload = async () => {
    if (!selectedFile || !token) return;

    setUploading(true);
    setError(null);

    try {
      const fileExt = getFileExtension(selectedFile);
      const signedUrl = await signUpload(
        token,
        fileExt,
        selectedFile.type || 'image/jpeg',
      );

      const response = await fetch(signedUrl, {
        method: 'PUT',
        headers: {
          'content-type': selectedFile.type || 'image/jpeg',
          'x-upsert': 'true',
        },
        body: selectedFile,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      setUploaded(true);
      setSelectedFile(null);
      setPreview(null);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Kuvien lähettäminen epäonnistui. Yritä uudelleen.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4 text-slate-400 hover:text-slate-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to projects
          </Button>
          <p className="text-xs text-slate-500 mb-1">JHC Project Database</p>
          <h1 className="text-2xl font-semibold text-slate-100 mb-2">
            Lähetä kuvia
          </h1>
          <p className="text-slate-400">
            Valitse kuva ja lataa se projektiin.
          </p>
        </div>

        <div className="bg-slate-900 rounded-lg border border-slate-800 p-6 space-y-6">
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-dashed border-2 border-slate-700 hover:border-cyan-500 bg-slate-800/50 text-slate-300"
              disabled={uploading || uploaded}
            >
              <Upload className="w-5 h-5 mr-2" />
              Valitse kuva
            </Button>
            <p className="text-xs text-slate-500 mt-2 text-center">
              Voit ottaa kuvan suoraan kameralla
            </p>
          </div>

          {preview && selectedFile && (
            <div className="space-y-4">
              <h3 className="text-slate-300 font-medium">
                Valittu kuva
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="relative group aspect-square rounded-lg overflow-hidden bg-slate-800">
                  <ImageWithFallback
                    src={preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={removeFile}
                    className="absolute top-2 right-2 p-1.5 bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={uploading || uploaded}
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-slate-900/80 text-xs text-slate-300">
                    {selectedFile.name}
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {uploaded && (
            <div className="p-4 bg-green-900/20 border border-green-800 rounded-lg text-green-400 text-sm flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Uploaded, you can close this page.
            </div>
          )}

          {selectedFile && !uploaded && (
            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Lähetetään...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Lähetä kuva
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
