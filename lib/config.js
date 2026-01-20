"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.configuration = exports.customCommandsKey = exports.lastCommandKey = void 0;
exports.getConfig = getConfig;
exports.writeConfig = writeConfig;
const path = __importStar(require("node:path"));
const fs = __importStar(require("node:fs"));
const os = __importStar(require("node:os"));
const colors_1 = require("./colors");
function isValidKlazyConfig(obj) {
    if (!obj || typeof obj !== 'object')
        return false;
    const config = obj;
    // Accept undefined, null, or string for optional string fields
    const isOptionalString = (val) => val === undefined || val === null || typeof val === 'string';
    if (!isOptionalString(config.previousNamespace))
        return false;
    if (!isOptionalString(config.previousContext))
        return false;
    if (!isOptionalString(config.lastCommand))
        return false;
    return true;
}
const configPath = path.join(os.homedir(), '.klazy');
exports.lastCommandKey = 'lastCommand';
exports.customCommandsKey = 'custom';
const defaultConfig = {
    previousNamespace: undefined,
    previousContext: undefined,
};
function getConfig() {
    const exist = fs.existsSync(configPath);
    if (!exist) {
        return { ...defaultConfig };
    }
    let rawContent;
    try {
        rawContent = fs.readFileSync(configPath, 'utf8');
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : 'unknown error';
        (0, colors_1.logError)('read config file', `${configPath}: ${msg}`);
        return { ...defaultConfig };
    }
    try {
        const parsed = JSON.parse(rawContent);
        if (!isValidKlazyConfig(parsed)) {
            (0, colors_1.logError)('validate config', 'invalid config structure');
            return { ...defaultConfig };
        }
        return parsed;
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : 'unknown error';
        (0, colors_1.logError)('parse config file', `${configPath}: ${msg}`);
        return { ...defaultConfig };
    }
}
function writeConfig(config) {
    try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), { mode: 0o600 });
    }
    catch (error) {
        const msg = error instanceof Error ? error.message : 'unknown error';
        (0, colors_1.logError)('write config file', `${configPath}: ${msg}`);
    }
}
let config = getConfig();
exports.configuration = {
    get: () => config,
    put: (update) => {
        const currentConfig = getConfig();
        const mergedConfig = { ...currentConfig, ...update };
        writeConfig(mergedConfig);
        config = getConfig();
    },
};
//# sourceMappingURL=config.js.map