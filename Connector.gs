// Initialize the Community Connector using the DataStudioApp service
const communityConnector = DataStudioApp.createCommunityConnector();

// Schema is defined in Schema.gs - use getSchemaDefinition() to get a copy
let schema = getSchemaDefinition();

// Cache for schema with custom fields (per API key)
let schemaCache = {};

// Return the defined schema to Data Studio
function getSchema(request) {
  Logger.log('Run getSchema()');

  // Create cache key based on API key and livemode
  const api_key = request?.api_key || request?.configParams?.api_key || '';
  const livemode = request?.livemode !== undefined ? request.livemode : true;
  const cacheKey = api_key + '_' + livemode;

  // Check if we have cached schema for this API key
  if (schemaCache[cacheKey]) {
    Logger.log('getSchema() - Returning cached schema');
    return { schema: schemaCache[cacheKey] };
  }

  // Reset schema to base definition
  schema = getSchemaDefinition();

  request.max_request_count = 1;
  const data = fetchDataApi(request, true, false);
  const customFieldsSchema = buildCustomFieldsSchema(data);
  schema.push(...customFieldsSchema);

  // Cache the schema
  schemaCache[cacheKey] = schema.slice();

  return { schema: schema };
}

// Define the configuration settings for the connector, including user input fields
function getConfig(request) {
  let config = communityConnector.getConfig();

  config.newInfo()
      .setId('instructions')
      .setText('To use the Fundraise Up API, you need an API key. Go to Dashboard > Settings > API keys and click Create API key. You can create multiple keys for the same account.');

  config.newTextInput()
      .setId('api_key')
      .setName('API Key')
      .setHelpText('. . .')
      .setPlaceholder('')
      .setAllowOverride(true);

  config.newCheckbox()
      .setId('livemode')
      .setName('Live Mode')
      .setHelpText('Required for API keys created after 30th January 2026. Check for live mode, uncheck for test mode.')
      .setAllowOverride(true);

  /**
   * FundraiseUp REST Api does not support timestamp queries.
   * Also, to collect all possible custom fields keys for the schema,
   * we collect the maximum possible amount of rows in one api request.
   */
  config.setDateRangeRequired(false);

  return config.build();
}

/**
 * Extract API credentials from request object
 * @param {Object} request - Request object from Looker Studio or manual call
 * @returns {Object} { apiKey, livemode }
 */
function getApiCredentials(request) {
  const scriptProperties = PropertiesService.getScriptProperties();
  let apiKey;
  let livemode = true;

  // Get API key
  if (request && 'api_key' in request && request.api_key) {
    apiKey = request.api_key;
  } else if (request && 'configParams' in request) {
    apiKey = request.configParams.api_key;
    scriptProperties.setProperty('api_key', apiKey);
  } else {
    apiKey = scriptProperties.getProperty('api_key');
  }

  // Get livemode
  if (request && 'livemode' in request) {
    livemode = request.livemode;
  } else if (request && 'configParams' in request && 'livemode' in request.configParams) {
    livemode = request.configParams.livemode;
  }

  return { apiKey, livemode };
}

/**
 * Try to get data from cache
 * @param {DataCache} cache - Cache instance
 * @param {boolean} skipCache - Whether to skip cache check
 * @returns {Object|null} Cached data or null
 */
function tryGetFromCache(cache, skipCache) {
  if (skipCache) {
    return null;
  }

  const data = getCache(cache);
  if (data !== null && 'has_more' in data && !data.has_more) {
    console.log('tryGetFromCache() - Returning complete data from cache');
    return data;
  }

  return null;
}

/**
 * Execute function with script lock
 * @param {Function} fn - Function to execute
 * @returns {*} Result of function
 */
