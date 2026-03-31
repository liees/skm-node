/**
 * SSH Key Management Core
 * Supports Ed25519 (recommended), RSA, and ECDSA
 */

import { execa } from 'execa';
import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import type { KeyGenerationOptions, SSHKeyInfo, CommandResult } from '../types/index.js';
import { ConfigManager } from './config.js';

// Known SSH key file prefixes to manage (avoids touching unrelated files in ~/.ssh)
const MANAGED_KEY_PREFIXES = ['id_ed25519', 'id_rsa', 'id_ecdsa'];

export class SSHKeyManager {
  private skmPath: string;
  private sshPath: string;
  private configManager: ConfigManager;

  constructor(
    skmPath: string = join(homedir(), '.skm'),
    sshPath: string = join(homedir(), '.ssh'),
    configManager: ConfigManager
  ) {
    this.skmPath = skmPath;
    this.sshPath = sshPath;
    this.configManager = configManager;
  }

  /**
   * Generate SSH key with modern defaults (Ed25519)
   */
  async generateKey(options: KeyGenerationOptions): Promise<CommandResult<SSHKeyInfo>> {
    try {
      const {
        email,
        name,
        algorithm = 'ed25519',
        bits = 4096,
        passphrase = '',
        comment = email,
      } = options;

      // FIX #4: Validate email format at the application layer
      if (!email.includes('@')) {
        return { success: false, error: 'Invalid email format' };
      }

      const keyDir = join(this.skmPath, name);
      const keyPath = join(keyDir, 'id_' + algorithm);
      const pubPath = keyPath + '.pub';

      // Check if key already exists
      try {
        await fs.access(keyDir);
        return {
          success: false,
          error: `Key '${name}' already exists`,
        };
      } catch {
        // Key doesn't exist, proceed
      }

      // Create key directory
      await fs.mkdir(keyDir, { recursive: true });

      // Generate key based on algorithm
      const args = ['-t', algorithm, '-C', comment];

      if (algorithm === 'rsa') {
        args.push('-b', bits.toString());
      }

      args.push('-f', keyPath);

      if (passphrase) {
        args.push('-N', passphrase);
      } else {
        args.push('-N', '');
      }

      await execa('ssh-keygen', args);

      // Get fingerprint
      const fingerprintResult = await execa('ssh-keygen', ['-lf', pubPath]);
      const fingerprint = fingerprintResult.stdout.split(' ')[1];

      // Read public key
      const publicKey = await fs.readFile(pubPath, 'utf-8');

      // Store key info in config
      this.configManager.addKey(name, {
        email,
        algorithm,
        bits: algorithm === 'rsa' ? bits : undefined,
        createdAt: new Date().toISOString(),
        fingerprint,
        hasPassphrase: !!passphrase,
      });

      await this.configManager.save();

      // Auto-sync to SSH directory if enabled
      const config = this.configManager.get();
      if (config.autoSyncSSH) {
        await this.syncToSSH(name);
      }

      return {
        success: true,
        data: {
          name,
          email,
          algorithm,
          bits: algorithm === 'rsa' ? bits : undefined,
          fingerprint,
          createdAt: new Date(),
          publicKey,
          hasPassphrase: !!passphrase,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * List all managed keys with details
   */
  async listKeys(): Promise<CommandResult<SSHKeyInfo[]>> {
    try {
      const config = this.configManager.get();
      const keys: SSHKeyInfo[] = [];

      for (const [name, info] of Object.entries(config.keys)) {
        const keyDir = join(this.skmPath, name);
        const pubPath = join(keyDir, `id_${info.algorithm}.pub`);

        let publicKey = '';
        try {
          publicKey = await fs.readFile(pubPath, 'utf-8');
        } catch {
          // Public key file might not exist
        }

        keys.push({
          name,
          email: info.email,
          algorithm: info.algorithm,
          bits: info.bits,
          fingerprint: info.fingerprint,
          createdAt: new Date(info.createdAt),
          publicKey,
          hasPassphrase: info.hasPassphrase,
        });
      }

      return {
        success: true,
        data: keys,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Activate a key (sync to ~/.ssh)
   */
  async useKey(name: string): Promise<CommandResult> {
    try {
      const config = this.configManager.get();
      const keyInfo = config.keys[name];

      if (!keyInfo) {
        return {
          success: false,
          error: `Key '${name}' not found`,
        };
      }

      await this.syncToSSH(name);

      this.configManager.setActiveKey(name);
      await this.configManager.save();

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Sync key to ~/.ssh directory
   * FIX #1: Only removes known managed key files, not arbitrary id_* files
   */
  private async syncToSSH(name: string): Promise<void> {
    const config = this.configManager.get();
    const keyInfo = config.keys[name];

    if (!keyInfo) {
      throw new Error(`Key '${name}' not found in config`);
    }

    const keyDir = join(this.skmPath, name);
    const algorithm = keyInfo.algorithm;

    // FIX #1: Only remove known managed key files instead of all id_* files
    const sshFiles = await fs.readdir(this.sshPath);
    for (const file of sshFiles) {
      const isManagedKey = MANAGED_KEY_PREFIXES.some(
        (prefix) => file === prefix || file === `${prefix}.pub`
      );
      if (isManagedKey) {
        await fs.unlink(join(this.sshPath, file));
      }
    }

    // Copy new keys
    const privateKey = join(keyDir, `id_${algorithm}`);
    const publicKey = privateKey + '.pub';

    await fs.copyFile(privateKey, join(this.sshPath, `id_${algorithm}`));
    await fs.copyFile(publicKey, join(this.sshPath, `id_${algorithm}.pub`));

    // Set proper permissions
    await fs.chmod(join(this.sshPath, `id_${algorithm}`), 0o600);
    await fs.chmod(join(this.sshPath, `id_${algorithm}.pub`), 0o644);
  }

  /**
   * Delete a managed key
   * FIX #2: Check wasActive before removeKey clears it
   */
  async deleteKey(name: string): Promise<CommandResult> {
    try {
      const config = this.configManager.get();

      if (!config.keys[name]) {
        return {
          success: false,
          error: `Key '${name}' not found`,
        };
      }

      // FIX #2: Capture wasActive before removeKey nullifies activeKey
      const wasActive = config.activeKey === name;

      const keyDir = join(this.skmPath, name);
      await fs.rm(keyDir, { recursive: true, force: true });

      this.configManager.removeKey(name);
      await this.configManager.save();

      if (wasActive) {
        await this.clearSSHKeys();
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Clear SSH directory managed keys only
   * FIX #1: Same safe removal logic as syncToSSH
   */
  private async clearSSHKeys(): Promise<void> {
    try {
      const sshFiles = await fs.readdir(this.sshPath);
      for (const file of sshFiles) {
        const isManagedKey = MANAGED_KEY_PREFIXES.some(
          (prefix) => file === prefix || file === `${prefix}.pub`
        );
        if (isManagedKey) {
          await fs.unlink(join(this.sshPath, file));
        }
      }
    } catch {
      // SSH directory might not exist
    }
  }

  /**
   * Get key fingerprint
   */
  async getFingerprint(name: string): Promise<CommandResult<string>> {
    try {
      const config = this.configManager.get();
      const keyInfo = config.keys[name];

      if (!keyInfo) {
        return {
          success: false,
          error: `Key '${name}' not found`,
        };
      }

      return {
        success: true,
        data: keyInfo.fingerprint,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Export public key
   */
  async exportPublicKey(name: string): Promise<CommandResult<string>> {
    try {
      const config = this.configManager.get();
      const keyInfo = config.keys[name];

      if (!keyInfo) {
        return {
          success: false,
          error: `Key '${name}' not found`,
        };
      }

      const pubPath = join(this.skmPath, name, `id_${keyInfo.algorithm}.pub`);
      const publicKey = await fs.readFile(pubPath, 'utf-8');

      return {
        success: true,
        data: publicKey.trim(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Initialize SKM directories
   */
  async initialize(): Promise<CommandResult> {
    try {
      await fs.mkdir(this.skmPath, { recursive: true });
      await fs.mkdir(this.sshPath, { recursive: true });
      await this.configManager.load();
      await this.configManager.save();

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
