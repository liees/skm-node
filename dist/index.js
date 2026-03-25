#!/usr/bin/env node
/**
 * skm-node - Modern SSH Key Manager
 *
 * A secure, feature-rich SSH key management tool with support for:
 * - Ed25519 (recommended), RSA, and ECDSA keys
 * - Interactive CLI with prompts
 * - Automatic SSH directory synchronization
 * - Key fingerprint management
 * - Public key export
 */
import { Command } from 'commander';
import chalk from 'chalk';
import { registerCommands } from './commands/index.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const packageJson = require('../package.json');
function main() {
    const program = new Command();
    program
        .name('skm')
        .description(chalk.bold('Modern SSH Key Manager'))
        .version(packageJson.version);
    // Register all commands
    registerCommands(program);
    // Handle unknown commands
    program.on('command:*', () => {
        console.log(chalk.red('Invalid command'));
        console.log();
        program.help();
    });
    // Add helpful epilog
    program.addHelpText('after', `
${chalk.bold('Examples:')}
  ${chalk.cyan('skm init')}                    Initialize skm-node
  ${chalk.cyan('skm create mykey -e me@example.com')}  Create a new Ed25519 key
  ${chalk.cyan('skm create github -t rsa')}     Create an RSA key
  ${chalk.cyan('skm ls')}                       List all keys
  ${chalk.cyan('skm use mykey')}                Activate a key
  ${chalk.cyan('skm fingerprint mykey')}        Show key fingerprint
  ${chalk.cyan('skm export mykey')}             Export public key

${chalk.bold('Recommended:')} Use Ed25519 keys for better security and performance.
  ${chalk.cyan('skm create mykey -e me@example.com -t ed25519')}
`);
    program.parse();
}
main();
//# sourceMappingURL=index.js.map