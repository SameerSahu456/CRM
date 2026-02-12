import React, { useState, useRef } from 'react';
import { Download, Upload, FileText, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
import { bulkImportApi } from '../../services/api';
import { BulkImportResult, BulkImportError } from '../../types';

interface Props {
  isDark: boolean;
  cardClass: string;
  selectClass: string;
}

const ENTITIES = [
  { value: 'accounts', label: 'Accounts' },
  { value: 'leads', label: 'Leads' },
  { value: 'contacts', label: 'Contacts' },
  { value: 'deals', label: 'Deals' },
  { value: 'partners', label: 'Partners' },
  { value: 'sales_entries', label: 'Sales Entries' },
  { value: 'products', label: 'Products' },
];

export const BulkImportTab: React.FC<Props> = ({ isDark, cardClass, selectClass }) => {
  const [entity, setEntity] = useState('accounts');
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

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
    } catch (err: any) {
      setError(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Entity Selector + Template Download */}
      <div className={`${cardClass} p-6`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Bulk Import
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Select Entity
            </label>
            <select value={entity} onChange={e => { setEntity(e.target.value); setResult(null); setFile(null); setError(''); }} className={selectClass}>
              {ENTITIES.map(e => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
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
              Download Template
            </button>
          </div>
        </div>

        {/* File Upload */}
        <div
          onClick={() => fileRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            isDark
              ? 'border-zinc-700 hover:border-brand-500/50 bg-dark-100'
              : 'border-slate-200 hover:border-brand-500/50 bg-slate-50'
          }`}
        >
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileText className={`w-8 h-8 ${isDark ? 'text-brand-400' : 'text-brand-600'}`} />
              <div className="text-left">
                <div className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{file.name}</div>
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
              <Upload className={`w-8 h-8 mx-auto mb-2 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
              <div className={`text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Click to upload or drag a CSV file here
              </div>
            </div>
          )}
        </div>

        {/* Import Button */}
        <div className="flex justify-end mt-4">
          <button
            onClick={handleImport}
            disabled={!file || importing}
            className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {importing ? 'Importing...' : 'Import Data'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className={`${cardClass} p-4 border-l-4 border-red-500`}>
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className={`${cardClass} p-6`}>
          <h4 className={`text-base font-semibold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Import Results
          </h4>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className={`p-3 rounded-xl ${isDark ? 'bg-dark-100' : 'bg-slate-50'}`}>
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {result.total}
              </div>
              <div className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>Total Rows</div>
            </div>
            <div className={`p-3 rounded-xl ${isDark ? 'bg-emerald-900/20' : 'bg-emerald-50'}`}>
              <div className={`text-2xl font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                {result.imported}
              </div>
              <div className={`text-xs ${isDark ? 'text-emerald-500/70' : 'text-emerald-600/70'}`}>Imported</div>
            </div>
            <div className={`p-3 rounded-xl ${isDark ? 'bg-red-900/20' : 'bg-red-50'}`}>
              <div className={`text-2xl font-bold ${isDark ? 'text-red-400' : 'text-red-700'}`}>
                {result.errors.length}
              </div>
              <div className={`text-xs ${isDark ? 'text-red-500/70' : 'text-red-600/70'}`}>Errors</div>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div>
              <div className={`text-sm font-medium mb-2 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                Error Details
              </div>
              <div className={`max-h-60 overflow-y-auto rounded-lg border ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
                <table className="w-full text-xs">
                  <thead className={isDark ? 'bg-dark-100' : 'bg-slate-50'}>
                    <tr>
                      <th className={`px-3 py-2 text-left font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Row</th>
                      <th className={`px-3 py-2 text-left font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Field</th>
                      <th className={`px-3 py-2 text-left font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Message</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-zinc-800' : 'divide-slate-100'}`}>
                    {result.errors.map((err: BulkImportError, i: number) => (
                      <tr key={i}>
                        <td className={`px-3 py-2 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>{err.row}</td>
                        <td className={`px-3 py-2 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>{err.field}</td>
                        <td className={`px-3 py-2 ${isDark ? 'text-red-400' : 'text-red-600'}`}>{err.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
