# Project Architecture & AI Coding Rules: Delivery Tracking System

This document serves as the master instruction set for AI coding assistants and developers working on this project. It defines the core architecture, technology stack, design principles, and coding conventions to ensure an enterprise-grade, high-performance, and scalable Delivery Tracking System.

## 🎯 Core Objectives
Our system is built with a strict focus on:
- **Speed & Performance:** Lightning-fast load times, optimized battery usage on mobile, and smooth map interactions.
- **Scalability:** Built to handle concurrent real-time tracking for up to 200 active drivers smoothly, with room to scale.
- **Security:** Robust data protection, secure tracking links, and vulnerability prevention.
- **Consistency:** Uniform code structure, design language, and user experience across all portals.
- **Enterprise-Grade:** Highly reliable, maintainable, and thoroughly tested infrastructure.

## 🏢 System Components
The ecosystem consists of three main applications, each with distinct focuses:
1. **Driver App (PWA):** Mobile-first, optimized for offline capabilities, background sync, and battery-efficient GPS tracking.
2. **Customer Portal:** Lightweight, unauthenticated (but secure via token) public-facing application for real-time item tracking.
3. **Admin Panel:** Comprehensive dashboard for dispatchers and managers to oversee operations, drivers, real-time map views, and analytics.

---

## 🛠 Technology Stack & Infrastructure

### Cloud & Database
- **Infrastructure:** Laravel Cloud (Optimized for modern Laravel deployments).
- **Database:** PostgreSQL (with **PostGIS** extension recommended for robust geospatial querying, distance calculations, and proximity searches).
- **Real-time WebSockets:** Laravel Reverb (Native, lightweight, highly performant for handling 200+ concurrent driver connections and admin dashboards).

### Backend (Laravel)
- **Framework:** Laravel 11+
- **Performance Engine:** Laravel Octane powered by FrankenPHP.
- **Authentication:** Laravel Sanctum (Token-based for the PWA, Session-based for the Admin Panel).

### Frontend (React / TypeScript)
- **Routing:** TanStack Router (Type-safe, code-split routing).
- **Server State Management:** TanStack Query (Data fetching, caching, synchronization, offline-first mutations).
- **Client State Management:** Zustand (Global UI state, lightweight, boilerplate-free).
- **Data Grids/Tables:** TanStack Table (Headless UI for powerful admin tables).
- **List Virtualization:** TanStack Virtual (Crucial for rendering 200+ drivers or massive delivery logs without DOM lag).
- **Forms & Validation:** TanStack Form combined with **Zod** for strict schema validation on the client.
- **Advanced UI Inputs:** TanStack Ranger (For building complex multi-range sliders, e.g., filtering delivery distances).
- **Date & Time Handling:** Day.js (Lightweight, immutable, excellent for timezone/duration handling).
- **Real-time Client:** Laravel Echo (Paired with Reverb for WebSocket consumption).

---

## 🎨 Design & UI Principles (Shadcn UI)
We use Shadcn UI as our foundation, but with strict customization rules to maintain a clean, premium aesthetic:

1. **NO Hardcoded Colors:** 
   - Never use hex (`#FFFFFF`) or explicit Tailwind color classes (like `text-blue-500` or `bg-red-600`) in components.
   - Always use our semantic CSS variables/theme tokens (e.g., `text-primary`, `bg-background`, `border-border`).
2. **Clean Component Styling:** 
   - Avoid over-styling Shadcn UI components.
   - Do not add excessive `className` overrides.
   - Avoid overly bold typography or heavy/dark drop shadows. Keep the interface light, modern, and breathable.
3. **Consistent Spacing & Layout:** 
   - Use standard Tailwind spacing utility classes. Avoid arbitrary values (`w-[312px]`).

---

## 🏗 Architectural Guidelines & Best Practices

### 1. Real-Time Tracking & Map Performance
- **WebSocket Optimization:** Broadcast driver locations via Laravel Reverb using private/presence channels for security. 
- **Location Throttling (PWA):** Do not emit GPS coordinates on every micro-movement. Throttle the `watchPosition` API (e.g., emit updates every 5-10 seconds or based on a specific distance delta) to preserve the driver's battery and reduce server/WebSocket load.
- **Ephemeral State Storage:** If tracking 200 drivers updating frequently, consider storing active real-time coordinates in a fast in-memory store (like Redis) rather than constantly writing to PostgreSQL. Only persist critical milestones (pickup, geofence entry, delivery) directly to the Postgres database to prevent write bottlenecks.
- **Map Rendering:** Ensure map components (Mapbox/MapLibre/Google) use clustering or WebGL rendering to maintain 60fps when the admin views all 200 drivers simultaneously.

