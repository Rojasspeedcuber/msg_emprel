import { describe, expect, it } from 'vitest';
import { parsePhone } from './phone';
import { addRecipients, createRecipient, splitRecipients } from './recipients';
import { countCharacters, getMessageError, MAX_MESSAGE_LENGTH } from './message';

describe('parsePhone', () => {
  it('normaliza número brasileiro para E.164 e formata para exibição', () => {
    expect(parsePhone('+55 81 99999-9999')).toEqual({
      valid: true,
      e164: '+5581999999999',
      display: '+55 81 99999-9999',
    });
  });

  it('aceita prefixo 00 como internacional', () => {
    const result = parsePhone('0055 81 99999-9999');
    expect(result.valid && result.e164).toBe('+5581999999999');
  });

  it('exige código do país', () => {
    const result = parsePhone('81 99999-9999');
    expect(result.valid).toBe(false);
  });

  it('rejeita número com dígitos a mais', () => {
    expect(parsePhone('+55 81 99999-99999').valid).toBe(false);
  });
});

describe('splitRecipients', () => {
  it('separa por quebra de linha, vírgula e ponto e vírgula, ignorando vazios', () => {
    expect(splitRecipients('+5581999999999\n+5581988888888, ; +5511977777777;;\n')).toEqual([
      '+5581999999999',
      '+5581988888888',
      '+5511977777777',
    ]);
  });
});

describe('addRecipients', () => {
  it('remove duplicados existentes e dentro do próprio lote, e conta quantos foram removidos', () => {
    const current = [createRecipient('+55 81 99999-9999')];
    const result = addRecipients(current, [
      '+5581999999999',
      '+55 81 99999-9999',
      '+55 81 98888-8888',
      '+55 81 98888-8888',
    ]);

    expect(result.recipients).toHaveLength(2);
    expect(result.added).toBe(1);
    expect(result.duplicatesRemoved).toBe(3);
  });

  it('mantém números inválidos na lista, sinalizados com explicação', () => {
    const result = addRecipients([], ['81 99999-9999']);

    expect(result.invalidAdded).toBe(1);
    expect(result.recipients[0].error).toBeTruthy();
    expect(result.recipients[0].e164).toBeUndefined();
  });
});

describe('mensagem', () => {
  it('bloqueia mensagens vazias ou só com espaços', () => {
    expect(getMessageError('')).not.toBeNull();
    expect(getMessageError('   \n\t ')).not.toBeNull();
    expect(getMessageError('Olá')).toBeNull();
  });

  it('conta emojis como um caractere e respeita o limite', () => {
    expect(countCharacters('👍🏽')).toBe(2);
    expect(getMessageError('a'.repeat(MAX_MESSAGE_LENGTH))).toBeNull();
    expect(getMessageError('a'.repeat(MAX_MESSAGE_LENGTH + 1))).not.toBeNull();
  });
});
