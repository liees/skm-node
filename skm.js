#!/usr/bin/env node

import { promises as fs } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { program } from 'commander';
import chalk from 'chalk';
import { execa } from 'execa';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package.json
const packageJson = JSON.parse(
  await fs.readFile(new URL('./package.json', import.meta.url))
);

// Constants
export const HOME_DIR = homedir();
export const SSH_PATH = join(HOME_DIR, '.ssh');
export const SKM_PATH = join(HOME_DIR, '.skm');
export const CONFIG_PATH = join(SKM_PATH, 'config.json');

// Utility functions
export const logger = {
  success: (msg) => console.log(chalk.green('✓'), chalk.green(msg)),
  error: (msg) => console.log(chalk.red('✗'), chalk.red(msg)),
  info: (msg) => console.log(chalk.blue('ℹ'), chalk.blue(msg)),
  warn: (msg) => console.log(chalk.yellow('⚠'), chalk.yellow(msg))
};

async function ensureDirectoryExists(path) {
  try {
    await fs.access(path);
  } catch {
    await fs.mkdir(path, { recursive: true });
  }
}

async function readConfig() {
  try {
    const config = await fs.readFile(CONFIG_PATH, 'utf-8');
    return JSON.parse(config);
  } catch {
    return { use: '' };
  }
}

async function writeConfig(config) {
  await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
}

// Command handlers
async function initializeSkm() {
  try {
    await ensureDirectoryExists(SKM_PATH);

    const configExists = await fs.access(CONFIG_PATH)
      .then(() => true)
      .catch(() => false);

    if (!configExists) {
      await writeConfig({ use: '' });
      logger.success('skm-node initialized successfully!');
    } else {
      logger.info('skm-node is already initialized.');
    }

    // Check for existing SSH keys and import them
    const sshExists = await fs.access(SSH_PATH)
      .then(() => true)
      .catch(() => false);

    if (sshExists) {
      const files = await fs.readdir(SSH_PATH);
      const hasExistingKeys = files.some(file => file.endsWith('id_rsa'));

      if (hasExistingKeys) {
        logger.info('Found existing SSH keys. Would you like to import them? (y/n)');
        // Note: In a real implementation, you'd want to add user interaction here
      }
    }
  } catch (error) {
    logger.error(`Failed to initialize: ${error.message}`);
    process.exit(1);
  }
}

async function listKeys() {
  try {
    const config = await readConfig();
    const files = await fs.readdir(SKM_PATH);
    const keys = files.filter(file => file !== 'config.json');

    if (keys.length === 0) {
      logger.info('No SSH keys managed by skm-node');
      return;
    }

    console.log('\nManaged SSH keys:');
    for (const key of keys) {
      const prefix = config.use === key ? chalk.green('→') : ' ';
      console.log(`${prefix} ${key}`);
    }
    console.log();
  } catch (error) {
    logger.error(`Failed to list keys: ${error.message}`);
    process.exit(1);
  }
}

async function useKey(name) {
  try {
    const files = await fs.readdir(SKM_PATH);
    if (!files.includes(name)) {
      logger.error(`SSH key '${name}' not found`);
      return;
    }

    await ensureDirectoryExists(SSH_PATH);
    await execa('cp', ['-rf', `${join(SKM_PATH, name)}/*`, SSH_PATH]);
    await writeConfig({ use: name });
    logger.success(`Now using SSH key: ${name}`);
  } catch (error) {
    logger.error(`Failed to switch key: ${error.message}`);
    process.exit(1);
  }
}

async function createKey(email, name) {
  try {
    if (!email || !name) {
      logger.error('Both email and name are required');
      return;
    }

    const keyPath = join(SKM_PATH, name);
    const files = await fs.readdir(SKM_PATH);

    if (files.includes(name)) {
      logger.error(`SSH key '${name}' already exists`);
      return;
    }

    await ensureDirectoryExists(keyPath);

    logger.info('Generating new SSH key...');
    await execa('ssh-keygen', [
      '-t', 'rsa',
      '-b', '4096',
      '-C', email,
      '-f', join(keyPath, 'id_rsa'),
      '-N', '' // Empty passphrase - in production you might want to prompt for this
    ]);

    logger.success(`SSH key '${name}' created successfully`);
    logger.info('You can now use it with: skm use ' + name);
  } catch (error) {
    logger.error(`Failed to create key: ${error.message}`);
    process.exit(1);
  }
}

// Export functions for testing
export { initializeSkm, listKeys, useKey, createKey };

// Only run CLI if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  // CLI setup
  program
    .name('skm-node')
    .description('Modern SSH Key Manager')
    .version(packageJson.version);

  program
    .command('init')
    .description('Initialize skm-node')
    .action(initializeSkm);

  program
    .command('ls')
    .description('List all SSH keys')
    .action(listKeys);

  program
    .command('use')
    .argument('<name>', 'Name of the SSH key to use')
    .description('Switch to a different SSH key')
    .action(useKey);

  program
    .command('create')
    .argument('<email>', 'Email associated with the key')
    .argument('<name>', 'Name for the new SSH key')
    .description('Create a new SSH key')
    .action(createKey);

  // Error handling for unknown commands
  program.on('command:*', () => {
    logger.error('Invalid command');
    console.log();
    program.help();
  });

  // Parse command line arguments
  program.parse();
}
