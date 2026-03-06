import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { TransportMode } from 'rendezvous-kit'
import type { RoutingClient } from '../routing.js'
import { isPaymentRequired } from '../routing.js'

export async function handleGetIsochrone(
  args: {
    lat: number
    lon: number
    transport_mode: TransportMode
    time_minutes: number
  },
  routingClient: RoutingClient,
) {
  console.error(`Computing isochrone: ${args.time_minutes}min ${args.transport_mode} from [${args.lat},${args.lon}]`)

  try {
    const result = await routingClient.computeIsochrone(
      { lat: args.lat, lon: args.lon },
      args.transport_mode,
      args.time_minutes,
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
          time_minutes: result.timeMinutes,
          transport_mode: result.mode,
          polygon: result.polygon,
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

export function registerIsochroneTool(server: McpServer, routingClient: RoutingClient): void {
  server.registerTool(
    'get_isochrone',
    {
      description:
        'Get a reachability polygon showing everywhere reachable from a point within a given travel time. ' +
        'Returns a GeoJSON polygon. Useful for understanding how far someone can travel.',
      inputSchema: {
        lat: z.number().min(-90).max(90).describe('Latitude of starting point'),
        lon: z.number().min(-180).max(180).describe('Longitude of starting point'),
        transport_mode: z.enum(['drive', 'cycle', 'walk']).describe('Travel mode'),
        time_minutes: z.number().min(1).max(120).describe('Maximum travel time in minutes'),
      },
    },
    async (args) => handleGetIsochrone(args, routingClient),
  )
}
