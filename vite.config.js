import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Vite = the tool that runs the dev server and builds the app.
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
