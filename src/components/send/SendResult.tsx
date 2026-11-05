import { useEffect, useRef } from 'react';
import type { SendNotice } from '../../hooks/useMessageSender';
import { formatCount } from '../../lib/format';
import type { DisplayStatus } from '../../types/messaging';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { StatusBadge } from './StatusBadge';

export interface ResultRow {
  recipient: string;
  name: string;
  status: DisplayStatus;
  error?: string;
}

interface SendResultProps {
  notice: SendNotice | null;
  rows: ResultRow[];
  sending: boolean;
  onRetry: () => void;
}

export function SendResult({ notice, rows, sending, onRetry }: SendResultProps) {
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (notice) regionRef.current?.focus();
  }, [notice]);

  if (!notice && rows.length === 0) return null;

  const counts = countByStatus(rows);
  const success = counts.sent + counts.delivered;
  const failed = counts.failed;

  return (
    <section ref={regionRef} tabIndex={-1} aria-labelledby="result-title" className="scroll-mt-6 focus:outline-none">
      <Card id="result" title="Resultado do envio">
        <div className="space-y-5">
          {notice && <NoticeView notice={notice} />}

          {rows.length > 0 && (
            <>
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Total label="Sucesso" value={success} hint="Enviados ou entregues" tone="emerald" />
                <Total label="Falhas" value={failed} hint="Falha confirmada" tone="red" />
                <Total label="Aceitas" value={counts.accepted} hint="Ainda sem confirmação" tone="slate" />
                <Total label="Sem informação" value={counts.unknown} hint="Não informado" tone="amber" />
              </dl>

              <div className="overflow-hidden rounded-xl ring-1 ring-inset ring-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <caption className="sr-only">Resultado por destinatário</caption>
                  <thead className="bg-slate-50 text-left text-slate-600">
                    <tr>
                      <th scope="col" className="px-4 py-2.5 font-semibold">Destinatário</th>
                      <th scope="col" className="px-4 py-2.5 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {rows.map((row) => (
                      <tr key={row.recipient}>
                        <td className="px-4 py-2.5 align-top">
                          <span className="font-medium text-slate-900">{row.name}</span>
                          {row.error && <span className="mt-0.5 block text-xs text-red-700">{row.error}</span>}
                        </td>
                        <td className="px-4 py-2.5 align-top">
                          <StatusBadge status={row.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-600">
                  Reenvio afeta somente destinatários com falha confirmada pelo servidor, com a mesma mensagem.
                </p>
                <Button
                  variant="secondary"
                  onClick={onRetry}
                  disabled={failed === 0 || sending}
                  className="shrink-0"
                >
                  {failed > 0
                    ? `Reenviar para ${formatCount(failed)} ${failed === 1 ? 'destinatário com falha' : 'destinatários com falha'}`
                    : 'Nenhuma falha para reenviar'}
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </section>
  );
}

function NoticeView({ notice }: { notice: SendNotice }) {
  if (notice.kind === 'accepted') {
    return (
      <Alert tone="success" title="Solicitação aceita pelo servidor">
        {notice.detailed ? (
          <p>
            Os status abaixo foram informados pelo servidor. “Solicitação aceita” significa apenas que o pedido foi
            recebido. “Enviado” e “Entregue” aparecem somente quando confirmados.
          </p>
        ) : (
          <p>
            O servidor aceitou a solicitação, mas não informou o status de cada destinatário. Nenhum envio foi confirmado
            individualmente.
          </p>
        )}
        {notice.batchId && (
          <p className="text-xs">
            Protocolo: <code className="rounded bg-white/70 px-1 py-0.5">{notice.batchId}</code>
          </p>
        )}
      </Alert>
    );
  }

  if (notice.kind === 'uncertain') {
    return (
      <Alert tone="warning" title="Resultado incerto">
        <p>{notice.error.message}</p>
        <p>
          <strong>Antes de repetir o envio, consulte o resultado</strong> no painel do serviço de envio. Repetir agora
          pode enviar a mesma mensagem mais de uma vez. Sua mensagem e sua lista foram mantidas.
        </p>
      </Alert>
    );
  }

  const { error } = notice;
  return (
    <Alert tone="error" title={error.kind === 'validation' ? 'Dados recusados pelo servidor' : 'Não foi possível enviar'}>
      <p>{error.message}</p>
      {error.details.length > 0 && (
        <ul className="list-disc space-y-0.5 pl-5">
          {error.details.map((detail, index) => (
            <li key={`${detail.recipient ?? 'geral'}-${index}`}>
              {detail.recipient ? <strong>{detail.recipient}: </strong> : null}
              {detail.message}
            </li>
          ))}
        </ul>
      )}
      <p>Nenhum destinatário foi removido e sua mensagem foi mantida. Você pode corrigir e tentar novamente.</p>
    </Alert>
  );
}

function Total({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: number;
  hint: string;
  tone: 'emerald' | 'red' | 'slate' | 'amber';
}) {
  const colors = {
    emerald: 'text-emerald-700 bg-emerald-50 ring-emerald-200',
    red: 'text-red-700 bg-red-50 ring-red-200',
    slate: 'text-slate-700 bg-slate-50 ring-slate-200',
    amber: 'text-amber-800 bg-amber-50 ring-amber-200',
  }[tone];

  return (
    <div className={`rounded-xl p-3 ring-1 ring-inset ${colors}`}>
      <dt className="text-xs font-semibold uppercase tracking-wide">{label}</dt>
      <dd className="mt-1 text-2xl font-bold tabular-nums">{formatCount(value)}</dd>
      <dd className="text-xs opacity-80">{hint}</dd>
    </div>
  );
}

function countByStatus(rows: ResultRow[]): Record<DisplayStatus, number> {
  const counts: Record<DisplayStatus, number> = { accepted: 0, sent: 0, delivered: 0, failed: 0, unknown: 0 };
  for (const row of rows) counts[row.status] += 1;
  return counts;
}
