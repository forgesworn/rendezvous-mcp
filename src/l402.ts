/** Payment-required response returned to MCP when Valhalla returns 402. */
export interface L402PaymentRequired {
  status: 'payment_required'
  message: string
  invoice: string
  macaroon: string
  payment_hash: string
  payment_url: string
  amount_sats: number
}

/** In-memory L402 credential storage for a single MCP session. */
export class L402State {
  private macaroon: string | null = null
  private preimage: string | null = null

  /** Store credentials after the user pays an invoice. */
  store(macaroon: string, preimage: string): void {
    this.macaroon = macaroon
    this.preimage = preimage
  }

  /** Return the Authorization header value, or null if no credentials. */
  getAuthHeader(): string | null {
    if (!this.macaroon || !this.preimage) return null
    return `L402 ${this.macaroon}:${this.preimage}`
  }

  /** Clear stored credentials. */
  clear(): void {
    this.macaroon = null
    this.preimage = null
  }
}
