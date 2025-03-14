import { jest } from '@jest/globals';
import { promises as fs } from 'fs';
import { join } from 'path';
import { getDir } from 'tmp-promise';

// Mock the logger
const mockLogger = {
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn()
};

// Mock process.exit
const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});

// Import the function to test
let initializeSkm;
let SKM_PATH;
let CONFIG_PATH;

describe('initializeSkm', () => {
  let tmpDir;

  beforeAll(async () => {
    // Create a temporary directory for testing
    tmpDir = await getDir();

    // Mock the constants
    jest.unstable_mockModule('../skm.js', () => ({
      SKM_PATH: join(tmpDir.path, '.skm'),
      CONFIG_PATH: join(tmpDir.path, '.skm', 'config.json'),
      logger: mockLogger,
    }));

    // Import the module after mocking
    const module = await import('../skm.js');
    initializeSkm = module.initializeSkm;
    SKM_PATH = module.SKM_PATH;
    CONFIG_PATH = module.CONFIG_PATH;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await tmpDir.cleanup();
  });

  test('should initialize skm-node successfully', async () => {
    await initializeSkm();

    // Check if directory was created
    const skmExists = await fs.access(SKM_PATH)
      .then(() => true)
      .catch(() => false);
    expect(skmExists).toBe(true);

    // Check if config file was created
    const configExists = await fs.access(CONFIG_PATH)
      .then(() => true)
      .catch(() => false);
    expect(configExists).toBe(true);

    // Check if config has correct content
    const config = JSON.parse(await fs.readFile(CONFIG_PATH, 'utf-8'));
    expect(config).toEqual({ use: '' });

    // Check if success message was logged
    expect(mockLogger.success).toHaveBeenCalledWith('skm-node initialized successfully!');
  });

  test('should handle already initialized state', async () => {
    // Initialize first time
    await initializeSkm();
    jest.clearAllMocks();

    // Try to initialize again
    await initializeSkm();

    expect(mockLogger.info).toHaveBeenCalledWith('skm-node is already initialized.');
    expect(mockLogger.success).not.toHaveBeenCalled();
  });

  test('should handle errors gracefully', async () => {
    // Mock fs.mkdir to throw an error
    const mockMkdir = jest.spyOn(fs, 'mkdir').mockRejectedValue(new Error('Permission denied'));

    await initializeSkm();

    expect(mockLogger.error).toHaveBeenCalledWith('Failed to initialize: Permission denied');
    expect(mockExit).toHaveBeenCalledWith(1);

    mockMkdir.mockRestore();
  });
});
