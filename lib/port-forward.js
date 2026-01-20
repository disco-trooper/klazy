"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServices = getServices;
exports.portForward = portForward;
// src/port-forward.ts
const node_child_process_1 = require("node:child_process");
const cli_1 = require("./cli");
const config_1 = require("./config");
const namespace_1 = require("./namespace");
const colors_1 = require("./colors");
const exec_1 = require("./exec");
const misc_1 = require("./misc");
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
async function portForward(resourceType, allNamespaces = false) {
    let resourceName;
    let localPort;
    let remotePort;
    let namespace;
    if (resourceType === 'service') {
        const services = getServices(allNamespaces);
        const selectedService = await (0, misc_1.selectService)(services, undefined, allNamespaces);
        if (!selectedService)
            return;
        resourceName = selectedService.name;
        namespace = selectedService.namespace || (0, namespace_1.getCurrentNamespace)();
    }
    else {
        const pods = (0, exec_1.getPods)(allNamespaces);
        const selectedPod = await (0, misc_1.selectPod)(pods, undefined, allNamespaces, 'Select pod:');
        if (!selectedPod)
            return;
        resourceName = selectedPod.name;
        namespace = selectedPod.namespace || (0, namespace_1.getCurrentNamespace)();
    }
    localPort = await (0, cli_1.input)({ question: 'Local port', validationCallback: misc_1.validatePort });
    remotePort = await (0, cli_1.input)({ question: 'Remote port', defaultValue: localPort, validationCallback: misc_1.validatePort });
    const resource = resourceType === 'service' ? 'svc' : 'pod';
    const cmd = `kubectl port-forward ${resource}/${resourceName} ${localPort}:${remotePort} -n ${namespace}`;
    config_1.configuration.put({ [config_1.lastCommandKey]: cmd });
    console.log(`Port forwarding ${(0, colors_1.colorize)(resourceName, 'cyan')} ${(0, colors_1.colorize)(localPort, 'green')}:${(0, colors_1.colorize)(remotePort, 'green')}`);
    const proc = (0, node_child_process_1.spawn)('kubectl', ['port-forward', `${resource}/${resourceName}`, `${localPort}:${remotePort}`, '-n', namespace], {
        stdio: 'inherit'
    });
    proc.on('close', (code) => {
        if (code !== 0 && code !== null) {
            console.log((0, colors_1.colorize)(`Port forward ended (code ${code})`, 'yellow'));
        }
    });
}
//# sourceMappingURL=port-forward.js.map