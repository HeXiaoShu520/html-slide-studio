import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import type { IncomingMessage, ServerResponse } from 'http'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'cors-proxy',
      configureServer(server) {
        server.middlewares.use('/api-proxy', (req: IncomingMessage, res: ServerResponse) => {
          const target = req.headers['x-target'] as string
          if (!target) { res.statusCode = 400; res.end('missing x-target header'); return }
          const chunks: Buffer[] = []
          req.on('data', (c: Buffer) => chunks.push(c))
          req.on('end', async () => {
            const hdrs: Record<string, string> = {}
            for (const [k, v] of Object.entries(req.headers)) {
              if (!['host', 'x-target', 'connection'].includes(k) && typeof v === 'string') hdrs[k] = v
            }
            try {
              const r = await fetch(target, { method: req.method, headers: hdrs, body: chunks.length ? Buffer.concat(chunks) : undefined })
              res.statusCode = r.status
              r.headers.forEach((v, k) => { if (k !== 'content-encoding') res.setHeader(k, v) })
              res.end(Buffer.from(await r.arrayBuffer()))
            } catch (e) { res.statusCode = 502; res.end(String(e)) }
          })
        })
      },
    },
  ],
  resolve: { alias: { '@styles': path.resolve(__dirname, 'styles') } },
  server: { port: 5173, open: true },
})
