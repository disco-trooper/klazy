"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamLogs = streamLogs;
// src/logs.ts
const node_child_process_1 = require("node:child_process");
const cli_1 = require("./cli");
const fuzzy_1 = require("./fuzzy");
const namespace_1 = require("./namespace");
const exec_1 = require("./exec");
function getServicePods(serviceName, namespace) {
    const selectorResult = (0, node_child_process_1.spawnSync)('kubectl', [
        'get', 'service', serviceName, '-n', namespace,
        '-o', 'jsonpath={.spec.selector}'
    ], { encoding: 'utf8' });
    if (selectorResult.status !== 0)
        return [];
    try {
        const selector = JSON.parse(selectorResult.stdout.replace(/'/g, '"'));
        const labelSelector = Object.entries(selector).map(([k, v]) => `${k}=${v}`).join(',');
        const podsResult = (0, node_child_process_1.spawnSync)('kubectl', [
            'get', 'pods', '-n', namespace, '-l', labelSelector,
            '-o', 'jsonpath={.items[*].metadata.name}'
        ], { encoding: 'utf8' });
        if (podsResult.status !== 0)
            return [];
        return podsResult.stdout.trim().split(/\s+/).filter(Boolean);
    }
    catch {
        return [];
    }
}
function getServices(allNamespaces = false) {
    const args = ['get', 'services', '-o', 'jsonpath={range .items[*]}{.metadata.name}{"\\t"}{.metadata.namespace}{"\\n"}{end}'];
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
async function streamLogs(resourceType, searchTerm, allNamespaces = false, follow = true) {
    let podName;
    let namespace;
    if (resourceType === 'service') {
        // Service logs - select service, then its pod
        const services = getServices(allNamespaces);
        if (services.length === 0) {
            console.log('No services found');
            return;
        }
        let selectedService;
        if (searchTerm) {
            const names = services.map(s => allNamespaces ? `${s.namespace}/${s.name}` : s.name);
            const filtered = (0, fuzzy_1.fuzzyFilter)(names, searchTerm);
            if (filtered.length === 0) {
                console.log(`No services matching "${searchTerm}"`);
                return;
            }
            if (filtered.length === 1) {
                selectedService = services[filtered[0].originalIndex];
            }
            else {
                const displayNames = filtered.map(f => names[f.originalIndex]);
                const selected = await (0, cli_1.select)({ question: 'Select service:', options: displayNames, autocomplete: true });
                if (!selected)
                    return;
                const idx = displayNames.indexOf(selected);
                selectedService = services[filtered[idx].originalIndex];
            }
        }
        else {
            const displayNames = services.map(s => allNamespaces ? `${s.namespace}/${s.name}` : s.name);
            const selected = await (0, cli_1.select)({ question: 'Select service:', options: displayNames, autocomplete: true });
            if (!selected)
                return;
            const idx = displayNames.indexOf(selected);
            selectedService = services[idx];
        }
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
                const idx = displayNames.indexOf(selected);
                selectedPod = pods[filtered[idx].originalIndex];
            }
        }
        else {
            const displayNames = pods.map(p => allNamespaces ? `${p.namespace}/${p.name}` : p.name);
            const selected = await (0, cli_1.select)({ question: 'Select pod:', options: displayNames, autocomplete: true });
            if (!selected)
                return;
            const idx = displayNames.indexOf(selected);
            selectedPod = pods[idx];
        }
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