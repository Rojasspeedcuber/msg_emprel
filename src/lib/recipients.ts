import type { Recipient } from '../types/messaging';
import { parsePhone } from './phone';

/** Separa um texto colado por quebra de linha, vírgula ou ponto e vírgula. */
export function splitRecipients(text: string): string[] {
  return text
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function createRecipient(raw: string): Recipient {
  const result = parsePhone(raw);

  if (result.valid) {
    return { key: result.e164, input: raw, e164: result.e164, display: result.display };
  }

  return { key: `invalid:${raw}`, input: raw, error: result.error };
}

export interface AddRecipientsResult {
  recipients: Recipient[];
  added: number;
  invalidAdded: number;
  duplicatesRemoved: number;
}

/** Adiciona números à lista, descartando duplicados (inclusive dentro do próprio lote). */
export function addRecipients(current: Recipient[], rawItems: string[]): AddRecipientsResult {
  const seen = new Set(current.map((recipient) => recipient.key));
  const recipients = [...current];
  let added = 0;
  let invalidAdded = 0;
  let duplicatesRemoved = 0;

  for (const raw of rawItems) {
    const candidate = createRecipient(raw);

    if (seen.has(candidate.key)) {
      duplicatesRemoved += 1;
      continue;
    }

    seen.add(candidate.key);
    recipients.push(candidate);
    added += 1;
    if (!candidate.e164) invalidAdded += 1;
  }

  return { recipients, added, invalidAdded, duplicatesRemoved };
}
