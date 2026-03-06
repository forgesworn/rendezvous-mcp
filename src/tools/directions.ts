import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { TransportMode } from 'rendezvous-kit'
import type { RoutingClient } from '../routing.js'
import { isPaymentRequired } from '../routing.js'

export async function handleGetDirections(
  args: {
    from: { lat: number; lon: number }
    to: { lat: number; lon: number }
    transport_mode: TransportMode
  },
  routingClient: RoutingClient,
) {
  console.error(`Computing route: ${args.transport_mode} from [${args.from.lat},${args.from.lon}] to [${args.to.lat},${args.to.lon}]`)

  try {
    const result = await routingClient.computeRoute(
      { lat: args.from.lat, lon: args.from.lon },
      { lat: args.to.lat, lon: args.to.lon },
      args.transport_mode,
    )

    if (isPaymentRequired(result)) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: false,
            status: result.status,
            message: result.message,
            invoice: result.invoice,
            macaroon: result.macaroon,
            payment_hash: result.payment_hash,
            payment_url: result.payment_url,
            amount_sats: result.amount_sats,
          }),
        }],
        isError: true as const,
      }
    }

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: true,
          distance_km: Math.round(result.distanceKm * 100) / 100,
          duration_minutes: Math.round(result.durationMinutes * 10) / 10,
          steps: (result.legs ?? []).map(leg => ({
            instruction: leg.instruction,
            distance_km: Math.round(leg.distanceKm * 100) / 100,
            duration_minutes: Math.round(leg.durationMinutes * 10) / 10,
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

export function registerDirectionsTool(server: McpServer, routingClient: RoutingClient): void {
  server.registerTool(
    'get_directions',
    {
      description:
        'Get directions between two points with distance, duration, and turn-by-turn steps. ' +
        'Returns a GeoJSON LineString of the route geometry.',
      inputSchema: {
        from: z.object({
          lat: z.number().min(-90).max(90).describe('Latitude'),
          lon: z.number().min(-180).max(180).describe('Longitude'),
        }).describe('Starting point'),
        to: z.object({
          lat: z.number().min(-90).max(90).describe('Latitude'),
          lon: z.number().min(-180).max(180).describe('Longitude'),
        }).describe('Destination point'),
        transport_mode: z.enum(['drive', 'cycle', 'walk']).describe('Travel mode'),
      },
    },
    async (args) => handleGetDirections(args, routingClient),
  )
}
