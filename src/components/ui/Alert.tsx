import type { ReactNode } from 'react';

export type AlertTone = 'success' | 'warning' | 'error' | 'info';

const toneClasses: Record<AlertTone, string> = {
  success: 'bg-emerald-50 text-emerald-900 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-900 ring-amber-200',
  error: 'bg-red-50 text-red-900 ring-red-200',
  info: 'bg-sky-50 text-sky-900 ring-sky-200',
};

interface AlertProps {
  tone: AlertTone;
  title: string;
  children?: ReactNode;
  className?: string;
}

export function Alert({ tone, title, children, className = '' }: AlertProps) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`rounded-xl p-4 ring-1 ring-inset ${toneClasses[tone]} ${className}`}
    >
      <p className="font-semibold">{title}</p>
      {children && <div className="mt-1 space-y-2 text-sm">{children}</div>}
    </div>
  );
}
