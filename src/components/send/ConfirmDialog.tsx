import { useEffect, useRef } from 'react';
import { Button } from '../ui/Button';
import { pluralize } from '../../lib/format';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  recipients: string[];
  message: string;
  sending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  title,
  recipients,
  message,
  sending,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="confirm-title"
      aria-describedby="confirm-summary"
      onCancel={(event) => {
        // Esc fecha o diálogo pelo estado da aplicação, e não durante o envio.
        event.preventDefault();
        if (!sending) onCancel();
      }}
      className="m-auto w-[min(92vw,34rem)] rounded-2xl bg-white p-0 shadow-xl ring-1 ring-slate-200 backdrop:bg-slate-900/40"
    >
      <div className="flex max-h-[85vh] flex-col">
        <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
          <h2 id="confirm-title" className="text-lg font-semibold text-slate-900">
            {title}
          </h2>
          <p id="confirm-summary" className="mt-1 text-sm text-slate-600">
            Esta mensagem será enviada para{' '}
            <strong className="text-slate-900">{pluralize(recipients.length, 'destinatário', 'destinatários')}</strong>.
          </p>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4 sm:px-6">
          <section aria-labelledby="confirm-message-label">
            <h3 id="confirm-message-label" className="mb-2 text-sm font-medium text-slate-700">
              Mensagem
            </h3>
            <div className="rounded-xl bg-[#efeae2] p-3">
              <p className="ml-auto max-h-40 max-w-[90%] overflow-y-auto whitespace-pre-wrap break-words rounded-lg rounded-tr-none bg-[#d9fdd3] px-3 py-2 text-[15px] text-slate-900 shadow-sm">
                {message}
              </p>
            </div>
          </section>

          <section aria-labelledby="confirm-recipients-label">
            <h3 id="confirm-recipients-label" className="mb-2 text-sm font-medium text-slate-700">
              Destinatários
            </h3>
            <ul className="max-h-40 divide-y divide-slate-100 overflow-y-auto rounded-lg ring-1 ring-inset ring-slate-200">
              {recipients.map((recipient) => (
                <li key={recipient} className="px-3 py-2 text-sm text-slate-800">
                  {recipient}
                </li>
              ))}
            </ul>
          </section>

          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-inset ring-amber-200">
            Confirmar significa solicitar o envio. Os resultados por destinatário aparecem depois que o servidor responder.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <Button variant="secondary" onClick={onCancel} disabled={sending} autoFocus>
            Voltar e editar
          </Button>
          <Button onClick={onConfirm} disabled={sending}>
            {sending ? 'Enviando…' : 'Confirmar envio'}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
