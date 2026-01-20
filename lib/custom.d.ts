import type { CustomCommand } from './types';
export declare const isValidCustomCommand: (cmd: unknown) => cmd is CustomCommand;
export declare const isCustomConfigValid: boolean;
export declare const isCustomCommand: (commandName: string) => boolean;
export declare const runCustomCommand: (commandName: string, allNamespaces?: boolean) => Promise<void>;
