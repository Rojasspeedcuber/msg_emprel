/** Limite de texto de uma mensagem do WhatsApp. */
export const MAX_MESSAGE_LENGTH = 4096;

/** Conta caracteres por code point, para que emojis contem como um caractere. */
export function countCharacters(text: string): number {
  return Array.from(text).length;
}

export function isBlankMessage(text: string): boolean {
  return text.trim().length === 0;
}

export function getMessageError(text: string): string | null {
  if (isBlankMessage(text)) return 'Digite uma mensagem antes de enviar.';
  if (countCharacters(text) > MAX_MESSAGE_LENGTH) {
    return `A mensagem passou do limite de ${MAX_MESSAGE_LENGTH.toLocaleString('pt-BR')} caracteres.`;
  }
  return null;
}
