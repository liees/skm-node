import { jest } from '@jest/globals';
import { promises as fs } from 'fs';
import { join } from 'path';
import { getDir } from 'tmp-promise';
import { execa } from 'execa';

// Mock execa
jest.mock('execa');

// Mock the logger
const mockLogger = {
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn()
};

// Mock process.exit
const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});

// Import the functions to test
let createKey, useKey, listKeys;
let SKM_PATH, SSH_PATH, CONFIG_PATH;

describe('Key Management', () => {
  let tmpDir;

  beforeAll(async () => {
    // Create a temporary directory for testing
    tmpDir = await getDir();

    // Mock the constants
    jest.unstable_mockModule('../skm.js', () => ({
      SKM_PATH: join(tmpDir.path, '.skm'),
      SSH_PATH: join(tmpDir.path, '.ssh'),
      CONFIG_PATH: join(tmpDir.path, '.skm', 'config.json'),
      logger: mockLogger,
    }));

    // Import the module after mocking
    const module = await import('../skm.js');
    createKey = module.createKey;
    useKey = module.useKey;
    listKeys = module.listKeys;
    SKM_PATH = module.SKM_PATH;
    SSH_PATH = module.SSH_PATH;
    CONFIG_PATH = module.CONFIG_PATH;

    // Create necessary directories
    await fs.mkdir(SKM_PATH, { recursive: true });
    await fs.writeFile(CONFIG_PATH, JSON.stringify({ use: '' }));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await tmpDir.cleanup();
  });

  describe('createKey', () => {
    test('should create a new SSH key successfully', async () => {
      const email = 'test@example.com';
      const name = 'test-key';

      execa.mockResolvedValue({ stdout: '', stderr: '' });

      await createKey(email, name);

      expect(execa).toHaveBeenCalledWith('ssh-keygen', [
        '-t', 'rsa',
        '-b', '4096',
        '-C', email,
        '-f', join(SKM_PATH, name, 'id_rsa'),
        '-N', ''
      ]);

      expect(mockLogger.success).toHaveBeenCalledWith(`SSH key '${name}' created successfully`);
    });

    test('should handle missing parameters', async () => {
      await createKey(null, null);
      expect(mockLogger.error).toHaveBeenCalledWith('Both email and name are required');
    });

    test('should handle existing key name', async () => {
      const name = 'existing-key';
      await fs.mkdir(join(SKM_PATH, name));

      await createKey('test@example.com', name);
      expect(mockLogger.error).toHaveBeenCalledWith(`SSH key '${name}' already exists`);
    });
  });

  describe('useKey', () => {
    test('should switch to an existing key', async () => {
      const name = 'test-key';
      await fs.mkdir(join(SKM_PATH, name));

      execa.mockResolvedValue({ stdout: '', stderr: '' });

      await useKey(name);

      expect(mockLogger.success).toHaveBeenCalledWith(`Now using SSH key: ${name}`);

      const config = JSON.parse(await fs.readFile(CONFIG_PATH, 'utf-8'));
      expect(config.use).toBe(name);
    });

    test('should handle non-existent key', async () => {
      await useKey('non-existent-key');
      expect(mockLogger.error).toHaveBeenCalledWith(`SSH key 'non-existent-key' not found`);
    });
  });

  describe('listKeys', () => {
    test('should list all available keys', async () => {
      // Create some test keys
      await fs.mkdir(join(SKM_PATH, 'key1'));
      await fs.mkdir(join(SKM_PATH, 'key2'));
      await fs.writeFile(CONFIG_PATH, JSON.stringify({ use: 'key1' }));

      const consoleSpy = jest.spyOn(console, 'log');

      await listKeys();

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('key1'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('key2'));

      consoleSpy.mockRestore();
    });

    test('should handle no keys', async () => {
      // Remove all keys
      const files = await fs.readdir(SKM_PATH);
      await Promise.all(
        files
          .filter(file => file !== 'config.json')
          .map(file => fs.rm(join(SKM_PATH, file), { recursive: true }))
      );

      await listKeys();

      expect(mockLogger.info).toHaveBeenCalledWith('No SSH keys managed by skm-node');
    });
  });
});
