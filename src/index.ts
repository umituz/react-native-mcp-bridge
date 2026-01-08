/**
 * @umituz/react-native-mcp-bridge
 * MCP-inspired inter-package communication bridge for React Native packages
 * @description Enable loose coupling and runtime tool discovery between packages
 */

// =============================================================================
// DOMAIN LAYER - Types & Interfaces
// =============================================================================

export type {
  MCPTool,
  MCPToolParams,
  MCPToolResult,
  MCPToolMetadata,
  MCPToolCallLog,
  MCPToolCategory,
} from "./domain/entities";

export type {
  IMCPBridge,
  IMCPBridgeConfig,
  MCPBridgeStats,
} from "./domain/interfaces";

// =============================================================================
// INFRASTRUCTURE LAYER - Services & Utils
// =============================================================================

export { MCPBridge } from "./infrastructure/services";

export { MCPLogger } from "./infrastructure/utils";

export { MCP_BRIDGE_DEFAULTS, MCP_ERROR_CODES, MCP_LOG_LEVELS } from "./infrastructure/constants";

// =============================================================================
// PRESENTATION LAYER - Hooks
// =============================================================================

export {
  useMCPBridge,
  getGlobalBridge,
  setGlobalBridge,
  useMCPTool,
} from "./presentation/hooks";

// =============================================================================
// SINGLETON INSTANCE (Global Bridge)
// =============================================================================

import { MCPBridge } from "./infrastructure/services";

/**
 * Global MCP bridge instance
 * @description Shared bridge instance for all packages
 */
export const mcpBridge = new MCPBridge();
