import { spawnSync } from 'node:child_process';
import { select, input } from './cli';
import type { Context } from './types';

const SELECTED_CONTEXT_REGEX = /^\s*\*/;

/**
 * Get all kubectl contexts
 */
export function getContexts(): Context[] {
    const result = spawnSync('kubectl', ['config', 'get-contexts'], { encoding: 'utf-8' });
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
export function selectContext(): Promise<string> {
    const contexts = getContexts();
    const selectedContext = contexts.findIndex(c => c.current);
    const contextNames = contexts.map(c => c.name);
    return select({ question: 'select context', options: contextNames, pointer: selectedContext });
}

/**
 * Interactive namespace selection for a given context
 */
export function selectNamespace(context: string): Promise<string> {
    const result = spawnSync('kubectl', ['get', 'ns', '--context', context], { encoding: 'utf-8' });
    if (result.status !== 0) {
        return select({ question: 'select namespace', options: [], autocomplete: true });
    }
    const nsRaw = result.stdout;
    const nsSplit = nsRaw.trim().split('\n');
    nsSplit.shift();
    const namespaces = nsSplit.map(s => s.trim().split(/\s/).shift() as string);
    return select({ question: 'select namespace', options: namespaces, autocomplete: true });
}

/**
 * Interactive resource selection
 */
export function selectResource(resource: string, context: string, namespace: string): Promise<string> {
    const result = spawnSync('kubectl', ['get', `${resource}s`, '--namespace', namespace, '--context', context], { encoding: 'utf-8' });
    if (result.status !== 0) {
        return select({ question: `select ${resource}`, options: [], autocomplete: true });
    }
    const podsRaw = result.stdout;
    const resourceSplit = podsRaw.trim().split('\n');
    resourceSplit.shift();
    const resources = resourceSplit.map(s => s.trim().split(/\s/).shift() as string);
    return select({ question: `select ${resource}`, options: resources, autocomplete: true });
}

/**
 * Validate port number
 */
export function validatePort(value: string): boolean {
    const numVal = Number(value);
    return !isNaN(numVal) && numVal >= 0 && numVal <= 65535;
}

/**
 * Interactive port selection with validation
 */
export function selectPort(question: string): Promise<string> {
    return input({
        question,
        defaultValue: '8080',
        invalidWarning: 'valid ports are numbers in range [0,65535]',
        validationCallback: validatePort,
    });
}
