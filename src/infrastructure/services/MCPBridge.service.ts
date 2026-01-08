/**
 * MCP Bridge Service
 * @description Core service for inter-package communication using MCP-inspired pattern
 */

import type {
  IMCPBridge,
  IMCPBridgeConfig,
  MCPTool,
  MCPToolParams,
  MCPToolResult,
  MCPToolMetadata,
  MCPToolCallLog,
  MCPBridgeStats,
} from "../../domain/interfaces";
import { MCPLogger } from "../utils/logger.util";
import { MCP_BRIDGE_DEFAULTS, MCP_ERROR_CODES } from "../constants";

export class MCPBridge implements IMCPBridge {
  readonly config: IMCPBridgeConfig;

  private tools = new Map<string, MCPTool & { metadata: MCPToolMetadata }>();
  private logger: MCPLogger;

  constructor(config: IMCPBridgeConfig = {}) {
    this.config = {
      enableLogging: config.enableLogging ?? MCP_BRIDGE_DEFAULTS.ENABLE_LOGGING,
      maxLogs: config.maxLogs ?? MCP_BRIDGE_DEFAULTS.MAX_LOGS,
      defaultTimeout: config.defaultTimeout ?? MCP_BRIDGE_DEFAULTS.DEFAULT_TIMEOUT,
      enableToolDiscovery: config.enableToolDiscovery ?? MCP_BRIDGE_DEFAULTS.ENABLE_TOOL_DISCOVERY,
    };

    this.logger = new MCPLogger(this.config.maxLogs, this.config.enableLogging);
  }

  registerTool<TParams extends MCPToolParams, TResult>(
    tool: MCPTool<TParams, TResult>
  ): void {
    if (this.tools.has(tool.name)) {
      if (__DEV__) {
        console.warn(`[MCP] Tool "${tool.name}" is already registered. Overwriting.`);
      }
    }

    const toolWithMetadata: MCPTool & { metadata: MCPToolMetadata } = {
      ...tool,
      metadata: {
        name: tool.name,
        description: tool.description,
        category: tool.category,
        timeout: tool.timeout ?? this.config.defaultTimeout,
        callCount: 0,
      },
    };

    this.tools.set(tool.name, toolWithMetadata);

    if (__DEV__) {
      console.log(`[MCP] ✓ Tool registered: ${tool.name}`);
    }
  }

  unregisterTool(toolName: string): boolean {
    const result = this.tools.delete(toolName);

    if (__DEV__) {
      if (result) {
        console.log(`[MCP] ✓ Tool unregistered: ${toolName}`);
      } else {
        console.warn(`[MCP] ✗ Tool not found: ${toolName}`);
      }
    }

    return result;
  }

  async callTool<TParams extends MCPToolParams, TResult>(
    toolName: string,
    params: TParams,
    caller?: string
  ): Promise<MCPToolResult<TResult>> {
    const tool = this.tools.get(toolName);

    if (!tool) {
      const error = `Tool not found: ${toolName}`;
      if (__DEV__) {
        console.error(`[MCP] ✗ ${error}`);
      }
      return {
        success: false,
        error: `${MCP_ERROR_CODES.TOOL_NOT_FOUND}: ${error}`,
      };
    }

    const startTime = Date.now();

    try {
      const timeout = tool.metadata.timeout ?? this.config.defaultTimeout;

      const resultPromise = tool.handler(params);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Tool timeout")), timeout)
      );

      const result = await Promise.race([resultPromise, timeoutPromise]);

      const duration = Date.now() - startTime;

      const callLog: MCPToolCallLog = {
        toolName,
        params,
        result,
        duration,
        timestamp: new Date(),
        caller,
      };

      this.logger.log(callLog);

      tool.metadata.callCount++;
      tool.metadata.lastCalledAt = new Date();

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      const errorResult: MCPToolResult<TResult> = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };

      const callLog: MCPToolCallLog = {
        toolName,
        params,
        result: errorResult,
        duration,
        timestamp: new Date(),
        caller,
      };

      this.logger.log(callLog);

      return errorResult;
    }
  }

  hasTool(toolName: string): boolean {
    return this.tools.has(toolName);
  }

  getTool(toolName: string): MCPTool | undefined {
    const toolWithMetadata = this.tools.get(toolName);
    if (!toolWithMetadata) return undefined;

    const { metadata, ...tool } = toolWithMetadata;
    return tool;
  }

  listTools(category?: string): MCPToolMetadata[] {
    const tools = Array.from(this.tools.values());

    if (category) {
      return tools
        .filter((tool) => tool.metadata.category === category)
        .map((tool) => tool.metadata);
    }

    return tools.map((tool) => tool.metadata);
  }

  getCallLogs(toolName?: string): MCPToolCallLog[] {
    return this.logger.getLogs(toolName);
  }

  clearLogs(): void {
    this.logger.clear();
  }

  clearTools(): void {
    this.tools.clear();
  }

  getStats(): MCPBridgeStats {
    const logs = this.logger.getLogs();
    const totalCalls = logs.length;

    const totalDuration = logs.reduce((sum, log) => sum + log.duration, 0);
    const averageCallDuration = totalCalls > 0 ? totalDuration / totalCalls : 0;

    const toolsByCategory: Record<string, number> = {};
    this.tools.forEach((tool) => {
      const category = tool.metadata.category || "uncategorized";
      toolsByCategory[category] = (toolsByCategory[category] || 0) + 1;
    });

    const toolCallCounts = new Map<string, number>();
    logs.forEach((log) => {
      toolCallCounts.set(log.toolName, (toolCallCounts.get(log.toolName) || 0) + 1);
    });

    const mostCalledTools = Array.from(toolCallCounts.entries())
      .map(([toolName, calls]) => ({ toolName, calls }))
      .sort((a, b) => b.calls - a.calls)
      .slice(0, 10);

    return {
      totalTools: this.tools.size,
      totalCalls,
      averageCallDuration,
      toolsByCategory,
      mostCalledTools,
    };
  }
}
