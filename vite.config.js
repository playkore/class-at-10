var _a, _b;
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
var repositoryName = (_b = (_a = process.env.GITHUB_REPOSITORY) === null || _a === void 0 ? void 0 : _a.split('/').pop()) !== null && _b !== void 0 ? _b : 'eve-hunter-adventure';
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    base: repositoryName ? "/".concat(repositoryName, "/") : '/',
    build: {
        outDir: 'dist'
    }
});
