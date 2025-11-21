import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Allow Render preview host so deployed previews can access built assets
  preview: {
    // Add the frontend host used by Render
    allowedHosts: ['hdd-frontend.onrender.com'],
  },
})
