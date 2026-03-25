/**
 * SSH Key types and interfaces
 */

export interface SSHKeyInfo {
  name: string;
  email: string;
  algorithm: 'ed25519' | 'rsa' | 'ecdsa';
  bits?: number;
  fingerprint: string;
  createdAt: Date;
  publicKey: string;
  hasPassphrase: boolean;
}

export interface SKMConfig {
  activeKey: string | null;
  defaultAlgorithm: 'ed25519' | 'rsa' | 'ecdsa';
  defaultBits: number;
  autoSyncSSH: boolean;
  keys: Record<string, StoredKeyInfo>;
}

export interface StoredKeyInfo {
  email: string;
  algorithm: 'ed25519' | 'rsa' | 'ecdsa';
  bits?: number;
  createdAt: string;
  fingerprint: string;
  hasPassphrase: boolean;
}

export interface KeyGenerationOptions {
  email: string;
  name: string;
  algorithm?: 'ed25519' | 'rsa' | 'ecdsa';
  bits?: number;
  passphrase?: string;
  comment?: string;
}

export interface SSHConfigEntry {
  host: string;
  identityFile: string;
  user?: string;
  port?: number;
  additionalOptions?: Record<string, string>;
}

export type CommandResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};
