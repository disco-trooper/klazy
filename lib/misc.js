"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContexts = getContexts;
exports.selectContext = selectContext;
exports.selectNamespace = selectNamespace;
exports.selectResource = selectResource;
exports.validatePort = validatePort;
exports.selectPort = selectPort;
const node_child_process_1 = require("node:child_process");
const cli_1 = require("./cli");
const SELECTED_CONTEXT_REGEX = /^\s*\*/;
/**
 * Get all kubectl contexts
 */
function getContexts() {
    const result = (0, node_child_process_1.spawnSync)('kubectl', ['config', 'get-contexts'], { encoding: 'utf-8' });
    if (result.status !== 0) {
        return [];
    }
    const namespacesRaw = result.stdout;
    const split = namespacesRaw.trim().split('\n');
    split.shift();
    return split.map(line => {
        const current = SELECTED_CONTEXT_REGEX.test(line);
        const lineSplit = current ? line.split(SELECTED_CONTEXT_REGEX)[1].trim().split(/\s/) : line.trim().split(/\s/);
        return { name: lineSplit[0], current };
    });
}
/**
 * Interactive context selection
 */
function selectContext() {
    const contexts = getContexts();
    const selectedContext = contexts.findIndex(c => c.current);
    const contextNames = contexts.map(c => c.name);
    return (0, cli_1.select)({ question: 'select context', options: contextNames, pointer: selectedContext });
}
/**
 * Interactive namespace selection for a given context
 */
function selectNamespace(context) {
    const result = (0, node_child_process_1.spawnSync)('kubectl', ['get', 'ns', '--context', context], { encoding: 'utf-8' });
    if (result.status !== 0) {
        return (0, cli_1.select)({ question: 'select namespace', options: [], autocomplete: true });
    }
    const nsRaw = result.stdout;
    const nsSplit = nsRaw.trim().split('\n');
    nsSplit.shift();
    const namespaces = nsSplit.map(s => s.trim().split(/\s/).shift());
    return (0, cli_1.select)({ question: 'select namespace', options: namespaces, autocomplete: true });
}
/**
 * Interactive resource selection
 */
function selectResource(resource, context, namespace) {
    const result = (0, node_child_process_1.spawnSync)('kubectl', ['get', `${resource}s`, '--namespace', namespace, '--context', context], { encoding: 'utf-8' });
    if (result.status !== 0) {
        return (0, cli_1.select)({ question: `select ${resource}`, options: [], autocomplete: true });
    }
    const podsRaw = result.stdout;
    const resourceSplit = podsRaw.trim().split('\n');
    resourceSplit.shift();
    const resources = resourceSplit.map(s => s.trim().split(/\s/).shift());
    return (0, cli_1.select)({ question: `select ${resource}`, options: resources, autocomplete: true });
}
/**
 * Validate port number
 */
function validatePort(value) {
    const numVal = Number(value);
    return !isNaN(numVal) && numVal >= 0 && numVal <= 65535;
}
/**
 * Interactive port selection with validation
 */
function selectPort(question) {
    return (0, cli_1.input)({
        question,
        defaultValue: '8080',
        invalidWarning: 'valid ports are numbers in range [0,65535]',
        validationCallback: validatePort,
    });
}
//# sourceMappingURL=misc.js.map