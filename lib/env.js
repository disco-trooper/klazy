"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showEnv = showEnv;
// src/env.ts
const node_child_process_1 = require("node:child_process");
const namespace_1 = require("./namespace");
const colors_1 = require("./colors");
const exec_1 = require("./exec");
const misc_1 = require("./misc");
function formatEnvOutput(envString) {
    return envString.split('\n').filter(Boolean).map(line => {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=');
        return `${(0, colors_1.colorize)(key, 'cyan')}=${value}`;
    }).join('\n');
}
async function showEnv(searchTerm, allNamespaces = false) {
    const pods = (0, exec_1.getPods)(allNamespaces);
    const selectedPod = await (0, misc_1.selectPod)(pods, searchTerm, allNamespaces, 'Select pod to show env from:');
    if (!selectedPod)
        return;
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