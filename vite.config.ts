import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { resolve } from 'path'

export default defineConfig({
  root: 'src/render',
  plugins: [react()],
  
  build: {
    outDir: '../../dist/render',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/render/index.html')
      }
    }
  },
  
  server: {
    port: 5174,
    strictPort: false
  },
  
  base: './'
}) 