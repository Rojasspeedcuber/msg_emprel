import type { DisplayStatus } from '../../types/messaging';

const statusInfo: Record<DisplayStatus, { label: string; classes: string }> = {
  accepted: { label: 'Solicitação aceita', classes: 'bg-slate-100 text-slate-700 ring-slate-300' },
  sent: { label: 'Enviado', classes: 'bg-sky-50 text-sky-800 ring-sky-200' },
  delivered: { label: 'Entregue', classes: 'bg-emerald-50 text-emerald-800 ring-emerald-200' },
  failed: { label: 'Falha', classes: 'bg-red-50 text-red-800 ring-red-200' },
  unknown: { label: 'Sem informação', classes: 'bg-amber-50 text-amber-900 ring-amber-200' },
};

export function StatusBadge({ status }: { status: DisplayStatus }) {
  const info = statusInfo[status];
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${info.classes}`}>
      {info.label}
    </span>
  );
}
