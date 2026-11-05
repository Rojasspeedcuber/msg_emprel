import type {
  SendMessageRequest,
  SendMessageResponse,
  ValidationDetail,
} from '../types/messaging';

/**
 * Contrato da camada de envio. A interface depende apenas desta abstração,
 * podendo usar a API real ou o modo demonstração.
 */
export interface MessageApi {
  sendMessage(request: SendMessageRequest): Promise<SendMessageResponse>;
}

/**
 * - validation:  backend recusou os dados (nada foi enviado)
 * - unavailable: serviço indisponível (5xx) — nada foi aceito
 * - network:     falha de conexão — o envio pode ou não ter chegado ao servidor
 * - timeout:     sem resposta no tempo limite — resultado incerto
 * - unexpected:  resposta fora do contrato — resultado incerto
 */
export type MessageApiErrorKind = 'validation' | 'unavailable' | 'network' | 'timeout' | 'unexpected';

export class MessageApiError extends Error {
  readonly kind: MessageApiErrorKind;
  readonly status?: number;
  readonly details: ValidationDetail[];

  constructor(
    kind: MessageApiErrorKind,
    message: string,
    options: { status?: number; details?: ValidationDetail[] } = {},
  ) {
    super(message);
    this.name = 'MessageApiError';
    this.kind = kind;
    this.status = options.status;
    this.details = options.details ?? [];
  }
}

/** Erros em que não sabemos se o backend aceitou a solicitação. */
export function isUncertainError(error: MessageApiError): boolean {
  return error.kind === 'network' || error.kind === 'timeout' || error.kind === 'unexpected';
}

export function toMessageApiError(error: unknown): MessageApiError {
  if (error instanceof MessageApiError) return error;
  return new MessageApiError('unexpected', 'Ocorreu um erro inesperado ao enviar a solicitação.');
}
