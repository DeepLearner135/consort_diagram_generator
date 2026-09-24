import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'
import fs from 'fs'

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
        },
        {
            name: 'timestamped-html',
            enforce: 'post',
            generateBundle(_, bundle) {
                const htmlKey = Object.keys(bundle).find(k => k.endsWith('.html'));
                if (!htmlKey) return;
                const now = new Date();
                const pad = (n) => String(n).padStart(2, '0');
                const year = now.getFullYear();
                const month = pad(now.getMonth() + 1);
                const day = pad(now.getDate());
                const hours = pad(now.getHours());
                const minutes = pad(now.getMinutes());
                const seconds = pad(now.getSeconds());
                const timestamp = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
                const newName = `ConsortDiagramGenerator_${timestamp}.html`;

                const chunk = bundle[htmlKey];
                chunk.fileName = newName;
                bundle[newName] = chunk;
                delete bundle[htmlKey];
            },
            configurePreviewServer(server) {
                server.middlewares.use((req, res, next) => {
                    if (req.url === '/' || req.url === '/index.html') {
                        try {
                            const files = fs.readdirSync('dist');
                            const htmlFiles = files.filter(f => f.startsWith('ConsortDiagramGenerator') && f.endsWith('.html'));
                            if (htmlFiles.length > 0) {
                                htmlFiles.sort().reverse();
                                req.url = '/' + htmlFiles[0];
                            }
                        } catch (e) {
                            // ignore
                        }
                    }
                    next();
                });
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
