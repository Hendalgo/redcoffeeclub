import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
export default defineConfig({ integrations: [react()], build: { inlineStylesheets: 'always' }, devToolbar: { enabled: false }, vite: { optimizeDeps: { include: ['three/examples/jsm/exporters/GLTFExporter.js'] } } });
