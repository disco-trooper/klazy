"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePod = deletePod;
// src/delete.ts
const node_child_process_1 = require("node:child_process");
const cli_1 = require("./cli");
const fuzzy_1 = require("./fuzzy");
const namespace_1 = require("./namespace");
const colors_1 = require("./colors");
const exec_1 = require("./exec");
async function deletePod(searchTerm, allNamespaces = false, force = false) {
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
            const selected = await (0, cli_1.select)({ question: 'Select pod to delete:', options: displayNames, autocomplete: true });
            if (!selected)
                return;
            const idx = displayNames.indexOf(selected);
            selectedPod = pods[filtered[idx].originalIndex];
        }
    }
    else {
        const displayNames = pods.map(p => allNamespaces ? `${p.namespace}/${p.name}` : p.name);
        const selected = await (0, cli_1.select)({ question: 'Select pod to delete:', options: displayNames, autocomplete: true });
        if (!selected)
            return;
        const idx = displayNames.indexOf(selected);
        selectedPod = pods[idx];
    }
    const ns = selectedPod.namespace || (0, namespace_1.getCurrentNamespace)();
    if (!force) {
        console.log(`\nAbout to delete pod ${(0, colors_1.colorize)(selectedPod.name, 'red')} in namespace ${(0, colors_1.colorize)(ns, 'magenta')}`);
        const confirm = await (0, cli_1.input)({ question: 'Type pod name to confirm' });
        if (confirm !== selectedPod.name) {
            console.log('Deletion cancelled');
            return;
        }
    }
    console.log(`Deleting pod ${selectedPod.name}...`);
    (0, node_child_process_1.spawnSync)('kubectl', ['delete', 'pod', selectedPod.name, '-n', ns], { stdio: 'inherit' });
}
//# sourceMappingURL=delete.js.map