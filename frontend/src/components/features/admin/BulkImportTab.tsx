import React, { useState, useRef } from 'react';
import { Download, Upload, FileText, Loader2, AlertCircle } from 'lucide-react';
import { bulkImportApi } from '@/services/api';
import { BulkImportResult, BulkImportError } from '@/types';
import { Card, Button, Select, Alert } from '@/components/ui';
import { cx } from '@/utils/cx';

const ENTITIES = [
  { value: 'accounts', label: 'Accounts' },
  { value: 'leads', label: 'Leads' },
  { value: 'contacts', label: 'Contacts' },
  { value: 'deals', label: 'Deals' },
  { value: 'partners', label: 'Accounts' },
  { value: 'sales_entries', label: 'Sales Entries' },
  { value: 'products', label: 'Products' },
];

export const BulkImportTab: React.FC = () => {
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
      <Card>
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Bulk Import
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <Select
            label="Select Entity"
            value={entity}
            onChange={e => { setEntity(e.target.value); setResult(null); setFile(null); setError(''); }}
            options={ENTITIES}
          />
          <div className="flex items-end">
            <Button
              variant="secondary"
              onClick={handleDownloadTemplate}
              loading={downloading}
              icon={!downloading ? <Download className="w-4 h-4" /> : undefined}
            >
              Download Template
            </Button>
          </div>
        </div>

        {/* File Upload */}
        <div
          onClick={() => fileRef.current?.click()}
          className={cx(
            'relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
            'border-gray-200 hover:border-brand-500/50 bg-gray-50',
            'dark:border-zinc-700 dark:hover:border-brand-500/50 dark:bg-dark-100'
          )}
        >
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileText className="w-8 h-8 text-brand-600 dark:text-brand-400" />
              <div className="text-left">
                <div className="font-medium text-gray-900 dark:text-white">{file.name}</div>
                <div className="text-xs text-gray-400 dark:text-zinc-500">
                  {(file.size / 1024).toFixed(1)} KB
                </div>
              </div>
              <button
                onClick={e => { e.stopPropagation(); setFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                className="p-1 rounded-lg hover:bg-gray-200 text-gray-400 dark:hover:bg-zinc-800 dark:text-zinc-400"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <div>
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400 dark:text-zinc-500" />
              <div className="text-sm text-gray-500 dark:text-zinc-400">
                Click to upload or drag a CSV file here
              </div>
            </div>
          )}
        </div>

        {/* Import Button */}
        <div className="flex justify-end mt-4">
          <Button
            onClick={handleImport}
            disabled={!file || importing}
            loading={importing}
            icon={!importing ? <Upload className="w-4 h-4" /> : undefined}
          >
            {importing ? 'Importing...' : 'Import Data'}
          </Button>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <Alert variant="error" icon={<AlertCircle className="w-5 h-5" />} className="border-l-4 border-l-red-500">
          {error}
        </Alert>
      )}

      {/* Results */}
      {result && (
        <Card>
          <h4 className="text-base font-semibold mb-3 text-gray-900 dark:text-white">
            Import Results
          </h4>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-dark-100">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {result.total}
              </div>
              <div className="text-xs text-gray-400 dark:text-zinc-500">Total Rows</div>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                {result.imported}
              </div>
              <div className="text-xs text-emerald-600/70 dark:text-emerald-500/70">Imported</div>
            </div>
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20">
              <div className="text-2xl font-bold text-red-700 dark:text-red-400">
                {result.errors.length}
              </div>
              <div className="text-xs text-red-600/70 dark:text-red-500/70">Errors</div>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div>
              <div className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Error Details
              </div>
              <div className="max-h-60 overflow-y-auto rounded-lg border border-gray-200 dark:border-zinc-800">
                <table className="premium-table text-xs">
                  <thead className="bg-gray-50 dark:bg-dark-200">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-500 dark:text-zinc-400">Row</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-500 dark:text-zinc-400">Field</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-500 dark:text-zinc-400">Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                    {result.errors.map((err: BulkImportError, i: number) => (
                      <tr key={i}>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{err.row}</td>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{err.field}</td>
                        <td className="px-3 py-2 text-red-600 dark:text-red-400">{err.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
