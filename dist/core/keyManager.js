/**
 * SSH Key Management Core
 * Supports Ed25519 (recommended), RSA, and ECDSA
 */
import { execa } from 'execa';
import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
export class SSHKeyManager {
    skmPath;
    sshPath;
    configManager;
    constructor(skmPath = join(homedir(), '.skm'), sshPath = join(homedir(), '.ssh'), configManager) {
        this.skmPath = skmPath;
        this.sshPath = sshPath;
        this.configManager = configManager;
    }
    /**
     * Generate SSH key with modern defaults (Ed25519)
     */
    async generateKey(options) {
        try {
            const { email, name, algorithm = 'ed25519', bits = 4096, passphrase = '', comment = email, } = options;
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
            }
            catch {
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
            }
            else {
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
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    /**
     * List all managed keys with details
     */
    async listKeys() {
        try {
            const config = this.configManager.get();
            const keys = [];
            for (const [name, info] of Object.entries(config.keys)) {
                const keyDir = join(this.skmPath, name);
                const pubPath = join(keyDir, `id_${info.algorithm}.pub`);
                let publicKey = '';
                try {
                    publicKey = await fs.readFile(pubPath, 'utf-8');
                }
                catch {
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
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    /**
     * Activate a key (sync to ~/.ssh)
     */
    async useKey(name) {
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
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    /**
     * Sync key to ~/.ssh directory
     */
    async syncToSSH(name) {
        const config = this.configManager.get();
        const keyInfo = config.keys[name];
        if (!keyInfo) {
            throw new Error(`Key '${name}' not found in config`);
        }
        const keyDir = join(this.skmPath, name);
        const algorithm = keyInfo.algorithm;
        // Clean existing SSH keys
        const sshFiles = await fs.readdir(this.sshPath);
        for (const file of sshFiles) {
            if (file.startsWith('id_') && !file.endsWith('.pub')) {
                await fs.unlink(join(this.sshPath, file));
            }
            if (file.startsWith('id_') && file.endsWith('.pub')) {
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
     */
    async deleteKey(name) {
        try {
            const config = this.configManager.get();
            if (!config.keys[name]) {
                return {
                    success: false,
                    error: `Key '${name}' not found`,
                };
            }
            const keyDir = join(this.skmPath, name);
            await fs.rm(keyDir, { recursive: true, force: true });
            this.configManager.removeKey(name);
            await this.configManager.save();
            // If this was the active key, clear active
            if (config.activeKey === name) {
                await this.clearSSHKeys();
            }
            return {
                success: true,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    /**
     * Clear SSH directory keys
     */
    async clearSSHKeys() {
        try {
            const sshFiles = await fs.readdir(this.sshPath);
            for (const file of sshFiles) {
                if (file.startsWith('id_')) {
                    await fs.unlink(join(this.sshPath, file));
                }
            }
        }
        catch {
            // SSH directory might not exist
        }
    }
    /**
     * Get key fingerprint
     */
    async getFingerprint(name) {
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
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    /**
     * Export public key
     */
    async exportPublicKey(name) {
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
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    /**
     * Initialize SKM directories
     */
    async initialize() {
        try {
            await fs.mkdir(this.skmPath, { recursive: true });
            await fs.mkdir(this.sshPath, { recursive: true });
            await this.configManager.load();
            await this.configManager.save();
            return {
                success: true,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
}
//# sourceMappingURL=keyManager.js.map