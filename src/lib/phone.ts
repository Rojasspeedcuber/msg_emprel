import { parsePhoneNumberFromString } from 'libphonenumber-js';

export type PhoneResult =
  | { valid: true; e164: string; display: string }
  | { valid: false; error: string };

export const PHONE_FORMAT_HINT = 'Use o formato +55 81 99999-9999 (código do país, DDD e número).';

/**
 * Valida e normaliza um número para o formato internacional E.164.
 * Esta validação verifica apenas o formato. Ela NÃO confirma se o número possui WhatsApp.
 */
export function parsePhone(raw: string): PhoneResult {
  const trimmed = raw.trim();
  const international = trimmed.startsWith('00') ? `+${trimmed.slice(2)}` : trimmed;

  if (!international.startsWith('+')) {
    return {
      valid: false,
      error: 'Falta o código do país. Comece com + (ex.: +55 para o Brasil).',
    };
  }

  const phone = parsePhoneNumberFromString(international);
  if (!phone || !phone.isValid()) {
    return {
      valid: false,
      error: 'Número inválido. Confira o código do país, o DDD e os dígitos.',
    };
  }

  return {
    valid: true,
    e164: phone.number,
    // Hífen antes dos 4 últimos dígitos, como em +55 81 99999-9999.
    display: phone.formatInternational().replace(/ (\d{4})$/, '-$1'),
  };
}
