import { resolve } from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa"; // Tambahkan import ini

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
      devOptions: {
        enabled: true, // Tambahkan ini agar PWA aktif di npm run dev
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5000000,
      },
      manifest: {
        name: "Puskesmas Kendali!",
        short_name: "Kendali",
        description: "Kontrol Elektronik Naskah Dan Arsip Layanan Integritas",
        theme_color: "#ffffff",
        icons: [
          {
            src: "/logo192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/logo512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
        screenshots: [
          {
            src: "/screen-desktop.png",
            sizes: "1280x720",
            type: "image/png",
            form_factor: "wide", // Untuk Desktop
            label: "Tampilan Desktop Kendali",
          },
          {
            src: "/screen-mobile.png",
            sizes: "390x844",
            type: "image/png",
            // form_factor tidak diisi atau 'narrow' untuk Mobile
            label: "Tampilan Mobile Kendali",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      // eslint-disable-next-line no-undef
      "@": resolve(__dirname, "src"),
    },
  },
  base: "/",
  server: {
    port: 2000,
  },
});
