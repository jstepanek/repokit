import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { select } from '@inquirer/prompts';
import { loadConfig } from '../utils/config.js';
import {
  isGitRepo,
  gitInit,
  gitAddAll,
  gitCommit,
  gitRenameBranch,
  gitAddRemote,
  gitPush,
} from '../utils/git.js';
import {
  isGhInstalled,
  isGhAuthenticated,
  createRepoOnly,
  repoExists,
  getGhUsername,
} from '../utils/github.js';
import { validateProjectName, validateGitHubName } from '../utils/validation.js';
import { getGitHubSSHKeys } from '../utils/ssh.js';

/**
 * Create a README.md file with the project name as header
 * @param {string} dir - Directory path
 * @param {string} projectName - Project name
 */
function createReadme(dir, projectName) {
  const content = `# ${projectName}\n`;
  writeFileSync(join(dir, 'README.md'), content);
}

/**
 * Execute the init command
 * @param {string} projectName - Name of the project
 * @param {Object} options - Command options
 */
export async function initCommand(projectName, options) {
  const config = loadConfig();

  // Validate project name early to prevent command injection
  let validatedName;
  try {
    validatedName = validateProjectName(projectName);
  } catch (error) {
    console.error(chalk.red(`\nError: ${error.message}`));
    process.exit(1);
  }
  projectName = validatedName;

  // Determine visibility (CLI flag > config default)
  let isPublic = false;
  if (options.public) {
    isPublic = true;
  } else if (options.private) {
    isPublic = false;
  } else {
    isPublic = config.defaultVisibility === 'public';
  }

  // Determine organization (CLI flag > config default)
  const org = options.org ?? config.defaultOrg;

  // Validate organization name to prevent command injection
  if (org) {
    try {
      validateGitHubName(org);
    } catch (error) {
      console.error(chalk.red(`\nError: Invalid organization name - ${error.message}`));
      process.exit(1);
    }
  }

  // Determine target directory
  const useCurrentDir = options.here;
  const targetDir = useCurrentDir
    ? process.cwd()
    : resolve(process.cwd(), projectName);

  console.log('');
  console.log(chalk.bold('repokit init'));
  console.log(chalk.gray('─'.repeat(40)));
  console.log(`  Project:    ${chalk.cyan(projectName)}`);
  console.log(`  Directory:  ${chalk.cyan(targetDir)}`);
  console.log(`  Visibility: ${chalk.cyan(isPublic ? 'public' : 'private')}`);
  console.log(`  Owner:      ${chalk.cyan(org || 'personal account')}`);
  console.log(chalk.gray('─'.repeat(40)));
  console.log('');

  // Preflight checks
  const preflightSpinner = ora('Running preflight checks...').start();

  // Check gh CLI is installed
  if (!isGhInstalled()) {
    preflightSpinner.fail('GitHub CLI (gh) is not installed');
    console.log(
      chalk.yellow('\nInstall it with: brew install gh')
    );
    process.exit(1);
  }

  // Check gh CLI is authenticated
  if (!isGhAuthenticated()) {
    preflightSpinner.fail('GitHub CLI is not authenticated');
    console.log(
      chalk.yellow('\nAuthenticate with: gh auth login')
    );
    process.exit(1);
  }

  // Check if repo already exists on GitHub
  if (repoExists(projectName, org)) {
    preflightSpinner.fail(
      `Repository "${org ? `${org}/${projectName}` : projectName}" already exists on GitHub`
    );
    process.exit(1);
  }

  preflightSpinner.succeed('Preflight checks passed');

  // Safety checks for --here flag
  if (useCurrentDir) {
    // Check if git repo already exists
    if (isGitRepo(targetDir) && !options.force) {
      console.error(
        chalk.red('\nError: Current directory is already a git repository.')
      );
      console.error(
        chalk.yellow('Use --force to proceed anyway (will rename branch to main).')
      );
      process.exit(1);
    }

    // Check if README.md already exists
    const readmePath = join(targetDir, 'README.md');
    if (existsSync(readmePath) && !options.force) {
      console.error(chalk.red('\nError: README.md already exists.'));
      console.error(
        chalk.yellow('Use --force to proceed anyway (will overwrite README.md).')
      );
      process.exit(1);
    }
  }

  // Step 1: Create directory (if not using current)
  if (!useCurrentDir) {
    const dirSpinner = ora('Creating project directory...').start();

    if (existsSync(targetDir)) {
      dirSpinner.fail(`Directory "${projectName}" already exists`);
      process.exit(1);
    }

    try {
      mkdirSync(targetDir, { recursive: true });
      dirSpinner.succeed('Created project directory');
    } catch (error) {
      dirSpinner.fail(`Failed to create directory: ${error.message}`);
      process.exit(1);
    }
  }

  // Step 2: Create README.md
  const readmeSpinner = ora('Creating README.md...').start();
  try {
    createReadme(targetDir, projectName);
    readmeSpinner.succeed('Created README.md');
  } catch (error) {
    readmeSpinner.fail(`Failed to create README.md: ${error.message}`);
    process.exit(1);
  }

  // Step 3: Initialize git
  const gitSpinner = ora('Initializing git repository...').start();
  try {
    if (!isGitRepo(targetDir)) {
      gitInit(targetDir);
    }
    gitRenameBranch(targetDir, 'main');
    gitSpinner.succeed('Initialized git repository');
  } catch (error) {
    gitSpinner.fail(`Failed to initialize git: ${error.message}`);
    process.exit(1);
  }

  // Step 4: Make first commit
  const commitSpinner = ora('Creating initial commit...').start();
  try {
    gitAddAll(targetDir);
    gitCommit(targetDir, 'Initial commit');
    commitSpinner.succeed('Created initial commit');
  } catch (error) {
    commitSpinner.fail(`Failed to create commit: ${error.message}`);
    process.exit(1);
  }

  // Step 5: Create GitHub repo
  const ghSpinner = ora('Creating GitHub repository...').start();
  let repoUrl;
  try {
    repoUrl = createRepoOnly({
      name: projectName,
      isPublic,
      org,
    });
    ghSpinner.succeed('Created GitHub repository');
  } catch (error) {
    ghSpinner.fail(`Failed to create GitHub repo: ${error.message}`);
    process.exit(1);
  }

  // Step 6: Add remote
  const remoteSpinner = ora('Setting up remote...').start();
  try {
    gitAddRemote(targetDir, repoUrl);
    remoteSpinner.succeed('Set up remote origin');
  } catch (error) {
    remoteSpinner.fail(`Failed to add remote: ${error.message}`);
    process.exit(1);
  }

  // Step 7: Select SSH key and push to main
  const sshKeys = getGitHubSSHKeys();
  let selectedIdentityFile = null;

  if (sshKeys.length > 1) {
    console.log('');
    const selectedKey = await select({
      message: 'Select SSH key to use for push:',
      choices: sshKeys.map(key => ({
        name: `${key.name} (${key.identityFile})`,
        value: key.identityFile,
      })),
    });
    selectedIdentityFile = selectedKey;
    console.log('');
  } else if (sshKeys.length === 1) {
    selectedIdentityFile = sshKeys[0].identityFile;
  }

  const pushSpinner = ora('Pushing to GitHub...').start();
  try {
    gitPush(targetDir, 'main', selectedIdentityFile);
    pushSpinner.succeed('Pushed to GitHub');
  } catch (error) {
    pushSpinner.fail(`Failed to push: ${error.message}`);
    process.exit(1);
  }

  // Success message
  console.log('');
  console.log(chalk.green.bold('Done!'));

  const owner = org || getGhUsername();
  const githubUrl = `https://github.com/${owner}/${projectName}`;

  console.log('');
  console.log(`  ${chalk.gray('Repository:')} ${chalk.cyan(githubUrl)}`);
  console.log(`  ${chalk.gray('Local path:')} ${chalk.cyan(targetDir)}`);
  console.log('');

  if (!useCurrentDir) {
    console.log(chalk.gray(`  cd ${projectName} to get started`));
    console.log('');
  }
}
