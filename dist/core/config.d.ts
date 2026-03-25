/**
 * Configuration management with Zod validation
 */
import type { SKMConfig, StoredKeyInfo } from '../types/index.js';
export declare class ConfigManager {
    private configPath;
    private config;
    constructor(configPath: string);
    load(): Promise<SKMConfig>;
    save(): Promise<void>;
    get(): SKMConfig;
    setActiveKey(name: string | null): void;
    addKey(name: string, info: StoredKeyInfo): void;
    removeKey(name: string): void;
    getKey(name: string): StoredKeyInfo | undefined;
    getActiveKey(): string | null;
}
//# sourceMappingURL=config.d.ts.map