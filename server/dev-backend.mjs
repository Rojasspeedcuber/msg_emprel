// Backend de desenvolvimento: implementa o contrato de POST /api/messages/send
// usando a WhatsApp Cloud API (Meta). Requer WHATSAPP_ACCESS_TOKEN e WHATSAPP_PHONE_NUMBER_ID.
import { createServer } from 'node:http';

const PORT = Number(process.env.PORT) || 3000;
const MAX_MESSAGE_LENGTH = 4096;
const E164 = /^\+[1-9]\d{7,14}$/;
const API_VERSION = process.env.WHATSAPP_API_VERSION || 'v23.0';
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
  console.error('Defina WHATSAPP_ACCESS_TOKEN e WHATSAPP_PHONE_NUMBER_ID (ex.: em .env.local).');
  process.exit(1);
}

const MESSAGES_URL = `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`;

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function validationError(message, details = []) {
  return { error: { message, details } };
}

function validate(payload) {
  if (!payload || typeof payload !== 'object') {
    return validationError('Corpo da requisição inválido.');
  }

  const { recipients, message } = payload;
  const details = [];

  if (!Array.isArray(recipients) || recipients.length === 0) {
    return validationError('Informe ao menos um destinatário.');
  }

  for (const recipient of recipients) {
    if (typeof recipient !== 'string' || !E164.test(recipient)) {
      details.push({ recipient: String(recipient), message: 'Número inválido. Use o formato E.164, ex.: +5581999999999.' });
    }
  }

  if (typeof message !== 'string' || message.trim() === '') {
    details.push({ message: 'A mensagem não pode estar vazia.' });
  } else if (message.length > MAX_MESSAGE_LENGTH) {
    details.push({ message: `A mensagem excede ${MAX_MESSAGE_LENGTH} caracteres.` });
  }

  return details.length > 0 ? validationError('Dados inválidos.', details) : null;
}

function describeMetaError(status, data) {
  const err = data?.error;
  if (!err) return `A Meta respondeu HTTP ${status} sem detalhes.`;
  const details = err.error_data?.details;
  return `[${err.code ?? status}] ${err.message}${details ? ` — ${details}` : ''}`;
}

async function sendText(recipient, body) {
  try {
    const response = await fetch(MESSAGES_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipient.slice(1),
        type: 'text',
        text: { preview_url: false, body },
      }),
    });
    const data = await response.json().catch(() => undefined);

    if (response.ok && data?.messages?.[0]?.id) {
      return { recipient, status: 'accepted' };
    }
    return { recipient, status: 'failed', error: describeMetaError(response.status, data) };
  } catch (error) {
    return { recipient, status: 'failed', error: `Falha de conexão com a Meta: ${error.message}` };
  }
}

const server = createServer((req, res) => {
  let raw = '';
  req.on('data', (chunk) => {
    raw += chunk;
  });
  req.on('end', async () => {
    console.log(`${new Date().toLocaleTimeString('pt-BR')} ${req.method} ${req.url}`);

    if (req.method !== 'POST' || req.url !== '/api/messages/send') {
      return send(res, 404, validationError('Rota não encontrada.'));
    }

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      return send(res, 400, validationError('JSON inválido.'));
    }

    const error = validate(payload);
    if (error) {
      console.log('  -> 400 validação', JSON.stringify(error.error.details));
      return send(res, 400, error);
    }

    const results = [];
    for (const recipient of payload.recipients) {
      results.push(await sendText(recipient, payload.message));
    }

    const failed = results.filter((r) => r.status === 'failed').length;
    console.log(`  -> 200 ${results.length} destinatário(s), ${failed} falha(s)`);
    for (const result of results) {
      if (result.status === 'failed') console.log(`     ${result.recipient}: ${result.error}`);
    }

    return send(res, 200, {
      batchId: `lote-${Date.now()}`,
      results,
    });
  });
});

server.listen(PORT, () => {
  console.log(`Backend em http://localhost:${PORT} (WhatsApp Cloud API ${API_VERSION})`);
  console.log('Endpoint: POST /api/messages/send');
});
