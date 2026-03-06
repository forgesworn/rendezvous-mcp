import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { RoutingClient } from '../routing.js'

// ---------------------------------------------------------------------------
// Extracted handler (testable without MCP server)
// ---------------------------------------------------------------------------

export async function handleStoreRoutingCredentials(
  args: {
    macaroon: string
    preimage: string
  },
  routingClient: RoutingClient,
) {
  console.error('Storing L402 routing credentials')

  routingClient.storeL402Credentials(args.macaroon, args.preimage)

  return {
    content: [{
      type: 'text' as const,
      text: JSON.stringify({
        success: true,
        message: 'L402 credentials stored. Subsequent routing calls will authenticate automatically.',
      }),
    }],
  }
}

// ---------------------------------------------------------------------------
// Tool registration
// ---------------------------------------------------------------------------

export function registerStoreCredentialsTool(server: McpServer, routingClient: RoutingClient): void {
  server.registerTool(
    'store_routing_credentials',
    {
      description:
        'Store L402 payment credentials (macaroon + preimage) after paying a routing invoice. ' +
        'Call this after the user has paid the Lightning invoice returned by a payment_required response. ' +
        'Once stored, all subsequent routing calls (find_rendezvous, score_venues, get_isochrone, get_directions) ' +
        'will authenticate automatically.',
      inputSchema: {
        macaroon: z.string().min(1).regex(/^[A-Za-z0-9+/=]+$/, 'Must be valid base64')
          .describe('The macaroon from the payment_required response'),
        preimage: z.string().min(1).regex(/^[0-9a-fA-F]+$/, 'Must be valid hex')
          .describe('The payment preimage obtained after paying the invoice'),
      },
    },
    async (args) => handleStoreRoutingCredentials(args, routingClient),
  )
}
