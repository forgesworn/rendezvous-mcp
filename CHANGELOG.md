## [1.1.4](https://github.com/forgesworn/rendezvous-mcp/compare/v1.1.3...v1.1.4) (2026-04-12)


### Bug Fixes

* resolve runtime dependency vulnerabilities ([19cd561](https://github.com/forgesworn/rendezvous-mcp/commit/19cd561815e4a60b0975277e44cc8be5a027473a))

## [1.1.3](https://github.com/forgesworn/rendezvous-mcp/compare/v1.1.2...v1.1.3) (2026-04-07)


### Bug Fixes

* use dev.forgesworn namespace for MCP registry ([73e3558](https://github.com/forgesworn/rendezvous-mcp/commit/73e35582e707e149cb138080a5aa9fcab95e3831))

## [1.1.2](https://github.com/forgesworn/rendezvous-mcp/compare/v1.1.1...v1.1.2) (2026-04-07)


### Bug Fixes

* publish mcpName field for MCP registry validation ([1582394](https://github.com/forgesworn/rendezvous-mcp/commit/1582394a4045210f5b813b6cfd0ca0a8f012997a))

## [1.1.1](https://github.com/forgesworn/rendezvous-mcp/compare/v1.1.0...v1.1.1) (2026-04-07)


### Bug Fixes

* remove stale find-rendezvous reference from store-credentials tool description ([f5dcbc9](https://github.com/forgesworn/rendezvous-mcp/commit/f5dcbc979042a619089b203beb35b9cb98417d2e))

# [1.1.0](https://github.com/forgesworn/rendezvous-mcp/compare/v1.0.1...v1.1.0) (2026-03-25)


### Features

* add MCP instructions, tool annotations, and kebab-case tool names ([b13a324](https://github.com/forgesworn/rendezvous-mcp/commit/b13a32456706f52ee3e1fa4fe549e663893b4160))

## [1.0.1](https://github.com/forgesworn/rendezvous-mcp/compare/v1.0.0...v1.0.1) (2026-03-20)


### Bug Fixes

* correct copyright to TheCryptoDonkey ([a7d78de](https://github.com/forgesworn/rendezvous-mcp/commit/a7d78de6136c65da497aab9f67c93fd1f03649b5))

# 1.0.0 (2026-03-18)


### Bug Fixes

* add defence-in-depth validation for L402 credentials ([f6cea2f](https://github.com/forgesworn/rendezvous-mcp/commit/f6cea2f72351d3dbcf2d466fb65e238590bbbe24))
* drop geometry from directions response to reduce token bloat ([b85155c](https://github.com/forgesworn/rendezvous-mcp/commit/b85155c86c80372412182195904f8b8f1b4a1884))
* encode payment_hash in URL, add 402 body validation tests ([93e761e](https://github.com/forgesworn/rendezvous-mcp/commit/93e761ef498d793c36a266e6868ee99d8fac1f0f))
* harden security and production readiness ([9c89d3b](https://github.com/forgesworn/rendezvous-mcp/commit/9c89d3b200e964abb848e2a98c3c8c45c9c03dcd))
* production readiness hardening (security, quality, testing) ([4e92df1](https://github.com/forgesworn/rendezvous-mcp/commit/4e92df16e788fa40434ff22b901135bc2e7eaefb))
* regenerate lockfile to resolve rendezvous-kit from npm (not file reference) ([ec254ac](https://github.com/forgesworn/rendezvous-mcp/commit/ec254acc16aef839c35001979201a268c4d1f509))
* sanitise error messages to prevent internal URL leakage ([9a19400](https://github.com/forgesworn/rendezvous-mcp/commit/9a19400fa60384f4549b5f864b44f0efc22673d0))
* validate OVERPASS_URL env var at startup ([ca079bc](https://github.com/forgesworn/rendezvous-mcp/commit/ca079bc7d944299625412b16a926550dcf825e37))
* validate VALHALLA_URL at startup, harden HTTP transport ([1a1219e](https://github.com/forgesworn/rendezvous-mcp/commit/1a1219e02972133f8e43b5d609a62978fe7ebdef))


### Features

* add store_routing_credentials tool for L402 payment flow ([0a113fa](https://github.com/forgesworn/rendezvous-mcp/commit/0a113fa4ba9dff6f80e5d5fbe47dceb9e333aabb))
* add Streamable HTTP transport for remote AI clients ([3362848](https://github.com/forgesworn/rendezvous-mcp/commit/33628486570bbb684f31640707da360ceabe16c4))
* get_directions tool — turn-by-turn routing ([55bf921](https://github.com/forgesworn/rendezvous-mcp/commit/55bf921f1889a669e4260f20d3fad2b54bfccf30))
* get_isochrone tool — reachability polygon ([0392733](https://github.com/forgesworn/rendezvous-mcp/commit/03927332b259dae70a0859e67a4e954a14b19c83))
* initial npm publication with CI/CD and production docs ([911889d](https://github.com/forgesworn/rendezvous-mcp/commit/911889d83f668c9c6f16fee64f31d3ad69892e0d))
* L402 state management for payment credentials ([e4cab2e](https://github.com/forgesworn/rendezvous-mcp/commit/e4cab2eb4a173f82cd938a1bd6f7deacf7868eaf))
* MCP server entry point — wire up all tools on stdio ([a16db9f](https://github.com/forgesworn/rendezvous-mcp/commit/a16db9f9d71e0d10894e5b4961eabcfdef776d9e))
* routing client with L402 payment handling ([cab9611](https://github.com/forgesworn/rendezvous-mcp/commit/cab96113d19a53d61730bb39c53fb3e2d1d072ee))
* score_venues tool — fairness-ranked meeting point scoring ([605adc7](https://github.com/forgesworn/rendezvous-mcp/commit/605adc797a0e238329237fe2fa5601d642a65830))
* search_venues tool — Overpass venue search by location ([753598f](https://github.com/forgesworn/rendezvous-mcp/commit/753598f62a0d6eec991c82caac3be5b6b5828c7a))
