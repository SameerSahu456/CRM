import React, { useState, useRef } from 'react';
import { Download, Upload, FileText, AlertCircle, Loader2, X } from 'lucide-react';
import { bulkImportApi } from '@/services/api';
import { BulkImportResult, BulkImportError } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  entity: string;
  entityLabel: string;
  onSuccess?: () => void;
}

export const BulkImportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  entity,
  entityLabel,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const reset = () => {
    setFile(null);
    setResult(null);
    setError('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleDownloadTemplate = async () => {
    setDownloading(true);
    try {
      await bulkImportApi.downloadTemplate(entity);
    } catch (err: any) {
      setError(err.message || 'Failed to download template');
    } finally {
      setDownloading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setResult(null);
      setError('');
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setError('');
    setResult(null);
    try {
      const res = await bulkImportApi.import(entity, file);
      setResult(res);
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      if (res.imported > 0 && onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const overlayClass = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm';
  const modalClass = 'relative w-full max-w-md mx-4 rounded-2xl shadow-2xl bg-white border border-slate-200 dark:bg-dark-200 dark:border-zinc-800';

  return (
    <div className={overlayClass} onClick={handleClose}>
      <div className={modalClass} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-zinc-800">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Import {entityLabel}
          </h3>
          <button onClick={handleClose} className="p-1.5 rounded-lg transition-colors hover:bg-slate-100 text-slate-400 dark:hover:bg-zinc-800 dark:text-zinc-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Step 1: Download template */}
          <div>
            <div className="text-sm font-medium mb-2 text-slate-700 dark:text-zinc-300">
              Step 1: Download the CSV template
            </div>
            <button
              onClick={handleDownloadTemplate}
              disabled={downloading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:border-zinc-700"
            >
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Download {entityLabel} Template
            </button>
          </div>

          {/* Step 2: Upload CSV */}
          <div>
            <div className="text-sm font-medium mb-2 text-slate-700 dark:text-zinc-300">
              Step 2: Upload your filled CSV
            </div>
            <div
              onClick={() => fileRef.current?.click()}
              className="relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors border-slate-200 hover:border-brand-500/50 bg-slate-50 dark:border-zinc-700 dark:hover:border-brand-500/50 dark:bg-dark-100"
            >
              <input ref={fileRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="w-7 h-7 text-brand-600 dark:text-brand-400" />
                  <div className="text-left">
                    <div className="font-medium text-sm text-slate-900 dark:text-white">{file.name}</div>
                    <div className="text-xs text-slate-400 dark:text-zinc-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); setFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                    className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 dark:hover:bg-zinc-800 dark:text-zinc-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <Upload className="w-7 h-7 mx-auto mb-1.5 text-slate-400 dark:text-zinc-500" />
                  <div className="text-sm text-slate-500 dark:text-zinc-400">
                    Click to select a CSV file
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-xl flex items-center gap-2 text-sm bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 dark:bg-dark-100 dark:border-zinc-800">
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="text-center">
                  <div className="text-xl font-bold text-slate-900 dark:text-white">{result.total}</div>
                  <div className="text-xs text-slate-400 dark:text-zinc-500">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{result.imported}</div>
                  <div className="text-xs text-emerald-600/70 dark:text-emerald-500/70">Imported</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-red-700 dark:text-red-400">{result.errors.length}</div>
                  <div className="text-xs text-red-600/70 dark:text-red-500/70">Errors</div>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 dark:border-zinc-800">
                  <table className="w-full text-xs">
                    <thead className="bg-white dark:bg-dark-200">
                      <tr>
                        <th className="px-2 py-1.5 text-left font-semibold text-slate-500 dark:text-zinc-400">Row</th>
                        <th className="px-2 py-1.5 text-left font-semibold text-slate-500 dark:text-zinc-400">Field</th>
                        <th className="px-2 py-1.5 text-left font-semibold text-slate-500 dark:text-zinc-400">Message</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                      {result.errors.map((err: BulkImportError, i: number) => (
                        <tr key={i}>
                          <td className="px-2 py-1.5 text-slate-700 dark:text-zinc-300">{err.row}</td>
                          <td className="px-2 py-1.5 text-slate-700 dark:text-zinc-300">{err.field}</td>
                          <td className="px-2 py-1.5 text-red-600 dark:text-red-400">{err.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-zinc-800">
          <button
            onClick={handleClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            {result ? 'Close' : 'Cancel'}
          </button>
          {!result && (
            <button
              onClick={handleImport}
              disabled={!file || importing}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {importing ? 'Importing...' : 'Import'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
