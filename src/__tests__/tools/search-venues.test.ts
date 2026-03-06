import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleSearchVenues } from '../../tools/search-venues.js'

// Mock rendezvous-kit's searchVenues
vi.mock('rendezvous-kit', async (importOriginal) => {
  const actual = await importOriginal() as any
  return {
    ...actual,
    searchVenues: vi.fn(),
  }
})

import { searchVenues } from 'rendezvous-kit'
const mockSearchVenues = vi.mocked(searchVenues)

describe('handleSearchVenues', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns venues from Overpass', async () => {
    mockSearchVenues.mockResolvedValueOnce([
      { name: 'The Crown', lat: 51.47, lon: -2.59, venueType: 'pub', osmId: 'node/123' },
      { name: 'Park Cafe', lat: 51.48, lon: -2.58, venueType: 'cafe', osmId: 'node/456' },
    ])

    const result = await handleSearchVenues({
      lat: 51.47,
      lon: -2.59,
      radius_km: 2,
      venue_types: ['pub', 'cafe'],
    })

    const data = JSON.parse(result.content[0].text)
    expect(data.success).toBe(true)
    expect(data.venues).toHaveLength(2)
    expect(data.venues[0].name).toBe('The Crown')
    expect(data.venues[0].type).toBe('pub')
    expect(mockSearchVenues).toHaveBeenCalledOnce()
  })

  it('handles Overpass errors gracefully with isError', async () => {
    mockSearchVenues.mockRejectedValueOnce(new Error('All Overpass endpoints failed'))

    const result = await handleSearchVenues({
      lat: 51.47,
      lon: -2.59,
      venue_types: ['pub'],
    })

    const data = JSON.parse(result.content[0].text)
    expect(data.success).toBe(false)
    expect(data.error).toContain('Overpass')
    expect(result.isError).toBe(true)
  })

  it('handles non-Error thrown values', async () => {
    mockSearchVenues.mockRejectedValueOnce('unexpected failure')

    const result = await handleSearchVenues({
      lat: 51.47,
      lon: -2.59,
      venue_types: ['pub'],
    })

    const data = JSON.parse(result.content[0].text)
    expect(data.success).toBe(false)
    expect(data.error).toBe('unexpected failure')
    expect(result.isError).toBe(true)
  })
})
