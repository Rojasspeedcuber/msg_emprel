import { useMemo, useState } from 'react';
import { config } from './config';
import { ConfirmDialog } from './components/send/ConfirmDialog';
import { DemoBanner } from './components/DemoBanner';
import { Header } from './components/Header';
import { MessageEditor } from './components/message/MessageEditor';
import { MessagePreview } from './components/message/MessagePreview';
import { RecipientForm } from './components/recipients/RecipientForm';
import { RecipientList } from './components/recipients/RecipientList';
import { SendPanel } from './components/send/SendPanel';
import { SendResult, type ResultRow } from './components/send/SendResult';
import { useMessageSender } from './hooks/useMessageSender';
import { pluralize } from './lib/format';
import { getMessageError } from './lib/message';
import { addRecipients, type AddRecipientsResult } from './lib/recipients';
import { createMessageApi, type DemoScenario } from './services';
import type { Recipient } from './types/messaging';

interface PendingSend {
  title: string;
  recipients: string[];
  message: string;
}

export default function App() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [message, setMessage] = useState('');
  const [scenario, setScenario] = useState<DemoScenario>('parcial');
  const [pending, setPending] = useState<PendingSend | null>(null);

  const api = useMemo(() => createMessageApi(scenario), [scenario]);
  const { sending, notice, outcomes, lastMessage, send } = useMessageSender(api);

  const validNumbers = recipients.flatMap((recipient) => (recipient.e164 ? [recipient.e164] : []));
  const invalidCount = recipients.length - validNumbers.length;

  const blockers: string[] = [];
  if (validNumbers.length === 0) blockers.push('Adicione pelo menos um número válido.');
  if (invalidCount > 0) {
    blockers.push(`Corrija ou remova ${pluralize(invalidCount, 'número inválido', 'números inválidos')}.`);
  }
  const messageError = getMessageError(message);
  if (messageError) blockers.push(messageError);

  const rows: ResultRow[] = recipients.flatMap((recipient) => {
    if (!recipient.e164) return [];
    const outcome = outcomes[recipient.e164];
    if (!outcome) return [];
    return [
      {
        recipient: recipient.e164,
        name: recipient.display ?? recipient.e164,
        status: outcome.status,
        error: outcome.error,
      },
    ];
  });
  const failedNumbers = rows.filter((row) => row.status === 'failed').map((row) => row.recipient);

  function handleAdd(rawNumbers: string[]): AddRecipientsResult {
    const result = addRecipients(recipients, rawNumbers);
    setRecipients(result.recipients);
    return result;
  }

  function handleReview() {
    setPending({
      title: 'Confirmar envio',
      recipients: validNumbers,
      message: message.trim(),
    });
  }

  function handleRetry() {
    if (lastMessage === null) return;
    setPending({
      title: 'Reenviar somente para falhas',
      recipients: failedNumbers,
      message: lastMessage,
    });
  }

  async function handleConfirm() {
    if (!pending) return;
    await send(pending.recipients, pending.message);
    setPending(null);
  }

  return (
    <div className="min-h-screen">
      <Header />

      {config.demoMode && <DemoBanner scenario={scenario} onScenarioChange={setScenario} />}

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-2 lg:items-start lg:gap-8 lg:py-8">
        <div className="space-y-6">
          <RecipientForm onAdd={handleAdd} />
          <RecipientList
            recipients={recipients}
            onRemove={(key) => setRecipients((current) => current.filter((item) => item.key !== key))}
            onClear={() => setRecipients([])}
          />
          <MessageEditor value={message} onChange={setMessage} />
        </div>

        <div className="space-y-6 lg:sticky lg:top-6">
          <MessagePreview message={message} />
          <SendPanel
            validCount={validNumbers.length}
            blockers={blockers}
            sending={sending}
            onReview={handleReview}
          />
        </div>

        <div className="lg:col-span-2">
          <SendResult
            notice={notice}
            rows={rows}
            sending={sending}
            onRetry={handleRetry}
          />
        </div>
      </main>

      <ConfirmDialog
        open={pending !== null}
        title={pending?.title ?? ''}
        recipients={pending?.recipients ?? []}
        message={pending?.message ?? ''}
        sending={sending}
        onCancel={() => setPending(null)}
        onConfirm={handleConfirm}
      />

      <footer className="mx-auto max-w-6xl px-4 pb-8 pt-2 text-center text-xs text-slate-500 sm:px-6">
        {config.demoMode
          ? 'Modo demonstração: nenhuma requisição é feita ao backend.'
          : `Backend: ${config.apiBaseUrl || 'mesmo domínio (/api)'}`}
      </footer>
    </div>
  );
}
