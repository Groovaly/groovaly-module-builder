import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
var defaultRepoName = 'groovaly-module-builder';
var githubRepository = process.env.GITHUB_REPOSITORY || '';
var repoName = githubRepository.indexOf('/') >= 0
    ? githubRepository.split('/')[1]
    : defaultRepoName;
export default defineConfig({
    plugins: [react()],
    base: process.env.GITHUB_ACTIONS ? "/".concat(repoName, "/") : '/',
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
