# AGENTS.md: rendezvous-mcp

Instructions for AI coding agents working in this repository.

## What This Is

MCP server for AI-driven fair meeting point discovery. Thin wrapper over [rendezvous-kit](https://github.com/forgesworn/rendezvous-kit) exposing 5 tools via the Model Context Protocol: `score-venues`, `search-venues`, `get-isochrone`, `get-directions`, `store-routing-credentials`.

## Commands

```bash
npm install         # install dependencies
npm run build       # tsc, compiles to build/
npm test            # vitest run
npm run typecheck   # tsc --noEmit
npm start           # stdio mode (default)
npm run start:http  # HTTP mode on port 3002
```

There is no separate lint script.

## Repository Layout

```
src/
  index.ts               server entry point, dual transport (stdio/HTTP)
  routing.ts              RoutingClient wrapping ValhallaEngine with L402 handling
  l402.ts                 L402State credential storage and types
  tools/
    score-venues.ts       score candidate venues by travel time fairness
    search-venues.ts      search Overpass for venues near a location
    isochrone.ts          compute reachability polygon
    directions.ts         turn-by-turn routing
    store-credentials.ts  store L402 macaroon and preimage after payment
```

## Subpath Exports

| Import path | Module |
|-------------|--------|
| `rendezvous-mcp` | server entry point |
| `rendezvous-mcp/routing` | `RoutingClient`, `validateUrl`, `isPaymentRequired` |
| `rendezvous-mcp/l402` | `L402State` |
| `rendezvous-mcp/tools/*` | individual tool handlers |

## Handler Extraction Pattern

Each tool file exports two things:
1. `handle*()`: extracted handler function (testable without MCP framework)
2. `register*Tool()`: one-liner that registers the handler with the MCP server

This pattern keeps tool logic testable and registration minimal.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TRANSPORT` | `stdio` | Transport mode: `stdio` or `http` |
| `PORT` | `3002` | HTTP server port (HTTP mode only) |
| `HOST` | `0.0.0.0` | HTTP bind address (HTTP mode only) |
| `VALHALLA_URL` | Hosted, L402-gated endpoint | Routing engine URL |
| `OVERPASS_URL` | Public endpoints | Venue search API |

## Conventions

- British English everywhere: favour, colour, behaviour, licence, initialise, metre
- Never use `console.log()`: stdio transport reserves stdout for JSON-RPC. Use `console.error()` for all debug output
- Git: commit messages use `type: description` format. Do not include `Co-Authored-By` lines
- ESM-only, with `.js` extensions in imports
- TypeScript strict mode: no `any`, no implicit returns

## L402 Payments

The default routing endpoint offers free requests. When the free tier is exhausted, tools return a `payment_required` response with a Lightning invoice. After payment, call `store-routing-credentials` to store the macaroon for the session. Self-hosted Valhalla has no payment requirement.

## Common Pitfalls

- Writing to stdout in stdio mode corrupts the JSON-RPC stream; always use `console.error()` for debug output
- `VALHALLA_URL` defaults to a hosted, L402-gated endpoint; self-hosted Valhalla skips payment handling entirely

## Before Committing

1. Run `npm test && npm run typecheck`: both must pass
2. Use conventional commit messages: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`
3. Use British English in all text
