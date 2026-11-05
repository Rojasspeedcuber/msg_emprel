import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { pluralize } from '../../lib/format';
import type { Recipient } from '../../types/messaging';

interface RecipientListProps {
  recipients: Recipient[];
  onRemove: (key: string) => void;
  onClear: () => void;
}

export function RecipientList({ recipients, onRemove, onClear }: RecipientListProps) {
  const validCount = recipients.filter((recipient) => recipient.e164).length;
  const invalidCount = recipients.length - validCount;

  return (
    <Card
      id="recipient-list"
      title="Lista de envio"
      actions={
        recipients.length > 0 && (
          <Button variant="danger" onClick={onClear}>
            Limpar todos
          </Button>
        )
      }
    >
      <div className="mb-4 flex flex-wrap gap-2 text-sm font-medium">
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-800 ring-1 ring-inset ring-emerald-200">
          {pluralize(validCount, 'válido', 'válidos')}
        </span>
        {invalidCount > 0 && (
          <span className="rounded-full bg-red-50 px-3 py-1 text-red-800 ring-1 ring-inset ring-red-200">
            {pluralize(invalidCount, 'inválido', 'inválidos')}
          </span>
        )}
      </div>

      {recipients.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
          Nenhum destinatário ainda. Adicione números acima para começar.
        </p>
      ) : (
        <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto rounded-lg ring-1 ring-inset ring-slate-200">
          {recipients.map((recipient, index) => {
            const label = recipient.display ?? recipient.input;
            const errorId = recipient.error ? `recipient-error-${index}` : undefined;

            return (
              <li key={recipient.key} className="flex items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="break-all font-medium text-slate-900">{label}</p>
                  {recipient.error && (
                    <p id={errorId} className="mt-0.5 text-sm text-red-600">
                      {recipient.error}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      recipient.error ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {recipient.error ? 'Inválido' : 'Válido'}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemove(recipient.key)}
                    aria-label={`Remover ${label}`}
                    title="Remover"
                    className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-red-600 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                  >
                    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor">
                      <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                    </svg>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {invalidCount > 0 && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-900 ring-1 ring-inset ring-red-200">
          Números inválidos não são enviados e impedem o envio até serem corrigidos ou removidos. Para corrigir,
          use o formato com + e código do país, como <strong>+55 81 99999-9999</strong>.
        </p>
      )}
    </Card>
  );
}
