import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const SSH_CONFIG_PATH = join(homedir(), '.ssh', 'config');

/**
 * Parse SSH config file and extract GitHub host configurations
 * @returns {Array<{name: string, host: string, identityFile: string}>}
 */
export function getGitHubSSHKeys() {
  if (!existsSync(SSH_CONFIG_PATH)) {
    return [];
  }

  const content = readFileSync(SSH_CONFIG_PATH, 'utf-8');
  const lines = content.split('\n');

  const hosts = [];
  let currentHost = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Match "Host" lines
    const hostMatch = trimmed.match(/^Host\s+(.+)$/i);
    if (hostMatch) {
      // Save previous host if it was GitHub-related
      if (currentHost && currentHost.isGitHub) {
        hosts.push(currentHost);
      }

      const hostValue = hostMatch[1];
      currentHost = {
        host: hostValue,
        name: hostValue,
        identityFile: null,
        isGitHub: hostValue.includes('github.com'),
      };
      continue;
    }

    if (!currentHost) continue;

    // Match "HostName" lines
    const hostNameMatch = trimmed.match(/^HostName\s+(.+)$/i);
    if (hostNameMatch) {
      if (hostNameMatch[1] === 'github.com') {
        currentHost.isGitHub = true;
      }
      continue;
    }

    // Match "IdentityFile" lines
    const identityMatch = trimmed.match(/^IdentityFile\s+(.+)$/i);
    if (identityMatch) {
      currentHost.identityFile = identityMatch[1].replace('~', homedir());
      continue;
    }
  }

  // Don't forget the last host
  if (currentHost && currentHost.isGitHub) {
    hosts.push(currentHost);
  }

  // Extract friendly names from hosts
  return hosts.map(h => {
    let friendlyName = h.host;
    // Extract account name from host alias like "github.com-bluestemlabs"
    if (h.host.startsWith('github.com-')) {
      friendlyName = h.host.replace('github.com-', '');
    } else if (h.host === 'github.com') {
      friendlyName = 'default';
    }

    return {
      name: friendlyName,
      host: h.host,
      identityFile: h.identityFile,
    };
  });
}

/**
 * Get the SSH command for a specific identity file
 * @param {string} identityFile - Path to the identity file
 * @returns {string} SSH command with identity file
 */
export function getSSHCommand(identityFile) {
  return `ssh -i ${identityFile}`;
}
