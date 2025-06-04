import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'; 


export default defineConfig({
  plugins: [
    react(),
    
    nodePolyfills({
      
      
      
      global: true,
      
      buffer: true,
      
      process: true,
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
    }),
  ],
  define: {
    
    'global': 'globalThis',
  },
   
  server: {
    cors: {
      origin: '*', 
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    },
    host: true, 
    port: 5173, 
  },
  resolve: {
    alias: {
      
      
    }
  },
  build: {
    target: 'esnext', 
     sourcemap: true, 
  },
   optimizeDeps: {
     esbuildOptions: {
       
       define: {
         global: 'globalThis',
       },
     },
   },
});