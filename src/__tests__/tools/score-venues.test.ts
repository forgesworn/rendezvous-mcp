import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleScoreVenues } from '../../tools/score-venues.js'

// Mock the routing client
const mockComputeRouteMatrix = vi.fn()
const mockRoutingClient = {
  computeRouteMatrix: mockComputeRouteMatrix,
  valhallaUrl: 'http://test',
} as any

describe('handleScoreVenues', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns venues ranked by min_max fairness', async () => {
    // Venue A: Alice 10min, Bob 13min → max=13
    // Venue B: Alice 20min, Bob 15min → max=20
    // → Venue A wins
    mockComputeRouteMatrix.mockResolvedValueOnce({
      origins: [
        { lat: 51.45, lon: -2.59 },
        { lat: 51.50, lon: -0.12 },
      ],
      destinations: [
        { lat: 51.47, lon: -1.35 },
        { lat: 51.48, lon: -1.30 },
      ],
      entries: [
        { originIndex: 0, destinationIndex: 0, durationMinutes: 10, distanceKm: 15 },
        { originIndex: 0, destinationIndex: 1, durationMinutes: 20, distanceKm: 30 },
        { originIndex: 1, destinationIndex: 0, durationMinutes: 13, distanceKm: 18 },
        { originIndex: 1, destinationIndex: 1, durationMinutes: 15, distanceKm: 22 },
      ],
    })

    const result = await handleScoreVenues({
      participants: [
        { lat: 51.45, lon: -2.59, label: 'Alice' },
        { lat: 51.50, lon: -0.12, label: 'Bob' },
      ],
      venues: [
        { lat: 51.47, lon: -1.35, name: 'The Crown' },
        { lat: 51.48, lon: -1.30, name: 'Railway Arms' },
      ],
      transport_mode: 'drive',
      fairness: 'min_max',
    }, mockRoutingClient)

    const data = JSON.parse(result.content[0].text)
    expect(data.success).toBe(true)
    expect(data.ranked_venues).toHaveLength(2)
    expect(data.ranked_venues[0].name).toBe('The Crown')
    expect(data.ranked_venues[0].travel_times.Alice).toBe(10)
    expect(data.ranked_venues[0].travel_times.Bob).toBe(13)
    expect(data.ranked_venues[0].fairness_score).toBe(13)
  })

  it('returns payment_required on 402 with isError', async () => {
    mockComputeRouteMatrix.mockResolvedValueOnce({
      status: 'payment_required',
      message: 'Pay up',
      invoice: 'lnbc1000...',
      macaroon: 'mac',
      payment_hash: 'hash',
      payment_url: 'http://test/invoice-status/hash',
      amount_sats: 1000,
    })

    const result = await handleScoreVenues({
      participants: [
        { lat: 51.45, lon: -2.59, label: 'Alice' },
        { lat: 51.50, lon: -0.12, label: 'Bob' },
      ],
      venues: [{ lat: 51.47, lon: -1.35, name: 'Pub' }],
      transport_mode: 'drive',
    }, mockRoutingClient)

    const data = JSON.parse(result.content[0].text)
    expect(data.success).toBe(false)
    expect(data.status).toBe('payment_required')
    expect(data.invoice).toBe('lnbc1000...')
    expect(result.isError).toBe(true)
  })

  it('auto-labels participants without labels', async () => {
    mockComputeRouteMatrix.mockResolvedValueOnce({
      origins: [{ lat: 51.45, lon: -2.59 }, { lat: 51.50, lon: -0.12 }],
      destinations: [{ lat: 51.47, lon: -1.35 }],
      entries: [
        { originIndex: 0, destinationIndex: 0, durationMinutes: 10, distanceKm: 15 },
        { originIndex: 1, destinationIndex: 0, durationMinutes: 12, distanceKm: 18 },
      ],
    })

    const result = await handleScoreVenues({
      participants: [
        { lat: 51.45, lon: -2.59 },
        { lat: 51.50, lon: -0.12 },
      ],
      venues: [{ lat: 51.47, lon: -1.35, name: 'Pub' }],
      transport_mode: 'drive',
    }, mockRoutingClient)

    const data = JSON.parse(result.content[0].text)
    expect(data.ranked_venues[0].travel_times).toHaveProperty('Participant 1')
    expect(data.ranked_venues[0].travel_times).toHaveProperty('Participant 2')
  })

  it('skips unreachable venues (durationMinutes < 0)', async () => {
    mockComputeRouteMatrix.mockResolvedValueOnce({
      origins: [{ lat: 51.45, lon: -2.59 }, { lat: 51.50, lon: -0.12 }],
      destinations: [{ lat: 51.47, lon: -1.35 }, { lat: 52.0, lon: 0.0 }],
      entries: [
        { originIndex: 0, destinationIndex: 0, durationMinutes: 10, distanceKm: 15 },
        { originIndex: 0, destinationIndex: 1, durationMinutes: -1, distanceKm: -1 },
        { originIndex: 1, destinationIndex: 0, durationMinutes: 12, distanceKm: 18 },
        { originIndex: 1, destinationIndex: 1, durationMinutes: -1, distanceKm: -1 },
      ],
    })

    const result = await handleScoreVenues({
      participants: [
        { lat: 51.45, lon: -2.59, label: 'Alice' },
        { lat: 51.50, lon: -0.12, label: 'Bob' },
      ],
      venues: [
        { lat: 51.47, lon: -1.35, name: 'Reachable' },
        { lat: 52.0, lon: 0.0, name: 'Unreachable' },
      ],
      transport_mode: 'drive',
    }, mockRoutingClient)

    const data = JSON.parse(result.content[0].text)
    expect(data.ranked_venues).toHaveLength(1)
    expect(data.ranked_venues[0].name).toBe('Reachable')
  })

  it('returns error on network failure with isError', async () => {
    mockComputeRouteMatrix.mockRejectedValueOnce(new Error('ECONNREFUSED'))

    const result = await handleScoreVenues({
      participants: [
        { lat: 51.45, lon: -2.59, label: 'Alice' },
        { lat: 51.50, lon: -0.12, label: 'Bob' },
      ],
      venues: [{ lat: 51.47, lon: -1.35, name: 'Pub' }],
      transport_mode: 'drive',
    }, mockRoutingClient)

    const data = JSON.parse(result.content[0].text)
    expect(data.success).toBe(false)
    expect(data.error).toBe('ECONNREFUSED')
    expect(result.isError).toBe(true)
  })
})
