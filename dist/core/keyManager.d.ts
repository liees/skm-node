/**
 * SSH Key Management Core
 * Supports Ed25519 (recommended), RSA, and ECDSA
 */
import type { KeyGenerationOptions, SSHKeyInfo, CommandResult } from '../types/index.js';
import { ConfigManager } from './config.js';
export declare class SSHKeyManager {
    private skmPath;
    private sshPath;
    private configManager;
    constructor(skmPath: string | undefined, sshPath: string | undefined, configManager: ConfigManager);
    /**
     * Generate SSH key with modern defaults (Ed25519)
     */
    generateKey(options: KeyGenerationOptions): Promise<CommandResult<SSHKeyInfo>>;
    /**
     * List all managed keys with details
     */
    listKeys(): Promise<CommandResult<SSHKeyInfo[]>>;
    /**
     * Activate a key (sync to ~/.ssh)
     */
    useKey(name: string): Promise<CommandResult>;
    /**
     * Sync key to ~/.ssh directory
     */
    private syncToSSH;
    /**
     * Delete a managed key
     */
    deleteKey(name: string): Promise<CommandResult>;
    /**
     * Clear SSH directory keys
     */
    private clearSSHKeys;
    /**
     * Get key fingerprint
     */
    getFingerprint(name: string): Promise<CommandResult<string>>;
    /**
     * Export public key
     */
    exportPublicKey(name: string): Promise<CommandResult<string>>;
    /**
     * Initialize SKM directories
     */
    initialize(): Promise<CommandResult>;
}
//# sourceMappingURL=keyManager.d.ts.map