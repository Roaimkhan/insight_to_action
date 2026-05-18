// src/services/api.ts — REST API calls (placeholder for backend integration)

const BASE_URL = process.env.BACKEND_URL ?? 'http://localhost:8000';

export const api = {
  getScenarios: () =>
    fetch(`${BASE_URL}/api/scenarios`).then((r) => r.json()),
  getAuditLog: (scenarioId: string) =>
    fetch(`${BASE_URL}/api/agent/${scenarioId}/audit`).then((r) => r.json()),
};
