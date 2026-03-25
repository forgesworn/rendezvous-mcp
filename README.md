# rendezvous-mcp

**Nostr:** [`npub1mgvlrnf5hm9yf0n5mf9nqmvarhvxkc6remu5ec3vf8r0txqkuk7su0e7q2`](https://njump.me/npub1mgvlrnf5hm9yf0n5mf9nqmvarhvxkc6remu5ec3vf8r0txqkuk7su0e7q2)

**Fair meeting points for AI — isochrone-based fairness, not naive midpoints.**

[![npm](https://img.shields.io/npm/v/rendezvous-mcp)](https://www.npmjs.com/package/rendezvous-mcp)
[![licence](https://img.shields.io/npm/l/rendezvous-mcp)](https://github.com/forgesworn/rendezvous-mcp/blob/main/LICENSE)
![TypeScript](https://img.shields.io/badge/TypeScript-native-blue)
[![Nostr](https://img.shields.io/badge/Nostr-Zap%20me-purple)](https://primal.net/p/npub1mgvlrnf5hm9yf0n5mf9nqmvarhvxkc6remu5ec3vf8r0txqkuk7su0e7q2)

MCP server for AI-driven meeting point discovery. Give your AI the ability to answer **"where should we meet?"** using real travel times, venue availability, and fairness algorithms.

Works out of the box — free public routing, no API keys needed. Self-host Valhalla for unlimited queries, or use L402 Lightning credits for our hosted endpoint.

## Tools

| Tool | Description |
|------|-------------|
| `score-venues` | Score candidate venues by travel time fairness for 2–10 participants |
| `search-venues` | Search for venues near a location using OpenStreetMap |
| `get-isochrone` | Get a reachability polygon (everywhere reachable within N minutes) |
| `get-directions` | Get directions between two points with turn-by-turn steps |
| `store-routing-credentials` | Store L402 macaroon + preimage after Lightning payment |

## Quick start

Add to your MCP client config (Claude Code, Claude Desktop, Cursor, etc.):

```json
{
  "mcpServers": {
    "rendezvous": {
      "command": "npx",
      "args": ["rendezvous-mcp"]
    }
  }
}
```

Then ask your AI: *"Where's a fair place for Alice in London, Bob in Bristol, and Carol in Birmingham to meet for lunch?"*

## Remote (HTTP/SSE)

For ChatGPT, remote AI agents, or any client that connects over HTTP:

```bash
TRANSPORT=http npx rendezvous-mcp
```

Starts a Streamable HTTP server on port 3002 with the MCP endpoint at `/mcp`.

### ChatGPT connector

In ChatGPT settings, add an MCP server with:
- **URL:** `http://your-host:3002/mcp`
- **Transport:** Streamable HTTP

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `TRANSPORT` | `stdio` | Transport mode: `stdio` or `http` |
| `PORT` | `3002` | HTTP server port (HTTP mode only) |
| `HOST` | `0.0.0.0` | HTTP bind address (HTTP mode only) |
| `VALHALLA_URL` | `https://routing.trotters.cc` | Routing engine URL |
| `OVERPASS_URL` | Public endpoints | Venue search API |

## Self-hosted routing

For unlimited queries with no rate limits, run your own Valhalla instance:

```json
{
  "mcpServers": {
    "rendezvous": {
      "command": "npx",
      "args": ["rendezvous-mcp"],
      "env": {
        "VALHALLA_URL": "http://localhost:8002"
      }
    }
  }
}
```

## How it works

1. User asks "Where should we meet?"
2. AI geocodes participant locations
3. AI calls `search-venues` to find candidate venues near the area
4. AI calls `score-venues` with participants + candidates — returns ranked results with travel times and fairness scores
5. AI presents the fairest option with travel times for each person

For deeper analysis, the AI can use `get-isochrone` to visualise reachability and `get-directions` for turn-by-turn navigation.

## L402 payments

The default routing endpoint (`routing.trotters.cc`) offers free requests. When the free tier is exhausted, tools return a `payment_required` response with a Lightning invoice. After payment, call `store-routing-credentials` to store the macaroon for the session.

Self-hosted Valhalla has no payment requirement.

## Architecture

Thin MCP wrapper over [rendezvous-kit](https://github.com/forgesworn/rendezvous-kit) — the open-source TypeScript library for isochrone intersection, venue search, and fairness scoring. Each tool is an extracted handler function (testable without MCP) plus a registration one-liner.

## Development

```bash
npm install
npm run build
npm test
```

## Licence

[MIT](https://github.com/forgesworn/rendezvous-mcp/blob/main/LICENSE)

## Support

For issues and feature requests, see [GitHub Issues](https://github.com/forgesworn/rendezvous-mcp/issues).

If you find rendezvous-mcp useful, consider sending a tip:

- **Lightning:** `thedonkey@strike.me`
- **Nostr zaps:** `npub1mgvlrnf5hm9yf0n5mf9nqmvarhvxkc6remu5ec3vf8r0txqkuk7su0e7q2`
