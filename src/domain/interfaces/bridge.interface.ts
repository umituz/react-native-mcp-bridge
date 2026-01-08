/**
 * MCP Bridge Interface
 * @description Contract for MCP bridge implementation
 */

import type { MCPTool, MCPToolParams, MCPToolResult, MCPToolMetadata, MCPToolCallLog } from "../entities";

export interface IMCPBridgeConfig {
  readonly enableLogging?: boolean;
  readonly maxLogs?: number;
  readonly defaultTimeout?: number;
  readonly enableToolDiscovery?: boolean;
}

export interface IMCPBridge {
  readonly config: IMCPBridgeConfig;

  registerTool<TParams extends MCPToolParams, TResult>(
    tool: MCPTool<TParams, TResult>
  ): void;

  unregisterTool(toolName: string): boolean;

  callTool<TParams extends MCPToolParams, TResult>(
    toolName: string,
    params: TParams,
    caller?: string
  ): Promise<MCPToolResult<TResult>>;

  hasTool(toolName: string): boolean;

  getTool(toolName: string): MCPTool | undefined;

  listTools(category?: string): MCPToolMetadata[];

  getCallLogs(toolName?: string): MCPToolCallLog[];

  clearLogs(): void;

  clearTools(): void;

  getStats(): MCPBridgeStats;
}

export interface MCPBridgeStats {
  readonly totalTools: number;
  readonly totalCalls: number;
  readonly averageCallDuration: number;
  readonly toolsByCategory: Record<string, number>;
  readonly mostCalledTools: Array<{ toolName: string; calls: number }>;
}
