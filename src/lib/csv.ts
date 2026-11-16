import type { Contact } from '../types/messaging';

export type CsvParseResult =
  | { ok: true; contacts: Contact[]; skipped: number }
  | { ok: false; error: string };

const NAME_HEADERS = ['nome', 'name'];
const PHONE_HEADERS = ['telefone', 'fone', 'phone', 'celular', 'whatsapp', 'numero', 'tel'];

export const CSV_FORMAT_HINT =
  'Primeira linha com os cabeçalhos "nome" e "telefone" (ou "fone"). Separador vírgula ou ponto e vírgula.';

/**
 * Lê um CSV com cabeçalho. A coluna de telefone é obrigatória; a de nome é opcional.
 * Linhas sem telefone são ignoradas e contadas em `skipped`.
 */
export function parseContactsCsv(text: string): CsvParseResult {
  const content = text.replace(/^\uFEFF/, '');
  const rows = parseRows(content, detectDelimiter(content));

  if (rows.length === 0) {
    return { ok: false, error: 'O arquivo está vazio.' };
  }

  const header = rows[0].map(normalizeHeader);
  const phoneIndex = header.findIndex((column) => PHONE_HEADERS.includes(column));
  const nameIndex = header.findIndex((column) => NAME_HEADERS.includes(column));

  if (phoneIndex === -1) {
    return {
      ok: false,
      error: 'Não encontrei a coluna de telefone. A primeira linha precisa ter o cabeçalho "telefone" (ou "fone").',
    };
  }

  const contacts: Contact[] = [];
  let skipped = 0;

  for (const columns of rows.slice(1)) {
    const phone = (columns[phoneIndex] ?? '').trim();
    const name = nameIndex === -1 ? '' : (columns[nameIndex] ?? '').trim();

    if (phone === '') {
      skipped += 1;
      continue;
    }
    contacts.push(name ? { name, phone } : { phone });
  }

  return { ok: true, contacts, skipped };
}

function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
  const commas = firstLine.split(',').length - 1;
  const semicolons = firstLine.split(';').length - 1;
  return semicolons > commas ? ';' : ',';
}

function normalizeHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

/** Separa o texto em linhas e colunas, respeitando campos entre aspas. Ignora linhas em branco. */
function parseRows(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === delimiter) {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((columns) => columns.some((column) => column.trim() !== ''));
}
