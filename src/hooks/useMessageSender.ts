import { useCallback, useRef, useState } from 'react';
import {
  isUncertainError,
  toMessageApiError,
  type MessageApi,
  type MessageApiError,
} from '../services/messageApi';
import type { DisplayStatus, RecipientResult, SendMessageResponse } from '../types/messaging';

export interface RecipientOutcome {
  status: DisplayStatus;
  error?: string;
}

/**
 * Resultado da última tentativa de envio, conforme confirmado pelo backend:
 * - accepted:  o backend aceitou a solicitação (não significa que foi entregue)
 * - error:     nada foi aceito; o usuário pode corrigir e tentar de novo
 * - uncertain: não sabemos se o backend recebeu/aceitou; orientar consulta antes de repetir
 */
export type SendNotice =
  | { kind: 'accepted'; batchId?: string; detailed: boolean }
  | { kind: 'error'; error: MessageApiError }
  | { kind: 'uncertain'; error: MessageApiError };

export function useMessageSender(api: MessageApi) {
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<SendNotice | null>(null);
  const [outcomes, setOutcomes] = useState<Record<string, RecipientOutcome>>({});
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const inFlight = useRef(false);

  const send = useCallback(
    async (recipients: string[], message: string): Promise<void> => {
      if (inFlight.current) return;
      inFlight.current = true;
      setSending(true);
      setNotice(null);

      try {
        const response = await api.sendMessage({ recipients, message });
        setOutcomes((previous) => ({ ...previous, ...buildOutcomes(recipients, response) }));
        setLastMessage(message);
        setNotice({
          kind: 'accepted',
          batchId: response.batchId,
          detailed: response.results !== undefined,
        });
      } catch (caught) {
        const error = toMessageApiError(caught);
        setNotice(isUncertainError(error) ? { kind: 'uncertain', error } : { kind: 'error', error });
      } finally {
        inFlight.current = false;
        setSending(false);
      }
    },
    [api],
  );

  return { sending, notice, outcomes, lastMessage, send };
}

function buildOutcomes(
  recipients: string[],
  response: SendMessageResponse,
): Record<string, RecipientOutcome> {
  const byRecipient = new Map<string, RecipientResult>(
    (response.results ?? []).map((result) => [result.recipient, result]),
  );

  const outcomes: Record<string, RecipientOutcome> = {};
  for (const recipient of recipients) {
    if (response.results === undefined) {
      outcomes[recipient] = { status: 'accepted' };
      continue;
    }
    const result = byRecipient.get(recipient);
    outcomes[recipient] = result
      ? { status: result.status, error: result.error }
      : { status: 'unknown' };
  }
  return outcomes;
}
