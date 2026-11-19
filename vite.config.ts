import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

/** Give every build its own service-worker cache name (hash of the app). */
function stampServiceWorker(): Plugin {
  return {
    name: 'stamp-sw',
    apply: 'build',
    closeBundle() {
      const dist = resolve(process.cwd(), 'dist');
      const hash = createHash('sha1').update(readFileSync(resolve(dist, 'index.html'))).digest('hex').slice(0, 10);
      const sw = resolve(dist, 'sw.js');
      writeFileSync(sw, readFileSync(sw, 'utf8').replaceAll('__BUILD__', hash));
    },
  };
}

const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')) as { version: string };

export default defineConfig({
  base: './',
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [react(), viteSingleFile(), stampServiceWorker()],
  build: { target: 'es2022', chunkSizeWarningLimit: 4000 },
});
