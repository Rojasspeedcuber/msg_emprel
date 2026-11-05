# msg_emprel — Envio em massa de WhatsApp (frontend)

Interface em React + TypeScript + Tailwind CSS para enviar a **mesma mensagem** a vários números de WhatsApp.
O frontend não contém credenciais do provedor: toda integração com o WhatsApp deve ficar no backend.

## Requisitos

- Node.js 20.19 ou superior (ou 22.12+)
- npm

## Instalação e execução

```bash
npm install
cp .env.example .env.local     # no Windows (PowerShell): Copy-Item .env.example .env.local
npm run dev
```

Abra o endereço exibido no terminal (por padrão, http://localhost:5173).

Por padrão o app inicia em **modo demonstração** (`VITE_DEMO_MODE=true`), com respostas simuladas.
Nenhuma requisição é feita ao backend nesse modo.

## Scripts

| Comando | Função |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Checagem de tipos e build de produção (pasta `dist/`) |
| `npm run preview` | Visualiza o build de produção |
| `npm run typecheck` | Somente checagem de tipos |
| `npm test` | Testes de validação de números, lista, mensagem e cliente HTTP |

## Configuração (variáveis de ambiente)

Arquivo: `.env.local` (não versionado). Modelo em `.env.example`.

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `VITE_DEMO_MODE` | `true` | `true` usa respostas simuladas; `false` usa o backend real. |
| `VITE_API_BASE_URL` | vazio | URL base do backend, ex.: `https://api.seudominio.com.br`. Vazio = mesmo domínio do frontend (`/api/...`). |
| `VITE_API_TIMEOUT_MS` | `30000` | Tempo máximo de espera pela resposta do backend. |
| `VITE_DEV_PROXY_TARGET` | vazio | Somente desenvolvimento: encaminha `/api` do Vite para o backend, evitando CORS. Ex.: `http://localhost:3000`. |

Exemplo para conectar a um backend local:

```bash
VITE_DEMO_MODE=false
VITE_API_BASE_URL=http://localhost:3000
```

Se o backend estiver em outra origem, ele precisa liberar CORS para a origem do frontend.
Alternativamente, use `VITE_DEV_PROXY_TARGET` durante o desenvolvimento.

> As variáveis `VITE_*` são embutidas no bundle. Nunca coloque chaves secretas nelas.

## Contrato com o backend

### `POST {VITE_API_BASE_URL}/api/messages/send`

Requisição:

```json
{
  "recipients": ["+5581999999999", "+5581988888888"],
  "message": "Olá! Esta é uma mensagem de exemplo."
}
```

Resposta de sucesso (`2xx`). `results` é opcional:

```json
{
  "batchId": "lote-123",
  "results": [
    { "recipient": "+5581999999999", "status": "delivered" },
    { "recipient": "+5581988888888", "status": "failed", "error": "Número sem WhatsApp" }
  ]
}
```

- `status` por destinatário: `accepted`, `sent`, `delivered` ou `failed`.
- Se `results` não vier, a interface mostra apenas **“Solicitação aceita”**.
- Se um destinatário enviado não aparecer em `results`, ele é mostrado como **“Sem informação”**.

Erros esperados:

| Situação | Resposta do backend | Exibição no frontend |
| --- | --- | --- |
| Dados inválidos | HTTP `400` ou `422`, com `{ "error": { "message": "...", "details": [{ "recipient": "...", "message": "..." }] } }` | Erro de validação com detalhes. Nada é removido da tela. |
| Serviço indisponível | HTTP `5xx` | “Serviço indisponível”. Nada foi aceito; pode tentar de novo. |
| Falha de conexão | Sem resposta | “Resultado incerto”: orienta consultar antes de repetir. |
| Tempo esgotado | Sem resposta no prazo | “Resultado incerto”: orienta consultar antes de repetir. |
| Resposta fora do formato | — | “Resultado incerto”. |

## Estrutura do código

```
src/
├── App.tsx                      # composição da tela e fluxo de envio
├── config.ts                    # leitura das variáveis VITE_*
├── types/messaging.ts           # tipos de destinatário, mensagem e resultado
├── lib/                         # regras puras (sem React)
│   ├── phone.ts                 # validação e normalização E.164 (libphonenumber-js)
│   ├── recipients.ts            # separação, deduplicação e contagem
│   ├── message.ts               # limites e validação da mensagem
│   └── format.ts                # pluralização e números em pt-BR
├── hooks/useMessageSender.ts    # estado do envio, resultados e proteção contra duplicidade
├── services/                    # camada de integração com a API
│   ├── messageApi.ts            # contrato MessageApi e erros classificados
│   ├── httpMessageApi.ts        # cliente HTTP real (timeout, status, validação de resposta)
│   ├── mockMessageApi.ts        # modo demonstração com cenários simulados
│   └── index.ts                 # escolhe a implementação conforme VITE_DEMO_MODE
└── components/
    ├── ui/                      # Button, Card, Alert, Field (reutilizáveis)
    ├── recipients/              # formulário e lista de destinatários
    ├── message/                 # editor, prévia estilo WhatsApp
    └── send/                    # painel de envio, diálogo de confirmação, resultado
```

A interface depende apenas da interface `MessageApi`. Para trocar a implementação, basta alterar `services/index.ts`.

## Modo demonstração

Aparece com o selo **“Modo demonstração”** no topo. O seletor de cenário permite testar:

- envio com falhas parciais (final `0` falha, `1–4` enviado, demais entregue);
- todos entregues;
- apenas solicitação aceita, sem detalhe por destinatário;
- erro de validação, indisponibilidade, falha de conexão e tempo esgotado.

## Observações

- A validação de números confere **somente o formato**. Ela não confirma se o número possui WhatsApp.
- Números sem código do país (`+`) são rejeitados com explicação. Prefixo `00` é aceito como equivalente a `+`.
- Mensagens são limitadas a 4.096 caracteres, o limite de texto do WhatsApp.
- Não há consulta de status posterior nesta versão. Quando o resultado é incerto, o usuário é orientado a verificar no painel do backend antes de repetir.
