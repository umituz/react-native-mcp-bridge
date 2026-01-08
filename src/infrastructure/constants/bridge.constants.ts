/**
 * MCP Bridge Constants
 * @description Default configuration values
 */

export const MCP_BRIDGE_DEFAULTS = {
  ENABLE_LOGGING: true,
  MAX_LOGS: 1000,
  DEFAULT_TIMEOUT: 5000,
  ENABLE_TOOL_DISCOVERY: true,
} as const;

export const MCP_ERROR_CODES = {
  TOOL_NOT_FOUND: "TOOL_NOT_FOUND",
  TOOL_TIMEOUT: "TOOL_TIMEOUT",
  INVALID_PARAMS: "INVALID_PARAMS",
  HANDLER_ERROR: "HANDLER_ERROR",
} as const;

export const MCP_LOG_LEVELS = {
  INFO: "info",
  WARN: "warn",
  ERROR: "error",
  DEBUG: "debug",
} as const;
