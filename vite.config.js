import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  esbuild: {
    drop: ['console', 'debugger'],
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1000, // Naikkan batas warning ke 1000kB (opsional)
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor'; // Pisahkan semua node_modules ke dalam chunk 'vendor'
          }
        },
      },
    },
  },
})
