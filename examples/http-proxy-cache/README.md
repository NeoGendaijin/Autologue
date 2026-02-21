# Production-Style HTTP Proxy Cache

Build a reverse proxy server with caching, resilience, and observability.

## Objective
Implement a Node.js reverse proxy suitable for high-traffic API mediation.

## Required Features
1. Core proxy:
- Forward incoming requests to an upstream target.
- Preserve method, query, headers, and body.
- Support streaming responses where possible.

2. Caching:
- In-memory LRU cache with max size and TTL.
- Cache key includes method + URL + selected headers.
- Only cache safe responses (`GET`, success status).
- `stale-while-revalidate` mode:
  - serve stale immediately
  - refresh asynchronously in background

3. Resilience:
- Per-IP rate limiting.
- Upstream timeout and retry policy (idempotent requests only).
- Circuit breaker for repeated upstream failures.
- Health endpoint that reports breaker state and cache stats.

4. Observability:
- Structured logs (JSON lines).
- Metrics endpoint with counters:
  - total requests
  - cache hit/miss
  - upstream errors
  - rate-limited requests

## CLI / Config
- `node proxy.js --upstream http://localhost:4000 --port 3000`
- Optional flags:
  - `--cache-ttl`
  - `--cache-max-entries`
  - `--timeout-ms`
  - `--rate-limit`

## Constraints
- Node.js built-ins only (no Express, no external cache libs).
- Clean separation between proxy logic, cache module, and resilience policies.

## Output Files
- `proxy.js`
- `README_IMPLEMENTATION.md`
- `load-test.js` (basic script to validate hit/miss and limiter behavior)

## Acceptance Criteria
- Repeated identical GET requests produce visible cache hits.
- Circuit breaker opens after repeated failures and recovers after cool-down.
- Rate limiting reliably blocks excess traffic.
- Metrics endpoint reflects real runtime behavior.
