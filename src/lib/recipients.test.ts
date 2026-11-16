import { describe, expect, it } from 'vitest';
import { parsePhone } from './phone';
import { addRecipients, createRecipient, recipientLabel, splitRecipients } from './recipients';
import { countCharacters, getMessageError, MAX_MESSAGE_LENGTH } from './message';
import { parseContactsCsv } from './csv';

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
    const current = [createRecipient({ phone: '+55 81 99999-9999' })];
    const result = addRecipients(current, [
      { phone: '+5581999999999' },
      { phone: '+55 81 99999-9999' },
      { phone: '+55 81 98888-8888' },
      { phone: '+55 81 98888-8888' },
    ]);

    expect(result.recipients).toHaveLength(2);
    expect(result.added).toBe(1);
    expect(result.duplicatesRemoved).toBe(3);
  });

  it('mantém números inválidos na lista, sinalizados com explicação', () => {
    const result = addRecipients([], [{ phone: '81 99999-9999' }]);

    expect(result.invalidAdded).toBe(1);
    expect(result.recipients[0].error).toBeTruthy();
    expect(result.recipients[0].e164).toBeUndefined();
  });

  it('guarda o nome do contato e o exibe junto ao número', () => {
    const result = addRecipients([], [{ name: 'Maria Silva', phone: '+55 81 99999-9999' }]);
    const [recipient] = result.recipients;

    expect(recipient.name).toBe('Maria Silva');
    expect(recipient.e164).toBe('+5581999999999');
    expect(recipientLabel(recipient)).toBe('Maria Silva · +55 81 99999-9999');
  });

  it('usa só o número quando não há nome', () => {
    const [recipient] = addRecipients([], [{ phone: '+55 81 99999-9999' }]).recipients;

    expect(recipientLabel(recipient)).toBe('+55 81 99999-9999');
  });
});

describe('parseContactsCsv', () => {
  it('lê nome e telefone com cabeçalho separado por vírgula', () => {
    expect(parseContactsCsv('nome,telefone\nMaria,+5581999999999\nJoão,+5581988888888')).toEqual({
      ok: true,
      contacts: [
        { name: 'Maria', phone: '+5581999999999' },
        { name: 'João', phone: '+5581988888888' },
      ],
      skipped: 0,
    });
  });

  it('aceita ponto e vírgula, BOM, CRLF e cabeçalhos com acento ou maiúsculas', () => {
    const result = parseContactsCsv('\uFEFFNome;Número\r\nAna;+5581999999999\r\n');

    expect(result).toEqual({
      ok: true,
      contacts: [{ name: 'Ana', phone: '+5581999999999' }],
      skipped: 0,
    });
  });

  it('respeita campos entre aspas, com vírgula e aspas escapadas', () => {
    const result = parseContactsCsv('nome,fone\n"Silva, Maria ""Mari""",+5581999999999');

    expect(result.ok && result.contacts[0].name).toBe('Silva, Maria "Mari"');
  });

  it('aceita a coluna de nome ausente', () => {
    expect(parseContactsCsv('telefone\n+5581999999999')).toEqual({
      ok: true,
      contacts: [{ phone: '+5581999999999' }],
      skipped: 0,
    });
  });

  it('ignora linhas sem telefone e conta quantas foram', () => {
    const result = parseContactsCsv('nome,telefone\nMaria,\n,\nJoão,+5581988888888');

    expect(result.ok && result.contacts).toEqual([{ name: 'João', phone: '+5581988888888' }]);
    expect(result.ok && result.skipped).toBe(1);
  });

  it('recusa arquivo sem coluna de telefone', () => {
    const result = parseContactsCsv('nome,email\nMaria,maria@exemplo.com');

    expect(result.ok).toBe(false);
  });

  it('recusa arquivo vazio', () => {
    expect(parseContactsCsv('  \n\n').ok).toBe(false);
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
