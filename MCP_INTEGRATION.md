# MCP Bridge - Tüm Paketlerde Entegrasyon

## 🎯 1 Satır Koda Hepsi!

App.tsx'ye sadece bu paketleri import et, hepsi otomatik kaydolsun:

```typescript
// App.tsx
import "@umituz/react-native-storage";       // 5 tool
import "@umituz/react-native-auth";            // 4 tool
import "@umituz/react-native-settings";        // 3 tool
import "@umituz/react-native-localization";    // 3 tool
import "@umituz/react-native-notifications";   // 3 tool
import "@umituz/react-native-offline";         // 2 tool

// TOPLAM: 20 MCP TOOL hazır! 🚀
```

## 📦 Mevcut MCP Tool'ları

### Storage (5 tool)
```typescript
await mcpBridge.callTool("storage.get", { key: "user" });
await mcpBridge.callTool("storage.set", { key: "user", value: { name: "Umit" } });
await mcpBridge.callTool("storage.delete", { key: "user" });
await mcpBridge.callTool("storage.clear", {});
await mcpBridge.callTool("storage.getAllKeys", {});
```

### Auth (4 tool)
```typescript
await mcpBridge.callTool("auth.signUp", { email: "test@test.com", password: "123456" });
await mcpBridge.callTool("auth.signIn", { email: "test@test.com", password: "123456" });
await mcpBridge.callTool("auth.signOut", {});
await mcpBridge.callTool("auth.getCurrentUser", {});
```

### Settings (3 tool)
```typescript
await mcpBridge.callTool("settings.get", {});
await mcpBridge.callTool("settings.setTheme", { theme: "dark" });
await mcpBridge.callTool("settings.setLanguage", { language: "tr" });
```

### Localization (3 tool)
```typescript
await mcpBridge.callTool("localization.getCurrentLanguage", {});
await mcpBridge.callTool("localization.setLanguage", { language: "tr" });
await mcpBridge.callTool("localization.getAvailableLanguages", {});
```

### Notifications (3 tool)
```typescript
await mcpBridge.callTool("notifications.requestPermission", {});
await mcpBridge.callTool("notifications.getPermissionStatus", {});
await mcpBridge.callTool("notifications.scheduleLocal", { title: "Hello", body: "World", seconds: 5 });
```

### Offline (2 tool)
```typescript
await mcpBridge.callTool("offline.isOffline", {});
await mcpBridge.callTool("offline.getConnectionType", {});
```

## 🔥 Gerçek Hayat Örneği

```typescript
// Login ol → Kaydet → Dil değiştir → Notification gönder
async function completeOnboarding(email: string, password: string) {
  // 1. Login (Auth package)
  const loginResult = await mcpBridge.callTool("auth.signIn", { email, password });

  // 2. Kullanıcıyı kaydet (Storage package)
  await mcpBridge.callTool("storage.set", {
    key: "user",
    value: loginResult.data,
  });

  // 3. Türkçe yap (Localization package)
  await mcpBridge.callTool("localization.setLanguage", { language: "tr" });

  // 4. Dark mode aç (Settings package)
  await mcpBridge.callTool("settings.setTheme", { theme: "dark" });

  // 5. Hoşgeldin notification (Notifications package)
  await mcpBridge.callTool("notifications.scheduleLocal", {
    title: "Hoşgeldin!",
    body: "Uygulamaya giriş yaptın",
    seconds: 1,
  });

  console.log("Onboarding tamam! ✅");
}
```

## 📊 Tüm Tool'ları Gör

```typescript
const tools = mcpBridge.listTools();
console.log(`Toplam ${tools.length} tool mevcut:`);

tools.forEach(tool => {
  console.log(`  • ${tool.name} - ${tool.description} (${tool.category})`);
});
```

## 🎉 Sonuç

**Sadece paketleri import et, 20 tool hazır!**

```typescript
// App.tsx - Tek bunu yap!
import "@umituz/react-native-storage";
import "@umituz/react-native-auth";
import "@umituz/react-native-settings";
import "@umituz/react-native-localization";
import "@umituz/react-native-notifications";
import "@umituz/react-native-offline";

// Artık her yerde kullan!
await mcpBridge.callTool("auth.signIn", { email, password });
```
