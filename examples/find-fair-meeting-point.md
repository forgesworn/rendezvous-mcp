# Example: Find a Fair Meeting Point

This walkthrough shows the typical AI agent flow for finding a fair meeting point.

## Scenario

Alice is in London, Bob is in Bristol, and Carol is in Birmingham. They want to meet for lunch at a pub.

## Step 1: Search for venues in the area between them

Call `search-venues` near the geographic centre of the three cities:

```json
{
  "lat": 51.9,
  "lon": -1.5,
  "radius_km": 15,
  "venue_types": ["pub", "restaurant"]
}
```

Response:

```json
{
  "success": true,
  "venue_count": 8,
  "venues": [
    { "name": "The Railway Tavern", "lat": 51.92, "lon": -1.48, "type": "pub", "osm_id": 12345 },
    { "name": "The Plough Inn", "lat": 51.85, "lon": -1.52, "type": "pub", "osm_id": 12346 },
    { "name": "Bella Italia", "lat": 51.88, "lon": -1.45, "type": "restaurant", "osm_id": 12347 }
  ]
}
```

## Step 2: Score venues by fairness

Call `score-venues` with participants and the candidate venues:

```json
{
  "participants": [
    { "lat": 51.5074, "lon": -0.1278, "label": "Alice" },
    { "lat": 51.4545, "lon": -2.5879, "label": "Bob" },
    { "lat": 52.4862, "lon": -1.8904, "label": "Carol" }
  ],
  "venues": [
    { "lat": 51.92, "lon": -1.48, "name": "The Railway Tavern", "type": "pub" },
    { "lat": 51.85, "lon": -1.52, "name": "The Plough Inn", "type": "pub" },
    { "lat": 51.88, "lon": -1.45, "name": "Bella Italia", "type": "restaurant" }
  ],
  "transport_mode": "drive",
  "fairness": "min_max"
}
```

Response:

```json
{
  "success": true,
  "ranked_venues": [
    {
      "name": "The Plough Inn",
      "lat": 51.85,
      "lon": -1.52,
      "type": "pub",
      "travel_times": { "Alice": 72.5, "Bob": 45.3, "Carol": 55.1 },
      "fairness_score": 72.5
    },
    {
      "name": "The Railway Tavern",
      "lat": 51.92,
      "lon": -1.48,
      "type": "pub",
      "travel_times": { "Alice": 78.2, "Bob": 48.1, "Carol": 50.3 },
      "fairness_score": 78.2
    },
    {
      "name": "Bella Italia",
      "lat": 51.88,
      "lon": -1.45,
      "type": "restaurant",
      "travel_times": { "Alice": 80.1, "Bob": 52.7, "Carol": 48.9 },
      "fairness_score": 80.1
    }
  ]
}
```

The Plough Inn wins — the longest journey (Alice, 72.5 min) is shorter than at the other venues.

## Step 3 (optional): Get directions

Call `get-directions` for each participant to the chosen venue:

```json
{
  "from": { "lat": 51.5074, "lon": -0.1278 },
  "to": { "lat": 51.85, "lon": -1.52 },
  "transport_mode": "drive"
}
```

## Step 4 (optional): Visualise reachability

Call `get-isochrone` to show each participant's 60-minute driving range:

```json
{
  "lat": 51.5074,
  "lon": -0.1278,
  "transport_mode": "drive",
  "time_minutes": 60
}
```

Returns a GeoJSON polygon that can be rendered on a map to show Alice's reachable area.
