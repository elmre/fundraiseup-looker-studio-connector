/**
 * RateLimiter - manages API request rate limiting
 *
 * FundraiseUp API uses concurrency-based rate limiting (max 3 parallel requests),
 * not time-based limits. Since this script is single-threaded, we don't need
 * complex rate limiting - just polite delays between requests.
 *
 * @see https://api.fundraiseup.com/v1/docs/#/#rate-limits
 */
class RateLimiter {
  constructor(delayMs = PAGINATION_DELAY_MS) {
    this.delayMs = delayMs;
    this.requestCount = 0;
    this.lastRequestTime = 0;
  }

  /**
   * Call before each API request to add polite delay
   * This prevents overwhelming the server even though there's no strict rate limit
   */
  throttle() {
    this.requestCount++;

    // Skip delay for first request
    if (this.requestCount === 1) {
      this.lastRequestTime = Date.now();
      return;
    }

    // Calculate time since last request
    const elapsed = Date.now() - this.lastRequestTime;
    const sleepTime = this.delayMs - elapsed;

    // Sleep if needed to maintain polite delay
    if (sleepTime > 0) {
      Utilities.sleep(sleepTime);
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Get current request count
   * @returns {number}
   */
  getRequestCount() {
    return this.requestCount;
  }
}

