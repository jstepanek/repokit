#!/usr/bin/env node

import { program } from 'commander';
import { initCommand } from './commands/init.js';
import { loadConfig, saveConfig, getConfigPath, configExists } from './utils/config.js';
import chalk from 'chalk';

program
  .name('repokit')
  .description('CLI tool to automate GitHub repository setup')
  .version('1.0.0');

// Init command
program
  .command('init <project-name>')
  .description('Initialize a new project with GitHub repository')
  .option('--public', 'Create a public repository')
  .option('--private', 'Create a private repository (default)')
  .option('--here', 'Use current directory instead of creating a new one')
  .option('--force', 'Force initialization even if git repo or README.md exists (with --here)')
  .option('--org <name>', 'GitHub organization (e.g., bluestemlabs)')
  .action(initCommand);

// Config command for managing defaults
program
  .command('config')
  .description('View or set default configuration')
  .option('--org <name>', 'Set default organization (use "personal" to clear)')
  .option('--visibility <type>', 'Set default visibility (public or private)')
  .option('--show', 'Show current configuration')
  .action((options) => {
    const config = loadConfig();

    // If --show or no options provided, show current config
    if (options.show || (!options.org && !options.visibility)) {
      console.log('');
      console.log(chalk.bold('repokit configuration'));
      console.log(chalk.gray('─'.repeat(40)));
      console.log(`  Config file: ${chalk.cyan(getConfigPath())}`);
      console.log(`  File exists: ${chalk.cyan(configExists() ? 'yes' : 'no')}`);
      console.log(chalk.gray('─'.repeat(40)));
      console.log(`  Default org:        ${chalk.cyan(config.defaultOrg || '(personal account)')}`);
      console.log(`  Default visibility: ${chalk.cyan(config.defaultVisibility)}`);
      console.log('');
      return;
    }

    // Update org if provided
    if (options.org) {
      if (options.org === 'personal') {
        config.defaultOrg = null;
        console.log(chalk.green('Set default org to personal account'));
      } else {
        config.defaultOrg = options.org;
        console.log(chalk.green(`Set default org to "${options.org}"`));
      }
    }

    // Update visibility if provided
    if (options.visibility) {
      if (!['public', 'private'].includes(options.visibility)) {
        console.error(chalk.red('Visibility must be "public" or "private"'));
        process.exit(1);
      }
      config.defaultVisibility = options.visibility;
      console.log(chalk.green(`Set default visibility to "${options.visibility}"`));
    }

    saveConfig(config);
  });

program.parse();
