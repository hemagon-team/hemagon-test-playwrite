import type { APIResponse, TestInfo } from '@playwright/test';

const SECRET_KEYS = new Set([
  'authorization',
  'cookie',
  'password',
  'token',
]);

export interface ApiExchangeAttachment {
  index:   number;
  method:  string;
  url:     string;
  request: {
    headers?: unknown;
    params?:  unknown;
    data?:    unknown;
    form?:    unknown;
  };
  response: {
    status:  number;
    ok:      boolean;
    headers: Record<string, string>;
    body:    unknown;
  };
}

export async function attachApiExchange(
  testInfo: TestInfo,
  exchange: ApiExchangeAttachment,
): Promise<void> {
  const name = `api-${String(exchange.index).padStart(2, '0')} ${exchange.method} ${toSafeName(exchange.url)}`;

  await testInfo.attach(name, {
    contentType: 'application/json',
    body:        Buffer.from(`${JSON.stringify(sanitizeSecrets(exchange), null, 2)}\n`),
  });
}

export async function buildApiExchange(
  index: number,
  method: string,
  url: string,
  options: unknown,
  response: APIResponse,
): Promise<ApiExchangeAttachment> {
  const responseText = await response.text().catch(error => `<<failed to read response body: ${String(error)}>>`);

  return {
    index,
    method: method.toUpperCase(),
    url,
    request:  extractRequestOptions(options),
    response: {
      status:  response.status(),
      ok:      response.ok(),
      headers: response.headers(),
      body:    parseJsonIfPossible(responseText),
    },
  };
}

function extractRequestOptions(options: unknown): ApiExchangeAttachment['request'] {
  if (!options || typeof options !== 'object') return {};

  const opts = options as {
    headers?: unknown;
    params?:  unknown;
    data?:    unknown;
    form?:    unknown;
  };

  return {
    headers: opts.headers,
    params:  opts.params,
    data:    opts.data,
    form:    opts.form,
  };
}

function parseJsonIfPossible(value: string): unknown {
  if (!value) return '';

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function sanitizeSecrets(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(item => sanitizeSecrets(item));
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.fromEntries(Object.entries(value).map(([key, entry]) => {
    if (SECRET_KEYS.has(key.toLowerCase())) {
      return [key, '<redacted>'];
    }
    return [key, sanitizeSecrets(entry)];
  }));
}

function toSafeName(url: string): string {
  const pathname = url.startsWith('http')
    ? new URL(url).pathname
    : url.split('?')[0];

  return pathname
    .replace(/^\/+/, '')
    .replace(/[^a-z0-9/_-]+/gi, '-')
    .replace(/\//g, '_')
    .slice(0, 80);
}
