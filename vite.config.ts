import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

declare const process: {
  env: Record<string, string | undefined>;
};

const defaultRepoName = 'groovaly-module-builder';
const githubRepository = process.env.GITHUB_REPOSITORY || '';
const repoName = githubRepository.indexOf('/') >= 0
  ? githubRepository.split('/')[1]
  : defaultRepoName;

export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_ACTIONS ? `/${repoName}/` : '/',
  build: {
    rollupOptions: {
      // Two pages: the public builder and the password-protected Cobra seller page.
      input: {
        main: 'index.html',
        cobra: 'cobra/index.html',
      },
    },
  },
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8000',
    },
  },
  test: {
    globals: true,
    environment: 'node',
  },
});
