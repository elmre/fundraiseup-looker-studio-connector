/**
 * Main scheduled task entry point
 */
function runScheduledTask() {
  Logger.log('Run runScheduledTask()');

  // Set to false for production cron execution
  const DEBUG_MODE = false;

  // Start processing from the first config
  processNextConfig(0, DEBUG_MODE);
}

function processNextConfig(configIndex, debugMode) {
  Logger.log('Run processNextConfig() - Index: ' + configIndex + (debugMode ? ' [DEBUG MODE]' : ''));

  const configs = getEnvJson('SPREADSHEET_CONFIGS');

  // Check if config exists and is valid
  if (!configs || !configs.length) {
    Logger.log('processNextConfig() - No configuration found. Running setupEnv()...');
    setupEnv();
    Logger.log('─────────────────────────────────────────────────────────────');
    Logger.log('⚠️  ACTION REQUIRED: Update Script Properties with your values');
    Logger.log('   1. Go to Project Settings (⚙️) > Script Properties');
    Logger.log('   2. Edit SPREADSHEET_CONFIGS with your spreadsheet_id and api_key');
    Logger.log('   3. Run runScheduledTask() again');
    Logger.log('─────────────────────────────────────────────────────────────');
    return;
  }

  // Check if config has placeholder values
  const firstConfig = configs[0];
  if (firstConfig.spreadsheet_id === 'YOUR_SPREADSHEET_ID' || firstConfig.api_key === 'YOUR_API_KEY') {
    Logger.log('─────────────────────────────────────────────────────────────');
    Logger.log('⚠️  ACTION REQUIRED: Script Properties contain placeholder values');
    Logger.log('   1. Go to Project Settings (⚙️) > Script Properties');
    Logger.log('   2. Edit SPREADSHEET_CONFIGS with your real spreadsheet_id and api_key');
    Logger.log('   3. Run runScheduledTask() again');
    Logger.log('─────────────────────────────────────────────────────────────');
    return;
  }

  // Check if we've processed all configs
  if (configIndex >= configs.length) {
    Logger.log('processNextConfig() - All configs processed (' + configs.length + ' total)');
    return;
  }

  const currentConfig = configs[configIndex];
  Logger.log('processNextConfig() - Processing config ' + (configIndex + 1) + '/' + configs.length +
    ' (sheet: ' + (currentConfig.sheet_name || 'default') + ')');

  // Process current config
  try {
    updateSpreadsheet(currentConfig);
  } catch (e) {
    Logger.log('processNextConfig() - Error processing config ' + configIndex + ': ' + e.message);
  }

  // Schedule next config if there are more
  if (configIndex + 1 < configs.length) {
    if (debugMode) {
      // Debug mode: process immediately without delay
      Logger.log('processNextConfig() - [DEBUG] Processing next config immediately...');
      processNextConfig(configIndex + 1, debugMode);
    } else {
      // Production mode: schedule async with delay
      const delayMs = 5000; // 5 seconds
      Logger.log('processNextConfig() - Scheduling next config in ' + (delayMs / 1000) + ' seconds');
      Async.apply('processNextConfig', [configIndex + 1, false], { after: delayMs });
    }
  } else {
    Logger.log('processNextConfig() - All configs have been processed');
  }
}

/**
 * Check if schema migration is needed and perform it
 * Optimized for large datasets - uses in-place migration to avoid cell limits
 * Preserves custom fields that were dynamically added
 * @param {Sheet} sheet - Google Sheet object
 * @param {Array} newHeaders - New headers from schema
 * @returns {boolean} true if migration was performed
 */
