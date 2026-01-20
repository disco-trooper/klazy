"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNamespaces = getNamespaces;
exports.getCurrentNamespace = getCurrentNamespace;
exports.useNamespace = useNamespace;
// lib/namespace.ts
const node_child_process_1 = require("node:child_process");
const cli_1 = require("./cli");
const config_1 = require("./config");
const colors_1 = require("./colors");
function getNamespaces() {
    const result = (0, node_child_process_1.spawnSync)('kubectl', ['get', 'namespaces', '-o', 'jsonpath={.items[*].metadata.name}'], { encoding: 'utf8' });
    if (result.status !== 0) {
        return [];
    }
    return result.stdout.trim().split(' ').filter(Boolean);
}
function getCurrentNamespace() {
    try {
        const result = (0, node_child_process_1.spawnSync)('kubectl', ['config', 'view', '--minify', '-o', 'jsonpath={..namespace}'], { encoding: 'utf8' });
        if (result.status !== 0) {
            return 'default';
        }
        return result.stdout.trim() || 'default';
    }
    catch {
        return 'default';
    }
}
function setNamespace(ns) {
    (0, node_child_process_1.spawnSync)('kubectl', ['config', 'set-context', '--current', `--namespace=${ns}`], { encoding: 'utf8' });
}
async function useNamespace(targetNs) {
    const config = (0, config_1.getConfig)();
    const currentNs = getCurrentNamespace();
    let newNs;
    if (targetNs === '-') {
        if (!config.previousNamespace) {
            console.log('No previous namespace to switch to');
            return;
        }
        newNs = config.previousNamespace;
    }
    else if (targetNs) {
        newNs = targetNs;
    }
    else {
        const namespaces = getNamespaces();
        const selected = await (0, cli_1.select)({ question: 'Select namespace:', options: namespaces, autocomplete: true });
        if (!selected)
            return;
        newNs = selected;
    }
    config.previousNamespace = currentNs;
    (0, config_1.writeConfig)(config);
    setNamespace(newNs);
    console.log(`Switched to namespace: ${(0, colors_1.colorize)(newNs, 'magenta')}`);
}
//# sourceMappingURL=namespace.js.map