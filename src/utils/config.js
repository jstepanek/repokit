import { readFileSync, writeFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const CONFIG_FILE = join(homedir(), '.repokitrc');

/**
 * Default configuration values
 */
const DEFAULT_CONFIG = {
  defaultOrg: null,        // null means personal account, or 'bluestemlabs' etc.
  defaultVisibility: 'private',  // 'private' or 'public'
};

/**
 * Load configuration from ~/.repokitrc
 * @returns {Object} Configuration object with defaults applied
 */
export function loadConfig() {
  if (!existsSync(CONFIG_FILE)) {
    return { ...DEFAULT_CONFIG };
  }

  try {
    const content = readFileSync(CONFIG_FILE, 'utf-8');
    const userConfig = JSON.parse(content);
    return { ...DEFAULT_CONFIG, ...userConfig };
  } catch (error) {
    console.warn(`Warning: Could not parse ${CONFIG_FILE}, using defaults`);
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Save configuration to ~/.repokitrc
 * @param {Object} config - Configuration object to save
 */
export function saveConfig(config) {
  try {
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch (error) {
    throw new Error(`Failed to save config: ${error.message}`);
  }
}

/**
 * Get the config file path for display purposes
 * @returns {string} Path to config file
 */
export function getConfigPath() {
  return CONFIG_FILE;
}

/**
 * Check if a config file exists
 * @returns {boolean}
 */
export function configExists() {
  return existsSync(CONFIG_FILE);
}
