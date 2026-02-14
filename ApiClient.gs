/**
 * ApiClient - handles FundraiseUp API communication
 * Encapsulates URL building, pagination, and request handling
 */
class ApiClient {
  /**
   * @param {string} apiKey - FundraiseUp API key
   * @param {boolean} livemode - true for live mode, false for test mode
   */
  constructor(apiKey, livemode = true) {
    if (!apiKey) {
      throw new Error("No API key defined.");
    }
    this.apiKey = apiKey;
    this.livemode = livemode;
    this.headers = { Authorization: 'Bearer ' + apiKey };
    this.rateLimiter = new RateLimiter();
  }

  /**
   * Build API URL with parameters
   * @param {Object} options - URL parameters
   * @returns {string} Complete API URL
   */
  buildUrl(options = {}) {
    let url = API_DONATIONS_ENDPOINT + '?limit=' + API_LIMIT_PER_REQUEST;
    url += '&livemode=' + this.livemode;

    if (options.startingAfter) {
      url += '&starting_after=' + options.startingAfter;
    }
    if (options.endingBefore) {
      url += '&ending_before=' + options.endingBefore;
    }

    return url;
  }

  /**
   * Fetch a single page of donations
   * @param {string} url - API URL to fetch
   * @returns {Object|null} Parsed response or null on failure
   */
  fetchPage(url) {
    this.rateLimiter.throttle();
    console.log('ApiClient.fetchPage() - URL:', url);
    return requestURL(url, { headers: this.headers });
  }

  /**
   * Fetch all pages of donations with pagination
   * @param {Object} options - Pagination options
   * @returns {Object} Result with data array and has_more flag
   */
  fetchAllPages(options = {}) {
    const {
      startingAfter = null,
      endingBefore = null,
      maxRequests = DEFAULT_MAX_REQUEST_COUNT,
      existingData = []
    } = options;

    const result = {
      data: [...existingData],
      has_more: true
    };

    let url = this.buildUrl({ startingAfter, endingBefore });
    const executionStart = Date.now();

    while (result.has_more) {
      // Check execution time limit
      if (Date.now() - executionStart > MAX_EXECUTION_TIME_PAID) {
        console.log('ApiClient.fetchAllPages() - Max execution time exceeded after ' + this.rateLimiter.getRequestCount() + ' requests');
        this._scheduleRetry();
        break;
      }

      const response = this.fetchPage(url);

      if (!response) {
        console.log('ApiClient.fetchAllPages() - Request failed, scheduling retry');
        this._scheduleRetryWithParams(startingAfter, endingBefore);
        break;
      }

      result.data.push(...response.data);
      result.has_more = response.has_more;

      if (!response.has_more || this.rateLimiter.getRequestCount() >= maxRequests) {
        break;
      }

      // Build next page URL
      url = this._getNextPageUrl(response, endingBefore);

      // Delay between requests
      Utilities.sleep(PAGINATION_DELAY_MS);
    }

    console.log('ApiClient.fetchAllPages() - Found ' + result.data.length + ' donations');
    return result;
  }

  /**
   * Get URL for next page based on pagination direction
   * @private
   */
  _getNextPageUrl(response, endingBefore) {
    if (endingBefore) {
      return this.buildUrl({ endingBefore: response.data[0].id });
    } else {
      return this.buildUrl({ startingAfter: response.data[response.data.length - 1].id });
    }
  }

  /**
   * Schedule async retry after execution timeout
   * @private
   */
  _scheduleRetry() {
    Async.apply('fetchDataApi', ['', false], { after: MS_PER_SECOND });
  }

  /**
   * Schedule async retry after request failure
   * @private
   */
  _scheduleRetryWithParams(startingAfter, endingBefore) {
    const retryRequest = {};
    if (startingAfter) retryRequest.starting_after = startingAfter;
    if (endingBefore) retryRequest.ending_before = endingBefore;
    Async.apply('fetchDataApi', [retryRequest, false, true], { after: FETCH_RETRY_DELAY_MS });
  }
}

