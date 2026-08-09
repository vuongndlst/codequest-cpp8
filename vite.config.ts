/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

/**
 * Xac dinh `base` path cho GitHub Pages.
 *
 * Ho tro ca hai truong hop (yeu cau muc 19 cua de bai):
 *   1. Repository dang `username.github.io`        -> base = '/'
 *   2. Project repository `username.github.io/abc` -> base = '/abc/'
 *
 * Thu tu uu tien:
 *   VITE_BASE_PATH (dat thu cong)  >  suy ra tu GITHUB_REPOSITORY  >  '/'
 */
function resolveBasePath(): string {
  const manual = process.env.VITE_BASE_PATH?.trim();
  if (manual) {
    return manual.endsWith('/') ? manual : `${manual}/`;
  }

  // GitHub Actions luon dat bien nay, vd. "nguyendinhvuong/codequest-cpp8"
  const ghRepo = process.env.GITHUB_REPOSITORY;
  if (ghRepo) {
    const [owner, repo] = ghRepo.split('/');
    if (!repo) return '/';
    // Truong hop 1: repo trung ten user -> deploy o goc domain
    if (repo.toLowerCase() === `${owner.toLowerCase()}.github.io`) return '/';
    // Truong hop 2: project repo -> deploy o thu muc con
    return `/${repo}/`;
  }

  return '/';
}

export default defineConfig({
  base: resolveBasePath(),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    // May phong ICT co the dung trinh duyet cu -> khong dung cu phap qua moi
    target: 'es2020',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          // Code editor chi tai khi hoc sinh vao man hinh nhiem vu.
          // Quan trong voi may phong ICT dung Wi-Fi chung.
          editor: [
            '@codemirror/state',
            '@codemirror/view',
            '@codemirror/commands',
            '@codemirror/language',
            '@codemirror/lang-cpp',
            '@lezer/highlight',
          ],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
