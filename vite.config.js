import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base` must match the GitHub repo name so asset paths resolve on GitHub Pages:
// https://appforgelabs.github.io/PeppaPartyTime/
export default defineConfig({
  plugins: [react()],
  base: '/PeppaPartyTime/',
});