function migrateSchemaIfNeeded(sheet, newHeaders) {
  const lastColumn = sheet.getLastColumn();
  const lastRow = sheet.getLastRow();

  // If sheet is empty, no migration needed
  if (lastColumn === 0 || lastRow === 0) {
    Logger.log('migrateSchemaIfNeeded() - Sheet is empty, no migration needed');
    return false;
  }

  // Get current headers
  const currentHeaders = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];

  // Find custom fields in current headers (columns that start with "Custom Field")
  const existingCustomFields = currentHeaders.filter(h => h && h.toString().startsWith('Custom Field'));

  // Merge: new schema headers + existing custom fields not already in new headers
  const customFieldsToPreserve = existingCustomFields.filter(cf => !newHeaders.includes(cf));
  const finalHeaders = [...newHeaders, ...customFieldsToPreserve];

  // Check if headers match exactly (same order and same columns)
  const headersMatch = currentHeaders.length === finalHeaders.length &&
    currentHeaders.every((header, index) => header === finalHeaders[index]);

  if (headersMatch) {
    Logger.log('migrateSchemaIfNeeded() - Headers match, no migration needed');
    return false;
  }

  Logger.log('migrateSchemaIfNeeded() - Schema change detected, starting migration...');
  Logger.log('migrateSchemaIfNeeded() - Current columns: ' + currentHeaders.length + ', New columns: ' + finalHeaders.length);
  Logger.log('migrateSchemaIfNeeded() - Total rows to migrate: ' + (lastRow - 1));

  if (customFieldsToPreserve.length > 0) {
    Logger.log('migrateSchemaIfNeeded() - Preserving custom fields: ' + customFieldsToPreserve.join(', '));
  }

  // Build a map: label -> old column index (0-based)
  const oldHeaderMap = {};
  currentHeaders.forEach((header, index) => {
    if (header) {
      oldHeaderMap[header] = index;
    }
  });

  // Build column mapping array for faster processing
  // columnMapping[newIndex] = oldIndex or -1 if new column
  const columnMapping = finalHeaders.map(newHeader => {
    const oldIndex = oldHeaderMap[newHeader];
    return oldIndex !== undefined ? oldIndex : -1;
  });

  // If only header row exists, just update headers
  if (lastRow === 1) {
    // Clear extra columns if new schema has fewer columns
    if (finalHeaders.length < currentHeaders.length) {
      sheet.getRange(1, finalHeaders.length + 1, 1, currentHeaders.length - finalHeaders.length).clear();
    }
    sheet.getRange(1, 1, 1, finalHeaders.length).setValues([finalHeaders]).setFontWeight("bold").setWrap(true);
    Logger.log('migrateSchemaIfNeeded() - Only headers existed, updated to new schema');
    return true;
  }

  // For large datasets, use in-place batch processing (no temp sheet to avoid cell limit)
  const totalDataRows = lastRow - 1;

  /**
   * Batch size for migration processing.
   * Larger batches = faster migration (fewer API calls to Sheets)
   * but more memory usage and risk of timeout on single batch.
   *
   * Benchmarks (40000 rows, 130 columns):
   * - 500 rows/batch  = ~11 min (too slow)
   * - 2000 rows/batch = ~3-4 min (good balance)
   * - 5000 rows/batch = ~2 min (may cause memory issues)
   */
  const BATCH_SIZE = 2000;

  let processedRows = 0;

  // Process data in batches - read, transform, write back in place
  while (processedRows < totalDataRows) {
    const startRow = processedRows + 2; // +2 because row 1 is header, and we're 1-indexed
    const rowsToProcess = Math.min(BATCH_SIZE, totalDataRows - processedRows);

    // Read batch from original sheet (all current columns)
    const batchData = sheet.getRange(startRow, 1, rowsToProcess, lastColumn).getValues();

    // Transform batch to new column order
    const transformedBatch = transformDataBatch(batchData, columnMapping);

    // Clear extra columns in this batch if we have fewer columns now
    if (finalHeaders.length < lastColumn) {
      sheet.getRange(startRow, finalHeaders.length + 1, rowsToProcess, lastColumn - finalHeaders.length).clear();
    }

    // Write transformed data back to the same rows
    sheet.getRange(startRow, 1, rowsToProcess, finalHeaders.length).setValues(transformedBatch);

    processedRows += rowsToProcess;

    // Log progress for large migrations (every batch)
    Logger.log('migrateSchemaIfNeeded() - Progress: ' + processedRows + '/' + totalDataRows + ' rows');

    // Flush to commit changes and free memory
    SpreadsheetApp.flush();
  }

  // Update headers
  if (finalHeaders.length < currentHeaders.length) {
    // Clear extra header columns
    sheet.getRange(1, finalHeaders.length + 1, 1, currentHeaders.length - finalHeaders.length).clear();
  }
  sheet.getRange(1, 1, 1, finalHeaders.length).setValues([finalHeaders]).setFontWeight("bold").setWrap(true);
  sheet.setFrozenRows(1);

  // Log migration summary
  const addedColumns = finalHeaders.filter(h => oldHeaderMap[h] === undefined);
  const removedColumns = currentHeaders.filter(h => h && !finalHeaders.includes(h));

  if (addedColumns.length > 0) {
    Logger.log('migrateSchemaIfNeeded() - Added columns: ' + addedColumns.join(', '));
  }
  if (removedColumns.length > 0) {
    Logger.log('migrateSchemaIfNeeded() - Removed columns: ' + removedColumns.join(', '));
  }

  Logger.log('migrateSchemaIfNeeded() - Migration completed. Rows migrated: ' + totalDataRows);

  return true;
}

