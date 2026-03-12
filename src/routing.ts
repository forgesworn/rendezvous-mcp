import { ValhallaEngine, ValhallaError } from 'rendezvous-kit'
import type { LatLon, TransportMode, Isochrone, RouteMatrix, RouteGeometry } from 'rendezvous-kit'
import { L402State } from './l402.js'
import type { L402PaymentRequired } from './l402.js'

const DEFAULT_VALHALLA_URL = 'https://routing.trotters.cc'

/** Validate that a string is an HTTP(S) URL. */
export function validateUrl(url: string, label: string): string {
  let parsed: URL
  try { parsed = new URL(url) } catch {
    throw new TypeError(`${label}: invalid URL "${url}"`)
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new TypeError(`${label}: must use http or https, got "${parsed.protocol}"`)
  }
  return url.replace(/\/$/, '')
}

export class RoutingClient {
  readonly valhallaUrl: string
  private readonly l402: L402State

  constructor(config?: { valhallaUrl?: string }) {
    this.valhallaUrl = config?.valhallaUrl
      ? validateUrl(config.valhallaUrl, 'RoutingClient valhallaUrl')
      : DEFAULT_VALHALLA_URL
    this.l402 = new L402State()
  }

  /** Store L402 credentials after user pays an invoice. */
  storeL402Credentials(macaroon: string, preimage: string): void {
    this.l402.store(macaroon, preimage)
  }

  /** Build a ValhallaEngine with current auth headers. */
  getEngine(): ValhallaEngine {
    const headers: Record<string, string> = {}
    const auth = this.l402.getAuthHeader()
    if (auth) headers['Authorization'] = auth
    return new ValhallaEngine({ baseUrl: this.valhallaUrl, headers })
  }

  /** Compute isochrone, returning L402PaymentRequired on 402. */
  async computeIsochrone(
    origin: LatLon, mode: TransportMode, timeMinutes: number,
  ): Promise<Isochrone | L402PaymentRequired> {
    try {
      return await this.getEngine().computeIsochrone(origin, mode, timeMinutes)
    } catch (err) {
      return this.handleError(err)
    }
  }

  /** Compute route matrix, returning L402PaymentRequired on 402. */
  async computeRouteMatrix(
    origins: LatLon[], destinations: LatLon[], mode: TransportMode,
  ): Promise<RouteMatrix | L402PaymentRequired> {
    try {
      return await this.getEngine().computeRouteMatrix(origins, destinations, mode)
    } catch (err) {
      return this.handleError(err)
    }
  }

  /** Compute route, returning L402PaymentRequired on 402. */
  async computeRoute(
    origin: LatLon, destination: LatLon, mode: TransportMode,
  ): Promise<RouteGeometry | L402PaymentRequired> {
    try {
      return await this.getEngine().computeRoute(origin, destination, mode)
    } catch (err) {
      return this.handleError(err)
    }
  }

  private handleError(err: unknown): never | L402PaymentRequired {
    if (err instanceof ValhallaError && err.status === 402) {
      try {
        const body = JSON.parse(err.body)
        return {
          status: 'payment_required',
          message: 'Free tier exhausted. Pay to continue using the routing service.',
          invoice: body.invoice ?? '',
          macaroon: body.macaroon ?? '',
          payment_hash: body.payment_hash ?? '',
          payment_url: `${this.valhallaUrl}/invoice-status/${body.payment_hash ?? ''}`,
          amount_sats: body.amount_sats ?? 1000,
        }
      } catch {
        return {
          status: 'payment_required',
          message: 'Payment required — could not parse invoice details.',
          invoice: '',
          macaroon: '',
          payment_hash: '',
          payment_url: this.valhallaUrl,
          amount_sats: 1000,
        }
      }
    }
    throw err
  }
}

/** Type guard for L402 payment required responses. */
export function isPaymentRequired(result: unknown): result is L402PaymentRequired {
  return typeof result === 'object' && result !== null && (result as Record<string, unknown>).status === 'payment_required'
}
