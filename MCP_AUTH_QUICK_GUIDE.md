# MCP ile Auth Hata Yönetimi - Hızlı Rehber

## 🎯 Gerçek Hayat Senaryosu: 401 Token Expired

### ❌ MCP OLMADAN (Karmaşık)
```typescript
import { storageService } from '@umituz/react-native-storage';
import { authService } from '@umituz/react-native-auth';
import { notificationsService } from '@umituz/react-native-notifications';
import { offlineService } from '@umituz/react-native-offline';

// Bir sürü import, tight coupling
await authService.signOut();
await storageService.delete('user');
await notificationsService.scheduleLocal({...});
await offlineService.isOffline();
```

### ✅ MCP İLE (Basit)
```typescript
import { mcpBridge } from '@umituz/react-native-mcp-bridge';

// Tek import, loose coupling
await mcpBridge.callTool("auth.signOut", {});
await mcpBridge.callTool("storage.delete", { key: "user" });
await mcpBridge.callTool("notifications.scheduleLocal", {...});
await mcpBridge.callTool("offline.isOffline", {});
```

## 📝 ai_meme_app'te Kullanım

### 1. AuthErrorHandler Hazır

`src/core/services/AuthErrorHandler.ts` dosyası oluşturuldu.

**Kullanım:**

```typescript
import { AuthErrorHandler } from "@core/services/AuthErrorHandler";

// Token expired olduğunda
const recovered = await AuthErrorHandler.handleUnauthorizedError();

if (recovered) {
  // Token yenilendi, devam et
} else {
  // Logout yapıldı, login ekranına yönlendir
}

// Hatalı login denemesi
await AuthErrorHandler.trackFailedLogin("user@test.com");

// Başarılı login
await AuthErrorHandler.resetFailedLoginAttempts();

// Son hatayı getir
const lastError = await AuthErrorHandler.getLastAuthError();
```

### 2. API Client Hazır

`src/core/services/apiClient.ts` dosyası oluşturuldu.

**Kullanım:**

```typescript
import { apiCall, generateMeme, loginExample } from "@core/services/apiClient";

// API çağrısı (otomatik token refresh)
const result = await apiCall("/api/meme/generate", {
  method: "POST",
  body: JSON.stringify({ prompt: "funny cat" })
});

// 401 gelirse AuthErrorHandler otomatik:
// 1. Token yenilemeyi dener
// 2. Başarısız olursa logout yapar
// 3. İsteği tekrarlar veya hata fırlatır
```

## 🔥 5 Gerçek Hayat Senaryosu

### Senaryo 1: API 401 Hatası → Auto Refresh

```typescript
// API interceptor
async function apiCall(url: string, options: RequestInit) {
  const response = await fetch(url, options);

  if (response.status === 401) {
    // MCP ile token yenile
    const recovered = await AuthErrorHandler.handleUnauthorizedError();

    if (recovered) {
      // Token yenilendi, isteği tekrarla
      return fetch(url, options);
    } else {
      // Logout yapıldı
      throw new Error("SESSION_EXPIRED");
    }
  }

  return response;
}
```

### Senaryo 2: Hatalı Login → Güvenlik Log

```typescript
// Login attempt tracking
async function handleLogin(email: string, password: string) {
  try {
    const result = await mcpBridge.callTool("auth.signIn", { email, password });

    if (result.success) {
      // Başarılı - denemeleri sıfırla
      await AuthErrorHandler.resetFailedLoginAttempts();
      return result.data;
    } else {
      // Başarısız - takip et
      const attempts = await AuthErrorHandler.trackFailedLogin(email);

      if (attempts >= 3) {
        // 3 deneme - notification gönder
        await mcpBridge.callTool("notifications.scheduleLocal", {
          title: "⚠️ Güvenlik Uyarısı",
          body: "Çok fazla başarısız giriş denemesi!",
          seconds: 0
        });
      }

      throw new Error("Login failed");
    }
  } catch (error) {
    await AuthErrorHandler.logAuthError(error, "login");
    throw error;
  }
}
```

### Senaryo 3: Network Error → Offline Kontrol

```typescript
// Network hatası
async function handleNetworkError(error: Error) {
  const offlineResult = await mcpBridge.callTool("offline.isOffline", {});

  if (offlineResult.data.isOffline) {
    // Offline notification
    await mcpBridge.callTool("notifications.scheduleLocal", {
      title: "Çevrimdışı",
      body: "İnternet bağlantınızı kontrol edin",
      seconds: 0
    });
  }
}
```

### Senaryo 4: Force Logout → Temizlik

```typescript
// Tüm verileri temizle
async function forceLogout() {
  // 1. Auth logout
  await mcpBridge.callTool("auth.signOut", {});

  // 2. Tüm user verilerini sil
  const keys = ["user", "auth_token", "login_attempts"];
  for (const key of keys) {
    await mcpBridge.callTool("storage.delete", { key });
  }

  // 3. Log kaydı
  await mcpBridge.callTool("storage.set", {
    key: "last_logout",
    value: {
      reason: "manual_logout",
      timestamp: new Date().toISOString()
    }
  });

  console.log("✅ Logout completed");
}
```

### Senaryo 5: Login Sonrası Setup

```typescript
// Başarılı login sonrası
async function onLoginSuccess(user: any) {
  // 1. Kullanıcıyı kaydet
  await mcpBridge.callTool("storage.set", {
    key: "user",
    value: user
  });

  // 2. Denemeleri sıfırla
  await AuthErrorHandler.resetFailedLoginAttempts();

  // 3. Hoşgeldin notification
  await mcpBridge.callTool("notifications.scheduleLocal", {
    title: "Hoşgeldin! 👋",
    body: "Başarıyla giriş yaptın",
    seconds: 0
  });

  // 4. Dil ayarla
  await mcpBridge.callTool("localization.setLanguage", {
    language: user.language || "en"
  });
}
```

## 🎉 Avantajlar

### ❌ Direkt Import
- Paketler birbirine bağımlı
- Test etmek zor
- Değiştirmek karmaşık
- Circular dependency riski

### ✅ MCP Bridge
- Paketler bağımsız
- Test edilebilir (mock tools)
- Runtime discovery
- Merkezi loglama
- Basit ve temiz

## 📦 ai_meme_app'te Hazır Dosyalar

✅ `src/core/services/AuthErrorHandler.ts` - Auth hata yönetimi
✅ `src/core/services/apiClient.ts` - API client + auto refresh
✅ `App.tsx` - MCP importları hazır

**Hemen kullanmaya başla!** 🚀
