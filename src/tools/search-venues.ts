import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { searchVenues, circleToPolygon } from 'rendezvous-kit'
import type { VenueType } from 'rendezvous-kit'

const VENUE_TYPES = [
  'pub', 'cafe', 'restaurant', 'park', 'library', 'playground',
  'community_centre', 'bar', 'fast_food', 'garden', 'theatre',
  'arts_centre', 'fitness_centre', 'sports_centre', 'escape_game',
  'swimming_pool', 'service_station',
] as const

// ---------------------------------------------------------------------------
// Extracted handler
// ---------------------------------------------------------------------------

/** Search OpenStreetMap for venues near a location by type. */
export async function handleSearchVenues(
  args: {
    lat: number
    lon: number
    radius_km?: number
    venue_types: string[]
  },
  overpassUrl?: string,
) {
  const radiusMetres = (args.radius_km ?? 5) * 1000

  console.error(`Searching venues within ${args.radius_km ?? 5}km of [${args.lat},${args.lon}] for types: ${args.venue_types.join(', ')}`)

  try {
    const polygon = circleToPolygon([args.lon, args.lat], radiusMetres)
    const venues = await searchVenues(polygon, args.venue_types as VenueType[], overpassUrl)

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: true,
          venue_count: venues.length,
          venues: venues.map(v => ({
            name: v.name,
            lat: v.lat,
            lon: v.lon,
            type: v.venueType,
            osm_id: v.osmId,
          })),
        }, null, 2),
      }],
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({ success: false, error: message }),
      }],
      isError: true as const,
    }
  }
}

// ---------------------------------------------------------------------------
// Tool registration
// ---------------------------------------------------------------------------

export function registerSearchVenuesTool(server: McpServer, overpassUrl?: string): void {
  server.registerTool(
    'search_venues',
    {
      description:
        'Search for venues (pubs, cafes, restaurants, parks, etc.) near a location using OpenStreetMap data. ' +
        'Returns name, coordinates, type, and OSM ID. Use this when you need comprehensive local venue data ' +
        'that may not be in your training knowledge.',
      inputSchema: {
        lat: z.number().min(-90).max(90).describe('Centre latitude'),
        lon: z.number().min(-180).max(180).describe('Centre longitude'),
        radius_km: z.number().min(0.5).max(25).optional().describe('Search radius in km (default 5)'),
        venue_types: z.array(z.enum(VENUE_TYPES)).min(1)
          .describe('Venue types to search: pub, cafe, restaurant, park, library, playground, community_centre, bar, fast_food, garden, theatre, arts_centre, fitness_centre, sports_centre, escape_game, swimming_pool, service_station'),
      },
    },
    async (args) => handleSearchVenues(args, overpassUrl),
  )
}
