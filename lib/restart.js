"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.restartPod = restartPod;
// src/restart.ts
const node_child_process_1 = require("node:child_process");
const namespace_1 = require("./namespace");
const colors_1 = require("./colors");
const exec_1 = require("./exec");
const misc_1 = require("./misc");
async function restartPod(searchTerm, allNamespaces = false) {
    const pods = (0, exec_1.getPods)(allNamespaces);
    const selectedPod = await (0, misc_1.selectPod)(pods, searchTerm, allNamespaces, 'Select pod to restart:');
    if (!selectedPod)
        return;
    const ns = selectedPod.namespace || (0, namespace_1.getCurrentNamespace)();
    console.log(`Restarting pod ${(0, colors_1.colorize)(selectedPod.name, 'yellow')}...`);
    const result = (0, node_child_process_1.spawnSync)('kubectl', ['delete', 'pod', selectedPod.name, '-n', ns], { encoding: 'utf8' });
    if (result.status === 0) {
        console.log((0, colors_1.colorize)('Pod deleted. Kubernetes will recreate it.', 'green'));
    }
    else {
        console.log((0, colors_1.colorize)('Failed to restart pod', 'red'));
    }
}
//# sourceMappingURL=restart.js.map