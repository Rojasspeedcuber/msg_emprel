import { config } from '../config';
import { createHttpMessageApi } from './httpMessageApi';
import { createMockMessageApi, type DemoScenario } from './mockMessageApi';
import type { MessageApi } from './messageApi';

export type { MessageApi } from './messageApi';
export { MessageApiError, isUncertainError, toMessageApiError } from './messageApi';
export type { DemoScenario } from './mockMessageApi';
export { DEMO_SCENARIOS } from './mockMessageApi';

/** Escolhe a implementação da API conforme VITE_DEMO_MODE. */
export function createMessageApi(demoScenario: DemoScenario): MessageApi {
  if (config.demoMode) return createMockMessageApi(demoScenario);
  return createHttpMessageApi({
    baseUrl: config.apiBaseUrl,
    timeoutMs: config.apiTimeoutMs,
  });
}
