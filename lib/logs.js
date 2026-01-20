"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamLogs = streamLogs;
// src/logs.ts
const node_child_process_1 = require("node:child_process");
const cli_1 = require("./cli");
const namespace_1 = require("./namespace");
const exec_1 = require("./exec");
const port_forward_1 = require("./port-forward");
const misc_1 = require("./misc");
function getServicePods(serviceName, namespace) {
    // Get service as full JSON to avoid quote issues with jsonpath
    const selectorResult = (0, node_child_process_1.spawnSync)('kubectl', [
        'get', 'service', serviceName, '-n', namespace,
        '-o', 'json'
    ], { encoding: 'utf8' });
    if (selectorResult.status !== 0)
        return [];
    try {
        const service = JSON.parse(selectorResult.stdout);
        const selector = service.spec?.selector;
        if (!selector || Object.keys(selector).length === 0)
            return [];
        const labelSelector = Object.entries(selector).map(([k, v]) => `${k}=${v}`).join(',');
        const podsResult = (0, node_child_process_1.spawnSync)('kubectl', [
            'get', 'pods', '-n', namespace, '-l', labelSelector,
            '-o', 'jsonpath={.items[*].metadata.name}'
        ], { encoding: 'utf8' });
        if (podsResult.status !== 0)
            return [];
        return podsResult.stdout.trim().split(/\s+/).filter(Boolean);
    }
    catch (err) {
        console.error('Failed to parse service:', err instanceof Error ? err.message : 'unknown error');
        return [];
    }
}
async function streamLogs(resourceType, searchTerm, allNamespaces = false, follow = true) {
    let podName;
    let namespace;
    if (resourceType === 'service') {
        // Service logs - select service, then its pod
        const services = (0, port_forward_1.getServices)(allNamespaces);
        const selectedService = await (0, misc_1.selectService)(services, searchTerm, allNamespaces);
        if (!selectedService)
            return;
        namespace = selectedService.namespace || (0, namespace_1.getCurrentNamespace)();
        const servicePods = getServicePods(selectedService.name, namespace);
        if (servicePods.length === 0) {
            console.log('No pods found for this service');
            return;
        }
        if (servicePods.length === 1) {
            podName = servicePods[0];
        }
        else {
            const selected = await (0, cli_1.select)({ question: 'Select pod:', options: servicePods, autocomplete: true });
            if (!selected)
                return;
            podName = selected;
        }
    }
    else {
        // Pod logs
        const pods = (0, exec_1.getPods)(allNamespaces);
        const selectedPod = await (0, misc_1.selectPod)(pods, searchTerm, allNamespaces, 'Select pod:');
        if (!selectedPod)
            return;
        podName = selectedPod.name;
        namespace = selectedPod.namespace || (0, namespace_1.getCurrentNamespace)();
    }
    const args = ['logs', podName, '-n', namespace];
    if (follow)
        args.push('-f');
    console.log(`Streaming logs from ${podName}...`);
    const proc = (0, node_child_process_1.spawn)('kubectl', args, { stdio: 'inherit' });
    proc.on('close', (code) => {
        if (code !== 0 && code !== null) {
            console.log(`\nLogs ended (code ${code})`);
        }
    });
}
//# sourceMappingURL=logs.js.map