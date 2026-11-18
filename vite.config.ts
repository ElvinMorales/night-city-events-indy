import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
import { assertProductionCatalog } from './scripts/production-policy';

export default defineConfig(({ command, mode }) => {
  if (command === 'build' && (mode !== 'production' || process.env.NODE_ENV !== 'production')) {
    throw new Error('Only production mode and NODE_ENV=production may create a distributable build. Use npm run dev for demos.');
  }
  return {
    base: '/night-city-events-indy/',
    // Static files must be imported deliberately; never copy a public/ tree wholesale.
    publicDir: false,
    build: { sourcemap: false },
    plugins: [react(), tailwind(), {
      name: 'production-catalog-boundary',
      apply: 'build',
      enforce: 'pre',
      buildStart() { assertProductionCatalog(); },
      load(id) {
        const file = id.replaceAll('\\', '/').split('?')[0];
        if (/\/(docs|public)\//.test(file) || /\/src\/data\/(?!events\.json$)[^/]+\.json$/.test(file) || /\.(test|spec)\.[cm]?[jt]sx?$/.test(file)) {
          this.error(`Review/demo/test content cannot enter the production bundle: ${file}`);
        }
      },
    }],
    server: { host: '127.0.0.1', strictPort: true },
    preview: { host: '127.0.0.1', strictPort: true },
  };
});
