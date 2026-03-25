/**
 * CLI Commands
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { homedir } from 'os';
import { join } from 'path';
import { SSHKeyManager } from '../core/keyManager.js';
import { ConfigManager } from '../core/config.js';

export function registerCommands(program: Command) {
  const skmPath = join(homedir(), '.skm');
  const sshPath = join(homedir(), '.ssh');
  const configPath = join(skmPath, 'config.json');
  const configManager = new ConfigManager(configPath);
  const keyManager = new SSHKeyManager(skmPath, sshPath, configManager);

  // init command
  program
    .command('init')
    .description('Initialize skm-node configuration')
    .action(async () => {
      const spinner = ora('Initializing skm-node...').start();

      const result = await keyManager.initialize();

      if (result.success) {
        spinner.succeed('skm-node initialized successfully!');
        console.log(chalk.gray(`  Config: ${configPath}`));
        console.log(chalk.gray(`  Keys: ${skmPath}`));
      } else {
        spinner.fail(`Initialization failed: ${result.error}`);
        process.exit(1);
      }
    });

  // create command
  program
    .command('create')
    .argument('<name>', 'Name for the SSH key')
    .option('-e, --email <email>', 'Email associated with the key')
    .option('-t, --type <type>', 'Key type (ed25519, rsa, ecdsa)', 'ed25519')
    .option('-b, --bits <bits>', 'Key bits (for RSA)', '4096')
    .option('-p, --passphrase', 'Prompt for passphrase')
    .description('Create a new SSH key')
    .action(async (name, options) => {
      await configManager.load();
      let email = options.email;

      // Interactive prompt if email not provided
      if (!email) {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'email',
            message: 'Enter email for SSH key:',
            validate: (input) => {
              if (!input.includes('@')) {
                return 'Please enter a valid email';
              }
              return true;
            },
          },
        ]);
        email = answers.email;
      }

      const passphrase = options.passphrase
        ? await promptPassphrase()
        : undefined;

      const spinner = ora('Generating SSH key...').start();

      const result = await keyManager.generateKey({
        name,
        email,
        algorithm: options.type as 'ed25519' | 'rsa' | 'ecdsa',
        bits: parseInt(options.bits, 10),
        passphrase,
      });

      if (result.success && result.data) {
        spinner.succeed(`SSH key '${name}' created successfully!`);
        console.log();
        console.log(chalk.green('  Algorithm:'), result.data.algorithm);
        console.log(chalk.green('  Email:'), result.data.email);
        console.log(chalk.green('  Fingerprint:'), result.data.fingerprint);
        console.log(chalk.green('  Passphrase:'), result.data.hasPassphrase ? 'Yes' : 'No');
        console.log();
        console.log(chalk.gray('  Use with:'), chalk.cyan(`skm use ${name}`));
      } else {
        spinner.fail(`Failed to create key: ${result.error}`);
        process.exit(1);
      }
    });

  // list command
  program
    .command('ls')
    .alias('list')
    .description('List all managed SSH keys')
    .action(async () => {
      await configManager.load();
      const result = await keyManager.listKeys();

      if (!result.success) {
        console.log(chalk.red(`Error: ${result.error}`));
        process.exit(1);
      }

      const keys = result.data || [];
      const config = configManager.get();

      if (keys.length === 0) {
        console.log(chalk.yellow('No SSH keys managed by skm-node'));
        console.log(chalk.gray('Create one with:'), chalk.cyan('skm create <name>'));
        return;
      }

      console.log();
      console.log(chalk.bold('Managed SSH keys:'));
      console.log();

      for (const key of keys) {
        const isActive = config.activeKey === key.name;
        const icon = isActive ? chalk.green('→') : ' ';
        const status = isActive ? chalk.green('(active)') : chalk.gray('');

        console.log(`${icon} ${chalk.bold(key.name)} ${status}`);
        console.log(`    Email: ${key.email}`);
        console.log(`    Type: ${key.algorithm}${key.bits ? ` (${key.bits} bits)` : ''}`);
        console.log(`    Fingerprint: ${chalk.gray(key.fingerprint)}`);
        console.log(`    Created: ${key.createdAt.toDateString()}`);
        console.log(`    Passphrase: ${key.hasPassphrase ? chalk.yellow('Yes') : chalk.gray('No')}`);
        console.log();
      }
    });

  // use command
  program
    .command('use')
    .argument('<name>', 'Name of the SSH key to activate')
    .description('Switch to a different SSH key')
    .action(async (name) => {
      await configManager.load();
      const spinner = ora(`Activating key '${name}'...`).start();

      const result = await keyManager.useKey(name);

      if (result.success) {
        spinner.succeed(`Now using SSH key: ${name}`);
      } else {
        spinner.fail(`Failed to activate key: ${result.error}`);
        process.exit(1);
      }
    });

  // delete command
  program
    .command('delete')
    .argument('<name>', 'Name of the SSH key to delete')
    .alias('rm')
    .description('Delete a managed SSH key')
    .action(async (name) => {
      await configManager.load();
      const config = configManager.get();
      const isActive = config.activeKey === name;

      if (isActive) {
        console.log(chalk.yellow(`Warning: '${name}' is currently active`));
      }

      const answers = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `Are you sure you want to delete '${name}'? This cannot be undone.`,
          default: false,
        },
      ]);

      if (!answers.confirm) {
        console.log(chalk.gray('Deletion cancelled'));
        return;
      }

      const spinner = ora('Deleting key...').start();

      const result = await keyManager.deleteKey(name);

      if (result.success) {
        spinner.succeed(`Key '${name}' deleted`);
      } else {
        spinner.fail(`Failed to delete: ${result.error}`);
        process.exit(1);
      }
    });

  // fingerprint command
  program
    .command('fingerprint')
    .argument('<name>', 'Name of the SSH key')
    .description('Show fingerprint for an SSH key')
    .action(async (name) => {
      await configManager.load();
      const result = await keyManager.getFingerprint(name);

      if (result.success && result.data) {
        console.log();
        console.log(chalk.bold(`Fingerprint for '${name}':`));
        console.log(chalk.cyan(result.data));
        console.log();
      } else {
        console.log(chalk.red(`Error: ${result.error}`));
        process.exit(1);
      }
    });

  // export command
  program
    .command('export')
    .argument('<name>', 'Name of the SSH key')
    .description('Export public key to clipboard or stdout')
    .action(async (name) => {
      await configManager.load();
      const result = await keyManager.exportPublicKey(name);

      if (result.success && result.data) {
        console.log(result.data);
      } else {
        console.log(chalk.red(`Error: ${result.error}`));
        process.exit(1);
      }
    });
}

/**
 * Prompt for passphrase twice to confirm
 */
async function promptPassphrase(): Promise<string> {
  const answers = await inquirer.prompt([
    {
      type: 'password',
      name: 'passphrase',
      message: 'Enter passphrase (leave empty for none):',
      mask: '*',
    },
    {
      type: 'password',
      name: 'confirm',
      message: 'Confirm passphrase:',
      mask: '*',
    },
  ]);

  if (answers.passphrase !== answers.confirm) {
    console.log(chalk.red('Passphrases do not match'));
    return promptPassphrase();
  }

  return answers.passphrase;
}