function withLock(fn) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(LOCK_TIMEOUT_MS);
    console.log('withLock() - Lock acquired');
    return fn();
  } catch (e) {
    Logger.log('withLock() - Could not obtain lock: ' + e);
    throw new Error('Could not obtain lock: ' + e);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Fetch donations data from FundraiseUp API
 * @param {Object} request - Request parameters
 * @param {boolean} skipCache - Skip reading from cache
 * @param {boolean} writeCache - Write results to cache
 * @returns {Object} Data with donations array and has_more flag
 */
function fetchDataApi(request, skipCache = false, writeCache = true) {
  Logger.log('Run fetchDataApi()');

  // Extract credentials
  const { apiKey, livemode } = getApiCredentials(request);

  if (!apiKey) {
    throw new Error("No API key defined.");
  }

  // Setup cache
  const cacheKey = apiKey + '_' + (livemode ? 'live' : 'test');
  const cache = new DataCache(CacheService.getUserCache(), cacheKey);

  // Try cache first
  const cachedData = tryGetFromCache(cache, skipCache);
  if (cachedData) {
    return cachedData;
  }

  // Fetch with lock to prevent concurrent API calls
  return withLock(() => {
    // Check cache again after acquiring lock (another process might have populated it)
    const cachedAfterLock = tryGetFromCache(cache, skipCache);
    if (cachedAfterLock) {
      return cachedAfterLock;
    }

    // Create API client and fetch data
    const client = new ApiClient(apiKey, livemode);

    const options = {
      startingAfter: request?.starting_after,
      endingBefore: request?.ending_before,
      maxRequests: request?.max_request_count || DEFAULT_MAX_REQUEST_COUNT
    };

    const data = client.fetchAllPages(options);

    // Save to cache and schedule refresh
    if (data.data.length && writeCache) {
      setCache(data, cache);
      Async.apply('fetchDataApi', ['', true, true], { after: CACHE_REFRESH_INTERVAL_MS });
    }

    return data;
  });
}

function buildCustomFieldsSchema(data) {
  if ( data === undefined || data.data === undefined || data.data.length === 0 ) {
    return [];
  }

  let customFieldsSchema = [];

  data.data.forEach(function(donation) {
    if( !donation.custom_fields.length ) {
      return;
    }

    donation.custom_fields.forEach(function(custom_field) {
      // Shema field name should be unique
      let field_name = 'custom_fields_'+ custom_field.name;

      // Check for duplicate inside current request
      let duplicate_check = customFieldsSchema.find(({ name }) => name === field_name );

      // Check if schema already has this custom field
      let duplicate_check_schema = schema.find(({ name }) => name === field_name );

      if ( typeof duplicate_check === 'undefined' && typeof duplicate_check_schema === 'undefined' ) {

        // duplicate not found - add custom field to schema
        let dataType;
        switch ( typeof custom_field.value ) {
          case 'number':
            dataType = 'NUMBER';
            break;
          case 'boolean':
            dataType = 'BOOLEAN';
            break;
          default:
            dataType = 'STRING';
        }

        customFieldsSchema.push( {name: field_name, label: 'Custom Field ' + convertToTitleCase(custom_field.name), description: '', group: 'Custom Fields', dataType: dataType, semantics: {isReaggregatable: true}} );

      }
    });
  });

  return customFieldsSchema;
}

function buildRows(request, data, type = '') {
  Logger.log('Run buildRows()');

  let rows = [];
  let row_number = request.last_row + 1 || 2;

  data.data.forEach(function(donation) {
    let row = [];
    let underscoredObj = underscoreNotate(donation); // read nested objects as first level

    request.fields.forEach(function(field) {

        if( type === 'spreadsheet' && field.hasOwnProperty('spreadsheet_formula') && field.spreadsheet_formula ) {

          // parse formula then add as formula string
          row.push( parseFormula(field, request, row_number) );

        } else if ( field.name in donation ) {

          // add from original response object
          row.push(validateValue(field, donation[field.name], type));

        } else if ( field.name in underscoredObj ) {

          // looks like it's nested object key
          // add from underscored object
          row.push(validateValue(field, underscoredObj[field.name], type));

        } else if ( donation.custom_fields.length && donation.custom_fields.find(({ name }) => name === field.name.split("custom_fields_").pop()) ) {

          // Match found in custom fields
          let donation_custom_field = donation.custom_fields.find(({ name }) => name === field.name.split("custom_fields_").pop());
          row.push(donation_custom_field.value);

        } else {

          row.push('');

        }

    });

    row_number++;

    if( type === 'spreadsheet' ) {
      rows.push(row);
    } else {
      rows.push({ values: row });
    }

  });

  console.log( 'Total donations:', rows.length );

  return rows;
}

function getData(request) {
  Logger.log('Run getData()');

  let data = fetchDataApi(request);
  let rows = buildRows(request, data);
  let customFieldsSchema = buildCustomFieldsSchema(data);

  schema.push(...customFieldsSchema);

  // Get the fields requested by Looker Studio
  let dataSchema = [];
  request.fields.forEach(function (field) {
      for (const element of schema) {
          if (element.name === field.name) {
              dataSchema.push(element);
              break;
          }
      }
  });

  return {
      schema: dataSchema,
      rows: rows
  };
}

// Specify the authentication type for the connector
function getAuthType() {
    // This connector does not require authentication
    return { type: 'NONE' };
}

// Check if the current user has administrative privileges
function isAdminUser() {
    // For this example, all users are treated as admin users
    return true;
}

function underscoreNotate(obj, target, prefix) {
  target = target || {};
  prefix = prefix || "";

  Object.keys(obj).forEach(function(key) {
    if ( typeof(obj[key]) === "object" && obj[key] !== null ) {
      underscoreNotate(obj[key],target,prefix + key + "_");
    } else {
      return target[prefix + key] = obj[key];
    }
  });

  return target;
}

function getCache(cache) {
  let data = null;
  console.log('Trying to fetch from cache...');
  try {
    const cachedString = cache.get();
    data = JSON.parse(cachedString);
    console.log('Fetched succesfully from cache', data.data.length + ' donations.');
  } catch (e) {
    console.log('Error when fetching from cache:', e);
  }

  return data;
}

function setCache(data, cache) {
  console.log('Setting data to cache...');
  try {
    cache.set(JSON.stringify(data));
  } catch (e) {
    console.log('Error when storing in cache', e);
  }
}

function convertToTitleCase(str) {
  if (!str) {
      return ""
  }

  const exceptions = ['of', 'the', 'and'];
  return str.replace(/[^a-zA-Z0-9-. ]/g, ' ').toLowerCase().split(' ').map((word, i) => {
            return exceptions.includes(word) && i !== 0 ? word : word.charAt(0).toUpperCase().concat(word.substr(1));
        }).join(' ');
}


function fmt(date, format = 'YYYYMMDDhhmmss') {
  const pad2 = (n) => n.toString().padStart(2, '0');

  const map = {
    YYYY: date.getFullYear(),
    MM: pad2(date.getMonth() + 1),
    DD: pad2(date.getDate()),
    hh: pad2(date.getHours()),
    mm: pad2(date.getMinutes()),
    ss: pad2(date.getSeconds()),
  };

  return Object.entries(map).reduce((prev, entry) => prev.replace(...entry), format);
}

/**
 * Validates the row values. Only numbers, boolean, date and strings are allowed
 */
function validateValue(field, value, type) {

  // For spreadsheet save date without formating
  if( ['created_at', 'succeeded_at', 'failed_at', 'refunded_at', 'recurring_plan_ended_at'].includes(field.name) && value !== null ) {
    const date = new Date(value);

    if( type === 'spreadsheet' ) {
      value = date.toISOString();
    } else {
      value = fmt(date);
    }

    return value;
  }

  switch (typeof value) {
    case 'string':
    case 'number':
    case 'boolean':
      return value;
    case 'object':
      if( Object.is(value, null) ) {
        return '';
      } else {
        return JSON.stringify(value);
      }
  }

  return '';
}

function requestURL( url, args ) {
    if ( !url || !args ) {
      return false;
    }

    const maxAttempts = 4;
    let attempts = 0;
    let response;

    while (attempts < maxAttempts) {
        try {
            response = UrlFetchApp.fetch(url, args);
            if (response.getResponseCode() === 200) {
                return JSON.parse(response.getContentText());
            } else {
                Logger.log("Failure, attempt " + (attempts + 1));
            }
        } catch (e) {
            Logger.log("Error on attempt " + (attempts + 1) + ": " + e.message);
        }
        attempts++;
        if (attempts < maxAttempts) {
            const wait_time = 5000 * attempts;
            Logger.log("Waiting " + wait_time + " seconds");
            Utilities.sleep( wait_time ); // make a pause then try again
        }
    }

    return false;
}

function parseFormula( field, request, row_number ) {
  //console.log( field );
  //console.log( request );

  if ( !field.hasOwnProperty('spreadsheet_formula') || !field['spreadsheet_formula'] || !request.hasOwnProperty('fields') || !request['fields'].length ) {
    return '';
  }

  let formula_string = field.spreadsheet_formula;
  const variables_from_formula_string = [];

  // Regular expression to match ${variable_name}
  const regex = /\$\{([^}]+)}/g;
  let match;

  // Loop through all matches and add them to the array
  while ((match = regex.exec(formula_string)) !== null) {
      variables_from_formula_string.push(match[1]);
  }

  for (let i = 0; i < variables_from_formula_string.length; i++) {
      let variable_field = request.fields.find(obj => obj.name === variables_from_formula_string[i]);

      if (variable_field.hasOwnProperty('letter') && variable_field['letter']) {
          let variable_value = variable_field['letter'] + row_number;

          // Replace the variable key in the formula_string with the variable_value
          formula_string = formula_string.replace(`\${${variables_from_formula_string[i]}}`, variable_value);
      }
  }

  return formula_string;
}
