# Frontend Architecture & Domain Rules

This document defines the strict organization of the React/PWA frontend to ensure scalability, domain isolation, and performance.

## 📁 1. Directory Structure: Domain-Driven

The `src/` directory is organized into global shared code and role-based business domains.

```text
src/
├── components/         # Global shared components
│   ├── ui/             # Atomic components (Shadcn-like)
│   ├── Layouts/        # Main App Layouts (Default, Blank)
│   └── shared/         # Complex shared logic (Map, Tables)
├── domains/            # Role-based business logic & screens
│   ├── driver/         # Driver PWA Domain
│   │   ├── components/ # Domain-specific UI
│   │   ├── hooks/      # Domain-specific logic/fetching
│   │   ├── services/   # Business Logic / Sync
│   │   └── pages/      # Route entry points
│   ├── admin/          # Dispatcher Dashboard Domain
│   ├── customer/       # Public Tracking Domain
│   └── system/         # Super Admin / System Management Domain
├── store/              # Global Zustand stores (Theme, Auth)
├── router/             # React Router configuration
├── hooks/              # Truly global hooks (useNetwork, usePWA)
├── lib/                # Configuration (Axios, Echo, I18n)
└── types/              # Shared TypeScript interfaces
```

## 📍 2. Component Locality Rules

To avoid a "junk drawer" `components/` folder, we follow these hierarchy rules:

1. **Page-Private**: If a component is used ONLY in `DriverTrackingPage`, it stays in `domains/driver/pages/Tracking/components/`.
2. **Domain-Shared**: If used across multiple driver screens, it goes to `domains/driver/components/`.
3. **Global-Shared**: If used by both Admin and Driver (like a `VehicleMarker`), it goes to `src/components/shared/`.

## 📄 3. Page Folder Pattern

Each page must be its own folder, not a single file, to keep related logic contained.

```text
Dashboard/
├── index.tsx           # Main component (The Page)
├── components/         # Private components
├── hooks/              # Page-specific fetching (TanStack Query)
└── types.ts            # Page-specific interfaces
```

## 🏗️ 4. Component Responsibility

*   **Pages (Smart)**: Handle URL parameters, data fetching (TanStack Query), and passing data to components.
*   **Components (Presentational)**: Should be "dumb" where possible. They receive data/callbacks via props.
*   **Hooks (Logic)**: Abstract all complex logic, side effects, and API calls away from the UI.

## 🚀 5. State Management Standards

*   **Server State**: TanStack Query (Key-based: `['deliveries', companyId]`).
*   **Client State**: Zustand (Small, independent stores). **Redux is deprecated.**
*   **Offline Storage**: Dexie.js (IndexedDB) for critical driver data in PWA.

## 🛣️ 6. Routing

*   Use **Lazy Loading** for all pages to minimize initial bundle size.
*   Define routes in `src/router/routes.tsx`.
*   Group routes by domain/role.

## 🏷️ 7. Naming Conventions

*   **PascalCase.tsx**: Components, Pages, Layouts.
*   **camelCase.ts**: Hooks (`useGeolocation.ts`), Utilities, Stores (`useThemeConfig.ts`).
*   **index.tsx**: Standard entry point for folders.
