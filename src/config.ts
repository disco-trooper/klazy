import * as path from 'node:path';
import * as fs from 'node:fs';
import * as os from 'node:os';
import type { KlazyConfig } from './types';
import { logError } from './colors';

function isValidKlazyConfig(obj: unknown): obj is KlazyConfig {
  if (!obj || typeof obj !== 'object') return false;
  const config = obj as Record<string, unknown>;
  if (config.previousNamespace !== undefined && typeof config.previousNamespace !== 'string') return false;
  if (config.previousContext !== undefined && typeof config.previousContext !== 'string') return false;
  if (config.lastCommand !== undefined && typeof config.lastCommand !== 'string') return false;
  return true;
}

const configPath: string = path.join(os.homedir(), '.klazy');

export const lastCommandKey = 'lastCommand';
export const customCommandsKey = 'custom';

const defaultConfig: KlazyConfig = {
    previousNamespace: undefined,
    previousContext: undefined,
};

export function getConfig(): KlazyConfig {
    const exist = fs.existsSync(configPath);
    if (!exist) {
        return { ...defaultConfig };
    }
    let rawContent: string;
    try {
        rawContent = fs.readFileSync(configPath, 'utf8');
    } catch {
        logError('read config file', configPath);
        return {};
    }
    try {
        const parsed = JSON.parse(rawContent);
        if (!isValidKlazyConfig(parsed)) {
          logError('validate config', 'invalid config structure');
          return { ...defaultConfig };
        }
        return parsed;
    } catch {
        logError('parse config file', configPath);
        return {};
    }
}

export function writeConfig(config: KlazyConfig): void {
    try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), { mode: 0o600 });
    } catch {
        logError('write config file', configPath);
    }
}

let config: KlazyConfig = getConfig();

export const configuration = {
    get: (): KlazyConfig => config,
    put: (update: Partial<KlazyConfig>): void => {
        const currentConfig = getConfig();
        const mergedConfig: KlazyConfig = { ...currentConfig, ...update };
        writeConfig(mergedConfig);
        config = getConfig();
    },
};
