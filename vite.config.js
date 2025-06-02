import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'; // For Buffer, etc.

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Polyfills for Node.js globals needed by some TON libraries
    nodePolyfills({
      // To exclude specific polyfills, add them to this list:
      // exclude: [],
      // Whether to polyfill `global`
      global: true,
      // Whether to polyfill `Buffer`
      buffer: true,
      // Whether to polyfill `process`
      process: true,
      // Whether to polyfill `util`
      // util: true, // Add if needed
      // Whether to polyfill `sys`
      // sys: true, // Add if needed
      // Whether to polyfill `events`
      // events: true, // Add if needed
      // Whether to polyfill `stream`
      // stream: true, // Add if needed
      // Whether to polyfill `path`
      // path: true, // Add if needed
      // Whether to polyfill `url`
      // url: true, // Add if needed
      // Whether to polyfill `string_decoder`
      // string_decoder: true, // Add if needed
      // Whether to polyfill `http`
      // http: true, // Add if needed
      // Whether to polyfill `https`
      // https: true, // Add if needed
      // Whether to polyfill `assert`
      // assert: true, // Add if needed
      // Whether to polyfill `zlib`
      // zlib: true, // Add if needed
      // Whether to polyfill `crypto`
      // crypto: true, // Add if needed - Note: This might require complex setup
      // Whether to polyfill `constants`
      // constants: true, // Add if needed
      // Whether to polyfill `os`
      // os: true, // Add if needed
      // Whether to polyfill `_http_request`
      // _http_request: true, // Add if needed
      // Whether to polyfill `_http_client`
      // _http_client: true, // Add if needed
      // Whether to polyfill `_servers`
      // _servers: true, // Add if needed
      // Whether to polyfill `tty`
      // tty: true, // Add if needed
      // Whether to polyfill `domain`
      // domain: true, // Add if needed
    }),
  ],
  define: {
    // Ensures 'global' is available for libraries expecting it
    'global': 'globalThis',
  },
   // For development server, ensure CORS headers allow access from TMA
  server: {
    cors: {
      origin: '*', // Allow all origins for local dev
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    },
    host: true, // Expose on network
    port: 5173, // Default Vite port
  },
  resolve: {
    alias: {
      // If you have specific path aliases, define them here
      // '@': path.resolve(__dirname, './src'),
    }
  },
  build: {
    target: 'esnext', // For modern browsers, supporting top-level await etc.
     sourcemap: true, // Generate source maps for debugging
  },
   optimizeDeps: {
     esbuildOptions: {
       // Node.js global to browser globalThis
       define: {
         global: 'globalThis',
       },
     },
   },
});