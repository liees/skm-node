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
import { initializeSkm } from '../skm.js';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = path.dirname(currentFilePath);
const TEST_PATH = path.join(currentDirPath, '..', 'test-skm');

describe('SKM Initialization', () => {
  beforeEach(async () => {
    process.env.NODE_ENV = 'test';
    process.env.TEST_HOME_DIR = TEST_PATH;
    process.env.TEST_SKM_PATH = path.join(TEST_PATH, '.skm');
    process.env.TEST_SSH_PATH = path.join(TEST_PATH, '.ssh');
    process.env.TEST_CONFIG_PATH = path.join(TEST_PATH, '.skm', 'config.json');
    await fs.rm(TEST_PATH, { recursive: true, force: true });
    await fs.mkdir(TEST_PATH, { recursive: true });
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

  it('should initialize skm-node successfully', async () => {
    await initializeSkm();
    const config = await fs.readFile(process.env.TEST_CONFIG_PATH, 'utf-8');
    const { use } = JSON.parse(config);
    expect(use).toBe('');

    const skmExists = await fs.access(process.env.TEST_SKM_PATH)
      .then(() => true)
      .catch(() => false);
    expect(skmExists).toBe(true);
  });

  it('should handle existing initialization', async () => {
    await initializeSkm();
    await initializeSkm();
    const config = await fs.readFile(process.env.TEST_CONFIG_PATH, 'utf-8');
    const { use } = JSON.parse(config);
    expect(use).toBe('');
  });

  it('should detect existing SSH keys', async () => {
    await fs.mkdir(process.env.TEST_SSH_PATH, { recursive: true });
    await fs.writeFile(path.join(process.env.TEST_SSH_PATH, 'id_rsa'), 'test');

    const consoleSpy = jest.spyOn(console, 'log');
    await initializeSkm();

    const calls = consoleSpy.mock.calls;
    const foundKeys = calls.some(([, message]) => message && message.includes('Found existing SSH keys'));
    expect(foundKeys).toBe(true);

    consoleSpy.mockRestore();
  });

  it('should not detect SSH keys if none exist', async () => {
    const consoleSpy = jest.spyOn(console, 'log');
    await initializeSkm();

    const calls = consoleSpy.mock.calls;
    const foundKeys = calls.some(([, message]) => message && message.includes('Found existing SSH keys'));
    expect(foundKeys).toBe(false);

    consoleSpy.mockRestore();
  });

  it('should handle initialization errors gracefully', async () => {
    // 模拟文件系统错误
    jest.spyOn(fs, 'mkdir').mockRejectedValueOnce(new Error('Mock error'));

    const consoleSpy = jest.spyOn(console, 'log');
    await initializeSkm();

    const calls = consoleSpy.mock.calls;
    const foundError = calls.some(([, message]) => message && message.includes('Failed to initialize'));
    expect(foundError).toBe(true);

    consoleSpy.mockRestore();
  });
});
