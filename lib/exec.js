"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPods = getPods;
exports.execIntoPod = execIntoPod;
// lib/exec.ts
const node_child_process_1 = require("node:child_process");
const namespace_1 = require("./namespace");
const misc_1 = require("./misc");
/**
 * Get all pods, optionally across all namespaces
 */
function getPods(allNamespaces = false) {
    const args = ['get', 'pods', '-o', 'jsonpath={range .items[*]}{.metadata.name}{"\\t"}{.metadata.namespace}{"\\n"}{end}'];
    if (allNamespaces)
        args.splice(2, 0, '--all-namespaces');
    const result = (0, node_child_process_1.spawnSync)('kubectl', args, { encoding: 'utf8' });
    if (result.status !== 0)
        return [];
    return result.stdout.trim().split('\n').filter(Boolean).map(line => {
        const [name, namespace] = line.split('\t');
        return { name, namespace };
    });
}
/**
 * Interactive exec into a pod
 */
async function execIntoPod(searchTerm, allNamespaces = false) {
    const pods = getPods(allNamespaces);
    const selectedPod = await (0, misc_1.selectPod)(pods, searchTerm, allNamespaces, 'Select pod to exec into:');
    if (!selectedPod)
        return;
    const ns = selectedPod.namespace || (0, namespace_1.getCurrentNamespace)();
    console.log(`Executing into ${selectedPod.name}...`);
    const child = (0, node_child_process_1.spawn)('kubectl', ['exec', '-it', '-n', ns, selectedPod.name, '--', '/bin/sh'], {
        stdio: 'inherit'
    });
    child.on('error', (err) => {
        console.error('Failed to exec:', err.message);
    });
}
//# sourceMappingURL=exec.js.map