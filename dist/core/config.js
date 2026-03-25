/**
 * Configuration management with Zod validation
 */
import { z } from 'zod';
import { promises as fs } from 'fs';
import { dirname } from 'path';
const StoredKeySchema = z.object({
    email: z.string().email(),
    algorithm: z.enum(['ed25519', 'rsa', 'ecdsa']),
    bits: z.number().optional(),
    createdAt: z.string(),
    fingerprint: z.string(),
    hasPassphrase: z.boolean(),
});
const ConfigSchema = z.object({
    activeKey: z.string().nullable(),
    defaultAlgorithm: z.enum(['ed25519', 'rsa', 'ecdsa']),
    defaultBits: z.number().min(2048).max(8192),
    autoSyncSSH: z.boolean(),
    keys: z.record(StoredKeySchema),
});
const DEFAULT_CONFIG = {
    activeKey: null,
    defaultAlgorithm: 'ed25519',
    defaultBits: 4096,
    autoSyncSSH: true,
    keys: {},
};
export class ConfigManager {
    configPath;
    config = null;
    constructor(configPath) {
        this.configPath = configPath;
    }
    async load() {
        try {
            const content = await fs.readFile(this.configPath, 'utf-8');
            const parsed = JSON.parse(content);
            this.config = ConfigSchema.parse(parsed);
            return this.config;
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                console.warn('Config validation failed, resetting to defaults');
            }
            this.config = { ...DEFAULT_CONFIG };
            await this.save();
            return this.config;
        }
    }
    async save() {
        if (!this.config) {
            throw new Error('No config loaded');
        }
        await fs.mkdir(dirname(this.configPath), { recursive: true });
        await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2));
    }
    get() {
        if (!this.config) {
            throw new Error('Config not loaded. Call load() first.');
        }
        return this.config;
    }
    setActiveKey(name) {
        if (!this.config)
            throw new Error('Config not loaded');
        this.config.activeKey = name;
    }
    addKey(name, info) {
        if (!this.config)
            throw new Error('Config not loaded');
        this.config.keys[name] = info;
    }
    removeKey(name) {
        if (!this.config)
            throw new Error('Config not loaded');
        delete this.config.keys[name];
        if (this.config.activeKey === name) {
            this.config.activeKey = null;
        }
    }
    getKey(name) {
        if (!this.config)
            throw new Error('Config not loaded');
        return this.config.keys[name];
    }
    getActiveKey() {
        if (!this.config)
            throw new Error('Config not loaded');
        return this.config.activeKey;
    }
}
//# sourceMappingURL=config.js.map