// src/services/websocket.ts — WebSocket class with auto-fallback to mock
import type { AgentEvent, ScenarioId } from '../types/agent';
import { useAgentStore } from '../store/agentStore';
import { startMockStream } from './mockStream';

class AgentWebSocket {
  private ws: WebSocket | null = null;
  private cleanup: (() => void) | null = null;
  private fallbackTimeout: ReturnType<typeof setTimeout> | null = null;

  connect(backendUrl: string, scenarioId: ScenarioId, onEvent: (event: AgentEvent) => void): void {
    try {
      this.ws = new WebSocket(`${backendUrl}/ws/agent/${scenarioId}`);

      // If no connection within 3s, fall back to mock
      this.fallbackTimeout = setTimeout(() => {
        this.fallbackToMock(scenarioId, onEvent);
      }, 3000);

      this.ws.onopen = () => {
        if (this.fallbackTimeout) {
          clearTimeout(this.fallbackTimeout);
          this.fallbackTimeout = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as AgentEvent;
          onEvent(data);
        } catch {
          // Skip malformed messages
        }
      };

      this.ws.onerror = () => {
        this.fallbackToMock(scenarioId, onEvent);
      };

      this.ws.onclose = () => {
        // Natural close — no action needed
      };
    } catch {
      this.fallbackToMock(scenarioId, onEvent);
    }
  }

  private fallbackToMock(scenarioId: ScenarioId, onEvent: (event: AgentEvent) => void): void {
    this.disconnect();
    useAgentStore.getState().setMockMode(true);

    this.cleanup = startMockStream(scenarioId, {
      node_start: (e) => onEvent(e),
      source_ingested: (e) => onEvent(e),
      contradiction: (e) => onEvent(e),
      action_chain: (e) => onEvent(e),
      step_start: (e) => onEvent(e),
      step_complete: (e) => onEvent(e),
      step_failed: (e) => onEvent(e),
      self_heal: (e) => onEvent(e),
      llm_token: (e) => onEvent(e),
      complete: (e) => onEvent(e),
    });
  }

  disconnect(): void {
    if (this.fallbackTimeout) {
      clearTimeout(this.fallbackTimeout);
      this.fallbackTimeout = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.cleanup) {
      this.cleanup();
      this.cleanup = null;
    }
  }
}

export const agentWebSocket = new AgentWebSocket();
