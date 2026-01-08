/**
 * MCP Tool Entity
 * @description Represents a callable tool in the MCP bridge system
 */

export interface MCPToolParams {
  [key: string]: any;
}

export interface MCPToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface MCPTool<TParams extends MCPToolParams = MCPToolParams, TResult = any> {
  readonly name: string;
  readonly description: string;
  readonly category?: string;
  readonly handler: (params: TParams) => Promise<MCPToolResult<TResult>> | MCPToolResult<TResult>;
  readonly timeout?: number;
}

export type MCPToolCategory =
  | "storage"
  | "auth"
  | "network"
  | "ui"
  | "media"
  | "location"
  | "notification"
  | "analytics"
  | "custom";

export interface MCPToolMetadata {
  readonly name: string;
  readonly description: string;
  readonly category?: MCPToolCategory;
  readonly timeout?: number;
  readonly callCount: number;
  readonly lastCalledAt?: Date;
}

export interface MCPToolCallLog {
  readonly toolName: string;
  readonly params: MCPToolParams;
  readonly result: MCPToolResult;
  readonly duration: number;
  readonly timestamp: Date;
  readonly caller?: string;
}
