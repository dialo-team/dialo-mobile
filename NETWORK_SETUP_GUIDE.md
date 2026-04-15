# Network & Storage Setup Guide

## Issues Fixed

### 1. ✅ SecureStore Platform Incompatibility - FIXED

**Problem**: `SecureStore.getItemAsync is not a function` on web
**Root Cause**: expo-secure-store isn't available in web environment
**Solution Implemented**:

- Created platform-aware storage layer at `src/api/auth/storage.ts`
- Uses **localStorage** on web platform
- Uses **SecureStore** on native (iOS/Android)
- Gracefully handles both environments

**Files Modified**:

- ✅ `src/api/auth/storage.ts` (NEW) - Platform detection logic
- ✅ `src/api/auth/authStorage.ts` - Updated to use new storage abstraction

### 2. ⚠️ CORS Policy Blocking - REQUIRES BACKEND CONFIG

**Problem**: "Access to XMLHttpRequest... blocked by CORS policy"
**Root Cause**: Backend at `http://14.225.254.174:8085` doesn't send CORS headers for localhost

**Current State**:

- ✅ Enhanced error logging added to detect CORS errors
- ✅ User-friendly error messages provided
- ⚠️ Backend configuration still needed

**Solutions** (choose one):

#### Option A: Add CORS Headers to Backend (RECOMMENDED)

Backend should add these headers in response:

```
Access-Control-Allow-Origin: http://localhost:8082
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-User-Id
Access-Control-Allow-Credentials: true
```

#### Option B: Use Development Proxy

In `metro.config.js` or `expo.dev` settings, configure reverse proxy to backend.

#### Option C: Test on Physical Device (BYPASS WEB)

Most reliable option:

1. Install Expo Go app on physical device
2. Connect device to same network as backend
3. Run: `npx expo start`
4. Scan QR code in Expo Go
5. Backend at 14.225.254.174:8085 will be directly accessible

## Testing Checklist

### On Web (localhost:8082)

- [ ] SecureStore error gone? YES (localStorage fallback active)
- [ ] Can see network error with helpful message? YES
- [ ] Error mentions backend CORS or device testing? YES

### On Physical Device (Expo Go)

1. Ensure device is on same network as backend
2. Backend at 14.225.254.174:8085 must be accessible
3. Test connection: `ping 14.225.254.174` from device
4. If accessible: Should work without CORS issues

## Port Configuration Status

**Current Setup**:

- `apiClient.ts`: Uses port 9000 (for auth endpoints)
- `chatApi.ts`: Uses port 8085 (for chat endpoints)

**Assumption**: These are different backend services

- Port 9000: Auth/Login service
- Port 8085: Chat service

**If this is wrong**, update the base URLs in:

- `src/api/apiClient.ts` (line 6)
- `src/api/chat/chatApi.ts` (line 11)

## Debugging Steps

### 1. Check Storage Access

Open browser console (F12):

```javascript
// Check localStorage (web fallback)
localStorage.getItem("accessToken");
localStorage.getItem("refreshToken");

// Or on Expo CLI, watch for logs:
// [AuthStorage] Getting access token
// [AuthStorage] Access token retrieved: exists or null
```

### 2. Check Network Requests

In browser DevTools → Network tab:

- All requests to 14.225.254.174:8085 should show CORS error if backend not configured
- Look for "CORS policy" error message
- Check request headers for Authorization and X-User-Id

### 3. Check Logs

Look for:

```
[AuthStorage] Getting access token
[chatApi] Making request to /api/v1/conversations
[chatClient] response error: { message, status, isCORSError }
```

## Next Steps

1. **Required**: Configure backend CORS OR test on physical device
2. **Optional**: Verify port configuration (9000 vs 8085) if endpoints fail
3. **Optional**: Set up development proxy if needed

## Contact Backend Team

Inform backend to enable CORS for development:

```
Allow Origin: http://localhost:8082
Methods: GET, POST, PUT, DELETE, OPTIONS
Headers: Content-Type, Authorization, X-User-Id
```
