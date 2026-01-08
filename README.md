# @umituz/react-native-mcp-bridge

MCP-inspired inter-package communication bridge for React Native packages. Enable loose coupling and runtime tool discovery between packages.

## Features

- **Loose Coupling**: Packages communicate through tools, not direct imports
- **Runtime Discovery**: List and discover available tools at runtime
- **Type-Safe**: Full TypeScript support with generic types
- **Logging**: Built-in request/response logging for debugging
- **Timeout Handling**: Configurable timeouts for tool calls
- **Stats**: Track tool usage and performance

## Installation

```bash
npm install @umituz/react-native-mcp-bridge
```

## Quick Start

### 1. Register Tools in Your Package

```typescript
// @umituz/react-native-storage/src/infrastructure/mcp/StorageTools.ts
import { mcpBridge } from '@umituz/react-native-mcp-bridge';
import { storageService } from '../adapters/StorageService';

mcpBridge.registerTool({
  name: 'storage.get',
  description: 'Get value from AsyncStorage',
  category: 'storage',
  handler: async ({ key }) => {
    const value = await storageService.get(key);
    return { success: true, data: value };
  },
});

mcpBridge.registerTool({
  name: 'storage.set',
  description: 'Set value in AsyncStorage',
  category: 'storage',
  handler: async ({ key, value }) => {
    await storageService.set(key, value);
    return { success: true, data: { key, saved: true } };
  },
});
```

### 2. Initialize Tools in Your App

```typescript
// App.tsx
import { initializeStorageMCPTools } from '@umituz/react-native-storage';
import { initializeAuthMCPTools } from '@umituz/react-native-auth';

export function App() {
  useEffect(() => {
    // Initialize all package tools
    initializeStorageMCPTools();
    initializeAuthMCPTools();

    // List available tools
    const tools = mcpBridge.listTools();
    console.log('Available tools:', tools);
  }, []);

  return <YourApp />;
}
```

### 3. Call Tools from Other Packages

```typescript
// @umituz/react-native-auth calling storage
import { mcpBridge } from '@umituz/react-native-mcp-bridge';

async function loginUser(email: string, password: string) {
  const user = await authService.login(email, password);

  // Save to storage using MCP
  await mcpBridge.callTool('storage.set', {
    key: 'user',
    value: user,
  });

  return user;
}
```

## Usage Examples

### Using React Hooks

```typescript
import { useMCPTool } from '@umituz/react-native-mcp-bridge';

function UserProfile() {
  const { call, loading, error, data } = useMCPTool({
    bridge: mcpBridge,
    toolName: 'storage.get',
  });

  useEffect(() => {
    call({ key: 'user' });
  }, []);

  if (loading) return <Loading />;
  if (error) return <Error message={error} />;

  return <Text>Hello, {data?.name}</Text>;
}
```

### Listing Tools by Category

```typescript
const storageTools = mcpBridge.listTools('storage');
console.log(storageTools);
// [
//   { name: 'storage.get', description: 'Get value...', category: 'storage' },
//   { name: 'storage.set', description: 'Set value...', category: 'storage' }
// ]
```

### Getting Call Logs

```typescript
// Get all logs
const logs = mcpBridge.getCallLogs();

// Get logs for specific tool
const storageLogs = mcpBridge.getCallLogs('storage.get');

logs.forEach(log => {
  console.log(`${log.toolName}: ${log.duration}ms`);
});
```

### Statistics

```typescript
const stats = mcpBridge.getStats();
console.log(stats);
// {
//   totalTools: 10,
//   totalCalls: 150,
//   averageCallDuration: 45,
//   toolsByCategory: { storage: 5, auth: 3, ui: 2 },
//   mostCalledTools: [
//     { toolName: 'storage.get', calls: 80 },
//     { toolName: 'storage.set', calls: 60 }
//   ]
// }
```

## API Reference

### MCPBridge

#### `registerTool(tool)`

Register a new tool.

```typescript
mcpBridge.registerTool({
  name: 'tool.name',
  description: 'Tool description',
  category: 'custom', // optional
  timeout: 5000, // optional, defaults to 5000ms
  handler: async (params) => {
    return { success: true, data: result };
  },
});
```

#### `callTool(toolName, params, caller?)`

Call a registered tool.

```typescript
const result = await mcpBridge.callTool('tool.name', { foo: 'bar' });

if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error);
}
```

