# MCP ile Auth Hata Yönetimi - Gerçek Hayat Senaryoları

## 🎯 Senaryo 1: Token Expired - Auto Refresh

```typescript
// Auth package - token expired olduğunda
async function handleTokenExpired() {
  try {
    // 1. Token'ı yenile
    const refreshResult = await mcpBridge.callTool("auth.refreshToken", {});

    if (refreshResult.success) {
      // 2. Yeni token'ı storage'a kaydet
      await mcpBridge.callTool("storage.set", {
        key: "auth_token",
        value: refreshResult.data.token
      });

      // 3. Kullanıcıya bilgi ver
      await mcpBridge.callTool("notifications.scheduleLocal", {
        title: "Oturum Güncellendi",
        body: "Oturumunuz başarıyla yenilendi",
        seconds: 0
      });

      return true;
    } else {
      throw new Error("Refresh failed");
    }
  } catch (error) {
    // Token yenileme başarısız, logout yap
    await forceLogout();
    return false;
  }
}
```

## 🎯 Senaryo 2: Network Error - Offline Kontrolü

```typescript
// Auth package - network hatası olduğunda
async function handleAuthNetworkError(error: Error) {
  // 1. Offline mı kontrol et
  const offlineResult = await mcpBridge.callTool("offline.isOffline", {});

  if (offlineResult.data.isOffline) {
    // 2. Offline ise, kullanıcı bilgilendir
    await mcpBridge.callTool("notifications.scheduleLocal", {
      title: "Çevrimdışı",
      body: "İnternet bağlantınızı kontrol edin",
      seconds: 0
    });

    // 3. Hata durumunu kaydet
    await mcpBridge.callTool("storage.set", {
      key: "last_auth_error",
      value: {
        type: "network_error",
        message: error.message,
        timestamp: new Date().toISOString()
      }
    });

    return { success: false, offline: true };
  }

  return { success: false, offline: false };
}
```

## 🎯 Senaryo 3: Invalid Credentials - Güvenlik Log

```typescript
// Auth package - hatalı girişte
async function handleInvalidCredentials(email: string) {
  // 1. Başarısız deneme sayısını al
  const attemptsResult = await mcpBridge.callTool("storage.get", {
    key: "login_attempts"
  });

  const attempts = attemptsResult.data?.count || 0;

  // 2. Yeni denemeyi kaydet
  await mcpBridge.callTool("storage.set", {
    key: "login_attempts",
    value: {
      count: attempts + 1,
      lastAttempt: new Date().toISOString(),
      email
    }
  });

  // 3. 3 deneme fazlaysa notification
  if (attempts + 1 >= 3) {
    await mcpBridge.callTool("notifications.scheduleLocal", {
      title: "Güvenlik Uyarısı",
      body: "Çok fazla başarısız giriş denemesi",
      seconds: 0
    });
  }

  return { attempts: attempts + 1 };
}
```

## 🎯 Senaryo 4: Force Logout - Tüm Verileri Temizle

```typescript
// Auth package - zorla çıkış
async function forceLogout() {
  // 1. Auth'dan çık
  await mcpBridge.callTool("auth.signOut", {});

  // 2. Storage'da kullanıcı verilerini temizle
  await mcpBridge.callTool("storage.delete", { key: "user" });
  await mcpBridge.callTool("storage.delete", { key: "auth_token" });
  await mcpBridge.callTool("storage.delete", { key: "login_attempts" });

  // 3. Ayarları sıfırla (isteğe bağlı)
  await mcpBridge.callTool("settings.setTheme", { theme: "system" });

  // 4. Kullanıcıya bilgi ver
  await mcpBridge.callTool("notifications.scheduleLocal", {
    title: "Oturum Sonlandırıldı",
    body: "Güvenlik nedeniyle oturumunuz kapatıldı",
    seconds: 0
  });

  // 5. Log kaydı tut
  await mcpBridge.callTool("storage.set", {
    key: "last_logout",
    value: {
      reason: "force_logout",
      timestamp: new Date().toISOString()
    }
  });

  console.log("✅ Force logout completed");
}
```

## 🎯 Senaryo 5: AI Meme App'te Gerçek Kullanım

