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
exports.copyFiles = copyFiles;
// src/copy.ts
const node_child_process_1 = require("node:child_process");
const path = __importStar(require("node:path"));
const cli_1 = require("./cli");
const fuzzy_1 = require("./fuzzy");
const namespace_1 = require("./namespace");
const colors_1 = require("./colors");
const exec_1 = require("./exec");
const misc_1 = require("./misc");
/**
 * Validates local path doesn't escape via traversal
 */
function isPathSafe(localPath) {
    const resolved = path.resolve(localPath);
    const cwd = process.cwd();
    return resolved.startsWith(cwd) || path.isAbsolute(localPath);
}
async function copyFiles(srcArg, destArg, allNamespaces = false) {
    const pods = (0, exec_1.getPods)(allNamespaces);
    if (pods.length === 0) {
        console.log('No pods found');
        return;
    }
    // Interactive mode if no args
    if (!srcArg) {
        const selectedPod = await (0, misc_1.selectPod)(pods, undefined, allNamespaces, 'Select pod:');
        if (!selectedPod)
            return;
        const ns = selectedPod.namespace || (0, namespace_1.getCurrentNamespace)();
        const directions = ['From pod to local', 'From local to pod'];
        const directionSel = await (0, cli_1.select)({ question: 'Copy direction:', options: directions });
        if (!directionSel)
            return;
        const direction = directions.indexOf(directionSel);
        if (direction === -1)
            return;
        const remotePath = await (0, cli_1.input)({ question: 'Remote path (in pod)' });
        const localPath = await (0, cli_1.input)({ question: 'Local path' });
        if (!isPathSafe(localPath)) {
            console.log((0, colors_1.colorize)('Warning: Path traversal detected. Use absolute path or path within current directory.', 'yellow'));
            return;
        }
        if (direction === 0) {
            (0, node_child_process_1.spawnSync)('kubectl', ['cp', `${ns}/${selectedPod.name}:${remotePath}`, localPath], { stdio: 'inherit' });
        }
        else {
            (0, node_child_process_1.spawnSync)('kubectl', ['cp', localPath, `${ns}/${selectedPod.name}:${remotePath}`], { stdio: 'inherit' });
        }
        console.log((0, colors_1.colorize)('Copy completed', 'green'));
        return;
    }
    const src = srcArg;
    const dest = destArg || '.';
    if (src.includes(':')) {
        const colonIdx = src.indexOf(':');
        const podPart = src.substring(0, colonIdx);
        const pathPart = src.substring(colonIdx + 1);
        const podNames = pods.map(p => allNamespaces ? `${p.namespace}/${p.name}` : p.name);
        const filtered = (0, fuzzy_1.fuzzyFilter)(podNames, podPart);
        if (filtered.length === 0) {
            console.log(`No pods matching "${podPart}"`);
            return;
        }
        const selectedPod = pods[filtered[0].originalIndex];
        const ns = selectedPod.namespace || (0, namespace_1.getCurrentNamespace)();
        (0, node_child_process_1.spawnSync)('kubectl', ['cp', `${ns}/${selectedPod.name}:${pathPart}`, dest], { stdio: 'inherit' });
        console.log((0, colors_1.colorize)('Copy completed', 'green'));
    }
    else if (dest.includes(':')) {
        const colonIdx = dest.indexOf(':');
        const podPart = dest.substring(0, colonIdx);
        const pathPart = dest.substring(colonIdx + 1);
        const podNames = pods.map(p => allNamespaces ? `${p.namespace}/${p.name}` : p.name);
        const filtered = (0, fuzzy_1.fuzzyFilter)(podNames, podPart);
        if (filtered.length === 0) {
            console.log(`No pods matching "${podPart}"`);
            return;
        }
        const selectedPod = pods[filtered[0].originalIndex];
        const ns = selectedPod.namespace || (0, namespace_1.getCurrentNamespace)();
        (0, node_child_process_1.spawnSync)('kubectl', ['cp', src, `${ns}/${selectedPod.name}:${pathPart}`], { stdio: 'inherit' });
        console.log((0, colors_1.colorize)('Copy completed', 'green'));
    }
    else {
        console.log('Usage: klazy copy <pod>:/path ./local or klazy copy ./local <pod>:/path');
    }
}
//# sourceMappingURL=copy.js.map