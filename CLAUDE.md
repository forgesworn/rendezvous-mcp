# CLAUDE.md — rendezvous-mcp

MCP server for AI-driven fair meeting point discovery. Thin wrapper over [rendezvous-kit](https://github.com/forgesworn/rendezvous-kit) exposing 5 tools via the Model Context Protocol.

## Conventions

- **British English** everywhere — favour, colour, behaviour, licence, initialise, metre
- **Never use `console.log()`** — stdio transport reserves stdout for JSON-RPC. Use `console.error()` for all debug output.
- **Git:** commit messages use `type: description` format. Do NOT include `Co-Authored-By` lines.
- **ESM-only** with `.js` extensions in imports
- **TypeScript strict mode** — no `any`, no implicit returns

## Project structure

```
src/
  index.ts                — server entry point, dual transport (stdio/HTTP)
  routing.ts              — RoutingClient wrapping ValhallaEngine with L402 handling
  l402.ts                 — L402State credential storage + types
  tools/
    score-venues.ts       — score candidate venues by travel time fairness
    search-venues.ts      — search Overpass for venues near a location
    isochrone.ts          — compute reachability polygon
    directions.ts         — turn-by-turn routing
    store-credentials.ts  — store L402 macaroon + preimage after payment
```

## Build & test

```bash
npm run build      # tsc → build/
npm test           # vitest run
npm run typecheck  # tsc --noEmit
npm start          # stdio mode (default)
npm run start:http # HTTP mode on port 3002
```

## Handler extraction pattern

Each tool file exports two things:
1. `handle*()` — extracted handler function (testable without MCP framework)
2. `register*Tool()` — one-liner that registers the handler with the MCP server

This pattern keeps tool logic testable and registration minimal.

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TRANSPORT` | `stdio` | Transport mode: `stdio` or `http` |
| `PORT` | `3002` | HTTP server port (HTTP mode only) |
| `HOST` | `0.0.0.0` | HTTP bind address (HTTP mode only) |
| `VALHALLA_URL` | `https://routing.trotters.cc` | Routing engine URL |
| `OVERPASS_URL` | Public endpoints | Venue search API |