### 2. Driver PWA (Enterprise Architecture)
The Driver App must function flawlessly under poor network conditions and heavy mobile usage. We follow the strict **App Shell Model**:
- **App Shell Architecture:** The core UI infrastructure (Bottom Navigation, Header, Map Container) MUST be cached by the Service Worker (Cache-First strategy). This ensures the app boots instantly even with no internet. Dynamic data (like active deliveries) must use a Stale-While-Revalidate strategy managed by TanStack Query.
- **Offline-First & Background Sync:** Never block a driver from completing a task due to a dead zone. If a driver marks an item as "Delivered" offline, queue the mutation in **IndexedDB** (NEVER use `localStorage` for this, as it is synchronous and blocks the UI thread). Use the Service Worker's Background Sync API to automatically push the data to Laravel when the connection returns.
- **Battery & Location Optimization:** Never use `setInterval` for GPS polling. Use `navigator.geolocation.watchPosition()`. To prevent extreme battery drain and WebSocket flooding, throttle the data sent to Laravel Reverb (e.g., only broadcast the location every 5-10 seconds, or if the driver has moved more than 15 meters).
- **Screen Wake Lock:** Utilize the browser's Screen Wake Lock API (`navigator.wakeLock.request('screen')`) during active navigation so the driver's phone screen does not turn off or dim while driving.
- **Push Notifications (Service Worker):** Dispatch alerts (e.g., "New Delivery Assigned") must use Web Push / FCM. These must be processed by the Service Worker so the driver receives them even if the PWA is fully closed.

### 3. Customer Portal Security
- **Unguessable Links:** Tracking URLs must use secure, unguessable identifiers like UUIDv4 or NanoIDs (e.g., `/track/trk_abc123xyz890`). Never expose sequential integer database IDs in the public portal to prevent enumeration attacks.
- **Read-Only Scope:** The portal should strictly consume read-only APIs with strict rate limiting applied.

### 4. Backend (Laravel) Structure (Domain-Based Name Grouping)
To maintain a clean and highly maintainable codebase as the enterprise application scales, we strictly use **Domain-Based Name Grouping**. Group all related files by their business domain (e.g., `Delivery`, `Tracking`, `User`, `Fleet`).

- **Models:** Use singular, PascalCase, and strictly group them by Domain within `app/Models/`.
  - ✅ `app/Models/Delivery/Delivery.php`
  - ✅ `app/Models/Tracking/DriverLocation.php`
- **Controllers (Portal + Domain Grouping):** Controllers must be separated first by the consumer portal, and then by domain namespace. Use singular nouns with a `Controller` suffix.
  - **Admin:** `app/Http/Controllers/Api/Admin/Delivery/DeliveryController.php`
  - **Driver:** `app/Http/Controllers/Api/Driver/Tracking/LocationController.php`
  - **Customer:** `app/Http/Controllers/Api/Customer/Tracking/TrackingController.php`
- **Services & Actions (Skinny Controllers):** Controllers must only handle validation (via FormRequests) and responses. Move all business logic into Domain-grouped Services or Actions.
  - **Services:** `app/Services/Delivery/AssignDriverService.php`
  - **Actions:** `app/Actions/Tracking/BroadcastLocationAction.php`

### 5. Database & Backend Operations (Laravel Octane)
- **Primary Keys (ULID):** All core entities (Users, Drivers, Customers, Deliveries, Orders, Payments) MUST use **ULID** as their primary key. This prevents IDOR (Insecure Direct Object Reference) enumeration attacks and supports offline PWA record creation, all while maintaining high-speed database inserts.
- **PostgreSQL & JSONB:** Utilize JSONB columns for flexible data (like varying delivery metadata or webhook payloads) but maintain strict relational columns and foreign keys for core system integrity.
- **Geospatial Indexing:** Ensure any spatial columns (like coordinates for branches or delivery zones) are properly indexed (e.g., GIST indexes if using PostGIS).
- **Octane Memory Management:** Because Octane keeps the application in memory, **never** use static properties or singletons to store request-specific state. This causes critical state bleed between requests.
- **Queues/Background Jobs:** Offload slow tasks (like pushing FCM notifications, generating reports, processing images, or sending emails) to Laravel Queues. Keep API response times strictly under 50-100ms.

### 6. Frontend State Management
- **TanStack Query (Server State):** Use for *all* asynchronous operations, API calls, and caching. Heavily utilize `staleTime` and `gcTime` to prevent redundant requests. Never use Zustand to store server responses.
- **Zustand (Client State):** Use exclusively for global, ephemeral UI state (e.g., map layer toggles, sidebar collapse state, multi-step form progress).
- **Local State (`useState`):** Keep isolated to individual components for things like uncontrolled inputs or local UI toggles.

### 7. Modular Architecture
- **Component Separation:** Break UIs into small, single-responsibility components. If a file exceeds 300 lines, refactor it into smaller pieces.
- **Logic Extraction:** Extract complex business logic, data fetching, and state management into custom hooks (e.g., `useLiveTracking.ts`, `usePwaSync.ts`). UI components should focus entirely on rendering.

---

## 🤖 AI Assistant Instructions (System Prompt)
*When generating code or proposing solutions for this workspace, you MUST follow these directives:*

1. **Stack Compliance:** Strictly use TanStack ecosystem (including Virtual and Ranger), Zustand, Laravel Reverb, Echo, Zod, and Day.js. Do not introduce alternatives (like Redux, Axios, Moment.js) unless explicitly requested.
2. **Context Awareness (The 3 Portals):** Always consider which application you are modifying (Admin, Driver PWA, or Customer Portal) and apply the appropriate security, network, and performance constraints.
3. **Design Compliance:** Check `index.css` for theme variables. Never output hardcoded color hexes. Keep Shadcn components clean and use standard Tailwind utilities.
4. **Code Quality:** Output strict TypeScript. Always handle loading, error, and *offline* states for asynchronous actions, particularly in the PWA.
5. **Database & API:** Always default to **ULID** for primary keys on core resources. Validate all API requests via Form Requests on the backend and Zod on the frontend.
6. **Octane Safety:** Actively avoid patterns that cause state bleed between requests in Laravel backend code.
