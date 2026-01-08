/**
 * useMCPBridge Hook
 * @description React hook for accessing MCP bridge instance
 */

import { useMemo } from "react";
import type { IMCPBridgeConfig } from "../../domain/interfaces";
import { MCPBridge } from "../../infrastructure/services";

let globalBridgeInstance: MCPBridge | null = null;

export interface UseMCPBridgeOptions {
  config?: IMCPBridgeConfig;
  singleton?: boolean;
}

export function useMCPBridge(options: UseMCPBridgeOptions = {}): MCPBridge {
  const { config, singleton = true } = options;

  return useMemo(() => {
    if (singleton && globalBridgeInstance) {
      return globalBridgeInstance;
    }

    const bridge = new MCPBridge(config);

    if (singleton) {
      globalBridgeInstance = bridge;
    }

    return bridge;
  }, [singleton, config]);
}

export function getGlobalBridge(): MCPBridge | null {
  return globalBridgeInstance;
}

export function setGlobalBridge(bridge: MCPBridge): void {
  globalBridgeInstance = bridge;
}
