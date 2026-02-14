/**
 * Constants and configuration values for FundraiseUp Looker Studio Connector
 * Centralized location for all magic numbers, URLs, and limits
 */

// =============================================================================
// API Configuration
// =============================================================================

/** FundraiseUp API base URL */
const API_BASE_URL = 'https://api.fundraiseup.com/v1';

/** FundraiseUp API donations endpoint */
const API_DONATIONS_ENDPOINT = API_BASE_URL + '/donations';

/** Maximum number of records per API request (API limit) */
const API_LIMIT_PER_REQUEST = 100;

// =============================================================================
// Rate Limiting
// =============================================================================

/**
 * FundraiseUp API uses concurrency-based rate limiting:
 * - Maximum 3 parallel requests per account
 * - No per-second or per-minute limits
 *
 * Since this script is single-threaded (sequential requests),
 * we don't need complex rate limiting. We add polite delays
 * to be a good API citizen and avoid overwhelming the server.
 *
 * @see https://api.fundraiseup.com/v1/docs/#/#rate-limits
 */

/** Milliseconds in one second */
const MS_PER_SECOND = 1000;

/**
 * Delay between paginated requests (ms)
 * This is a "polite" delay to avoid overwhelming the API.
 * Since there's no strict rate limit, 500ms is sufficient.
 */
const PAGINATION_DELAY_MS = 500;

/**
 * Maximum API requests per single script execution.
 * Each request fetches up to 100 donations (API_LIMIT_PER_REQUEST).
 *
 * With PAGINATION_DELAY_MS = 500ms:
 * - 100 requests = ~50 seconds API time + processing = ~2-3 minutes total
 * - 200 requests = ~100 seconds API time + processing = ~4-5 minutes total
 *
 * Google Apps Script limits:
 * - Free account: 6 minutes max execution time - 200 requests × 500 ms delay = ~100 seconds per one API config + time to update Spreadsheet (~20k rows per run)
 * - Paid account: 30 minutes max execution time - MAX_REQUESTS_PER_RUN = 500 ~ ~50,000 donations per run
 *
 * Set conservatively to avoid timeout. Script will continue in next run.
 */
const MAX_REQUESTS_PER_RUN = 500; // ~50,000 donations per run

// =============================================================================
// Execution Limits
// =============================================================================

/** Maximum execution time for paid Google Cloud account (29.5 minutes in ms) */
const MAX_EXECUTION_TIME_PAID = 1770000;

/** Default maximum number of API requests per execution */
const DEFAULT_MAX_REQUEST_COUNT = 300;

/** Lock wait timeout (ms) */
const LOCK_TIMEOUT_MS = 30000;

// =============================================================================
// Cache Configuration
// =============================================================================

/** Cache refresh interval (5 hours in ms - less than 6 hours to ensure refresh before expiry) */
const CACHE_REFRESH_INTERVAL_MS = 5 * 60 * 60 * 1000;

// =============================================================================
// Retry Configuration
// =============================================================================

/** Delay before retrying failed fetchDataApi (5 minutes in ms) */
const FETCH_RETRY_DELAY_MS = 5 * 60 * 1000;

// =============================================================================
// Spreadsheet Configuration
// =============================================================================

/** Delay before continuing updateSpreadsheet when data fetching is not finished (ms) */
const SPREADSHEET_CONTINUE_DELAY_MS = 120000;

/** Default sheet name if not specified in config */
const DEFAULT_SHEET_NAME = 'Fundraise Up';
