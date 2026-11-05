export interface Recipient {
  /** Chave única: o número E.164 quando válido, ou o texto original quando inválido. */
  key: string;
  /** Texto digitado ou colado pelo usuário. */
  input: string;
  /** Número normalizado no formato internacional, ex.: +5581999999999. */
  e164?: string;
  /** Número formatado para exibição, ex.: +55 81 99999-9999. */
  display?: string;
  /** Motivo da invalidade, quando o número não passa na validação de formato. */
  error?: string;
}

/** Estados de entrega informados pelo backend. */
export type DeliveryStatus = 'accepted' | 'sent' | 'delivered' | 'failed';

/** Estado exibido ao usuário. "unknown" = o backend não informou o destinatário. */
export type DisplayStatus = DeliveryStatus | 'unknown';

export interface RecipientResult {
  recipient: string;
  status: DeliveryStatus;
  error?: string;
}

export interface SendMessageRequest {
  recipients: string[];
  message: string;
}

export interface SendMessageResponse {
  batchId?: string;
  /** Presente apenas quando o backend informa o resultado de cada destinatário. */
  results?: RecipientResult[];
}

export interface ValidationDetail {
  recipient?: string;
  message: string;
}
