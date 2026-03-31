/**
 * Tests for SSH Key Manager
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { tmpdir } from 'os';
import { join } from 'path';
import { promises as fs } from 'fs';
// FIX #3: Corrected relative import paths (tests/core -> src/core is two levels up)
import { SSHKeyManager } from '../../src/core/keyManager.js';
import { ConfigManager } from '../../src/core/config.js';

describe('SSHKeyManager', () => {
  let testHomeDir: string;
  let testSkmPath: string;
  let testSshPath: string;
  let testConfigPath: string;
  let configManager: ConfigManager;
  let keyManager: SSHKeyManager;

  beforeEach(async () => {
    // Create isolated test directory
    testHomeDir = await fs.mkdtemp(join(tmpdir(), 'skm-test-'));
    testSkmPath = join(testHomeDir, '.skm');
    testSshPath = join(testHomeDir, '.ssh');
    testConfigPath = join(testSkmPath, 'config.json');

    await fs.mkdir(testSkmPath, { recursive: true });
    await fs.mkdir(testSshPath, { recursive: true });

    configManager = new ConfigManager(testConfigPath);
    await configManager.load();
    await configManager.save();

    keyManager = new SSHKeyManager(testSkmPath, testSshPath, configManager);
  });

  afterEach(async () => {
    // Cleanup test directory
    await fs.rm(testHomeDir, { recursive: true, force: true });
  });

  describe('initialize', () => {
    it('should create directories and config', async () => {
      const result = await keyManager.initialize();

      expect(result.success).toBe(true);

      const skmExists = await fs.access(testSkmPath)
        .then(() => true)
        .catch(() => false);
      expect(skmExists).toBe(true);
    });
  });

  describe('generateKey', () => {
    it('should create an Ed25519 key', async () => {
      const result = await keyManager.generateKey({
        name: 'test-key',
        email: 'test@example.com',
        algorithm: 'ed25519',
      });

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('test-key');
      expect(result.data?.algorithm).toBe('ed25519');
      expect(result.data?.fingerprint).toBeDefined();

      // Verify key files exist
      const keyDir = join(testSkmPath, 'test-key');
      const privateKeyExists = await fs.access(join(keyDir, 'id_ed25519'))
        .then(() => true)
        .catch(() => false);
      expect(privateKeyExists).toBe(true);
    });

    it('should create an RSA key with specified bits', async () => {
      const result = await keyManager.generateKey({
        name: 'rsa-key',
        email: 'test@example.com',
        algorithm: 'rsa',
        bits: 4096,
      });

      expect(result.success).toBe(true);
      expect(result.data?.algorithm).toBe('rsa');
      expect(result.data?.bits).toBe(4096);
    });

    it('should fail if key already exists', async () => {
      // Create first key
      await keyManager.generateKey({
        name: 'duplicate',
        email: 'test@example.com',
      });

      // Try to create again
      const result = await keyManager.generateKey({
        name: 'duplicate',
        email: 'test@example.com',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });

    // FIX #4: Email is now validated at the app layer, no longer relying on ssh-keygen failure
    it('should reject invalid email format', async () => {
      const result = await keyManager.generateKey({
        name: 'bad-email',
        email: 'not-an-email',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email format');
    });
  });

  describe('listKeys', () => {
    it('should return empty list when no keys exist', async () => {
      const result = await keyManager.listKeys();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should list created keys', async () => {
      await keyManager.generateKey({
        name: 'key1',
        email: 'key1@example.com',
      });

      await keyManager.generateKey({
        name: 'key2',
        email: 'key2@example.com',
      });

      const result = await keyManager.listKeys();

      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(2);
      expect(result.data?.map(k => k.name)).toContain('key1');
      expect(result.data?.map(k => k.name)).toContain('key2');
    });
  });

  describe('useKey', () => {
    it('should activate a key', async () => {
      await keyManager.generateKey({
        name: 'active-key',
        email: 'test@example.com',
      });

      const result = await keyManager.useKey('active-key');

      expect(result.success).toBe(true);

      const config = configManager.get();
      expect(config.activeKey).toBe('active-key');
    });

    it('should fail for non-existent key', async () => {
      const result = await keyManager.useKey('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should copy keys to SSH directory', async () => {
      await keyManager.generateKey({
        name: 'sync-key',
        email: 'test@example.com',
      });

      await keyManager.useKey('sync-key');

      // Check if key was synced to SSH directory
      const sshKeyExists = await fs.access(join(testSshPath, 'id_ed25519'))
        .then(() => true)
        .catch(() => false);
      expect(sshKeyExists).toBe(true);
    });

    // FIX #1: Verify that unrelated files in ~/.ssh are not deleted on sync
    it('should not delete unrelated files in SSH directory', async () => {
      // Create a file that should NOT be touched
      const untouchedFile = join(testSshPath, 'my_custom_key');
      await fs.writeFile(untouchedFile, 'custom content');

      await keyManager.generateKey({
        name: 'sync-key',
        email: 'test@example.com',
      });
      await keyManager.useKey('sync-key');

      const untouchedExists = await fs.access(untouchedFile)
        .then(() => true)
        .catch(() => false);
      expect(untouchedExists).toBe(true);
    });
  });

  describe('deleteKey', () => {
    it('should delete a key', async () => {
      await keyManager.generateKey({
        name: 'to-delete',
        email: 'test@example.com',
      });

      const result = await keyManager.deleteKey('to-delete');

      expect(result.success).toBe(true);

      const keyDir = join(testSkmPath, 'to-delete');
      const keyExists = await fs.access(keyDir)
        .then(() => true)
        .catch(() => false);
      expect(keyExists).toBe(false);
    });

    it('should fail for non-existent key', async () => {
      const result = await keyManager.deleteKey('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    // FIX #2: Verify that deleting the active key clears SSH directory
    it('should clear SSH directory when deleting active key', async () => {
      await keyManager.generateKey({
        name: 'active-key',
        email: 'test@example.com',
      });
      await keyManager.useKey('active-key');

      // Confirm key is in SSH dir
      const beforeDelete = await fs.access(join(testSshPath, 'id_ed25519'))
        .then(() => true)
        .catch(() => false);
      expect(beforeDelete).toBe(true);

      await keyManager.deleteKey('active-key');

      // Key should be removed from SSH dir
      const afterDelete = await fs.access(join(testSshPath, 'id_ed25519'))
        .then(() => true)
        .catch(() => false);
      expect(afterDelete).toBe(false);
    });

    it('should not clear SSH directory when deleting inactive key', async () => {
      await keyManager.generateKey({
        name: 'active-key',
        email: 'test@example.com',
      });
      await keyManager.generateKey({
        name: 'other-key',
        email: 'other@example.com',
      });
      await keyManager.useKey('active-key');

      await keyManager.deleteKey('other-key');

      // Active key should still be in SSH dir
      const activeKeyExists = await fs.access(join(testSshPath, 'id_ed25519'))
        .then(() => true)
        .catch(() => false);
      expect(activeKeyExists).toBe(true);
    });
  });

  describe('getFingerprint', () => {
    it('should return fingerprint', async () => {
      await keyManager.generateKey({
        name: 'fp-key',
        email: 'test@example.com',
      });

      const result = await keyManager.getFingerprint('fp-key');

      expect(result.success).toBe(true);
      expect(result.data).toMatch(/^SHA256:/);
    });
  });

  describe('exportPublicKey', () => {
    it('should export public key', async () => {
      await keyManager.generateKey({
        name: 'export-key',
        email: 'test@example.com',
      });

      const result = await keyManager.exportPublicKey('export-key');

      expect(result.success).toBe(true);
      expect(result.data).toMatch(/ssh-ed25519/);
      expect(result.data).toContain('test@example.com');
    });
  });
});
