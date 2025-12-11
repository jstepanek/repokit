import { execSync } from 'child_process';

/**
 * Execute a shell command and return the output
 * @param {string} command - Command to execute
 * @param {Object} options - execSync options
 * @returns {string} Command output
 */
function exec(command, options = {}) {
  return execSync(command, { encoding: 'utf-8', ...options }).trim();
}

/**
 * Check if GitHub CLI is installed
 * @returns {boolean}
 */
export function isGhInstalled() {
  try {
    exec('which gh');
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if user is authenticated with GitHub CLI
 * @returns {boolean}
 */
export function isGhAuthenticated() {
  try {
    exec('gh auth status');
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the authenticated GitHub username
 * @returns {string} GitHub username
 */
export function getGhUsername() {
  return exec('gh api user --jq .login');
}

/**
 * Create a GitHub repository
 * @param {Object} options - Repository options
 * @param {string} options.name - Repository name
 * @param {boolean} options.isPublic - Whether the repo should be public
 * @param {string|null} options.org - Organization name (null for personal account)
 * @returns {string} Repository URL
 */
export function createRepo({ name, isPublic = false, org = null }) {
  const visibility = isPublic ? '--public' : '--private';
  const ownerFlag = org ? `--org ${org}` : '';

  // Create the repo and capture the URL
  const result = exec(
    `gh repo create ${name} ${visibility} ${ownerFlag} --source=. --remote=origin --push`
  );

  return result;
}

/**
 * Create a GitHub repository without pushing (for manual remote setup)
 * @param {Object} options - Repository options
 * @param {string} options.name - Repository name
 * @param {boolean} options.isPublic - Whether the repo should be public
 * @param {string|null} options.org - Organization name (null for personal account)
 * @returns {string} Repository clone URL
 */
export function createRepoOnly({ name, isPublic = false, org = null }) {
  const visibility = isPublic ? '--public' : '--private';

  let fullName;
  if (org) {
    fullName = `${org}/${name}`;
  } else {
    const username = getGhUsername();
    fullName = `${username}/${name}`;
  }

  // Create the repo without source
  exec(`gh repo create ${fullName} ${visibility}`);

  // Return the SSH URL
  return `git@github.com:${fullName}.git`;
}

/**
 * Check if a repository already exists
 * @param {string} name - Repository name
 * @param {string|null} org - Organization name (null for personal account)
 * @returns {boolean}
 */
export function repoExists(name, org = null) {
  try {
    const fullName = org ? `${org}/${name}` : name;
    exec(`gh repo view ${fullName}`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get available organizations for the authenticated user
 * @returns {string[]} List of organization names
 */
export function getOrganizations() {
  try {
    const result = exec('gh api user/orgs --jq ".[].login"');
    return result.split('\n').filter(Boolean);
  } catch {
    return [];
  }
}
