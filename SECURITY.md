# Security Policy

## Network Calls

rendezvous-mcp makes outbound HTTP requests to:

- **Valhalla routing engine** (`VALHALLA_URL`, default: `https://routing.trotters.cc`) — isochrone, route matrix, and directions queries
- **Overpass API** (`OVERPASS_URL`, default: public instances) — venue search within polygon bounding boxes

No data is sent to any other service. There is no telemetry, analytics, or tracking.

## L402 Payment Flow

When the routing engine returns HTTP 402 (Payment Required), the response includes a Lightning invoice. After payment, the user stores a macaroon + preimage via `store-routing-credentials`. These credentials are held in memory only (per-session) and are never persisted to disk.

## Reporting a Vulnerability

If you discover a security vulnerability, please email **security@trotters.cc** rather than opening a public issue. We will respond within 48 hours.

## Supported Versions

Only the latest major version receives security fixes.
