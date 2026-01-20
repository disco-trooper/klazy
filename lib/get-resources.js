"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getResources = void 0;
// lib/get-resources.ts
const node_child_process_1 = require("node:child_process");
const cli_1 = require("./cli");
const config_1 = require("./config");
const namespace_1 = require("./namespace");
const colors_1 = require("./colors");
const RESOURCE_ALIASES = {
    'po': 'pods', 'pod': 'pods', 'pods': 'pods',
    'svc': 'services', 'service': 'services', 'services': 'services',
    'deploy': 'deployments', 'deployment': 'deployments', 'deployments': 'deployments',
    'sts': 'statefulsets', 'statefulset': 'statefulsets', 'statefulsets': 'statefulsets',
    'ds': 'daemonsets', 'daemonset': 'daemonsets', 'daemonsets': 'daemonsets',
    'cm': 'configmaps', 'configmap': 'configmaps', 'configmaps': 'configmaps',
    'secret': 'secrets', 'secrets': 'secrets',
    'ing': 'ingresses', 'ingress': 'ingresses', 'ingresses': 'ingresses',
    'pvc': 'persistentvolumeclaims', 'persistentvolumeclaims': 'persistentvolumeclaims',
    'ns': 'namespaces', 'namespaces': 'namespaces',
    'node': 'nodes', 'nodes': 'nodes',
};
const RESOURCE_OPTIONS = ['pods', 'services', 'deployments', 'statefulsets', 'daemonsets', 'configmaps', 'secrets', 'ingresses', 'persistentvolumeclaims', 'namespaces', 'nodes'];
function resolveResourceType(input) {
    if (!input)
        return null;
    return RESOURCE_ALIASES[input.toLowerCase()] || null;
}
function colorizeOutput(output) {
    return output.split('\n').map(line => {
        // Colorize status keywords
        return line.replace(/(Running|Pending|Error|CrashLoopBackOff|Completed|Failed|Succeeded|ContainerCreating|ImagePullBackOff|Terminated|Ready|NotReady|True|False)/g, (match) => (0, colors_1.colorizeStatus)(match));
    }).join('\n');
}
const getResources = async (resourceType, allNamespaces = false) => {
    let resource;
    if (resourceType) {
        const resolved = resolveResourceType(resourceType);
        if (!resolved) {
            console.log(`Unknown resource type: ${resourceType}`);
            return;
        }
        resource = resolved;
    }
    else {
        const selected = await (0, cli_1.select)({ question: 'Select resource:', options: RESOURCE_OPTIONS, autocomplete: true });
        if (!selected)
            return;
        resource = selected;
    }
    const ns = (0, namespace_1.getCurrentNamespace)();
    const args = ['get', resource];
    if (allNamespaces) {
        args.push('--all-namespaces');
    }
    else {
        args.push('-n', ns);
    }
    const cmd = `kubectl get ${resource} ${allNamespaces ? '--all-namespaces' : `-n ${ns}`}`;
    config_1.configuration.put({ [config_1.lastCommandKey]: cmd });
    try {
        const result = (0, node_child_process_1.spawnSync)('kubectl', args, { encoding: 'utf8' });
        if (result.stdout) {
            console.log(colorizeOutput(result.stdout));
        }
        if (result.stderr) {
            console.error(result.stderr);
        }
    }
    catch (err) {
        console.error('Failed to get resources');
    }
};
exports.getResources = getResources;
//# sourceMappingURL=get-resources.js.map