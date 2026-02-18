import path from "path"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,             // Permite que el servidor sea accesible fuera del contenedor
    port: 5173,             // Asegura que use el puerto 5173 definido en tu docker-compose
    allowedHosts: ['all'],  // ESTO CORRIGE EL ERROR: Permite el tráfico desde ngrok
    watch: {
      usePolling: true,     // Recomendado para detectar cambios dentro de Docker en Windows
    },
  },
})