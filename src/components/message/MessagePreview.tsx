import { isBlankMessage } from '../../lib/message';
import { Card } from '../ui/Card';

interface MessagePreviewProps {
  message: string;
}

export function MessagePreview({ message }: MessagePreviewProps) {
  const hasText = !isBlankMessage(message);
  const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <Card id="preview" title="Prévia" description="Aproximação de como a mensagem aparece no WhatsApp.">
      <div
        className="flex min-h-48 flex-col justify-end rounded-xl bg-[#efeae2] p-4 sm:p-5"
        style={{ backgroundImage: 'radial-gradient(rgba(0,0,0,0.035) 1px, transparent 1px)', backgroundSize: '14px 14px' }}
      >
        {hasText ? (
          <div className="ml-auto max-w-[85%] rounded-lg rounded-tr-none bg-[#d9fdd3] px-3 py-2 shadow-sm">
            <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-slate-900">
              {message.trim()}
            </p>
            <div className="mt-1 flex items-center justify-end gap-1 text-[11px] text-slate-500">
              <time>{time}</time>
              <svg aria-hidden="true" viewBox="0 0 16 11" className="h-3 w-4 text-sky-500" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M1 5.5 4 8.5 10 2" />
                <path d="M5 5.5 8 8.5 15 1.5" />
              </svg>
            </div>
          </div>
        ) : (
          <p className="m-auto text-center text-sm text-slate-500">Digite uma mensagem para ver a prévia.</p>
        )}
      </div>
    </Card>
  );
}