/**
 * Transform a batch of data rows to new column order
 * @param {Array} batchData - 2D array of row data
 * @param {Array} columnMapping - Array where columnMapping[newIndex] = oldIndex or -1
 * @returns {Array} Transformed 2D array
 */
function transformDataBatch(batchData, columnMapping) {
  return batchData.map(row => {
    return columnMapping.map(oldIndex => {
      if (oldIndex === -1) {
        return ''; // New column
      }
      return row[oldIndex];
    });
  });
}

function updateSpreadsheet(config, request) {
  Logger.log('Run updateSpreadsheet()');

  const spreadsheetId = config?.spreadsheet_id;
  const ss = SpreadsheetApp.openById(spreadsheetId);
  const api_key = config?.api_key || '';
  const livemode = config?.livemode !== undefined ? config.livemode : true; // Default to true (live mode)

  // select the sheet we want to update, or create it if it doesn't exist yet
  let sheet;
  const sheetName = config?.sheet_name || DEFAULT_SHEET_NAME;

  if ( ss.getSheetByName(sheetName) === null ) {
      sheet = ss.insertSheet(sheetName);
  } else {
      sheet = ss.getSheetByName(sheetName);
  }

  Logger.log('updateSpreadsheet() - Sheet name "'+ sheetName + '"');

  //define field schema, which will be added to the row headers
  let headers = [];

  request = request || {};

  // In case we need to use another API key
  if (api_key) {
      request['api_key'] = api_key;
  }

  // Set livemode parameter (required for API keys created after 30th January 2026)
  request['livemode'] = livemode;

  const schema = getSchema({'api_key': api_key, 'livemode': livemode});
  request['fields'] = request['fields'] || [];

  // add every field label to the headers array
  for ( let i = 0; i < schema.schema.length; i++ ) {
      headers.push(schema.schema[i].label);

      // request required data for buildRow() function
      request['fields'].push({
          'col_number': i + 1,
          'name': schema.schema[i].name,
          'letter': columnToLetter(i + 1),
          'spreadsheet_formula': schema.schema[i].spreadsheet_formula || '',
      });
  }

  // to be safe - remove duplicates from headers array
  headers = headers.filter(function(item, pos){
      return headers.indexOf(item) === pos;
  });

  if ( !headers.length ) {
      console.log('updateSpreadsheet() - Error: headers row not defined');
      return;
  }

  // Check and perform schema migration if needed
  migrateSchemaIfNeeded(sheet, headers);

  // add header row into spreadsheet (in case migration didn't happen or sheet was empty)
  const headerRow = sheet.getRange(1,1,1,headers.length);
  headerRow.setValues([headers]).setFontWeight("bold").setWrap(true);
  sheet.setFrozenRows(1);

  // Find Donation ID column index
  const donationIdIndex = headers.indexOf("Donation ID") + 1;

  if (donationIdIndex === 0) {
      console.log('updateSpreadsheet() - Error: "Donation ID" header not found');
      return false;
  }

  let last_row = sheet.getLastRow();
  const isInitialFill = last_row < 2; // No data rows yet

  if (isInitialFill) {
      console.log('updateSpreadsheet() - Initial fill mode: fetching all historical donations');
  }

  request.last_row = last_row;

  // Determine fetch direction based on mode
  if (last_row > 1) {
      const donationIdColumn = sheet.getRange(2, donationIdIndex, last_row - 1, 1).getValues();

      // Find first (oldest) and last (newest) donation IDs
      let oldestDonationId = null;
      let newestDonationId = null;

      for (let i = 0; i < donationIdColumn.length; i++) {
          if (donationIdColumn[i][0]) {
              oldestDonationId = donationIdColumn[i][0];
              break;
          }
      }

      for (let i = donationIdColumn.length - 1; i >= 0; i--) {
          if (donationIdColumn[i][0]) {
              newestDonationId = donationIdColumn[i][0];
              break;
          }
      }

      console.log('updateSpreadsheet() - Oldest Donation ID: ' + oldestDonationId);
      console.log('updateSpreadsheet() - Newest Donation ID: ' + newestDonationId);

      // Check if we're in "continue historical fill" mode (passed from previous run)
      if (request.continue_historical && oldestDonationId) {
          // Continue fetching older donations
          console.log('updateSpreadsheet() - Continuing historical fill, fetching donations before: ' + oldestDonationId);
          request['starting_after'] = oldestDonationId;
          request['fetch_direction'] = 'older';
      } else if (newestDonationId) {
          // Normal mode: fetch new donations
          console.log('updateSpreadsheet() - Normal update mode, fetching donations after: ' + newestDonationId);
          request['ending_before'] = newestDonationId;
          request['fetch_direction'] = 'newer';
      }
  }

  // Limit requests per run to avoid timeout (uses global constant from _Constants.gs)
  request.max_request_count = request.max_request_count || MAX_REQUESTS_PER_RUN;

  const data = fetchDataApi(request, true, false);

  if ( data.data === undefined || data.data.length === 0 ) {
    console.log( 'updateSpreadsheet() - No new data received' );

    // If we were doing initial fill and there's more to fetch, schedule continuation
    if (request.continue_historical && data.has_more) {
      console.log('updateSpreadsheet() - Historical fill incomplete, scheduling continuation...');
      const nextRequest = {
        continue_historical: true,
        max_request_count: MAX_REQUESTS_PER_RUN
      };
      Async.apply('updateSpreadsheet', [config, nextRequest], { after: SPREADSHEET_CONTINUE_DELAY_MS });
    }
    return false;
  }

  console.log('updateSpreadsheet() - Received ' + data.data.length + ' donations, has_more: ' + data.has_more);

  // API returns records from newest to oldest
  // For chronological order in spreadsheet (oldest at top, newest at bottom):
  // - When fetching newer donations (ending_before): reverse and append at end
  // - When fetching older donations (starting_after): reverse and prepend at beginning

  let rows;
  let insertRow;

  // Always reverse to get chronological order (oldest first)
  data['data'] = data.data.slice().reverse();

  if (request.fetch_direction === 'older') {
    // Fetching older donations - insert at beginning (row 2, after header)
    rows = buildRows(request, data, 'spreadsheet');
    insertRow = 2;

    // Insert empty rows at the top (after header) to make space
    if (rows.length > 0) {
      sheet.insertRowsAfter(1, rows.length);
    }

    console.log('updateSpreadsheet() - Inserting ' + rows.length + ' older donations at row 2');
  } else {
    // Fetching newer donations or initial fill - append at end
    rows = buildRows(request, data, 'spreadsheet');
    insertRow = sheet.getLastRow() + 1;

    console.log('updateSpreadsheet() - Appending ' + rows.length + ' newer donations at row ' + insertRow);
  }

  // Write data
  if (rows.length) {
    // Update last_row for row formulas if inserting at top
    if (request.fetch_direction === 'older') {
      // Recalculate row numbers in request.fields for formulas
      for (let i = 0; i < request.fields.length; i++) {
        request.fields[i].col_number = i + 1;
      }
      request.last_row = 1; // Will insert starting at row 2
      rows = buildRows(request, data, 'spreadsheet');
    }

    sheet.getRange(insertRow, 1, rows.length, rows[0].length).setValues(rows);
    console.log('updateSpreadsheet() - Added ' + rows.length + ' rows at position ' + insertRow);
  }

  // Schedule continuation if there's more data
  if (data.has_more) {
    console.log('updateSpreadsheet() - More data available, scheduling continuation...');
    // After initial fill or while continuing historical fill, keep fetching older records
    const shouldContinueHistorical = request.fetch_direction === 'older' || isInitialFill || request.continue_historical;
    const nextRequest = {
      continue_historical: shouldContinueHistorical,
      max_request_count: MAX_REQUESTS_PER_RUN
    };
    Async.apply('updateSpreadsheet', [config, nextRequest], { after: SPREADSHEET_CONTINUE_DELAY_MS });
  } else {
    // If we just finished initial/historical fill, now fetch new donations
    if (request.fetch_direction === 'older' || request.continue_historical) {
      console.log('updateSpreadsheet() - Historical fill complete! Now checking for new donations...');
      Async.apply('updateSpreadsheet', [config, {}], { after: SPREADSHEET_CONTINUE_DELAY_MS });
    } else {
      console.log('updateSpreadsheet() - Spreadsheet update complete.');
    }
  }

  return true;
}

function columnToLetter(column) {
    let temp, letter = '';
    while (column > 0) {
        temp = (column - 1) % 26;
        letter = String.fromCharCode(temp + 65) + letter;
        column = (column - temp - 1) / 26;
    }
    return letter;
}
