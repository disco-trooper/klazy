"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.describePod = describePod;
// lib/describe.ts
const node_child_process_1 = require("node:child_process");
const cli_1 = require("./cli");
const fuzzy_1 = require("./fuzzy");
const namespace_1 = require("./namespace");
const exec_1 = require("./exec");
const colors_1 = require("./colors");
/**
 * Colorize status values in kubectl describe output
 */
function colorizeDescribe(output) {
    return output.split('\n').map(line => {
        // Match whole words only, or status at end of line
        return line.replace(/\b(Running|Pending|Waiting|Terminated|Error|CrashLoopBackOff|Completed|Failed|Succeeded|ContainerCreating|ImagePullBackOff)\b|(?<=:\s+)(True|False)(?=\s*$)/g, (match) => (0, colors_1.colorizeStatus)(match));
    }).join('\n');
}
/**
 * Describe a pod with colorized output
 */
async function describePod(searchTerm, allNamespaces = false) {
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
        const selected = await (0, cli_1.select)({ question: 'Select pod to describe:', options: displayNames, autocomplete: true });
        if (!selected)
            return;
        const selectedIdx = displayNames.indexOf(selected);
        selectedPod = pods[selectedIdx];
    }
    const ns = selectedPod.namespace || (0, namespace_1.getCurrentNamespace)();
    const result = (0, node_child_process_1.spawnSync)('kubectl', ['describe', 'pod', selectedPod.name, '-n', ns], { encoding: 'utf8' });
    if (result.status === 0) {
        console.log(colorizeDescribe(result.stdout));
    }
    else {
        console.log(result.stderr || 'Failed to describe pod');
    }
}
//# sourceMappingURL=describe.js.map