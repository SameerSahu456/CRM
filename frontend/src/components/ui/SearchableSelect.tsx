import React, { useMemo } from 'react';
import { MultiSelect } from 'react-multi-select-component';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SelectOption {
  value: string;
  label: string;
}

export interface SearchableSelectProps {
  label?: string;
  options: SelectOption[];
  value?: string | string[];
  onChange: (value: any) => void;
  placeholder?: string;
  isMulti?: boolean;
  isClearable?: boolean;
  error?: string;
  hint?: string;
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select...',
  isMulti = false,
  error,
  hint,
  disabled = false,
}) => {
  // Convert string[] value to SelectOption[] for the library
  const selected = useMemo(() => {
    if (isMulti && Array.isArray(value)) {
      return options.filter((o) => value.includes(o.value));
    }
    if (!isMulti && typeof value === 'string' && value) {
      const found = options.find((o) => o.value === value);
      return found ? [found] : [];
    }
    return [];
  }, [options, value, isMulti]);

  const handleChange = (newValue: SelectOption[]) => {
    if (isMulti) {
      onChange(newValue.map((v) => v.value));
    } else {
      onChange(newValue.length > 0 ? newValue[0].value : '');
    }
  };

  const valueRenderer = (sel: SelectOption[]) => {
    if (sel.length === 0) return <span className="text-slate-400 dark:text-zinc-500">{placeholder}</span>;
    if (sel.length === options.length) return 'All selected';
    const visible = sel.slice(0, 2).map((s) => s.label);
    const rest = sel.length - visible.length;
    if (rest > 0) {
      return (
        <span className="flex items-center gap-1.5">
          {visible.join(', ')}
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
            +{rest} more
          </span>
        </span>
      );
    }
    return visible.join(', ');
  };

  return (
    <div className="multiselect-wrapper">
      {label && (
        <label className="block text-xs font-semibold mb-1.5 text-slate-600 dark:text-zinc-400">
          {label}
        </label>
      )}
      <MultiSelect
        options={options}
        value={selected}
        onChange={handleChange}
        labelledBy={label || 'Select'}
        hasSelectAll={isMulti}
        disableSearch={false}
        disabled={disabled}
        valueRenderer={valueRenderer}
        overrideStrings={{
          search: 'Search...',
          selectAll: 'Select All',
          noOptions: 'No options',
        }}
        className={`rmsc-custom ${error ? 'rmsc-error' : ''}`}
      />
      {hint && !error && (
        <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">{hint}</p>
      )}
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};
