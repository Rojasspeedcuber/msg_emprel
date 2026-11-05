import type { ReactNode } from 'react';

interface FieldProps {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string | null;
  children: ReactNode;
}

export function Field({ id, label, hint, error, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {hint && (
        <p id={hintId(id)} className="text-xs text-slate-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId(id)} className="text-sm font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export function hintId(id: string): string {
  return `${id}-hint`;
}

export function errorId(id: string): string {
  return `${id}-error`;
}

/** Monta o valor de aria-describedby para um campo com dica e/ou erro. */
export function describedBy(id: string, options: { hint?: unknown; error?: unknown }): string | undefined {
  const ids = [options.error ? errorId(id) : null, options.hint ? hintId(id) : null].filter(Boolean);
  return ids.length > 0 ? ids.join(' ') : undefined;
}

export function inputClass(invalid = false): string {
  const ring = invalid ? 'ring-red-400 focus:ring-red-500' : 'ring-slate-300 focus:ring-emerald-500';
  return `block w-full rounded-lg border-0 bg-white px-3 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:outline-none ${ring}`;
}
