const timeout = Number(import.meta.env.VITE_API_TIMEOUT_MS);

export const config = {
  /** Modo demonstração ativo por padrão; defina VITE_DEMO_MODE=false para usar o backend. */
  demoMode: import.meta.env.VITE_DEMO_MODE !== 'false',
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/$/, ''),
  apiTimeoutMs: Number.isFinite(timeout) && timeout > 0 ? timeout : 30000,
};
