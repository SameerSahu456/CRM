import React, { useState, useRef } from 'react';
import { Download, Upload, FileText, AlertCircle, Loader2, X } from 'lucide-react';
import { bulkImportApi } from '../services/api';
import { BulkImportResult, BulkImportError } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  entity: string;
  entityLabel: string;
  isDark: boolean;
  onSuccess?: () => void;
}

export const BulkImportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  entity,
  entityLabel,
  isDark,
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
  const modalClass = `relative w-full max-w-md mx-4 rounded-2xl shadow-2xl ${
    isDark ? 'bg-dark-200 border border-zinc-800' : 'bg-white border border-slate-200'
  }`;

  return (
    <div className={overlayClass} onClick={handleClose}>
      <div className={modalClass} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Import {entityLabel}
          </h3>
          <button onClick={handleClose} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-400'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Step 1: Download template */}
          <div>
            <div className={`text-sm font-medium mb-2 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
              Step 1: Download the CSV template
            </div>
            <button
              onClick={handleDownloadTemplate}
              disabled={downloading}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isDark
                  ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Download {entityLabel} Template
            </button>
          </div>

          {/* Step 2: Upload CSV */}
          <div>
            <div className={`text-sm font-medium mb-2 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
              Step 2: Upload your filled CSV
            </div>
            <div
              onClick={() => fileRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                isDark
                  ? 'border-zinc-700 hover:border-brand-500/50 bg-dark-100'
                  : 'border-slate-200 hover:border-brand-500/50 bg-slate-50'
              }`}
            >
              <input ref={fileRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className={`w-7 h-7 ${isDark ? 'text-brand-400' : 'text-brand-600'}`} />
                  <div className="text-left">
                    <div className={`font-medium text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{file.name}</div>
                    <div className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                      {(file.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); setFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                    className={`p-1 rounded-lg ${isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-200 text-slate-400'}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <Upload className={`w-7 h-7 mx-auto mb-1.5 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                  <div className={`text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    Click to select a CSV file
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className={`p-3 rounded-xl flex items-center gap-2 text-sm ${
              isDark ? 'bg-red-900/20 border border-red-800 text-red-400' : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Results */}
          {result && (
            <div className={`p-4 rounded-xl ${isDark ? 'bg-dark-100 border border-zinc-800' : 'bg-slate-50 border border-slate-200'}`}>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="text-center">
                  <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{result.total}</div>
                  <div className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Total</div>
                </div>
                <div className="text-center">
                  <div className={`text-xl font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>{result.imported}</div>
                  <div className={`text-xs ${isDark ? 'text-emerald-500/70' : 'text-emerald-600/70'}`}>Imported</div>
                </div>
                <div className="text-center">
                  <div className={`text-xl font-bold ${isDark ? 'text-red-400' : 'text-red-700'}`}>{result.errors.length}</div>
                  <div className={`text-xs ${isDark ? 'text-red-500/70' : 'text-red-600/70'}`}>Errors</div>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className={`max-h-40 overflow-y-auto rounded-lg border ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
                  <table className="w-full text-xs">
                    <thead className={isDark ? 'bg-dark-200' : 'bg-white'}>
                      <tr>
                        <th className={`px-2 py-1.5 text-left font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Row</th>
                        <th className={`px-2 py-1.5 text-left font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Field</th>
                        <th className={`px-2 py-1.5 text-left font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Message</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-zinc-800' : 'divide-slate-100'}`}>
                      {result.errors.map((err: BulkImportError, i: number) => (
                        <tr key={i}>
                          <td className={`px-2 py-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>{err.row}</td>
                          <td className={`px-2 py-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>{err.field}</td>
                          <td className={`px-2 py-1.5 ${isDark ? 'text-red-400' : 'text-red-600'}`}>{err.message}</td>
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
        <div className={`flex justify-end gap-3 px-6 py-4 border-t ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
          <button
            onClick={handleClose}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              isDark ? 'text-zinc-400 hover:bg-zinc-800' : 'text-slate-500 hover:bg-slate-100'
            }`}
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
