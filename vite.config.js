import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import laravel from "laravel-vite-plugin";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
    plugins: [
        laravel([
            "resources/js/src/admin.tsx",
            "resources/js/src/driver.tsx",
        ]), 
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            injectRegister: 'auto',
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
                globIgnores: [
                    '**/admin-*.js',
                    '**/system-*.js',
                    '**/admin/**',
                    '**/system/**',
                ],
                cleanupOutdatedCaches: true,
                maximumFileSizeToCacheInBytes: 3000000, // 3MB
            },
            manifest: {
                name: 'MapCN Driver',
                short_name: 'Driver',
                description: 'Driver App for MapCN Delivery Tracking System',
                theme_color: '#000000',
                background_color: '#ffffff',
                display: 'standalone',
                orientation: 'portrait',
                scope: '/driver',
                start_url: '/driver',
                icons: [
                    {
                        src: '/icons/icon-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: '/icons/icon-512x512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    },
                    {
                        src: '/icons/icon-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable'
                    }
                ]
            }
        })
    ],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./resources/js/src"),
        },
    },
});
