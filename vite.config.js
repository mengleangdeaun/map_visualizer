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
            "resources/js/src/system.tsx",
        ]), 
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            injectRegister: 'auto',
            workbox: {
                importScripts: ['/push-worker.js'],
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
                name: 'DLVR Driver',
                short_name: 'Driver',
                description: 'Driver App for SCCG Delivery Tracking System',
                theme_color: '#0a0a0a',
                background_color: '#0a0a0a',
                display: 'standalone',
                orientation: 'portrait',
                scope: '/driver',
                start_url: '/driver',
                icons: [
                    {
                        src: '/icons/icon-192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: '/icons/icon-512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    },
                    {
                        src: '/icons/icon-512-maskable.png',
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
