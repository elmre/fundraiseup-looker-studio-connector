/**
 * Environment Configuration using Properties Service
 * @see https://developers.google.com/apps-script/guides/properties
 *
 * Script Properties are the recommended way to store sensitive data like API keys.
 * They are encrypted, not visible in source code, and persist across executions.
 *
 * Setup:
 * 1. Run setupEnv() once to initialize default config structure
 * 2. In Apps Script Editor: Project Settings > Script Properties > Edit
 * 3. Or use setEnv('KEY', 'value') programmatically
 */

/**
 * Get environment variable from Script Properties
 * @param {string} key - Variable name
 * @returns {string|null} Variable value or null
 */
function getEnv(key) {
  return PropertiesService.getScriptProperties().getProperty(key);
}

/**
 * Set environment variable in Script Properties
 * @param {string} key - Variable name
 * @param {string} value - Variable value
 */
function setEnv(key, value) {
  PropertiesService.getScriptProperties().setProperty(key, value);
  Logger.log('setEnv() - Set: ' + key);
}

/**
 * Get environment variable as parsed JSON
 * @param {string} key - Variable name
 * @returns {*} Parsed JSON value or null
 */
function getEnvJson(key) {
  const value = getEnv(key);
  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch (e) {
    Logger.log('getEnvJson() - Error parsing ' + key + ': ' + e.message);
    return null;
  }
}

/**
 * Initialize environment with example configuration
 * Run this once, then update values in Project Settings > Script Properties
 */
function setupEnv() {
  const props = PropertiesService.getScriptProperties();

  // Only set if not already configured
  if (!props.getProperty('SPREADSHEET_CONFIGS')) {
    props.setProperty('SPREADSHEET_CONFIGS', JSON.stringify([
      {
        spreadsheet_id: 'YOUR_SPREADSHEET_ID',
        sheet_name: 'Live',
        api_key: 'YOUR_API_KEY',
        livemode: true // Required for API keys created after 30th January 2026. Set to false for test mode.
      }
    ]));
    Logger.log('setupEnv() - Default config created. Update values in Project Settings > Script Properties');
  }

  showEnv();
}

/**
 * Show all current environment variables (for debugging)
 */
function showEnv() {
  const props = PropertiesService.getScriptProperties().getProperties();
  Logger.log('Current Script Properties:');
  Object.keys(props).forEach(function(key) {
    // Mask sensitive values
    let value = props[key];
    if (key.toLowerCase().indexOf('key') !== -1 || key.toLowerCase().indexOf('secret') !== -1) {
      value = value.substring(0, 4) + '****';
    }
    Logger.log('  ' + key + ' = ' + value);
  });
}

