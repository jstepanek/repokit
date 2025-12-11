import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

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
 * Check if a directory is a git repository
 * @param {string} dir - Directory path
 * @returns {boolean}
 */
export function isGitRepo(dir) {
  return existsSync(join(dir, '.git'));
}

/**
 * Initialize a git repository
 * @param {string} dir - Directory path
 */
export function gitInit(dir) {
  exec('git init', { cwd: dir });
}

/**
 * Stage all files in the repository
 * @param {string} dir - Directory path
 */
export function gitAddAll(dir) {
  exec('git add -A', { cwd: dir });
}

/**
 * Create a commit with the given message
 * @param {string} dir - Directory path
 * @param {string} message - Commit message
 */
export function gitCommit(dir, message) {
  exec(`git commit -m "${message}"`, { cwd: dir });
}

/**
 * Add a remote origin
 * @param {string} dir - Directory path
 * @param {string} url - Remote URL
 */
export function gitAddRemote(dir, url) {
  exec(`git remote add origin ${url}`, { cwd: dir });
}

/**
 * Push to remote with upstream tracking
 * @param {string} dir - Directory path
 * @param {string} branch - Branch name (default: main)
 */
export function gitPush(dir, branch = 'main') {
  exec(`git push -u origin ${branch}`, { cwd: dir });
}

/**
 * Rename the current branch
 * @param {string} dir - Directory path
 * @param {string} newName - New branch name
 */
export function gitRenameBranch(dir, newName) {
  exec(`git branch -M ${newName}`, { cwd: dir });
}

/**
 * Get the current branch name
 * @param {string} dir - Directory path
 * @returns {string} Branch name
 */
export function getCurrentBranch(dir) {
  return exec('git branch --show-current', { cwd: dir });
}

/**
 * Check if there are any commits in the repository
 * @param {string} dir - Directory path
 * @returns {boolean}
 */
export function hasCommits(dir) {
  try {
    exec('git rev-parse HEAD', { cwd: dir });
    return true;
  } catch {
    return false;
  }
}
