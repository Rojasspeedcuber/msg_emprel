import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { pluralize } from '../../lib/format';

interface SendPanelProps {
  validCount: number;
  blockers: string[];
  sending: boolean;
  onReview: () => void;
}

export function SendPanel({ validCount, blockers, sending, onReview }: SendPanelProps) {
  const canReview = blockers.length === 0 && !sending;

  return (
    <Card id="send" title="Envio">
      <p className="text-sm text-slate-600">
        <span className="text-2xl font-bold text-slate-900">{validCount}</span>{' '}
        {validCount === 1 ? 'destinatário válido' : 'destinatários válidos'}
      </p>

      <Button
        className="mt-4 w-full py-3 text-base"
        onClick={onReview}
        disabled={!canReview}
        aria-describedby={blockers.length > 0 ? 'send-blockers' : undefined}
      >
        {sending ? 'Enviando…' : 'Revisar envio'}
      </Button>

      {sending && (
        <p role="status" className="mt-3 text-sm text-slate-600">
          Aguardando resposta do servidor. Não feche a página.
        </p>
      )}

      {!sending && blockers.length > 0 && (
        <div id="send-blockers" className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700 ring-1 ring-inset ring-slate-200">
          <p className="font-medium">Para revisar o envio:</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            {blockers.map((blocker) => (
              <li key={blocker}>{blocker}</li>
            ))}
          </ul>
        </div>
      )}

      {!sending && blockers.length === 0 && validCount > 0 && (
        <p className="mt-3 text-xs text-slate-500">
          Você poderá revisar a mensagem antes de confirmar o envio para {pluralize(validCount, 'destinatário', 'destinatários')}.
        </p>
      )}
    </Card>
  );
}
