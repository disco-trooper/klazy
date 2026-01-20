"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePod = deletePod;
// src/delete.ts
const node_child_process_1 = require("node:child_process");
const cli_1 = require("./cli");
const namespace_1 = require("./namespace");
const colors_1 = require("./colors");
const exec_1 = require("./exec");
const misc_1 = require("./misc");
async function deletePod(searchTerm, allNamespaces = false, force = false) {
    const pods = (0, exec_1.getPods)(allNamespaces);
    const selectedPod = await (0, misc_1.selectPod)(pods, searchTerm, allNamespaces, 'Select pod to delete:');
    if (!selectedPod)
        return;
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