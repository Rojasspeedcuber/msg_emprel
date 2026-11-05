import type { DeliveryStatus, RecipientResult, SendMessageRequest, SendMessageResponse } from '../types/messaging';
import { MessageApiError, type MessageApi } from './messageApi';

export type DemoScenario =
  | 'parcial'
  | 'sucesso'
  | 'aceite'
  | 'validacao'
  | 'indisponivel'
  | 'conexao'
  | 'timeout';

export const DEMO_SCENARIOS: { value: DemoScenario; label: string; description: string }[] = [
  { value: 'parcial', label: 'Envio com falhas parciais', description: 'Alguns destinatários falham.' },
  { value: 'sucesso', label: 'Todos entregues', description: 'Todos os destinatários recebem status "entregue".' },
  { value: 'aceite', label: 'Apenas solicitação aceita', description: 'O backend aceita, sem detalhar por destinatário.' },
  { value: 'validacao', label: 'Erro de validação', description: 'O backend recusa os dados (HTTP 400).' },
  { value: 'indisponivel', label: 'Serviço indisponível', description: 'Resposta HTTP 503.' },
  { value: 'conexao', label: 'Falha de conexão', description: 'Não há conexão com o servidor.' },
  { value: 'timeout', label: 'Tempo esgotado', description: 'Nenhuma resposta a tempo: resultado incerto.' },
];

const SIMULATED_DELAY_MS = 1200;

/**
 * Respostas simuladas para testar a interface sem backend.
 * Regra do cenário "parcial": final do número 0 falha; 1 a 4 fica "enviado"; demais "entregue".
 */
export function createMockMessageApi(scenario: DemoScenario): MessageApi {
  return {
    async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
      await delay(SIMULATED_DELAY_MS);

      switch (scenario) {
        case 'sucesso':
          return { batchId: demoBatchId(), results: request.recipients.map((r) => result(r, 'delivered')) };
        case 'aceite':
          return { batchId: demoBatchId() };
        case 'validacao':
          throw new MessageApiError('validation', 'Os dados enviados foram recusados pelo servidor (simulado).', {
            status: 400,
            details: request.recipients.slice(0, 1).map((recipient) => ({
              recipient,
              message: 'Número recusado pela validação do servidor (simulado).',
            })),
          });
        case 'indisponivel':
          throw new MessageApiError('unavailable', 'O serviço de envio está indisponível no momento (simulado). Nenhuma mensagem foi aceita.', { status: 503 });
        case 'conexao':
          throw new MessageApiError('network', 'Não foi possível conectar ao servidor (simulado).');
        case 'timeout':
          throw new MessageApiError('timeout', 'O servidor não respondeu a tempo (simulado).');
        case 'parcial':
        default:
          return { batchId: demoBatchId(), results: request.recipients.map(partialResult) };
      }
    },
  };
}

function partialResult(recipient: string): RecipientResult {
  const lastDigit = Number(recipient.replace(/\D/g, '').slice(-1));
  if (lastDigit === 0) return result(recipient, 'failed', 'Número sem WhatsApp (simulado).');
  if (lastDigit <= 4) return result(recipient, 'sent');
  return result(recipient, 'delivered');
}

function result(recipient: string, status: DeliveryStatus, error?: string): RecipientResult {
  return { recipient, status, error };
}

function demoBatchId(): string {
  return `demo-${Date.now().toString(36)}`;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
