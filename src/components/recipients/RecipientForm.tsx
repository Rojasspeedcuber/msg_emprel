import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Field, describedBy, inputClass } from '../ui/Field';
import { parsePhone, PHONE_FORMAT_HINT } from '../../lib/phone';
import { CSV_FORMAT_HINT, parseContactsCsv } from '../../lib/csv';
import { splitRecipients, type AddRecipientsResult } from '../../lib/recipients';
import { pluralize } from '../../lib/format';
import type { Contact } from '../../types/messaging';

interface RecipientFormProps {
  onAdd: (contacts: Contact[]) => AddRecipientsResult;
}

interface Feedback {
  tone: 'success' | 'warning';
  text: string;
}

export function RecipientForm({ onAdd }: RecipientFormProps) {
  const [single, setSingle] = useState('');
  const [singleError, setSingleError] = useState<string | null>(null);
  const [pasted, setPasted] = useState('');
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  function handleSingleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const items = splitRecipients(single);

    if (items.length === 0) {
      setSingleError('Digite um número com código do país e DDD.');
      return;
    }

    for (const item of items) {
      const parsed = parsePhone(item);
      if (!parsed.valid) {
        setSingleError(items.length > 1 ? `${item}: ${parsed.error}` : parsed.error);
        return;
      }
    }

    const result = onAdd(items.map((phone) => ({ phone })));
    setSingleError(null);
    setSingle('');
    setFeedback(buildFeedback(result));
  }

  function handlePasteSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const items = splitRecipients(pasted);

    if (items.length === 0) {
      setPasteError('Cole ou digite ao menos um número.');
      return;
    }

    const result = onAdd(items.map((phone) => ({ phone })));
    setPasteError(null);
    setPasted('');
    setFeedback(buildFeedback(result));
  }

  async function handleCsvChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const parsed = parseContactsCsv(await file.text());
    if (!parsed.ok) {
      setCsvError(parsed.error);
      setFeedback(null);
      return;
    }
    if (parsed.contacts.length === 0) {
      setCsvError('Nenhuma linha com telefone foi encontrada no arquivo.');
      setFeedback(null);
      return;
    }

    const result = onAdd(parsed.contacts);
    setCsvError(null);
    setFeedback(buildFeedback(result, parsed.skipped));
  }

  return (
    <Card
      id="recipients"
      title="Destinatários"
      description={
        <>
          Informe o código do país e o DDD. Exemplo: <strong className="font-semibold">+55 81 99999-9999</strong>
        </>
      }
    >
      <div className="space-y-6">
        <form onSubmit={handleSingleSubmit} noValidate className="space-y-3">
          <Field
            id="single-recipient"
            label="Adicionar um número"
            hint={PHONE_FORMAT_HINT}
            error={singleError}
          >
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="single-recipient"
                type="tel"
                inputMode="tel"
                autoComplete="off"
                placeholder="+55 81 99999-9999"
                value={single}
                onChange={(event) => setSingle(event.target.value)}
                aria-invalid={singleError ? true : undefined}
                aria-describedby={describedBy('single-recipient', { hint: true, error: singleError })}
                className={`${inputClass(Boolean(singleError))} sm:flex-1`}
              />
              <Button type="submit" variant="secondary" className="sm:w-auto">
                Adicionar
              </Button>
            </div>
          </Field>
        </form>

        <form onSubmit={handlePasteSubmit} noValidate className="space-y-3">
          <Field
            id="pasted-recipients"
            label="Colar vários números"
            hint="Separe os números por quebra de linha, vírgula ou ponto e vírgula. Duplicados são removidos automaticamente."
            error={pasteError}
          >
            <textarea
              id="pasted-recipients"
              rows={4}
              placeholder={'+55 81 99999-9999\n+55 81 98888-8888; +55 11 97777-7777'}
              value={pasted}
              onChange={(event) => setPasted(event.target.value)}
              aria-invalid={pasteError ? true : undefined}
              aria-describedby={describedBy('pasted-recipients', { hint: true, error: pasteError })}
              className={inputClass(Boolean(pasteError))}
            />
          </Field>
          <Button type="submit" variant="secondary">
            Adicionar números colados
          </Button>
        </form>

        <div className="space-y-3">
          <Field
            id="csv-file"
            label="Importar lista CSV"
            hint={CSV_FORMAT_HINT}
            error={csvError}
          >
            <input
              id="csv-file"
              type="file"
              accept=".csv,text/csv"
              onChange={handleCsvChange}
              aria-invalid={csvError ? true : undefined}
              aria-describedby={describedBy('csv-file', { hint: true, error: csvError })}
              className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:font-medium file:text-slate-700 hover:file:bg-slate-200"
            />
          </Field>
        </div>

        {feedback && (
          <p
            role="status"
            className={`rounded-lg px-3 py-2 text-sm ring-1 ring-inset ${
              feedback.tone === 'success'
                ? 'bg-emerald-50 text-emerald-800 ring-emerald-200'
                : 'bg-amber-50 text-amber-900 ring-amber-200'
            }`}
          >
            {feedback.text}
          </p>
        )}

        <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 ring-1 ring-inset ring-slate-200">
          A validação confere somente o formato do número. Ela <strong>não confirma</strong> se o número possui WhatsApp.
        </p>
      </div>
    </Card>
  );
}

function buildFeedback(result: AddRecipientsResult, skipped = 0): Feedback {
  const parts: string[] = [];

  if (result.added > 0) {
    parts.push(`${pluralize(result.added, 'número adicionado', 'números adicionados')}.`);
  } else {
    parts.push('Nenhum número novo foi adicionado.');
  }

  if (result.duplicatesRemoved > 0) {
    parts.push(`${pluralize(result.duplicatesRemoved, 'duplicado removido', 'duplicados removidos')}.`);
  }

  if (skipped > 0) {
    parts.push(`${pluralize(skipped, 'linha sem telefone ignorada', 'linhas sem telefone ignoradas')}.`);
  }

  if (result.invalidAdded > 0) {
    parts.push(
      `${pluralize(result.invalidAdded, 'número inválido', 'números inválidos')} na lista: corrija ou remova antes de enviar.`,
    );
  }

  return {
    tone: result.invalidAdded > 0 || skipped > 0 ? 'warning' : 'success',
    text: parts.join(' '),
  };
}
