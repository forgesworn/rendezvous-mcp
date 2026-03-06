import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { TransportMode, FairnessStrategy } from 'rendezvous-kit'
import type { RoutingClient } from '../routing.js'
import { isPaymentRequired } from '../routing.js'

// ---------------------------------------------------------------------------
// Extracted handler (testable without MCP server)
// ---------------------------------------------------------------------------

export async function handleScoreVenues(
  args: {
    participants: Array<{ lat: number; lon: number; label?: string }>
    venues: Array<{ lat: number; lon: number; name: string; type?: string }>
    transport_mode: TransportMode
    fairness?: FairnessStrategy
  },
  routingClient: RoutingClient,
) {
  const fairness = args.fairness ?? 'min_max'

  const participants = args.participants.map((p, i) => ({
    lat: p.lat,
    lon: p.lon,
    label: p.label ?? `Participant ${i + 1}`,
  }))

  const venuePoints = args.venues.map(v => ({ lat: v.lat, lon: v.lon }))

  console.error(`Scoring ${args.venues.length} venues for ${participants.length} participants (${args.transport_mode}, ${fairness})`)

  try {
    const matrix = await routingClient.computeRouteMatrix(participants, venuePoints, args.transport_mode)

    if (isPaymentRequired(matrix)) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: false,
            status: matrix.status,
            message: matrix.message,
            invoice: matrix.invoice,
            macaroon: matrix.macaroon,
            payment_hash: matrix.payment_hash,
            payment_url: matrix.payment_url,
            amount_sats: matrix.amount_sats,
          }),
        }],
        isError: true as const,
      }
    }

    // Score each venue
    const ranked: Array<{
      name: string
      lat: number
      lon: number
      type?: string
      travel_times: Record<string, number>
      fairness_score: number
    }> = []

    for (let vi = 0; vi < args.venues.length; vi++) {
      const venue = args.venues[vi]
      const travelTimes: Record<string, number> = {}
      const times: number[] = []
      let reachable = true

      for (let pi = 0; pi < participants.length; pi++) {
        const entry = matrix.entries.find(
          e => e.originIndex === pi && e.destinationIndex === vi,
        )
        const duration = entry?.durationMinutes ?? -1
        if (duration < 0) {
          reachable = false
          break
        }
        const label = participants[pi].label!
        travelTimes[label] = Math.round(duration * 10) / 10
        times.push(duration)
      }

      if (!reachable) continue

      const fairnessScore = computeFairnessScore(times, fairness)
      ranked.push({
        name: venue.name,
        lat: venue.lat,
        lon: venue.lon,
        type: venue.type,
        travel_times: travelTimes,
        fairness_score: Math.round(fairnessScore * 10) / 10,
      })
    }

    ranked.sort((a, b) => a.fairness_score - b.fairness_score)

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({ success: true, ranked_venues: ranked }, null, 2),
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

function computeFairnessScore(times: number[], strategy: string): number {
  switch (strategy) {
    case 'min_max':
      return Math.max(...times)
    case 'min_total':
      return times.reduce((sum, t) => sum + t, 0)
    case 'min_variance': {
      const mean = times.reduce((sum, t) => sum + t, 0) / times.length
      return Math.sqrt(times.reduce((sum, t) => sum + (t - mean) ** 2, 0) / times.length)
    }
    default:
      return Math.max(...times)
  }
}

// ---------------------------------------------------------------------------
// Tool registration
// ---------------------------------------------------------------------------

export function registerScoreVenuesTool(server: McpServer, routingClient: RoutingClient): void {
  server.registerTool(
    'score_venues',
    {
      description:
        'Score candidate venues by travel time fairness for multiple participants. ' +
        'Computes travel times from each participant to each venue and ranks by fairness strategy. ' +
        'The AI should suggest venues (from its own knowledge or via search_venues) and pass them here for scoring.',
      inputSchema: {
        participants: z.array(z.object({
          lat: z.number().min(-90).max(90).describe('Latitude'),
          lon: z.number().min(-180).max(180).describe('Longitude'),
          label: z.string().optional().describe('Name or label (e.g. "Alice")'),
        })).min(2).max(10).describe('Participant locations (2–10 people)'),
        venues: z.array(z.object({
          lat: z.number().min(-90).max(90).describe('Latitude'),
          lon: z.number().min(-180).max(180).describe('Longitude'),
          name: z.string().describe('Venue name'),
          type: z.string().optional().describe('Venue type (pub, cafe, restaurant, park, etc.)'),
        })).min(1).max(50).describe('Candidate venues to score (1–50)'),
        transport_mode: z.enum(['drive', 'cycle', 'walk']).describe('How participants will travel'),
        fairness: z.enum(['min_max', 'min_total', 'min_variance']).optional()
          .describe('Scoring strategy: min_max (default, minimise longest journey), min_total (minimise total travel), min_variance (equalise travel times)'),
      },
    },
    async (args) => handleScoreVenues(args, routingClient),
  )
}
