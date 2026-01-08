/**
 * useMCPTool Hook
 * @description React hook for calling MCP tools
 */

import { useCallback, useState } from "react";
import type { MCPToolParams, MCPToolResult } from "../../domain/entities";
import type { MCPBridge } from "../../infrastructure/services";

export interface UseMCPToolOptions {
  bridge: MCPBridge;
  toolName: string;
}

export function useMCPTool<TParams extends MCPToolParams = MCPToolParams, TResult = any>({
  bridge,
  toolName,
}: UseMCPToolOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TResult | null>(null);

  const call = useCallback(
    async (params: TParams): Promise<MCPToolResult<TResult>> => {
      setLoading(true);
      setError(null);

      try {
        const result = await bridge.callTool<TParams, TResult>(toolName, params);

        if (!result.success) {
          setError(result.error || "Unknown error");
          return result;
        }

        setData(result.data || null);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setLoading(false);
      }
    },
    [bridge, toolName]
  );

  return {
    call,
    loading,
    error,
    data,
  };
}
