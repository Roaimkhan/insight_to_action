// src/services/api.ts — REST API calls for the backend contract used by web and mobile.

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';

async function jsonFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, init);
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`${path} failed (${response.status}): ${errText}`);
  }
  return response.json();
}

export const api = {
  uploadFiles: async (files: { uri: string; name: string; mimeType?: string }[], prompt = '') => {
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/octet-stream',
      } as unknown as Blob);
    }
    void prompt;
    return jsonFetch('/api/ingest/upload', { method: 'POST', body: formData });
  },
  runScenario: (scenario: string) => jsonFetch('/api/agent/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario }),
  }),
  getSession: (sessionId: string) => jsonFetch(`/api/session/${sessionId}`),
  deleteIngestSession: (sessionId: string) => jsonFetch(`/api/ingest/session/${sessionId}`, { method: 'DELETE' }),
  injectSpike: (sessionId: string) => jsonFetch(`/api/demo/spike/${sessionId}`, { method: 'POST' }),
  getAnomalyStatus: (sessionId: string) => jsonFetch(`/api/demo/anomaly-status/${sessionId}`),
};
