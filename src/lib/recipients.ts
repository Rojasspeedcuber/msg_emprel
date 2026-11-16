import type { Contact, Recipient } from '../types/messaging';
import { parsePhone } from './phone';

/** Separa um texto colado por quebra de linha, vírgula ou ponto e vírgula. */
export function splitRecipients(text: string): string[] {
  return text
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function createRecipient(contact: Contact): Recipient {
  const result = parsePhone(contact.phone);
  const name = contact.name;

  if (result.valid) {
    return { key: result.e164, input: contact.phone, name, e164: result.e164, display: result.display };
  }

  return { key: `invalid:${contact.phone}`, input: contact.phone, name, error: result.error };
}

/** Texto para identificar o destinatário: "Nome · +55 81 99999-9999" ou só o número. */
export function recipientLabel(recipient: Recipient): string {
  const phone = recipient.display ?? recipient.input;
  return recipient.name ? `${recipient.name} · ${phone}` : phone;
}

export interface AddRecipientsResult {
  recipients: Recipient[];
  added: number;
  invalidAdded: number;
  duplicatesRemoved: number;
}

/** Adiciona contatos à lista, descartando duplicados (inclusive dentro do próprio lote). */
export function addRecipients(current: Recipient[], contacts: Contact[]): AddRecipientsResult {
  const seen = new Set(current.map((recipient) => recipient.key));
  const recipients = [...current];
  let added = 0;
  let invalidAdded = 0;
  let duplicatesRemoved = 0;

  for (const contact of contacts) {
    const candidate = createRecipient(contact);

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
