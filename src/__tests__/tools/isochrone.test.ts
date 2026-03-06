import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleGetIsochrone } from '../../tools/isochrone.js'

const mockComputeIsochrone = vi.fn()
const mockRoutingClient = { computeIsochrone: mockComputeIsochrone } as any

describe('handleGetIsochrone', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns isochrone polygon', async () => {
    mockComputeIsochrone.mockResolvedValueOnce({
      origin: { lat: 51.45, lon: -2.59 },
      mode: 'drive',
      timeMinutes: 15,
      polygon: {
        type: 'Polygon',
        coordinates: [[[-2.7, 51.4], [-2.5, 51.4], [-2.5, 51.5], [-2.7, 51.5], [-2.7, 51.4]]],
      },
    })

    const result = await handleGetIsochrone({
      lat: 51.45,
      lon: -2.59,
      transport_mode: 'drive',
      time_minutes: 15,
    }, mockRoutingClient)

    const data = JSON.parse(result.content[0].text)
    expect(data.success).toBe(true)
    expect(data.polygon.type).toBe('Polygon')
    expect(data.time_minutes).toBe(15)
  })

  it('returns payment_required on 402 with isError', async () => {
    mockComputeIsochrone.mockResolvedValueOnce({
      status: 'payment_required',
      message: 'Pay up',
      invoice: 'lnbc...',
      macaroon: 'mac',
      payment_hash: 'hash',
      payment_url: 'http://test/invoice-status/hash',
      amount_sats: 1000,
    })

    const result = await handleGetIsochrone({
      lat: 51.45, lon: -2.59, transport_mode: 'drive', time_minutes: 15,
    }, mockRoutingClient)

    const data = JSON.parse(result.content[0].text)
    expect(data.success).toBe(false)
    expect(data.status).toBe('payment_required')
    expect(result.isError).toBe(true)
  })

  it('returns error on network failure with isError', async () => {
    mockComputeIsochrone.mockRejectedValueOnce(new Error('ECONNREFUSED'))

    const result = await handleGetIsochrone({
      lat: 51.45, lon: -2.59, transport_mode: 'drive', time_minutes: 15,
    }, mockRoutingClient)

    const data = JSON.parse(result.content[0].text)
    expect(data.success).toBe(false)
    expect(data.error).toBe('ECONNREFUSED')
    expect(result.isError).toBe(true)
  })
})
