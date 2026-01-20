import * as path from 'node:path';
import * as fs from 'node:fs';
import * as os from 'node:os';
import type { KlazyConfig } from './types';

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
        console.log('cannot read config file', configPath);
        return {};
    }
    try {
        return JSON.parse(rawContent) as KlazyConfig;
    } catch {
        console.log('corrupted config file', configPath);
        return {};
    }
}

export function writeConfig(config: KlazyConfig): void {
    try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    } catch {
        console.log('error writing to config file', configPath);
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
