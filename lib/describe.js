"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.describePod = describePod;
// lib/describe.ts
const node_child_process_1 = require("node:child_process");
const namespace_1 = require("./namespace");
const exec_1 = require("./exec");
const colors_1 = require("./colors");
const misc_1 = require("./misc");
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
    const selectedPod = await (0, misc_1.selectPod)(pods, searchTerm, allNamespaces, 'Select pod to describe:');
    if (!selectedPod)
        return;
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