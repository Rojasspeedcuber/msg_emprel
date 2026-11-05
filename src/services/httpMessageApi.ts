import type {
  DeliveryStatus,
  RecipientResult,
  SendMessageRequest,
  SendMessageResponse,
  ValidationDetail,
} from '../types/messaging';
import { MessageApiError, type MessageApi } from './messageApi';

export interface HttpMessageApiOptions {
  /** URL base do backend. Vazio = mesmo domínio do frontend. */
  baseUrl: string;
  timeoutMs: number;
}

const SEND_PATH = '/api/messages/send';
const DELIVERY_STATUSES: DeliveryStatus[] = ['accepted', 'sent', 'delivered', 'failed'];

/**
 * Cliente HTTP do endpoint POST /api/messages/send.
 * Não envia credenciais: a integração com o provedor de WhatsApp fica no backend.
 */
export function createHttpMessageApi({ baseUrl, timeoutMs }: HttpMessageApiOptions): MessageApi {
  const url = `${baseUrl.replace(/\/$/, '')}${SEND_PATH}`;

  return {
    async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
      const controller = new AbortController();
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, timeoutMs);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(request),
          signal: controller.signal,
        });

        const body = await readJson(response);

        if (response.ok) {
          const parsed = parseSuccessBody(body);
          if (!parsed) {
            throw new MessageApiError(
              'unexpected',
              'O servidor respondeu, mas o formato da resposta não foi reconhecido.',
              { status: response.status },
            );
          }
          return parsed;
        }

        throw toHttpError(response.status, body);
      } catch (error) {
        if (error instanceof MessageApiError) throw error;
        if (timedOut) {
          throw new MessageApiError(
            'timeout',
            'O servidor não respondeu a tempo.',
          );
        }
        throw new MessageApiError(
          'network',
          'Não foi possível conectar ao servidor. Verifique sua conexão e a URL configurada.',
        );
      } finally {
        clearTimeout(timer);
      }
    },
  };
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

function parseSuccessBody(body: unknown): SendMessageResponse | null {
  if (body === undefined) return {};
  if (!isRecord(body)) return null;

  const result: SendMessageResponse = {};
  if (typeof body.batchId === 'string') result.batchId = body.batchId;

  if (body.results !== undefined) {
    if (!Array.isArray(body.results)) return null;
    const results: RecipientResult[] = [];
    for (const item of body.results) {
      if (!isRecord(item) || typeof item.recipient !== 'string') return null;
      if (!DELIVERY_STATUSES.includes(item.status as DeliveryStatus)) return null;
      results.push({
        recipient: item.recipient,
        status: item.status as DeliveryStatus,
        error: typeof item.error === 'string' ? item.error : undefined,
      });
    }
    result.results = results;
  }

  return result;
}

function toHttpError(status: number, body: unknown): MessageApiError {
  const message = extractMessage(body);

  if (status === 400 || status === 422) {
    return new MessageApiError(
      'validation',
      message ?? 'O servidor recusou os dados enviados. Revise os números e a mensagem.',
      { status, details: extractDetails(body) },
    );
  }

  if (status === 502 || status === 503 || status === 504 || status >= 500) {
    return new MessageApiError(
      'unavailable',
      'O serviço de envio está indisponível no momento. Nenhuma mensagem foi aceita. Tente novamente em instantes.',
      { status },
    );
  }

  return new MessageApiError(
    'unexpected',
    message ?? `O servidor respondeu com erro inesperado (HTTP ${status}).`,
    { status },
  );
}

function extractMessage(body: unknown): string | undefined {
  if (!isRecord(body)) return undefined;
  if (isRecord(body.error) && typeof body.error.message === 'string') return body.error.message;
  if (typeof body.message === 'string') return body.message;
  return undefined;
}

function extractDetails(body: unknown): ValidationDetail[] {
  if (!isRecord(body) || !isRecord(body.error) || !Array.isArray(body.error.details)) return [];
  return body.error.details
    .filter(isRecord)
    .filter((item) => typeof item.message === 'string')
    .map((item) => ({
      recipient: typeof item.recipient === 'string' ? item.recipient : undefined,
      message: item.message as string,
    }));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
