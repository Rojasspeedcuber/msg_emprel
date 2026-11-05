import { afterEach, describe, expect, it, vi } from 'vitest';
import { createHttpMessageApi } from './httpMessageApi';
import { MessageApiError } from './messageApi';

const request = { recipients: ['+5581999999999'], message: 'Olá' };

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function captureError(promise: Promise<unknown>): Promise<MessageApiError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof MessageApiError) return error;
    throw error;
  }
  throw new Error('esperava um erro');
}

describe('createHttpMessageApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('envia POST para /api/messages/send com o corpo esperado', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(202, { batchId: 'abc' }));
    vi.stubGlobal('fetch', fetchMock);

    const api = createHttpMessageApi({ baseUrl: 'https://api.exemplo.com/', timeoutMs: 1000 });
    const response = await api.sendMessage(request);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.exemplo.com/api/messages/send',
      expect.objectContaining({ method: 'POST', body: JSON.stringify(request) }),
    );
    expect(response).toEqual({ batchId: 'abc' });
  });

  it('retorna resultados por destinatário quando informados', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(200, { results: [{ recipient: '+5581999999999', status: 'failed', error: 'sem WhatsApp' }] }),
      ),
    );

    const api = createHttpMessageApi({ baseUrl: '', timeoutMs: 1000 });
    const response = await api.sendMessage(request);

    expect(response.results).toEqual([
      { recipient: '+5581999999999', status: 'failed', error: 'sem WhatsApp' },
    ]);
  });

  it('classifica erro 400 como validação, com detalhes', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(400, { error: { message: 'Dados inválidos', details: [{ recipient: '+5581999999999', message: 'x' }] } }),
      ),
    );

    const error = await captureError(createHttpMessageApi({ baseUrl: '', timeoutMs: 1000 }).sendMessage(request));

    expect(error.kind).toBe('validation');
    expect(error.message).toBe('Dados inválidos');
    expect(error.details).toEqual([{ recipient: '+5581999999999', message: 'x' }]);
  });

  it('classifica 503 como indisponibilidade', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(503, {})));

    const error = await captureError(createHttpMessageApi({ baseUrl: '', timeoutMs: 1000 }).sendMessage(request));

    expect(error.kind).toBe('unavailable');
  });

  it('classifica falha de conexão como network', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    const error = await captureError(createHttpMessageApi({ baseUrl: '', timeoutMs: 1000 }).sendMessage(request));

    expect(error.kind).toBe('network');
  });

  it('classifica ausência de resposta no prazo como timeout', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            init.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
          }),
      ),
    );

    const error = await captureError(createHttpMessageApi({ baseUrl: '', timeoutMs: 20 }).sendMessage(request));

    expect(error.kind).toBe('timeout');
  });
});
