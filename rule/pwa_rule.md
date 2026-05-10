# Progressive Web App (PWA) Architecture & Rules

This document outlines the strict architectural rules and best practices for developing the Driver App as a Progressive Web App (PWA). The goal is to create an experience that is indistinguishable from a native mobile application, prioritizing offline resilience, battery efficiency, and real-time performance.

## 📱 1. App Shell Architecture
The PWA must follow the **App Shell Model** to ensure instant loading.
- **Cache-First Strategy:** The core UI shell (Bottom navigation tabs, Header, Map Container, skeleton loaders) MUST be aggressively cached by the Service Worker. When the app boots, it loads from the cache instantly, completely bypassing the network.
- **Stale-While-Revalidate:** Dynamic content (active deliveries, route data) must be fetched using TanStack Query's Stale-While-Revalidate strategy. It displays cached data immediately, fetches fresh data in the background, and seamlessly updates the UI without locking the screen.

## 📴 2. Offline-First & Data Sync
Drivers will frequently enter areas with poor or no cellular reception (e.g., underground parking, rural routes). The app MUST NOT block critical actions.
- **Dexie.js for IndexedDB:** Never use `localStorage` for queuing offline actions or storing complex datasets. `localStorage` is synchronous and blocks the main UI thread, causing stuttering. Strictly use **Dexie.js** as the robust, strongly-typed wrapper for IndexedDB.
- **Mutation Queues:** If a driver performs a write action (e.g., "Mark Package as Delivered", "Upload Proof of Delivery Signature") while offline, the action must be securely queued locally inside a Dexie.js table.
- **Background Sync API:** The Service Worker must utilize the Web Background Sync API. Once the device regains connectivity, the Service Worker will read the pending actions from Dexie.js and automatically replay them to the Laravel backend.

## 🔋 3. Hardware APIs & Battery Optimization
Continuous GPS tracking and WebSockets are highly taxing on mobile batteries and thermal limits.
- **Geolocation Throttling:** 
  - DO NOT use `setInterval` combined with `getCurrentPosition`. 
  - DO use `navigator.geolocation.watchPosition()` with `enableHighAccuracy: true`. 
  - **Crucial:** Throttle the WebSocket payload. Only emit location updates to Laravel Reverb every 5-10 seconds, OR if the driver has moved a significant distance (e.g., > 15 meters). Do not spam the server on every micro-movement.
- **Screen Wake Lock API:** When the driver is actively navigating to a destination, use the Wake Lock API (`navigator.wakeLock.request('screen')`) to prevent the device screen from turning off or dimming. Always release the lock when navigation ends to save battery.

## 🔔 4. Push Notifications
Timely communication from dispatchers is critical.
- **Web Push / FCM:** Implement standard Web Push API or Firebase Cloud Messaging for dispatch notifications (e.g., "Route Updated", "New Pickup Added").
- **Service Worker Handling:** Notifications must be processed entirely by the Service Worker. This ensures the driver receives the alert and device vibration even if the PWA is completely closed or the phone is in their pocket.

## 📦 5. App Manifest & Installation Experience
To provide a true native installation experience:
- **`manifest.json` Rules:** Must include:
  - `display: "standalone"` or `"fullscreen"` to completely hide the Safari/Chrome browser UI.
  - `theme_color` and `background_color` that perfectly match the Shadcn UI theme to prevent harsh white flashes during app startup.
  - High-quality, maskable icons (192x192, 512x512).
- **Custom Install Prompt:** Intercept the `beforeinstallprompt` event to provide a custom, beautifully designed "Install App" button within your UI. Do not rely solely on the browser's native mini-infobar.

## 🧠 6. State Management for PWA
- **TanStack Query Offline Persister:** Configure TanStack Query with `networkMode: 'offlineFirst'`. Additionally, use TanStack Query's persister plugin to save the *entire* query cache directly into **Dexie.js**. This ensures that if the PWA is closed and reopened offline, the UI instantly populates with the last known delivery routes.
- **Zustand Persistence:** For global UI state (like dark mode preference, map layer settings, or offline mode toggles), use Zustand's `persist` middleware, backed by a custom Dexie.js storage engine or IndexedDB.

## 📸 7. Media & Image Uploads (Proof of Delivery)
Handling heavy files (like Proof of Delivery photos) in an offline-first PWA requires strict management to prevent database bloat and failed uploads.
- **Client-Side Compression:** NEVER upload raw 5MB+ photos directly from the driver's camera. Use a library like `browser-image-compression` to resize and compress images (target < 500KB) *before* queuing them in Dexie.js or sending them to Laravel.
- **Queue Priority & Background Uploads:** 
  - Text mutations (e.g., setting status to "Delivered") get **High Priority** and sync immediately.
  - Image uploads get **Low Priority** and sync in the background so the driver can immediately move on to their next route.
- **Upload Retry & Chunking:**
  - For standard compressed images (< 1MB), use TanStack Query's exponential backoff retries combined with Background Sync.
  - For large files (> 2MB), implement chunked resumable uploads. If a driver drops connection at 90%, the upload must resume from 90%, not restart.
- **Storage Limits & Automatic Cleanup:** IndexedDB has browser-enforced storage limits. Once a Proof of Delivery image is successfully synced and acknowledged by the server, the Service Worker MUST permanently delete the image blob from Dexie.js to prevent crashing the app due to quota limits.
