import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        viteSingleFile({ removeViteModuleLoader: true }),
        {
            name: 'remove-crossorigin',
            enforce: 'post',
            transformIndexHtml(html) {
                return html.replace(/ crossorigin([^>]*)/g, '$1');
            }
        }
    ],
    base: './',
    build: {
        target: 'esnext',
        assetsInlineLimit: 100000000,
        chunkSizeWarningLimit: 100000000,
        cssCodeSplit: false,
        minify: false,
        rollupOptions: {
            output: {
                inlineDynamicImports: true,
            }
        },
    }
})
