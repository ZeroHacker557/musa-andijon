import type { IncomingMessage, ServerResponse } from 'node:http'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { loadEnv, type Plugin, type ViteDevServer } from 'vite'

/**
 * Lokal dev serverda /api/* ni ishga tushiradi.
 *
 * Vercel'da har bir api/*.ts alohida serverless funksiya. Oddiy
 * `npm run dev` ularni bilmaydi — admin panel «API javobi tushunarsiz»
 * deb to'xtab qolardi. Bu plagin so'rovni mos api/<yo'l>.ts faylining
 * default handler'iga uzatadi va Node req/res ni Vercel'dagidek
 * (req.query, req.body, res.status().json()) qilib beradi.
 *
 * Faqat `vite dev` uchun — build va Vercel'ga ta'sir qilmaydi.
 *
 * DIQQAT: lokal API haqiqiy Firebase bazasi bilan ishlaydi — paneldagi
 * har bir o'zgarish production ma'lumotlariga yoziladi.
 */
export function localApi(): Plugin {
  return {
    name: 'musa-local-api',
    apply: 'serve',
    configureServer(server) {
      prepareEnv(server)
      server.middlewares.use((req, res, next) => {
        const pathname = (req.url ?? '').split('?')[0]
        if (!pathname.startsWith('/api/')) return next()
        handle(server, pathname, req, res).catch((error: unknown) => {
          const message = error instanceof Error ? error.message : String(error)
          server.config.logger.error(`[api] ${pathname}: ${error instanceof Error ? error.stack : message}`)
          if (!res.headersSent) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
          }
          res.end(JSON.stringify({ error: message }))
        })
      })
    },
  }
}

/**
 * .env / .env.local dagi qiymatlarni process.env ga qo'shadi (prefikssiz —
 * serverless kod BOT_TOKEN kabi nomlarni kutadi). Service account env'da
 * bo'lmasa — ildizdagi shu loyihaning kalit fayli olinadi, xuddi
 * scripts/_firebase.mjs dagidek projectId bo'yicha.
 */
function prepareEnv(server: ViteDevServer) {
  const { root, mode, logger } = server.config
  for (const [key, value] of Object.entries(loadEnv(mode, root, ''))) {
    if (process.env[key] === undefined) process.env[key] = value
  }
  if (process.env.FIREBASE_SERVICE_ACCOUNT) return

  const configPath = resolve(root, 'src/config/firebase.ts')
  const projectId = existsSync(configPath)
    ? readFileSync(configPath, 'utf8').match(/projectId:\s*['"]([^'"]+)['"]/)?.[1]
    : undefined
  const file = readdirSync(root)
    .filter((f) => f.includes('firebase-adminsdk') && f.endsWith('.json'))
    .find((f) => JSON.parse(readFileSync(resolve(root, f), 'utf8')).project_id === projectId)

  if (file) {
    process.env.FIREBASE_SERVICE_ACCOUNT = readFileSync(resolve(root, file), 'utf8')
    logger.info(`[api] lokal API: ${projectId} kaliti (${file})`)
  } else {
    logger.warn(`[api] «${projectId}» uchun service account topilmadi — /api ishlamaydi`)
  }
}

async function handle(server: ViteDevServer, pathname: string, req: IncomingMessage, res: ServerResponse) {
  // Vercel'dagidek: _ bilan boshlangan papkalar (api/_lib) tashqariga ochilmaydi
  const segments = pathname.slice('/api/'.length).replace(/\/$/, '').split('/')
  const file = resolve(server.config.root, 'api', ...segments) + '.ts'
  if (!segments.every((s) => /^[\w-]+$/.test(s) && !s.startsWith('_')) || !existsSync(file)) {
    res.statusCode = 404
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ error: `API topilmadi: ${pathname}` }))
    return
  }

  const mod = await server.ssrLoadModule(file)
  const handler = mod.default as (req: unknown, res: unknown) => unknown

  const url = new URL(req.url ?? '/', 'http://localhost')
  const query: Record<string, string | string[]> = {}
  for (const [key, value] of url.searchParams) {
    const prev = query[key]
    query[key] = prev === undefined ? value : ([] as string[]).concat(prev, value)
  }

  Object.assign(req, { query, body: await readBody(req) })
  Object.assign(res, {
    status(code: number) {
      res.statusCode = code
      return res
    },
    json(data: unknown) {
      if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify(data))
      return res
    },
    send(data: unknown) {
      if (data !== null && typeof data === 'object' && !Buffer.isBuffer(data)) {
        return (res as unknown as { json: (d: unknown) => unknown }).json(data)
      }
      res.end(data === undefined ? undefined : Buffer.isBuffer(data) ? data : String(data))
      return res
    },
    redirect(statusOrUrl: number | string, maybeUrl?: string) {
      res.statusCode = typeof statusOrUrl === 'number' ? statusOrUrl : 307
      res.setHeader('Location', typeof statusOrUrl === 'number' ? (maybeUrl ?? '/') : statusOrUrl)
      res.end()
      return res
    },
  })

  await handler(req, res)
}

/** Vercel kabi: JSON va form tanasi obyektga aylanadi, qolgani — satr. */
async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  if (!chunks.length) return undefined
  const raw = Buffer.concat(chunks).toString('utf8')
  const type = req.headers['content-type'] ?? ''
  if (type.includes('application/json')) return raw ? JSON.parse(raw) : undefined
  if (type.includes('application/x-www-form-urlencoded')) return Object.fromEntries(new URLSearchParams(raw))
  return raw
}
