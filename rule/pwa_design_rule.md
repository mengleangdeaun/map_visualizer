# PWA Design & UI Consistency Rules

This document defines the strict UI and design guidelines for the Driver App (PWA). A consistent, highly readable, and accessible UI is critical for drivers who operate in varying lighting conditions (e.g., bright sunlight, dark nights) and require multi-lingual support.

## 🎨 1. Color System (Shadcn UI & Tailwind)
- **No Hardcoded Hex Colors:** Absolutely NO hardcoded hex codes (`#FFFFFF`, `#FF5733`) or static Tailwind color classes (like `text-blue-500` or `bg-red-600`) in your component files.
- **Theme Variables:** Always use semantic CSS variables mapped in `index.css` (e.g., `text-primary`, `bg-background`, `border-border`, `text-muted-foreground`). This ensures perfect Light/Dark mode switching.
- **High Contrast:** Ensure all interactive elements and text maintain high contrast ratios. The PWA must be perfectly legible under direct, harsh sunlight.

## 🔤 2. Typography & Text (Source of Truth)
- **Font Stack Definition:** The primary source of truth for all typography is defined globally in the Tailwind configuration (`fontFamily.sans`). Never hardcode inline font families.
  - **The Official Stack:** `['Inter', 'Google Sans', 'Roboto', 'Battambang', 'sans-serif']`
  - *Reasoning:* **Inter** provides premium English legibility. **Google Sans** and **Roboto** provide flawless native fallbacks for Android users. **Battambang** seamlessly handles Khmer translation rendering without breaking the vertical rhythm of the UI.
- **Legibility at a Glance:** Drivers need to read information in split seconds. Avoid tiny font sizes (`text-xs` should be used very sparingly). Prioritize `text-sm`, `text-base`, and `text-lg`.
- **Weight Consistency:** Avoid excessive use of `font-bold` or `font-black`. Use `font-medium` or `font-semibold` for emphasis to keep the UI looking premium and breathable.
- **Line Heights:** Use appropriate line heights (`leading-relaxed` or `leading-normal`) to ensure multi-line text (like long addresses) is easy to read.

## 🖲️ 3. Buttons & Interactive Elements
- **Touch Hit Targets:** Mobile hit targets MUST be large enough to tap easily with a thumb while walking or in a mount. All primary buttons, icon buttons, and interactive elements must have a minimum height/width of `44px` (Tailwind `h-11 w-11` or larger).
- **Tactile Feedback:** Every button must have clear press/active states (e.g., `active:scale-95`, `active:opacity-80`) so the driver knows their tap registered. Disabled states must reduce opacity and use `pointer-events-none`.
- **Shadcn UI Constraints:** When importing Shadcn UI buttons, do not over-style them. Avoid adding heavy, dark drop shadows (`shadow-xl`) or excessive custom `className` styling. Stick to the default premium, flat-yet-tactile styling of the design system.

## 🌐 4. Localization (i18n)
The Driver App serves a diverse workforce and must strictly support three primary languages: **English (en)**, **Khmer (km)**, and **Chinese (zh)**.
- **No Hardcoded Strings:** NO hardcoded text is allowed in TSX files. 
  - ❌ `<button>Start Route</button>`
  - ✅ `<button>{t('delivery.start_route')}</button>`
- **Use Translation Hooks:** Always use standard translation hooks (e.g., `useTranslation()` from `react-i18next`).

### 📂 Separated Translation Files
To keep the translation files manageable and performant, they MUST be separated by domain/feature namespaces, rather than keeping one massive `translation.json`.
- **Directory Structure:** Maintain files in `resources/js/src/locales/{language}/{namespace}.json`.
  - `locales/en/common.json` (General UI: Submit, Cancel, Back, Error)
  - `locales/en/delivery.json` (Domain specific: Pickup, Drop-off, Proof of Delivery, Route)
  - `locales/en/auth.json` (Login, OTP, Logout)
- **Khmer Font Considerations:** Because we use **Battambang** in the core font stack, Khmer text will render beautifully. However, Khmer scripts often require slightly taller line heights to prevent clipping of subscripts. Always test UI layouts with Khmer text to ensure nothing is cut off.
- **Chinese Layout Constraints:** Chinese characters are much denser. Ensure flexbox and grid layouts do not break when an English word (which is long) is switched to Chinese (which is short but dense). Avoid setting rigid `width` on text containers.

## 🗺️ 5. Map UI Overlays
- **Floating Action Buttons (FABs):** Use FABs for primary map actions (e.g., "Recenter", "Current Location"). Ensure they float safely above the map using `z-index` and have a subtle drop shadow (`shadow-md`) to distinguish them from the map tiles.
- **Glassmorphism:** Use clean glassmorphic effects (e.g., `bg-background/85 backdrop-blur-md border border-border/50`) for map overlay cards (like the active delivery bottom-sheet) so the driver can still maintain context of the map underneath.