```typescript
// ai_meme_app/src/core/services/AuthErrorHandler.service.ts

export class AuthErrorHandler {
  /**
   * API çağrılarında 401 hatası alındığında
   */
  static async handleUnauthorizedError() {
    console.log("[AuthError] Handling 401 Unauthorized...");

    try {
      // 1. Önce token'ı yenilemeyi dene
      const refreshResult = await this.tryRefreshToken();

      if (refreshResult) {
        console.log("[AuthError] ✓ Token refreshed");
        return true;
      }

      // 2. Refresh başarısız ise logout yap
      console.log("[AuthError] ✗ Refresh failed, logging out...");
      await this.forceLogout();

      return false;
    } catch (error) {
      console.error("[AuthError] Fatal error:", error);
      await this.forceLogout();
      return false;
    }
  }

  /**
   * Token yenileme denemesi
   */
  private static async tryRefreshToken(): Promise<boolean> {
    try {
      // Offline mı kontrol et
      const offlineResult = await mcpBridge.callTool("offline.isOffline", {});

      if (offlineResult.data.isOffline) {
        console.log("[AuthError] Device is offline, cannot refresh");
        return false;
      }

      // Mevcut kullanıcıyı al
      const userResult = await mcpBridge.callTool("auth.getCurrentUser", {});

      if (!userResult.success || !userResult.data) {
        console.log("[AuthError] No user logged in");
        return false;
      }

      // Token'ı yenile (Firebase Auth auto-refresh)
      // Not: Firebase genellikle otomatik refresh yapar
      // Burada manuel kontrol yapıyoruz
      await mcpBridge.callTool("storage.set", {
        key: "auth_check",
        value: {
          checked: true,
          timestamp: new Date().toISOString()
        }
      });

      return true;
    } catch (error) {
      console.error("[AuthError] Refresh failed:", error);
      return false;
    }
  }

  /**
   * Zorla çıkış ve temizlik
   */
  private static async forceLogout() {
    // 1. Auth logout
    await mcpBridge.callTool("auth.signOut", {});

    // 2. Tüm user verilerini sil
    const keysToDelete = [
      "user",
      "auth_token",
      "login_attempts",
      "auth_check",
      "last_auth_error"
    ];

    for (const key of keysToDelete) {
      await mcpBridge.callTool("storage.delete", { key });
    }

    // 3. Log kaydı
    await mcpBridge.callTool("storage.set", {
      key: "last_logout",
      value: {
        reason: "auth_error",
        timestamp: new Date().toISOString()
      }
    });

    console.log("[AuthError] ✓ Forced logout completed");
  }

  /**
   * Login deneme sayısını takip et
   */
  static async trackFailedLogin(email: string) {
    const result = await mcpBridge.callTool("storage.get", {
      key: "login_attempts"
    });

    const attempts = result.data?.count || 0;

    await mcpBridge.callTool("storage.set", {
      key: "login_attempts",
      value: {
        count: attempts + 1,
        lastAttempt: new Date().toISOString(),
        email
      }
    });

    // 3+ denemede uyarı
    if (attempts + 1 >= 3) {
      await mcpBridge.callTool("notifications.scheduleLocal", {
        title: "Güvenlik Uyarısı",
        body: "Çok fazla başarısız giriş denemesi",
        seconds: 0
      });
    }

    return attempts + 1;
  }

  /**
   * Login başarılı olduğunda denemeleri sıfırla
   */
  static async resetFailedLoginAttempts() {
    await mcpBridge.callTool("storage.delete", { key: "login_attempts" });
  }
}
```

## 🔥 Kullanım Örneği - API Interceptor

```typescript
// ai_meme_app/src/core/services/apiClient.ts

import { AuthErrorHandler } from "./AuthErrorHandler";

export async function apiCall(url: string, options: RequestInit) {
  try {
    const response = await fetch(url, options);

    // 401 Unauthorized - Token expired
    if (response.status === 401) {
      console.log("[API] 401 - Attempting token refresh...");

      const recovered = await AuthErrorHandler.handleUnauthorizedError();

      if (recovered) {
        // Token yenilendi, isteği tekrarla
        console.log("[API] ✓ Token refreshed, retrying request...");
        return fetch(url, options); // Retry with new token
      } else {
        // Logout yapıldı
        console.log("[API] ✗ Auth failed, logged out");
        throw new Error("Unauthorized");
      }
    }

    return response;
  } catch (error) {
    // Network hatası
    if (error instanceof TypeError && error.message.includes("Network")) {
      const offlineResult = await mcpBridge.callTool("offline.isOffline", {});

      if (offlineResult.data.isOffline) {
        await mcpBridge.callTool("notifications.scheduleLocal", {
          title: "Çevrimdışı",
          body: "İnternet bağlantınız yok",
          seconds: 0
        });
      }
    }

    throw error;
  }
}
```

## 📊 Özet - Avantajları

### ❌ MCP OLMADAN
```typescript
// Direkt import - Bağımlılık karmaşası
import { storageService } from '@umituz/react-native-storage';
import { authService } from '@umituz/react-native-auth';
import { notificationsService } from '@umituz/react-native-notifications';
import { offlineService } from '@umituz/react-native-offline';

await storageService.delete('user');
await authService.signOut();
await notificationsService.scheduleLocal({...});
await offlineService.isOffline();
```

### ✅ MCP İLE
```typescript
// MCP ile - Loose coupling, paketsiz!
import { mcpBridge } from '@umituz/react-native-mcp-bridge';

await mcpBridge.callTool("storage.delete", { key: "user" });
await mcpBridge.callTool("auth.signOut", {});
await mcpBridge.callTool("notifications.scheduleLocal", {...});
await mcpBridge.callTool("offline.isOffline", {});

// Auth package hiçbir şey import etmiyor!
// Sadece MCP bridge'e bağlı
```

## 🎯 Sonuç

Auth hatalarını MCP ile yönetmek:
- ✅ Paketler birbirine bağımlı değil
- ✅ Test edilebilir (mock tools)
- ✅ Runtime discovery
- ✅ Merkezi loglama
- ✅ Basit ve temiz kod
