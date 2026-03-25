# API Reference

rendezvous-mcp exposes 5 MCP tools. All tools return JSON with a `success` field. On failure, `success` is `false` and an `error` message is included.

## score-venues

Score candidate venues by travel time fairness for 2–10 participants.

### Input

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `participants` | `Array<{ lat, lon, label? }>` | Yes | 2–10 participant locations |
| `venues` | `Array<{ lat, lon, name, type? }>` | Yes | 1–50 candidate venues to score |
| `transport_mode` | `"drive" \| "cycle" \| "walk"` | Yes | How participants will travel |
| `fairness` | `"min_max" \| "min_total" \| "min_variance"` | No | Scoring strategy (default: `min_max`) |

### Fairness strategies

- **min_max** — minimise the longest individual journey (default, best for general use)
- **min_total** — minimise total travel time across all participants
- **min_variance** — equalise travel times (everyone travels roughly the same)

### Response

```json
{
  "success": true,
  "ranked_venues": [
    {
      "name": "The Railway Tavern",
      "lat": 52.0,
      "lon": -1.5,
      "type": "pub",
      "travel_times": {
        "Alice": 45.2,
        "Bob": 38.7,
        "Carol": 41.3
      },
      "fairness_score": 45.2
    }
  ]
}
```

Venues are sorted by `fairness_score` ascending (lower is fairer).

---

## search-venues

Search OpenStreetMap for venues near a location.

### Input

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `lat` | `number` | Yes | Centre latitude |
| `lon` | `number` | Yes | Centre longitude |
| `radius_km` | `number` | No | Search radius in km (default: 5, max: 25) |
| `venue_types` | `string[]` | Yes | Types to search (see below) |

### Venue types

`pub`, `cafe`, `restaurant`, `park`, `library`, `playground`, `community_centre`, `bar`, `fast_food`, `garden`, `theatre`, `arts_centre`, `fitness_centre`, `sports_centre`, `escape_game`, `swimming_pool`, `service_station`

### Response

```json
{
  "success": true,
  "venue_count": 12,
  "venues": [
    {
      "name": "The Red Lion",
      "lat": 51.5074,
      "lon": -0.1278,
      "type": "pub",
      "osm_id": 123456789
    }
  ]
}
```

---

## get-isochrone

Compute a reachability polygon — everywhere reachable from a point within a given travel time.

### Input

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `lat` | `number` | Yes | Starting point latitude |
| `lon` | `number` | Yes | Starting point longitude |
| `transport_mode` | `"drive" \| "cycle" \| "walk"` | Yes | Travel mode |
| `time_minutes` | `number` | Yes | Maximum travel time (1–120 minutes) |

### Response

```json
{
  "success": true,
  "time_minutes": 30,
  "transport_mode": "drive",
  "polygon": {
    "type": "Polygon",
    "coordinates": [[[lon, lat], [lon, lat], ...]]
  }
}
```

The `polygon` is a GeoJSON Polygon.

---

## get-directions

Get directions between two points with turn-by-turn steps.

### Input

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `from` | `{ lat, lon }` | Yes | Starting point |
| `to` | `{ lat, lon }` | Yes | Destination |
| `transport_mode` | `"drive" \| "cycle" \| "walk"` | Yes | Travel mode |

### Response

```json
{
  "success": true,
  "distance_km": 142.35,
  "duration_minutes": 98.4,
  "steps": [
    {
      "instruction": "Turn right onto High Street",
      "distance_km": 0.45,
      "duration_minutes": 1.2
    }
  ]
}
```

---

## store-routing-credentials

Store L402 payment credentials after paying a Lightning invoice.

### Input

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `macaroon` | `string` | Yes | Base64-encoded macaroon from the `payment_required` response |
| `preimage` | `string` | Yes | Hex-encoded payment preimage from the Lightning payment |

### Response

```json
{
  "success": true,
  "message": "L402 credentials stored. Subsequent routing calls will authenticate automatically."
}
```

---

## L402 Payment Flow

When the free tier is exhausted, routing tools return an error with payment details:

```json
{
  "success": false,
  "status": "payment_required",
  "message": "Free tier exhausted. Pay to continue using the routing service.",
  "invoice": "lnbc...",
  "macaroon": "AgEL...",
  "payment_hash": "abc123...",
  "payment_url": "https://routing.trotters.cc/invoice-status/abc123...",
  "amount_sats": 1000
}
```

After the user pays the Lightning invoice, call `store-routing-credentials` with the `macaroon` and payment `preimage`. All subsequent routing calls authenticate automatically for the session.
