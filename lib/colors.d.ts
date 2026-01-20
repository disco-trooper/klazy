declare const COLORS: Record<string, string>;
export declare function colorize(text: string, color: string): string;
export declare function colorizeStatus(status: string): string;
export declare function logError(action: string, detail?: string): void;
export declare function logWarning(message: string): void;
export { COLORS };
