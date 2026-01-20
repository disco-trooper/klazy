"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.copyFiles = copyFiles;
// src/copy.ts
const node_child_process_1 = require("node:child_process");
const cli_1 = require("./cli");
const fuzzy_1 = require("./fuzzy");
const namespace_1 = require("./namespace");
const colors_1 = require("./colors");
const exec_1 = require("./exec");
async function copyFiles(srcArg, destArg, allNamespaces = false) {
    const pods = (0, exec_1.getPods)(allNamespaces);
    if (pods.length === 0) {
        console.log('No pods found');
        return;
    }
    // Interactive mode if no args
    if (!srcArg) {
        const displayNames = pods.map(p => allNamespaces ? `${p.namespace}/${p.name}` : p.name);
        const selected = await (0, cli_1.select)({ question: 'Select pod:', options: displayNames, autocomplete: true });
        if (!selected)
            return;
        const idx = displayNames.indexOf(selected);
        const selectedPod = pods[idx];
        const ns = selectedPod.namespace || (0, namespace_1.getCurrentNamespace)();
        const directions = ['From pod to local', 'From local to pod'];
        const directionSel = await (0, cli_1.select)({ question: 'Copy direction:', options: directions });
        if (!directionSel)
            return;
        const direction = directions.indexOf(directionSel);
        const remotePath = await (0, cli_1.input)({ question: 'Remote path (in pod)' });
        const localPath = await (0, cli_1.input)({ question: 'Local path' });
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
        const [podPart, pathPart] = src.split(':');
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
        const [podPart, pathPart] = dest.split(':');
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