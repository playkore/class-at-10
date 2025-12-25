import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const repositoryName =
  process.env.GITHUB_REPOSITORY?.split('/').pop() ?? 'eve-hunter-adventure'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: repositoryName ? `/${repositoryName}/` : '/',
  build: {
    outDir: 'dist'
  }
})
