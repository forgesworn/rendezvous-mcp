import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleGetDirections } from '../../tools/directions.js'

const mockComputeRoute = vi.fn()
const mockRoutingClient = { computeRoute: mockComputeRoute } as any

describe('handleGetDirections', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns route with steps', async () => {
    mockComputeRoute.mockResolvedValueOnce({
      origin: { lat: 51.45, lon: -2.59 },
      destination: { lat: 51.50, lon: -0.12 },
      mode: 'drive',
      durationMinutes: 120.5,
      distanceKm: 185.3,
      geometry: { type: 'LineString', coordinates: [[-2.59, 51.45], [-0.12, 51.50]] },
      legs: [
        { instruction: 'Head east on A4', distanceKm: 100, durationMinutes: 60 },
        { instruction: 'Continue on M4', distanceKm: 85.3, durationMinutes: 60.5 },
      ],
    })

    const result = await handleGetDirections({
      from: { lat: 51.45, lon: -2.59 },
      to: { lat: 51.50, lon: -0.12 },
      transport_mode: 'drive',
    }, mockRoutingClient)

    const data = JSON.parse(result.content[0].text)
    expect(data.success).toBe(true)
    expect(data.distance_km).toBe(185.3)
    expect(data.duration_minutes).toBe(120.5)
    expect(data.steps).toHaveLength(2)
    expect(data.steps[0].instruction).toBe('Head east on A4')
    expect(data.geometry).toBeUndefined()
  })

  it('returns payment_required on 402 with isError', async () => {
    mockComputeRoute.mockResolvedValueOnce({
      status: 'payment_required',
      message: 'Pay up',
      invoice: 'lnbc...',
      macaroon: 'mac',
      payment_hash: 'hash',
      payment_url: 'http://test/invoice-status/hash',
      amount_sats: 1000,
    })

    const result = await handleGetDirections({
      from: { lat: 51.45, lon: -2.59 },
      to: { lat: 51.50, lon: -0.12 },
      transport_mode: 'drive',
    }, mockRoutingClient)

    const data = JSON.parse(result.content[0].text)
    expect(data.success).toBe(false)
    expect(data.status).toBe('payment_required')
    expect(result.isError).toBe(true)
  })

  it('returns error on network failure with isError', async () => {
    mockComputeRoute.mockRejectedValueOnce(new Error('ETIMEDOUT'))

    const result = await handleGetDirections({
      from: { lat: 51.45, lon: -2.59 },
      to: { lat: 51.50, lon: -0.12 },
      transport_mode: 'drive',
    }, mockRoutingClient)

    const data = JSON.parse(result.content[0].text)
    expect(data.success).toBe(false)
    expect(data.error).toBe('ETIMEDOUT')
    expect(result.isError).toBe(true)
  })

  it('handles non-Error thrown values', async () => {
    mockComputeRoute.mockRejectedValueOnce('string error')

    const result = await handleGetDirections({
      from: { lat: 51.45, lon: -2.59 },
      to: { lat: 51.50, lon: -0.12 },
      transport_mode: 'drive',
    }, mockRoutingClient)

    const data = JSON.parse(result.content[0].text)
    expect(data.success).toBe(false)
    expect(data.error).toBe('string error')
    expect(result.isError).toBe(true)
  })
})