#### `hasTool(toolName)`

Check if a tool is registered.

```typescript
if (mcpBridge.hasTool('storage.get')) {
  // Tool exists
}
```

#### `listTools(category?)`

List all tools or tools by category.

```typescript
const allTools = mcpBridge.listTools();
const storageTools = mcpBridge.listTools('storage');
```

#### `getCallLogs(toolName?)`

Get call logs for all tools or specific tool.

```typescript
const allLogs = mcpBridge.getCallLogs();
const toolLogs = mcpBridge.getCallLogs('storage.get');
```

#### `getStats()`

Get bridge statistics.

```typescript
const stats = mcpBridge.getStats();
```

#### `unregisterTool(toolName)`

Unregister a tool.

```typescript
mcpBridge.unregisterTool('tool.name');
```

#### `clearLogs()`

Clear all call logs.

```typescript
mcpBridge.clearLogs();
```

#### `clearTools()`

Unregister all tools.

```typescript
mcpBridge.clearTools();
```

## Configuration

```typescript
import { MCPBridge } from '@umituz/react-native-mcp-bridge';

const bridge = new MCPBridge({
  enableLogging: true, // Enable/disable logging (default: true)
  maxLogs: 1000, // Max logs to keep (default: 1000)
  defaultTimeout: 5000, // Default timeout in ms (default: 5000)
  enableToolDiscovery: true, // Enable tool discovery (default: true)
});
```

## Best Practices

### 1. Tool Naming Convention

Use `package.action` format:

```typescript
// ✅ Good
'storage.get'
'storage.set'
'auth.login'
'auth.logout'

// ❌ Bad
'getStorage'
'loginUser'
```

### 2. Return Type Consistency

Always return `{ success: boolean, data?, error? }`:

```typescript
// ✅ Good
handler: async (params) => {
  try {
    const result = await doSomething(params);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ❌ Bad
handler: async (params) => {
  return await doSomething(params);
}
```

### 3. Error Handling

Always handle errors in tool handlers:

```typescript
handler: async ({ key }) => {
  try {
    const value = await storageService.get(key);
    return { success: true, data: value };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
```

### 4. Tool Categories

Use standard categories:

- `storage` - Storage operations
- `auth` - Authentication operations
- `network` - Network requests
- `ui` - UI operations
- `media` - Media operations
- `location` - Location services
- `notification` - Notifications
- `analytics` - Analytics
- `custom` - Custom operations

## Example: Complete Integration

```typescript
// 1. Storage package registers tools
// @umituz/react-native-storage/src/infrastructure/mcp/index.ts
import { mcpBridge } from '@umituz/react-native-mcp-bridge';

export function initializeStorageMCPTools() {
  mcpBridge.registerTool({
    name: 'storage.get',
    description: 'Get value from AsyncStorage',
    category: 'storage',
    handler: async ({ key }) => {
      const value = await storageService.get(key);
      return { success: true, data: value };
    },
  });
}

// 2. Auth package registers tools
// @umituz/react-native-auth/src/infrastructure/mcp/index.ts
export function initializeAuthMCPTools() {
  mcpBridge.registerTool({
    name: 'auth.login',
    description: 'Login user',
    category: 'auth',
    handler: async ({ email, password }) => {
      const user = await authService.login(email, password);

      // Save to storage using MCP
      await mcpBridge.callTool('storage.set', {
        key: 'user',
        value: user,
      });

      return { success: true, data: user };
    },
  });
}

// 3. App initializes all tools
// App.tsx
import { initializeStorageMCPTools } from '@umituz/react-native-storage';
import { initializeAuthMCPTools } from '@umituz/react-native-auth';

useEffect(() => {
  initializeStorageMCPTools();
  initializeAuthMCPTools();
}, []);

// 4. Components use tools
import { useMCPTool } from '@umituz/react-native-mcp-bridge';

function LoginScreen() {
  const loginMutation = useMCPTool({
    bridge: mcpBridge,
    toolName: 'auth.login',
  });

  const handleLogin = async () => {
    await loginMutation.call({
      email: 'user@example.com',
      password: 'password',
    });

    if (loginMutation.error) {
      Alert.alert('Error', loginMutation.error);
    } else {
      navigation.navigate('Home');
    }
  };

  return (
    <Button onPress={handleLogin} loading={loginMutation.loading}>
      Login
    </Button>
  );
}
```

## License

MIT

## Author

umituz
