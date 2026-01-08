/**
 * MCP Bridge Logger
 * @description Internal logging utility for MCP bridge operations
 */

import type { MCPToolCallLog } from "../../domain/entities";

export class MCPLogger {
  private logs: MCPToolCallLog[] = [];
  private maxLogs: number;
  private enabled: boolean;

  constructor(maxLogs: number = 1000, enabled: boolean = true) {
    this.maxLogs = maxLogs;
    this.enabled = enabled;
  }

  log(call: MCPToolCallLog): void {
    if (!this.enabled) return;

    this.logs.push(call);

    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    if (__DEV__) {
      const durationStr = `${call.duration}ms`;
      const status = call.result.success ? "✓" : "✗";
      console.log(
        `[MCP] ${status} ${call.toolName} (${durationStr})`,
        call.params,
        call.result
      );
    }
  }

  getLogs(toolName?: string): MCPToolCallLog[] {
    if (toolName) {
      return this.logs.filter((log) => log.toolName === toolName);
    }
    return [...this.logs];
  }

  clear(): void {
    this.logs = [];
  }

  getCount(): number {
    return this.logs.length;
  }
}
