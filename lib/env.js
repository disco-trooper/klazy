"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showEnv = showEnv;
// src/env.ts
const node_child_process_1 = require("node:child_process");
const cli_1 = require("./cli");
const fuzzy_1 = require("./fuzzy");
const namespace_1 = require("./namespace");
const colors_1 = require("./colors");
const exec_1 = require("./exec");
function formatEnvOutput(envString) {
    return envString.split('\n').filter(Boolean).map(line => {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=');
        return `${(0, colors_1.colorize)(key, 'cyan')}=${value}`;
    }).join('\n');
}
async function showEnv(searchTerm, allNamespaces = false) {
    const pods = (0, exec_1.getPods)(allNamespaces);
    if (pods.length === 0) {
        console.log('No pods found');
        return;
    }
    let selectedPod;
    if (searchTerm) {
        const podNames = pods.map(p => allNamespaces ? `${p.namespace}/${p.name}` : p.name);
        const filtered = (0, fuzzy_1.fuzzyFilter)(podNames, searchTerm);
        if (filtered.length === 0) {
            console.log(`No pods matching "${searchTerm}"`);
            return;
        }
        if (filtered.length === 1) {
            selectedPod = pods[filtered[0].originalIndex];
        }
        else {
            const displayNames = filtered.map(f => podNames[f.originalIndex]);
            const selected = await (0, cli_1.select)({ question: 'Select pod:', options: displayNames, autocomplete: true });
            if (!selected)
                return;
            const selectedIdx = displayNames.indexOf(selected);
            selectedPod = pods[filtered[selectedIdx].originalIndex];
        }
    }
    else {
        const displayNames = pods.map(p => allNamespaces ? `${p.namespace}/${p.name}` : p.name);
        const selected = await (0, cli_1.select)({ question: 'Select pod:', options: displayNames, autocomplete: true });
        if (!selected)
            return;
        const selectedIdx = displayNames.indexOf(selected);
        selectedPod = pods[selectedIdx];
    }
    const ns = selectedPod.namespace || (0, namespace_1.getCurrentNamespace)();
    const result = (0, node_child_process_1.spawnSync)('kubectl', ['exec', '-n', ns, selectedPod.name, '--', 'env'], { encoding: 'utf8' });
    if (result.status === 0) {
        console.log(formatEnvOutput(result.stdout));
    }
    else {
        console.log((0, colors_1.colorize)('Failed to get env. Pod might not be running.', 'red'));
    }
}
//# sourceMappingURL=env.js.map