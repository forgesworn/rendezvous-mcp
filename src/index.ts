#!/usr/bin/env node

import { createRequire } from 'node:module'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { RoutingClient } from './routing.js'
import { registerScoreVenuesTool } from './tools/score-venues.js'
import { registerSearchVenuesTool } from './tools/search-venues.js'
import { registerIsochroneTool } from './tools/isochrone.js'
import { registerDirectionsTool } from './tools/directions.js'
import { registerStoreCredentialsTool } from './tools/store-credentials.js'

const require = createRequire(import.meta.url)
const { version } = require('../package.json') as { version: string }

const TRANSPORT = process.env.TRANSPORT ?? 'stdio'
const PORT = parseInt(process.env.PORT ?? '3002', 10)
const HOST = process.env.HOST ?? '0.0.0.0'
const VALHALLA_URL = process.env.VALHALLA_URL
const OVERPASS_URL = process.env.OVERPASS_URL
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? '*'
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX ?? '60', 10)
const RATE_LIMIT_WINDOW = 60_000

const server = new McpServer({
  name: 'rendezvous-mcp',
  version,
})

const routingClient = new RoutingClient({
  valhallaUrl: VALHALLA_URL,
})

// Register all tools
registerScoreVenuesTool(server, routingClient)
registerSearchVenuesTool(server, OVERPASS_URL)
registerIsochroneTool(server, routingClient)
registerDirectionsTool(server, routingClient)
registerStoreCredentialsTool(server, routingClient)

if (TRANSPORT === 'http') {
  const { default: express } = await import('express')
  const { default: cors } = await import('cors')
  const { StreamableHTTPServerTransport } = await import(
    '@modelcontextprotocol/sdk/server/streamableHttp.js'
  )

  const app = express()
  app.use(cors({ origin: CORS_ORIGIN }))
  app.use(express.json({ limit: '100kb' }))

  // Simple in-memory rate limiter
  const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
  const cleanupInterval = setInterval(() => {
    const now = Date.now()
    for (const [ip, entry] of rateLimitMap) {
      if (now > entry.resetAt) rateLimitMap.delete(ip)
    }
  }, RATE_LIMIT_WINDOW)
  cleanupInterval.unref()

  app.use((req, res, next) => {
    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown'
    const now = Date.now()
    const entry = rateLimitMap.get(ip)
    if (!entry || now > entry.resetAt) {
      rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
      return next()
    }
    entry.count++
    if (entry.count > RATE_LIMIT_MAX) {
      res.status(429).json({ error: 'Too many requests' })
      return
    }
    next()
  })

  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      server: 'rendezvous-mcp',
      version,
      valhalla_url: routingClient.valhallaUrl,
      tools: ['score_venues', 'search_venues', 'get_isochrone', 'get_directions', 'store_routing_credentials'],
    })
  })

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  })

  await server.connect(transport)

  app.post('/mcp', async (req, res) => {
    await transport.handleRequest(req, res, req.body)
  })

  app.get('/mcp', async (req, res) => {
    await transport.handleRequest(req, res)
  })

  app.delete('/mcp', async (req, res) => {
    await transport.handleRequest(req, res)
  })

  const httpServer = app.listen(PORT, HOST, () => {
    console.error(`rendezvous-mcp HTTP server listening on ${HOST}:${PORT}`)
    console.error('MCP endpoint: /mcp')
    console.error('Health check: /health')
  })

  // Graceful shutdown
  const shutdown = () => {
    console.error('Shutting down gracefully…')
    httpServer.close(() => process.exit(0))
    setTimeout(() => process.exit(1), 5000).unref()
  }
  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
} else {
  const { StdioServerTransport } = await import(
    '@modelcontextprotocol/sdk/server/stdio.js'
  )

  const transport = new StdioServerTransport()
  await server.connect(transport)

  console.error('rendezvous-mcp server running on stdio')
}
