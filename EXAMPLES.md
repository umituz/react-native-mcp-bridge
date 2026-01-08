# MCP Bridge - Usage Examples

## Example 1: Auth Package Calling Storage Package

```typescript
// @umituz/react-native-auth/src/infrastructure/services/Auth.service.ts
import { mcpBridge } from '@umituz/react-native-mcp-bridge';

class AuthService {
  async login(email: string, password: string) {
    // Perform login
    const user = await this.apiLogin(email, password);

    // Save to storage via MCP (no direct import)
    await mcpBridge.callTool('storage.set', {
      key: 'user',
      value: user,
    });

    // Save auth token
    await mcpBridge.callTool('storage.set', {
      key: 'auth_token',
      value: user.token,
    });

    return user;
  }

  async logout() {
    // Clear storage via MCP
    await mcpBridge.callTool('storage.delete', { key: 'user' });
    await mcpBridge.callTool('storage.delete', { key: 'auth_token' });
  }

  async getCurrentUser() {
    // Get from storage via MCP
    const result = await mcpBridge.callTool('storage.get', {
      key: 'user',
    });

    if (result.success) {
      return result.data;
    }

    return null;
  }
}
```

## Example 2: Settings Package Using Storage

```typescript
// @umituz/react-native-settings/src/infrastructure/services/Settings.service.ts
import { mcpBridge } from '@umituz/react-native-mcp-bridge';

class SettingsService {
  private readonly SETTINGS_KEY = 'app_settings';

  async getSettings() {
    const result = await mcpBridge.callTool('storage.get', {
      key: this.SETTINGS_KEY,
    });

    return result.success ? result.data : {};
  }

  async updateSettings(newSettings: Record<string, any>) {
    const currentSettings = await this.getSettings();
    const updated = { ...currentSettings, ...newSettings };

    await mcpBridge.callTool('storage.set', {
      key: this.SETTINGS_KEY,
      value: updated,
    });

    return updated;
  }

  async resetSettings() {
    await mcpBridge.callTool('storage.delete', {
      key: this.SETTINGS_KEY,
    });
  }
}
```

## Example 3: Analytics Package Tracking Events

```typescript
// @umituz/react-native-analytics/src/infrastructure/mcp/AnalyticsTools.ts
import { mcpBridge } from '@umituz/react-native-mcp-bridge';

export function initializeAnalyticsMCPTools() {
  mcpBridge.registerTool({
    name: 'analytics.track',
    description: 'Track analytics event',
    category: 'analytics',
    handler: async ({ eventName, properties }) => {
      // Track event
      analyticsService.track(eventName, properties);
      return { success: true };
    },
  });

  mcpBridge.registerTool({
    name: 'analytics.identify',
    description: 'Identify user',
    category: 'analytics',
    handler: async ({ userId, traits }) => {
      analyticsService.identify(userId, traits);
      return { success: true };
    },
  });
}

// Usage in auth package
// After successful login:
await mcpBridge.callTool('analytics.identify', {
  userId: user.id,
  traits: { email: user.email, name: user.name },
});

await mcpBridge.callTool('analytics.track', {
  eventName: 'user_login',
  properties: { method: 'email' },
});
```

## Example 4: Multi-Package Workflow

```typescript
// Complete user onboarding flow
async function completeOnboarding(userData: UserData) {
  // 1. Create user account (auth package)
  const userResult = await mcpBridge.callTool('auth.register', {
    email: userData.email,
    password: userData.password,
  });

  if (!userResult.success) {
    throw new Error(userResult.error);
  }

  // 2. Save user preferences (settings package)
  await mcpBridge.callTool('settings.update', {
    theme: 'dark',
    language: 'en',
  });

  // 3. Track onboarding completion (analytics package)
  await mcpBridge.callTool('analytics.track', {
    eventName: 'onboarding_completed',
    properties: { userId: userResult.data.id },
  });

  // 4. Show celebration animation (UI package)
  await mcpBridge.callTool('ui.celebrate', {
    type: 'confetti',
  });

  return userResult.data;
}
```

## Example 5: React Component Usage

```typescript
import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useMCPTool } from '@umituz/react-native-mcp-bridge';

function UserProfileScreen() {
  const { call, loading, error, data: user } = useMCPTool({
    bridge: mcpBridge,
    toolName: 'storage.get',
  });

  const logoutMutation = useMCPTool({
    bridge: mcpBridge,
    toolName: 'auth.logout',
  });

  useEffect(() => {
    call({ key: 'user' });
  }, []);

  const handleLogout = async () => {
    const result = await logoutMutation.call();
    if (result.success) {
      navigation.navigate('Login');
    }
  };

  if (loading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error}</text>;

  return (
    <View>
      <Text>Welcome, {user?.name}</Text>
      <Text>Email: {user?.email}</Text>
      <Button onPress={handleLogout}>Logout</Button>
    </View>
  );
}
```

## Example 6: Custom Hook for Multi-Tool Operations

```typescript
// hooks/useAuthFlow.ts
import { mcpBridge } from '@umituz/react-native-mcp-bridge';

export function useAuthFlow() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      // 1. Login
      const loginResult = await mcpBridge.callTool('auth.login', {
        email,
        password,
      });

      if (!loginResult.success) {
        throw new Error(loginResult.error);
      }

      // 2. Load settings
      const settingsResult = await mcpBridge.callTool('settings.get', {});

      // 3. Track login event
      await mcpBridge.callTool('analytics.track', {
        eventName: 'user_login',
        properties: { email },
      });

      return {
        user: loginResult.data,
        settings: settingsResult.data,
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { login, loading, error };
}

// Usage
function LoginScreen() {
  const { login, loading, error } = useAuthFlow();

  const handleLogin = async () => {
    const result = await login('user@example.com', 'password');
    if (result) {
      navigation.navigate('Home', { user: result.user });
    }
  };

  return (
    <Button onPress={handleLogin} loading={loading}>
      Login
    </Button>
  );
}
```

## Example 7: Error Handling & Timeouts

```typescript
// Tool with timeout
mcpBridge.registerTool({
  name: 'network.fetch',
  description: 'Fetch data from API',
  category: 'network',
  timeout: 10000, // 10 seconds
  handler: async ({ url }) => {
    try {
      const response = await fetch(url);
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Fetch failed'
      };
    }
  },
});

// Usage with error handling
const result = await mcpBridge.callTool('network.fetch', {
  url: 'https://api.example.com/data',
});

if (result.success) {
  console.log('Data:', result.data);
} else {
  if (result.error?.includes('timeout')) {
    console.error('Request timed out');
  } else {
    console.error('Error:', result.error);
  }
}
```

## Example 8: Debugging with Logs

```typescript
// Enable debug logging in development
if (__DEV__) {
  const logs = mcpBridge.getCallLogs();

  logs.forEach(log => {
    console.log(`
      Tool: ${log.toolName}
      Duration: ${log.duration}ms
      Success: ${log.result.success}
      Params: ${JSON.stringify(log.params)}
    `);
  });

  // Get stats
  const stats = mcpBridge.getStats();
  console.log('Total calls:', stats.totalCalls);
  console.log('Avg duration:', stats.averageCallDuration);
  console.log('Most called:', stats.mostCalledTools);
}
```
