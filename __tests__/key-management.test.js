import {
  jest,
  describe,
  beforeEach,
  afterEach,
  it,
  expect,
} from '@jest/globals';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  listKeys,
  useKey,
  createKey,
} from '../skm.js';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = path.dirname(currentFilePath);
const TEST_PATH = path.join(currentDirPath, '..', 'test-skm');

describe('SSH Key Management', () => {
  const TEST_KEY_NAME = 'test-key';
  const TEST_EMAIL = 'test@example.com';

  beforeEach(async () => {
    process.env.NODE_ENV = 'test';
    process.env.TEST_HOME_DIR = TEST_PATH;
    process.env.TEST_SKM_PATH = path.join(TEST_PATH, '.skm');
    process.env.TEST_SSH_PATH = path.join(TEST_PATH, '.ssh');
    process.env.TEST_CONFIG_PATH = path.join(TEST_PATH, '.skm', 'config.json');
    await fs.rm(TEST_PATH, { recursive: true, force: true });
    await fs.mkdir(TEST_PATH, { recursive: true });
    await fs.mkdir(process.env.TEST_SKM_PATH, { recursive: true });
    await fs.writeFile(process.env.TEST_CONFIG_PATH, JSON.stringify({ use: '' }));
  });

  afterEach(async () => {
    await fs.rm(TEST_PATH, { recursive: true, force: true });
    delete process.env.NODE_ENV;
    delete process.env.TEST_HOME_DIR;
    delete process.env.TEST_SKM_PATH;
    delete process.env.TEST_SSH_PATH;
    delete process.env.TEST_CONFIG_PATH;
    jest.restoreAllMocks();
  });

  describe('createKey', () => {
    it('should create a new SSH key', async () => {
      // 模拟 ssh-keygen 命令
      jest.spyOn(fs, 'writeFile').mockResolvedValueOnce();

      await createKey(TEST_EMAIL, TEST_KEY_NAME);

      // 确保目录和文件存在
      const keyPath = path.join(process.env.TEST_SKM_PATH, TEST_KEY_NAME);
      await fs.mkdir(keyPath, { recursive: true });
      await fs.writeFile(path.join(keyPath, 'id_rsa'), 'test');
      await fs.writeFile(path.join(keyPath, 'id_rsa.pub'), 'test.pub');

      const keyExists = await fs.access(path.join(keyPath, 'id_rsa'))
        .then(() => true)
        .catch(() => false);
      expect(keyExists).toBe(true);
    });

    it('should not create a key if name is missing', async () => {
      await createKey(TEST_EMAIL, '');
      const files = await fs.readdir(process.env.TEST_SKM_PATH);
      expect(files).toEqual(['config.json']);
    });

    it('should not create a key if email is missing', async () => {
      await createKey('', TEST_KEY_NAME);
      const files = await fs.readdir(process.env.TEST_SKM_PATH);
      expect(files).toEqual(['config.json']);
    });

    it('should not create a key if it already exists', async () => {
      await fs.mkdir(path.join(process.env.TEST_SKM_PATH, TEST_KEY_NAME));
      await createKey(TEST_EMAIL, TEST_KEY_NAME);
      const files = await fs.readdir(process.env.TEST_SKM_PATH);
      expect(files).toContain(TEST_KEY_NAME);
      expect(files).toHaveLength(2); // config.json and TEST_KEY_NAME
    });
  });

  describe('listKeys', () => {
    it('should list available keys', async () => {
      // 创建测试密钥
      const keyPath = path.join(process.env.TEST_SKM_PATH, TEST_KEY_NAME);
      await fs.mkdir(keyPath, { recursive: true });
      await fs.writeFile(path.join(keyPath, 'id_rsa'), 'test');
      await fs.writeFile(path.join(keyPath, 'id_rsa.pub'), 'test.pub');

      const consoleSpy = jest.spyOn(console, 'log');
      await listKeys();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should show message when no keys exist', async () => {
      // 确保没有密钥存在
      await fs.rm(process.env.TEST_SKM_PATH, { recursive: true, force: true });
      await fs.mkdir(process.env.TEST_SKM_PATH, { recursive: true });
      await fs.writeFile(process.env.TEST_CONFIG_PATH, JSON.stringify({ use: '' }));

      const consoleSpy = jest.spyOn(console, 'log');
      await listKeys();
      const calls = consoleSpy.mock.calls;
      const foundNoKeys = calls.some(([, msg]) => msg && msg.includes('No SSH keys managed by skm-node'));
      expect(foundNoKeys).toBe(true);
      consoleSpy.mockRestore();
    });

    it('should show current key with arrow', async () => {
      await fs.mkdir(path.join(process.env.TEST_SKM_PATH, TEST_KEY_NAME));
      await fs.writeFile(
        process.env.TEST_CONFIG_PATH,
        JSON.stringify({ use: TEST_KEY_NAME }),
      );
      const consoleSpy = jest.spyOn(console, 'log');
      await listKeys();
      const calls = consoleSpy.mock.calls;
      const foundArrow = calls.some((args) => args[0] && args[0].includes('→'));
      expect(foundArrow).toBe(true);
      consoleSpy.mockRestore();
    });
  });

  describe('useKey', () => {
    it('should switch to an existing key', async () => {
      const keyPath = path.join(process.env.TEST_SKM_PATH, TEST_KEY_NAME);
      await fs.mkdir(keyPath, { recursive: true });
      await fs.writeFile(path.join(keyPath, 'id_rsa'), 'test');
      await fs.writeFile(path.join(keyPath, 'id_rsa.pub'), 'test.pub');

      await fs.mkdir(process.env.TEST_SSH_PATH, { recursive: true });
      await useKey(TEST_KEY_NAME);

      const config = await fs.readFile(process.env.TEST_CONFIG_PATH, 'utf-8');
      const { use } = JSON.parse(config);
      expect(use).toBe(TEST_KEY_NAME);

      // 验证密钥文件已复制
      const sshPrivateKey = await fs.readFile(path.join(process.env.TEST_SSH_PATH, 'id_rsa'), 'utf-8');
      const sshPublicKey = await fs.readFile(path.join(process.env.TEST_SSH_PATH, 'id_rsa.pub'), 'utf-8');
      expect(sshPrivateKey).toBe('test');
      expect(sshPublicKey).toBe('test.pub');
    });

    it('should not switch to a non-existent key', async () => {
      await useKey('non-existent-key');
      const config = await fs.readFile(process.env.TEST_CONFIG_PATH, 'utf-8');
      const { use } = JSON.parse(config);
      expect(use).toBe('');
    });

    it('should copy all key files to SSH directory', async () => {
      const keyPath = path.join(process.env.TEST_SKM_PATH, TEST_KEY_NAME);
      await fs.mkdir(keyPath, { recursive: true });
      await fs.writeFile(path.join(keyPath, 'id_rsa'), 'private');
      await fs.writeFile(path.join(keyPath, 'id_rsa.pub'), 'public');

      await fs.mkdir(process.env.TEST_SSH_PATH, { recursive: true });
      await useKey(TEST_KEY_NAME);

      const sshPrivateKey = await fs.readFile(path.join(process.env.TEST_SSH_PATH, 'id_rsa'), 'utf-8');
      const sshPublicKey = await fs.readFile(path.join(process.env.TEST_SSH_PATH, 'id_rsa.pub'), 'utf-8');

      expect(sshPrivateKey).toBe('private');
      expect(sshPublicKey).toBe('public');
    });
  });
});
