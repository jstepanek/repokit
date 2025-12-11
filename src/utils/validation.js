/**
 * Maximum allowed length for project names
 */
const MAX_PROJECT_NAME_LENGTH = 100;

/**
 * Pattern for valid GitHub repository names
 * Allows alphanumeric characters, hyphens, underscores, and periods
 */
const VALID_NAME_PATTERN = /^[a-zA-Z0-9._-]+$/;

/**
 * Validate a project name for use with GitHub repositories
 * @param {string} name - Project name to validate
 * @returns {string} The validated project name
 * @throws {Error} If the name is invalid
 */
export function validateProjectName(name) {
  if (!name || typeof name !== 'string') {
    throw new Error('Project name is required');
  }

  const trimmedName = name.trim();

  if (trimmedName.length === 0) {
    throw new Error('Project name cannot be empty');
  }

  if (trimmedName.length > MAX_PROJECT_NAME_LENGTH) {
    throw new Error(
      `Project name must be ${MAX_PROJECT_NAME_LENGTH} characters or less`
    );
  }

  if (trimmedName.startsWith('.')) {
    throw new Error('Project name cannot start with a period');
  }

  if (trimmedName.startsWith('-')) {
    throw new Error('Project name cannot start with a hyphen');
  }

  if (!VALID_NAME_PATTERN.test(trimmedName)) {
    throw new Error(
      'Project name can only contain letters, numbers, hyphens, underscores, and periods'
    );
  }

  // Check for path traversal attempts
  if (trimmedName.includes('..')) {
    throw new Error('Project name cannot contain ".."');
  }

  return trimmedName;
}

/**
 * Alias for validateProjectName - validates any GitHub name (repo, org, username)
 * GitHub org names follow the same naming rules as repository names
 * @param {string} name - Name to validate
 * @returns {string} The validated name
 * @throws {Error} If the name is invalid
 */
export const validateGitHubName = validateProjectName;
