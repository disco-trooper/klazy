import type { KlazyConfig } from './types';
export declare const lastCommandKey = "lastCommand";
export declare const customCommandsKey = "custom";
export declare function getConfig(): KlazyConfig;
export declare function writeConfig(config: KlazyConfig): void;
export declare const configuration: {
    get: () => KlazyConfig;
    put: (update: Partial<KlazyConfig>) => void;
};
