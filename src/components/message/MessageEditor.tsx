import { useState } from 'react';
import { Card } from '../ui/Card';
import { Field, describedBy, inputClass } from '../ui/Field';
import { countCharacters, getMessageError, MAX_MESSAGE_LENGTH } from '../../lib/message';
import { formatCount } from '../../lib/format';

interface MessageEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function MessageEditor({ value, onChange }: MessageEditorProps) {
  const [touched, setTouched] = useState(false);
  const count = countCharacters(value);
  const overLimit = count > MAX_MESSAGE_LENGTH;
  const error = touched ? getMessageError(value) : null;
  const counterId = 'message-counter';
  const describedByIds = [describedBy('message', { hint: true, error }), counterId].filter(Boolean).join(' ');

  return (
    <Card id="message" title="Mensagem" description="O mesmo texto será enviado para todos os destinatários válidos.">
      <Field
        id="message"
        label="Texto da mensagem"
        hint="Quebras de linha e emojis são preservados."
        error={error}
      >
        <textarea
          id="message"
          rows={7}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="Olá! Esta é uma mensagem de exemplo."
          aria-invalid={error ? true : undefined}
          aria-describedby={describedByIds}
          className={inputClass(Boolean(error))}
        />
      </Field>
      <div className="mt-2 flex justify-end">
        <span
          id={counterId}
          aria-live="polite"
          className={`text-sm tabular-nums ${overLimit ? 'font-semibold text-red-600' : 'text-slate-500'}`}
        >
          {formatCount(count)} / {formatCount(MAX_MESSAGE_LENGTH)} caracteres
        </span>
      </div>
    </Card>
  );
}
