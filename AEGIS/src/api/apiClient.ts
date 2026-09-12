// ============================================================================
// AEGIS OS — Centralized API Client & Mock Gateway
// Toggle USE_MOCK_API = false when ready to route to real backend microservices.
// ============================================================================

import type { ApiOperationLog } from './types';

// Global switch for mock mode vs live backend
export const USE_MOCK_API = true;
export const API_BASE_URL = 'http://localhost:8000';

type Subscriber = (log: ApiOperationLog) => void;
const listeners: Set<Subscriber> = new Set();
const recentLogs: ApiOperationLog[] = [];

export function subscribeToApiLogs(callback: Subscriber): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function getRecentApiLogs(): ApiOperationLog[] {
  return [...recentLogs];
}

export function logApiOperation(log: Omit<ApiOperationLog, 'id' | 'timestamp'>): ApiOperationLog {
  const fullLog: ApiOperationLog = {
    ...log,
    id: 'op-' + Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
  };

  recentLogs.unshift(fullLog);
  if (recentLogs.length > 50) recentLogs.pop();

  listeners.forEach((fn) => {
    try {
      fn(fullLog);
    } catch {
      // Ignore listener error
    }
  });

  return fullLog;
}

/**
 * Universal request wrapper. In mock mode, it returns simulated response with simulated latency.
 * In live mode, it issues real fetch calls.
 */
export async function request<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  endpoint: string,
  options?: {
    agentId?: string;
    payload?: Record<string, unknown>;
    mockData?: T;
    delayMs?: number;
    statusText?: '200 OK' | '201 Created' | '202 Queued' | '403 Forbidden' | 'APPROVAL_REQUIRED' | '500 Error';
    responseCode?: number;
  }
): Promise<T> {
  const agentId = options?.agentId || 'aegis-core';
  const delayMs = options?.delayMs ?? 180;
  const statusText = options?.statusText || (method === 'POST' ? '201 Created' : '200 OK');
  const responseCode = options?.responseCode || (method === 'POST' ? 201 : 200);

  if (USE_MOCK_API) {
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    logApiOperation({
      agentId,
      method,
      endpoint,
      status: statusText,
      responseCode,
      payload: options?.payload,
      responseSnippet: options?.mockData ? JSON.stringify(options.mockData).substring(0, 80) : 'OK',
    });

    return options?.mockData as T;
  }

  // Live backend call fallback
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: options?.payload ? JSON.stringify(options.payload) : undefined,
    });

    const json = (await res.json()) as T;

    logApiOperation({
      agentId,
      method,
      endpoint,
      status: res.ok ? '200 OK' : '500 Error',
      responseCode: res.status,
      payload: options?.payload,
      responseSnippet: JSON.stringify(json).substring(0, 80),
    });

    return json;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Network error';
    logApiOperation({
      agentId,
      method,
      endpoint,
      status: '500 Error',
      responseCode: 500,
      payload: options?.payload,
      responseSnippet: errorMsg,
    });
    throw err;
  }
}
