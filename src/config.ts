import * as path from 'node:path';
import * as fs from 'node:fs';
import * as os from 'node:os';
import type { KlazyConfig } from './types';
import { logError } from './colors';

function isValidKlazyConfig(obj: unknown): obj is KlazyConfig {
  if (!obj || typeof obj !== 'object') return false;
  const config = obj as Record<string, unknown>;
  // Accept undefined, null, or string for optional string fields
  const isOptionalString = (val: unknown): boolean =>
    val === undefined || val === null || typeof val === 'string';
  if (!isOptionalString(config.previousNamespace)) return false;
  if (!isOptionalString(config.previousContext)) return false;
  if (!isOptionalString(config.lastCommand)) return false;
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
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'unknown error';
        logError('read config file', `${configPath}: ${msg}`);
        return { ...defaultConfig };
    }
    try {
        const parsed = JSON.parse(rawContent);
        if (!isValidKlazyConfig(parsed)) {
          logError('validate config', 'invalid config structure');
          return { ...defaultConfig };
        }
        return parsed;
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'unknown error';
        logError('parse config file', `${configPath}: ${msg}`);
        return { ...defaultConfig };
    }
}

export function writeConfig(config: KlazyConfig): void {
    try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), { mode: 0o600 });
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'unknown error';
        logError('write config file', `${configPath}: ${msg}`);
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
